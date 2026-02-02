"""
Voice Agent - Opzione 2: Whisper Locale su GPU RunPod
=====================================================
STT: faster-whisper (gira sulla GPU, multilingua perfetto, gratis)
LLM: Claude (Anthropic API)
TTS: Cartesia (sonic-multilingual)
VAD: Silero (rileva inizio/fine parlato)

Architettura:
1. VAD rileva quando l'utente parla
2. Audio accumulato durante il parlato
3. Quando l'utente smette -> faster-whisper trascrive il segmento
4. Claude genera la risposta
5. Cartesia sintetizza la voce

Pro: Multilingua perfetto, nessun costo STT, gira tutto locale
Contro: ~0.5-1s di latenza per la trascrizione (dipende dalla GPU)
"""

import asyncio
import io
import logging
import os
import struct
import numpy as np
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.plugins import cartesia, silero
from dotenv import load_dotenv
import anthropic as anthropic_sdk

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent-whisper-local")

# Stato globale
current_tts_task = None
background_tasks = set()

# Whisper model (caricato una sola volta)
whisper_model = None

SYSTEM_PROMPT = """
Sei un amico fidato e simpatico.
Parli perfettamente Italiano, Inglese e Spagnolo.
Rispondi SEMPRE nella stessa lingua in cui l'utente ti parla.

Sii breve (1-2 frasi), diretto e naturale. Niente risposte da robot.
"""

# Configurazione audio
SAMPLE_RATE = 48000  # LiveKit WebRTC default
WHISPER_SAMPLE_RATE = 16000  # Whisper vuole 16kHz
MIN_SPEECH_DURATION = 0.5  # Minimo 0.5s di parlato per evitare rumore
MAX_SPEECH_DURATION = 30.0  # Massimo 30s per evitare segmenti troppo lunghi


def _keep_task(task):
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)


def load_whisper():
    """Carica il modello Whisper sulla GPU (una sola volta)."""
    global whisper_model
    if whisper_model is not None:
        return whisper_model

    from faster_whisper import WhisperModel

    # "large-v3" per qualita' massima, "medium" per bilanciare velocita'/qualita'
    # "small" se la GPU ha poca VRAM
    model_size = os.getenv("WHISPER_MODEL_SIZE", "large-v3")
    device = os.getenv("WHISPER_DEVICE", "cuda")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

    logger.info(f"Caricamento Whisper {model_size} su {device} ({compute_type})...")
    whisper_model = WhisperModel(
        model_size,
        device=device,
        compute_type=compute_type,
    )
    logger.info("Whisper caricato!")
    return whisper_model


def transcribe_audio(audio_frames, sample_rate=SAMPLE_RATE):
    """Trascrive un segmento audio con faster-whisper."""
    model = load_whisper()

    if not audio_frames:
        return "", ""

    # Unisci tutti i frame in un unico array numpy
    all_samples = []
    for frame in audio_frames:
        # frame.data e' bytes (int16 PCM)
        samples = np.frombuffer(frame.data, dtype=np.int16).astype(np.float32) / 32768.0
        all_samples.append(samples)

    if not all_samples:
        return "", ""

    audio_data = np.concatenate(all_samples)

    # Resample a 16kHz se necessario (Whisper vuole 16kHz)
    if sample_rate != WHISPER_SAMPLE_RATE:
        # Resample semplice (decimazione)
        ratio = sample_rate / WHISPER_SAMPLE_RATE
        indices = np.arange(0, len(audio_data), ratio).astype(int)
        indices = indices[indices < len(audio_data)]
        audio_data = audio_data[indices]

    # Controlla durata minima
    duration = len(audio_data) / WHISPER_SAMPLE_RATE
    if duration < MIN_SPEECH_DURATION:
        logger.debug(f"Segmento troppo corto ({duration:.1f}s), ignorato.")
        return "", ""

    logger.info(f"Trascrizione segmento: {duration:.1f}s")

    # Trascrivi
    segments, info = model.transcribe(
        audio_data,
        beam_size=5,
        language=None,  # Auto-detect lingua!
        vad_filter=True,  # Filtra silenzi residui
        vad_parameters=dict(
            min_silence_duration_ms=500,
        ),
    )

    # Raccogli testo
    full_text = ""
    for segment in segments:
        full_text += segment.text

    detected_language = info.language if info else "unknown"
    logger.info(f"Lingua rilevata: {detected_language} | Testo: {full_text.strip()}")

    return full_text.strip(), detected_language


async def entrypoint(ctx: JobContext):
    # Pre-carica Whisper durante la connessione
    load_whisper()

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connesso alla room: {ctx.room.name}")

    participant = await ctx.wait_for_participant()
    logger.info(f"Partecipante: {participant.identity}")

    # VAD: Silero per rilevare inizio/fine parlato
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

    # Tracce esistenti
    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            start_track_handler(pub.track)

    # Tracce future
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track, publication, remote_participant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            start_track_handler(track)

    @ctx.room.on("disconnected")
    def on_disconnected():
        logger.warning("Disconnesso dalla room!")

    logger.info("Agent pronto (Whisper locale su GPU)")
    await asyncio.Event().wait()


async def handle_audio_track(track, source, vad, tts, messages):
    """Gestisce la traccia audio: VAD -> accumula -> Whisper -> Claude -> TTS"""
    logger.info("Avvio gestione traccia audio con VAD + Whisper locale...")

    try:
        audio_stream = rtc.AudioStream(track)
        vad_stream = vad.stream()

        # Buffer per accumulare audio durante il parlato
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

                    # Interrompi TTS in corso
                    global current_tts_task
                    if current_tts_task and not current_tts_task.done():
                        logger.info("Interruzione TTS (barge-in)")
                        current_tts_task.cancel()

                elif event.type == silero.VADEventType.END_OF_SPEECH:
                    if is_speaking and speech_frames:
                        is_speaking = False
                        frames_to_process = speech_frames.copy()
                        speech_frames = []
                        logger.info(f"Fine parlato. Frame accumulati: {len(frames_to_process)}")

                        # Trascrivi in un thread separato (non bloccare l'event loop)
                        task = asyncio.create_task(
                            transcribe_and_respond(
                                frames_to_process, source, tts, messages
                            )
                        )
                        _keep_task(task)
                    is_speaking = False

        vad_task = asyncio.create_task(process_vad())
        _keep_task(vad_task)

        # Loop principale: inoltra audio al VAD e accumula durante parlato
        async for audio_event in audio_stream:
            frame_count += 1
            vad_stream.push_frame(audio_event.frame)

            # Accumula frame durante il parlato
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
    """Trascrive l'audio accumulato con Whisper e genera risposta."""
    try:
        # Trascrivi in un thread (faster-whisper e' sincrono e usa GPU)
        loop = asyncio.get_event_loop()
        text, language = await loop.run_in_executor(
            None, transcribe_audio, frames
        )

        if not text or len(text.strip()) < 2:
            logger.info("Trascrizione vuota o troppo corta, ignorata.")
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
