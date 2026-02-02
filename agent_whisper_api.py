"""
Voice Agent - Opzione 3: OpenAI Whisper API (Batch, NO WebSocket)
=================================================================
STT: OpenAI Whisper API (HTTP POST, non streaming - evita il crash WebSocket)
LLM: Claude (Anthropic API)
TTS: Cartesia (sonic-multilingual)
VAD: Silero (rileva inizio/fine parlato)

Architettura:
1. VAD rileva quando l'utente parla
2. Audio accumulato durante il parlato
3. Quando l'utente smette -> invio audio a OpenAI Whisper via HTTP POST
4. Claude genera la risposta
5. Cartesia sintetizza la voce

Pro: Multilingua perfetto, nessun WebSocket (stabile), qualita' Whisper
Contro: Costo API OpenAI per ogni segmento, ~1-2s latenza di rete
"""

import asyncio
import io
import logging
import os
import struct
import wave
import numpy as np
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.plugins import cartesia, silero
from dotenv import load_dotenv
import anthropic as anthropic_sdk
import httpx

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent-whisper-api")

# Stato globale
current_tts_task = None
background_tasks = set()

SYSTEM_PROMPT = """
Sei un amico fidato e simpatico.
Parli perfettamente Italiano, Inglese e Spagnolo.
Rispondi SEMPRE nella stessa lingua in cui l'utente ti parla.

Sii breve (1-2 frasi), diretto e naturale. Niente risposte da robot.
"""

# Configurazione audio
SAMPLE_RATE = 48000  # LiveKit WebRTC default
MIN_SPEECH_DURATION = 0.5  # Minimo 0.5s
MAX_SPEECH_DURATION = 30.0  # Massimo 30s

# Client HTTP riutilizzabile
http_client = None


def _keep_task(task):
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)


def frames_to_wav(audio_frames, sample_rate=SAMPLE_RATE):
    """Converte frame audio LiveKit in un file WAV in memoria."""
    all_samples = []
    for frame in audio_frames:
        samples = np.frombuffer(frame.data, dtype=np.int16)
        all_samples.append(samples)

    if not all_samples:
        return None

    audio_data = np.concatenate(all_samples)

    # Resample a 16kHz per Whisper (riduce upload e migliora compatibilita')
    target_rate = 16000
    if sample_rate != target_rate:
        ratio = sample_rate / target_rate
        indices = np.arange(0, len(audio_data), ratio).astype(int)
        indices = indices[indices < len(audio_data)]
        audio_data = audio_data[indices]
        sample_rate = target_rate

    duration = len(audio_data) / sample_rate
    if duration < MIN_SPEECH_DURATION:
        return None

    # Crea WAV in memoria
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(audio_data.tobytes())

    buffer.seek(0)
    logger.info(f"WAV creato: {duration:.1f}s, {len(buffer.getvalue())} bytes")
    return buffer


async def transcribe_whisper_api(wav_buffer):
    """Invia audio a OpenAI Whisper API via HTTP POST (NO WebSocket)."""
    global http_client

    if http_client is None:
        http_client = httpx.AsyncClient(timeout=30.0)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        logger.error("OPENAI_API_KEY non impostata!")
        return "", ""

    try:
        response = await http_client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": ("audio.wav", wav_buffer, "audio/wav")},
            data={
                "model": "whisper-1",
                # Non specificare lingua = auto-detect multilingua!
                "response_format": "verbose_json",
            },
        )

        if response.status_code != 200:
            logger.error(f"Whisper API errore {response.status_code}: {response.text}")
            return "", ""

        result = response.json()
        text = result.get("text", "").strip()
        language = result.get("language", "unknown")

        logger.info(f"Whisper API: lingua={language} | testo={text}")
        return text, language

    except Exception as e:
        logger.error(f"Errore Whisper API: {e}")
        return "", ""


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connesso alla room: {ctx.room.name}")

    participant = await ctx.wait_for_participant()
    logger.info(f"Partecipante: {participant.identity}")

    # VAD: Silero
    vad = silero.VAD.load()

    # TTS: Cartesia Multilingua
    voice_id = os.getenv("CARTESIA_VOICE_ID", "a0e99841-438c-4a64-b679-ae501e7d6091")
    tts = cartesia.TTS(model="sonic-multilingual", voice=voice_id)

    # Sorgente audio output
    source = rtc.AudioSource(24000, 1)
    track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
    options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    await ctx.room.local_participant.publish_track(track, options)

    messages = []

    logger.info("Invio saluto...")
    await speak(source, tts, "Ciao! Ci sono. Parla pure in qualsiasi lingua.")

    # Sottoscrizione tracce (fix race condition)
    already_handled = set()

    def start_track_handler(audio_track):
        track_id = audio_track.sid
        if track_id not in already_handled:
            already_handled.add(track_id)
            logger.info(f"Traccia audio connessa: {track_id}")
            task = asyncio.create_task(
                handle_audio_track(audio_track, source, vad, tts, messages)
            )
            _keep_task(task)

    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            start_track_handler(pub.track)

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, remote_participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            start_track_handler(track)

    @ctx.room.on("disconnected")
    def on_disconnected():
        logger.warning("Disconnesso dalla room!")

    logger.info("Agent pronto (Whisper API batch)")
    await asyncio.Event().wait()


