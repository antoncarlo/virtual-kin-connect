"""
Voice Agent - Opzione 2: Whisper Locale su GPU RunPod
=====================================================
STT: faster-whisper (gira sulla GPU, multilingua perfetto, gratis)
LLM: Claude (Anthropic API)
TTS: Cartesia (sonic-multilingual)
VAD: Silero (rileva inizio/fine parlato)

Architettura:
1. Connetti a LiveKit e saluta SUBITO
2. Carica Whisper in background sulla GPU
3. VAD rileva quando l'utente parla
4. Audio accumulato durante il parlato
5. Quando l'utente smette -> faster-whisper trascrive il segmento
6. Claude genera la risposta
7. Cartesia sintetizza la voce
"""

import asyncio
import io
import logging
import os
import struct
import traceback
import numpy as np
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.plugins import cartesia, silero
from dotenv import load_dotenv
import anthropic as anthropic_sdk

load_dotenv()
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("voice-agent-whisper-local")

# Stato globale
current_tts_task = None
background_tasks = set()

# Whisper model (caricato in background)
whisper_model = None
whisper_ready = asyncio.Event()

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


def _load_whisper_sync():
    """Carica il modello Whisper sulla GPU (chiamata sincrona)."""
    global whisper_model
    if whisper_model is not None:
        return whisper_model

    from faster_whisper import WhisperModel

    # "medium" come default: buon compromesso velocita'/qualita'
    # Cambia a "large-v3" per qualita' massima (piu' lento a scaricare)
    # Cambia a "small" se la GPU ha poca VRAM
    model_size = os.getenv("WHISPER_MODEL_SIZE", "medium")
    device = os.getenv("WHISPER_DEVICE", "cuda")
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

    logger.info(f">>> Caricamento Whisper {model_size} su {device} ({compute_type})...")
    whisper_model = WhisperModel(
        model_size,
        device=device,
        compute_type=compute_type,
    )
    logger.info(">>> Whisper caricato e pronto!")
    return whisper_model


async def load_whisper_background():
    """Carica Whisper in background senza bloccare l'event loop."""
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _load_whisper_sync)
        whisper_ready.set()
        logger.info(">>> Whisper segnalato come pronto")
    except Exception as e:
        logger.error(f">>> ERRORE caricamento Whisper: {e}")
        logger.error(traceback.format_exc())


def transcribe_audio(audio_frames, sample_rate=SAMPLE_RATE):
    """Trascrive un segmento audio con faster-whisper."""
    global whisper_model
    if whisper_model is None:
        logger.warning("Whisper non ancora caricato, skip trascrizione")
        return "", ""

    if not audio_frames:
        return "", ""

    # Unisci tutti i frame in un unico array numpy
    all_samples = []
    for frame in audio_frames:
        # frame.data e' bytes (int16 PCM)
        try:
            samples = np.frombuffer(frame.data, dtype=np.int16).astype(np.float32) / 32768.0
            all_samples.append(samples)
        except Exception as e:
            logger.error(f"Errore conversione frame: {e}")
            continue

    if not all_samples:
        return "", ""

    audio_data = np.concatenate(all_samples)

    # Resample a 16kHz se necessario (Whisper vuole 16kHz)
    if sample_rate != WHISPER_SAMPLE_RATE:
        ratio = sample_rate / WHISPER_SAMPLE_RATE
        indices = np.arange(0, len(audio_data), ratio).astype(int)
        indices = indices[indices < len(audio_data)]
        audio_data = audio_data[indices]

    # Controlla durata minima
    duration = len(audio_data) / WHISPER_SAMPLE_RATE
    if duration < MIN_SPEECH_DURATION:
        logger.debug(f"Segmento troppo corto ({duration:.1f}s), ignorato.")
        return "", ""

    logger.info(f">>> Trascrizione segmento: {duration:.1f}s")

    try:
        segments, info = whisper_model.transcribe(
            audio_data,
            beam_size=5,
            language=None,  # Auto-detect lingua!
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500),
        )

        full_text = ""
        for segment in segments:
            full_text += segment.text

        detected_language = info.language if info else "unknown"
        logger.info(f">>> Lingua: {detected_language} | Testo: {full_text.strip()}")
        return full_text.strip(), detected_language

    except Exception as e:
        logger.error(f">>> Errore trascrizione Whisper: {e}")
        logger.error(traceback.format_exc())
        return "", ""


