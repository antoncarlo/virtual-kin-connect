import asyncio
import logging
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.plugins import openai, cartesia
from dotenv import load_dotenv
import anthropic as anthropic_sdk
import os

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

current_tts_task = None
user_language = None
is_shutting_down = False

SYSTEM_PROMPT = """You are Relai's friendly voice companion.

LANGUAGE RULES:
1. If the user hasn't specified a language yet, ask them in English: "What language would you like to speak?"
2. Once the user responds in ANY language or specifies a preference, ALWAYS respond in THAT language from now on.
3. Remember the language choice for the entire conversation.

Current user language preference: {language}

Be conversational, warm and natural - like talking to a friend.
Keep responses brief (1-2 sentences max).
You help users with Relai's services."""

async def entrypoint(ctx: JobContext):
    global is_shutting_down
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to {ctx.room.name}")
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant: {participant.identity}")
    
    stt = openai.STT(model="whisper-1")
    tts = cartesia.TTS(voice="a0e99841-438c-4a64-b679-ae501e7d6091")
    source = rtc.AudioSource(24000, 1)
    track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
    await ctx.room.local_participant.publish_track(track)
    messages = []
    
    logger.info("Playing greeting...")
    greeting = "Hi! I'm your Relai companion. What language would you like to speak?"
    await speak(source, tts, greeting)
    logger.info("Greeting done!")
    
    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info("Found existing audio track!")
            asyncio.create_task(handle_track(pub.track, source, stt, tts, messages))
    
    # Gestione chiusura pulita
    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        is_shutting_down = True
        logger.info("Shutting down gracefully...")

async def handle_track(track, source, stt, tts, messages):
    global is_shutting_down
    logger.info("Starting audio processing...")
    audio_stream = rtc.AudioStream(track)
    stt_stream = stt.stream()
    
    async def process_speech():
        try:
            async for event in stt_stream:
                if is_shutting_down:
                    break
                if hasattr(event, 'alternatives') and event.alternatives:
                    user_text = event.alternatives[0].text.strip()
                    if user_text and len(user_text) > 2:
                        logger.info(f"USER: {user_text}")
                        await respond(user_text, source, tts, messages)
        except asyncio.CancelledError:
            logger.info("Speech processing stopped")
        except Exception as e:
            if not is_shutting_down:
                logger.error(f"Speech processing error: {e}")
    
    asyncio.create_task(process_speech())
    
    try:
        async for audio_event in audio_stream:
            if is_shutting_down:
                break
            stt_stream.push_frame(audio_event.frame)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        if not is_shutting_down:
            logger.error(f"Audio stream error: {e}")

async def speak(source, tts, text):
    global current_tts_task
    async def _speak():
        try:
            async for audio in tts.synthesize(text):
                await source.capture_frame(audio.frame)
        except asyncio.CancelledError:
            logger.info("Speech cancelled")
            raise
    current_tts_task = asyncio.create_task(_speak())
    try:
        await current_tts_task
    except asyncio.CancelledError:
        pass

async def respond(user_text, source, tts, messages):
    global user_language
    
    messages.append({"role": "user", "content": user_text})
    if len(messages) > 20:
        messages = messages[-20:]
    
    lang_info = user_language if user_language else "Not set yet - detect from user's response"
    system = SYSTEM_PROMPT.format(language=lang_info)
    
    try:
        client = anthropic_sdk.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=200,
            system=system,
            messages=messages
        )
        response_text = response.content[0].text
        
        if not user_language and len(messages) >= 1:
            user_language = "Detected from conversation"
        
        messages.append({"role": "assistant", "content": response_text})
        logger.info(f"AGENT: {response_text}")
        await speak(source, tts, response_text)
    except Exception as e:
        logger.error(f"Claude API error: {e}")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