async def handle_audio_track(track, source, vad, tts, messages):
    """Gestisce traccia audio: VAD -> accumula -> Whisper API -> Claude -> TTS"""
    logger.info("Avvio gestione traccia con VAD + Whisper API...")

    try:
        audio_stream = rtc.AudioStream(track)
        vad_stream = vad.stream()

        speech_frames = []
        is_speaking = False
        frame_count = 0

        async def process_vad():
            nonlocal speech_frames, is_speaking
            async for event in vad_stream:
                if event.type == silero.VADEventType.START_OF_SPEECH:
                    is_speaking = True
                    speech_frames = []
                    logger.info("Inizio parlato rilevato...")

                    global current_tts_task
                    if current_tts_task and not current_tts_task.done():
                        logger.info("Interruzione TTS (barge-in)")
                        current_tts_task.cancel()

                elif event.type == silero.VADEventType.END_OF_SPEECH:
                    if is_speaking and speech_frames:
                        is_speaking = False
                        frames_to_process = speech_frames.copy()
                        speech_frames = []
                        n_frames = len(frames_to_process)
                        logger.info(f"Fine parlato. Frame: {n_frames}")

                        task = asyncio.create_task(
                            transcribe_and_respond(
                                frames_to_process, source, tts, messages
                            )
                        )
                        _keep_task(task)
                    is_speaking = False

        vad_task = asyncio.create_task(process_vad())
        _keep_task(vad_task)

        async for audio_event in audio_stream:
            frame_count += 1
            vad_stream.push_frame(audio_event.frame)

            if is_speaking:
                speech_frames.append(audio_event.frame)

            if frame_count % 500 == 0:
                status = "PARLANDO" if is_speaking else "silenzio"
                logger.info(f"Frame: {frame_count} | Stato: {status}")

    except Exception as e:
        logger.error(f"Errore gestione traccia: {e}")
    finally:
        logger.warning("Loop audio terminato.")


async def transcribe_and_respond(frames, source, tts, messages):
    """Converte audio in WAV, invia a Whisper API, genera risposta."""
    try:
        wav_buffer = await asyncio.get_event_loop().run_in_executor(
            None, frames_to_wav, frames
        )

        if wav_buffer is None:
            logger.info("Segmento troppo corto, ignorato.")
            return

        text, language = await transcribe_whisper_api(wav_buffer)

        if not text or len(text.strip()) < 2:
            logger.info("Trascrizione vuota, ignorata.")
            return

        logger.info(f"[UTENTE] ({language}) {text}")
        await respond(text, source, tts, messages)

    except Exception as e:
        logger.error(f"Errore trascrizione/risposta: {e}")


async def speak(source, tts, text):
    global current_tts_task

    async def _speak():
        try:
            async for audio in tts.synthesize(text):
                await source.capture_frame(audio.frame)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Errore TTS: {e}")

    current_tts_task = asyncio.create_task(_speak())
    try:
        await current_tts_task
    except asyncio.CancelledError:
        pass


async def respond(user_text, source, tts, messages):
    global current_tts_task
    if current_tts_task and not current_tts_task.done():
        current_tts_task.cancel()

    messages.append({"role": "user", "content": user_text})
    if len(messages) > 20:
        messages[:] = messages[-20:]

    try:
        client = anthropic_sdk.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        response = client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=150,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        txt = response.content[0].text
        messages.append({"role": "assistant", "content": txt})
        logger.info(f"[AI] {txt}")
        await speak(source, tts, txt)
    except Exception as e:
        logger.error(f"Errore Claude: {e}")
        if messages and messages[-1]["role"] == "user":
            messages.pop()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