async def entrypoint(ctx: JobContext):
    logger.info("=== ENTRYPOINT AVVIATO ===")

    try:
        # 1. CONNETTI SUBITO (non bloccare con Whisper)
        await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
        logger.info(f"=== Connesso alla room: {ctx.room.name} ===")

        # 2. Carica Whisper IN BACKGROUND
        whisper_task = asyncio.create_task(load_whisper_background())
        _keep_task(whisper_task)

        participant = await ctx.wait_for_participant()
        logger.info(f"=== Partecipante: {participant.identity} ===")

        # 3. VAD: Silero per rilevare inizio/fine parlato
        vad = silero.VAD.load()
        logger.info("=== VAD Silero caricato ===")

        # 4. TTS: Cartesia Multilingua
        voice_id = os.getenv("CARTESIA_VOICE_ID", "a0e99841-438c-4a64-b679-ae501e7d6091")
        tts = cartesia.TTS(model="sonic-multilingual", voice=voice_id)
        logger.info("=== TTS Cartesia pronto ===")

        # 5. Sorgente audio output
        source = rtc.AudioSource(24000, 1)
        track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
        options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
        await ctx.room.local_participant.publish_track(track, options)
        logger.info("=== Track audio pubblicata ===")

        messages = []

        # 6. SALUTA SUBITO (mentre Whisper scarica in background)
        logger.info("=== Invio saluto ===")
        await speak(source, tts, "Ciao! Ci sono. Un momento che mi preparo ad ascoltarti.")

        # 7. Aspetta che Whisper sia pronto (max 120 secondi)
        logger.info("=== Attendo caricamento Whisper... ===")
        try:
            await asyncio.wait_for(whisper_ready.wait(), timeout=120.0)
            logger.info("=== Whisper pronto! ===")
            await speak(source, tts, "Perfetto, sono pronto. Parla pure in qualsiasi lingua.")
        except asyncio.TimeoutError:
            logger.error("=== TIMEOUT: Whisper non caricato in 120s ===")
            await speak(source, tts, "Scusa, ho un problema tecnico. Riprova tra poco.")
            return

        # 8. Sottoscrizione tracce (fix race condition)
        already_handled = set()

        def start_track_handler(audio_track):
            track_id = audio_track.sid
            if track_id not in already_handled:
                already_handled.add(track_id)
                logger.info(f"=== Traccia audio connessa: {track_id} ===")
                task = asyncio.create_task(
                    handle_audio_track(audio_track, source, vad, tts, messages)
                )
                _keep_task(task)

        # Tracce esistenti
        for pub in participant.track_publications.values():
            logger.info(f"=== Pub: kind={pub.kind}, track={pub.track} ===")
            if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
                start_track_handler(pub.track)

        # Tracce future
        @ctx.room.on("track_subscribed")
        def on_track_subscribed(track, publication, remote_participant):
            logger.info(f"=== EVENTO track_subscribed: kind={track.kind} ===")
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                start_track_handler(track)

        @ctx.room.on("disconnected")
        def on_disconnected():
            logger.warning("=== DISCONNESSO dalla room! ===")

        logger.info("=== Agent pronto e in ascolto (Whisper locale su GPU) ===")
        await asyncio.Event().wait()

    except Exception as e:
        logger.error(f"=== ERRORE FATALE in entrypoint: {e} ===")
        logger.error(traceback.format_exc())


async def handle_audio_track(track, source, vad, tts, messages):
    """Gestisce la traccia audio: VAD -> accumula -> Whisper -> Claude -> TTS"""
    logger.info("=== Avvio gestione traccia audio ===")

    try:
        audio_stream = rtc.AudioStream(track)
        vad_stream = vad.stream()

        speech_frames = []
        is_speaking = False
        frame_count = 0

        async def process_vad():
            nonlocal speech_frames, is_speaking
            try:
                async for event in vad_stream:
                    if event.type == silero.VADEventType.START_OF_SPEECH:
                        is_speaking = True
                        speech_frames = []
                        logger.info(">>> Inizio parlato rilevato")

                        global current_tts_task
                        if current_tts_task and not current_tts_task.done():
                            logger.info(">>> Interruzione TTS (barge-in)")
                            current_tts_task.cancel()

                    elif event.type == silero.VADEventType.END_OF_SPEECH:
                        if is_speaking and speech_frames:
                            is_speaking = False
                            frames_to_process = speech_frames.copy()
                            speech_frames = []
                            logger.info(f">>> Fine parlato. Frame: {len(frames_to_process)}")

                            task = asyncio.create_task(
                                transcribe_and_respond(
                                    frames_to_process, source, tts, messages
                                )
                            )
                            _keep_task(task)
                        is_speaking = False
            except Exception as e:
                logger.error(f">>> Errore VAD: {e}")
                logger.error(traceback.format_exc())

        vad_task = asyncio.create_task(process_vad())
        _keep_task(vad_task)

        async for audio_event in audio_stream:
            frame_count += 1
            vad_stream.push_frame(audio_event.frame)

            if is_speaking:
                speech_frames.append(audio_event.frame)

            if frame_count % 500 == 0:
                status = "PARLANDO" if is_speaking else "silenzio"
                logger.info(f">>> Frame: {frame_count} | Stato: {status}")

    except Exception as e:
        logger.error(f"=== Errore gestione traccia: {e} ===")
        logger.error(traceback.format_exc())
    finally:
        logger.warning("=== Loop audio terminato ===")


async def transcribe_and_respond(frames, source, tts, messages):
    """Trascrive l'audio accumulato con Whisper e genera risposta."""
    try:
        loop = asyncio.get_event_loop()
        text, language = await loop.run_in_executor(
            None, transcribe_audio, frames
        )

        if not text or len(text.strip()) < 2:
            logger.info(">>> Trascrizione vuota, ignorata.")
            return

        logger.info(f"[UTENTE] ({language}) {text}")
        await respond(text, source, tts, messages)

    except Exception as e:
        logger.error(f">>> Errore trascrizione/risposta: {e}")
        logger.error(traceback.format_exc())


async def speak(source, tts, text):
    global current_tts_task

    async def _speak():
        try:
            logger.info(f">>> TTS: {text}")
            async for audio in tts.synthesize(text):
                await source.capture_frame(audio.frame)
            logger.info(">>> TTS completato")
        except asyncio.CancelledError:
            logger.info(">>> TTS cancellato")
        except Exception as e:
            logger.error(f">>> Errore TTS: {e}")
            logger.error(traceback.format_exc())

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
        logger.error(f">>> Errore Claude: {e}")
        logger.error(traceback.format_exc())
        if messages and messages[-1]["role"] == "user":
            messages.pop()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
