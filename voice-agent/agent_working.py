import asyncio
import logging
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.agents.vad import VADEventType
from livekit.plugins import openai, cartesia, silero
from dotenv import load_dotenv
import anthropic as anthropic_sdk
import os

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

current_tts_task = None

SYSTEM_PROMPT = """You are a friendly, natural voice assistant.
Detect user's language and respond in THE SAME language.
Be conversational and natural - like talking to a friend.
Keep responses brief (1-2 sentences)."""

async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connected to {ctx.room.name}")
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant: {participant.identity}")
    vad = silero.VAD.load()
    stt = openai.STT()
    tts = cartesia.TTS(voice="a0e99841-438c-4a64-b679-ae501e7d6091")
    source = rtc.AudioSource(24000, 1)
    track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
    await ctx.room.local_participant.publish_track(track)
    messages = []
    logger.info("Playing greeting...")
    await speak(source, tts, "Ciao! Come posso aiutarti?")
    logger.info("Greeting done!")
    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info("Found existing audio track!")
            asyncio.create_task(handle_track(pub.track, source, vad, stt, tts, messages))
    await asyncio.Event().wait()

async def handle_track(track, source, vad, stt, tts, messages):
    logger.info("Starting audio processing...")
    audio_stream = rtc.AudioStream(track)
    stt_stream = stt.stream()
    vad_stream = vad.stream()
    frame_count = 0
    async def process_speech():
        async for event in stt_stream:
            if hasattr(event, 'alternatives') and event.alternatives:
                user_text = event.alternatives[0].text.strip()
                if user_text and len(user_text) > 2:
                    logger.info(f"USER: {user_text}")
                    await respond(user_text, source, tts, messages)
    async def detect_interruptions():
        async for vad_event in vad_stream:
            if vad_event.type == VADEventType.START_OF_SPEECH:
                global current_tts_task
                if current_tts_task and not current_tts_task.done():
                    logger.info("INTERRUPTED")
                    current_tts_task.cancel()
    asyncio.create_task(process_speech())
    asyncio.create_task(detect_interruptions())
    async for audio_event in audio_stream:
        frame_count += 1
        if frame_count % 500 == 0:
            logger.info(f"Audio frames: {frame_count}")
        stt_stream.push_frame(audio_event.frame)
        vad_stream.push_frame(audio_event.frame)

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
    messages.append({"role": "user", "content": user_text})
    if len(messages) > 20:
        messages = messages[-20:]
    client = anthropic_sdk.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=150,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    response_text = response.content[0].text
    messages.append({"role": "assistant", "content": response_text})
    logger.info(f"AGENT: {response_text}")
    await speak(source, tts, response_text)

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
