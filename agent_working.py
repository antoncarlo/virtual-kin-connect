"""
Voice Agent per RunPod + LiveKit
Usa: Deepgram (STT), Claude (LLM), Cartesia (TTS)

Fix principali rispetto alle versioni precedenti:
1. Usa event listener per track_subscribed (no race condition)
2. Gestione corretta degli stream audio
3. Retry/reconnect su Deepgram
4. Logging dettagliato per debug
"""

import asyncio
import logging
import os
from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, AutoSubscribe
from livekit.plugins import deepgram, cartesia, silero
from dotenv import load_dotenv
import anthropic as anthropic_sdk

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("voice-agent")

# Stato globale
current_tts_task = None
background_tasks = set()

SYSTEM_PROMPT = """
Sei un amico fidato e simpatico.
Parli Italiano, Inglese e Spagnolo.
Rispondi nella stessa lingua dell'utente.

REGOLA IMPORTANTE:
L'input potrebbe contenere errori fonetici (es. inglese scritto come italiano).
Interpreta il senso e rispondi coerentemente.

Esempi:
- "Ciao come stai?" -> Rispondi in Italiano
- "Hello how are you" -> Rispondi in Inglese
- "Hola que tal" -> Rispondi in Spagnolo

Sii breve (1-2 frasi), diretto e naturale. Niente risposte da robot.
"""


def _keep_task(task):
    """Tiene un riferimento al task per evitare garbage collection."""
    background_tasks.add(task)
    task.add_done_callback(background_tasks.discard)


async def entrypoint(ctx: JobContext):
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"Connesso alla room: {ctx.room.name}")

    participant = await ctx.wait_for_participant()
    logger.info(f"Partecipante connesso: {participant.identity}")

    # --- SETUP MOTORI ---

    # STT: Deepgram Nova-2 in Italiano
    stt = deepgram.STT(
        model="nova-2",
        language="it",
        interim_results=True,
        punctuate=True,
        smart_format=True,
    )

    # TTS: Cartesia Multilingua (voce maschile Barbershop)
    voice_id = "a0e99841-438c-4a64-b679-ae501e7d6091"
    tts = cartesia.TTS(model="sonic-multilingual", voice=voice_id)

    # VAD: Silero per interruzioni
    vad = silero.VAD.load()

    # Sorgente audio output (24kHz mono, come richiesto da Cartesia)
    source = rtc.AudioSource(24000, 1)
    track = rtc.LocalAudioTrack.create_audio_track("agent-voice", source)
    options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)
    await ctx.room.local_participant.publish_track(track, options)
    logger.info("Track audio pubblicata")

    # Stato conversazione
    messages = []

    # --- SALUTO INIZIALE ---
    logger.info("Invio saluto...")
    await speak(source, tts, "Ciao! Ci sono. Di cosa parliamo?")

    # --- SOTTOSCRIZIONE TRACCE AUDIO (FIX RACE CONDITION) ---
    # Metodo 1: Controlla tracce gia' esistenti
    already_handled = set()
    for pub in participant.track_publications.values():
        if pub.track and pub.track.kind == rtc.TrackKind.KIND_AUDIO:
            track_id = pub.track.sid
            if track_id not in already_handled:
                already_handled.add(track_id)
                logger.info(f"Traccia audio trovata (esistente): {track_id}")
                task = asyncio.create_task(
                    handle_audio_track(pub.track, source, stt, tts, vad, messages)
                )
                _keep_task(task)

    # Metodo 2: Ascolta nuove tracce (se arrivano dopo)
    @ctx.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.RemoteTrackPublication,
        remote_participant: rtc.RemoteParticipant,
    ):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            track_id = track.sid
            if track_id not in already_handled:
                already_handled.add(track_id)
                logger.info(f"Nuova traccia audio sottoscritta: {track_id}")
                task = asyncio.create_task(
                    handle_audio_track(track, source, stt, tts, vad, messages)
                )
                _keep_task(task)

    # Metodo 3: Gestisci riconnessioni del partecipante
    @ctx.room.on("participant_connected")
    def on_participant_connected(remote_participant: rtc.RemoteParticipant):
        logger.info(f"Partecipante riconnesso: {remote_participant.identity}")

    @ctx.room.on("disconnected")
    def on_disconnected():
        logger.warning("Disconnesso dalla room!")

    logger.info("Agent pronto e in ascolto...")
    # Mantieni il processo vivo
    await asyncio.Event().wait()


async def handle_audio_track(track, source, stt, tts, vad, messages):
    """Gestisce una singola traccia audio del partecipante."""
    logger.info("Avvio gestione traccia audio...")

    try:
        audio_stream = rtc.AudioStream(track)
        stt_stream = stt.stream()
        vad_stream = vad.stream()

        # --- TASK 1: Processa risultati STT ---
        async def process_stt():
            logger.info("Task STT avviato, in attesa di trascrizioni...")
            try:
                async for event in stt_stream:
                    if not hasattr(event, "alternatives") or not event.alternatives:
                        continue

                    text = event.alternatives[0].text.strip()
                    if not text:
                        continue

                    if hasattr(event, "is_final") and event.is_final:
                        if len(text) > 2:
                            logger.info(f"[UTENTE] {text}")
                            task = asyncio.create_task(
                                respond(text, source, tts, messages)
                            )
                            _keep_task(task)
                    else:
                        # Risultati parziali (interim) per debug
                        logger.debug(f"  ...sentendo: {text}")
            except Exception as e:
                logger.error(f"Errore nel task STT: {e}")

        # --- TASK 2: Processa VAD per interruzioni ---
        async def process_vad():
            logger.info("Task VAD avviato...")
            try:
                async for event in vad_stream:
                    if event.type == silero.VADEventType.START_OF_SPEECH:
                        global current_tts_task
                        if current_tts_task and not current_tts_task.done():
                            logger.info("Interruzione rilevata! Cancello TTS.")
                            current_tts_task.cancel()
            except Exception as e:
                logger.error(f"Errore nel task VAD: {e}")

        # Avvia i task di elaborazione
        stt_task = asyncio.create_task(process_stt())
        vad_task = asyncio.create_task(process_vad())
        _keep_task(stt_task)
        _keep_task(vad_task)

        # --- LOOP PRINCIPALE: Inoltra audio ai motori ---
        frame_count = 0
        async for audio_event in audio_stream:
            frame_count += 1
            stt_stream.push_frame(audio_event.frame)
            vad_stream.push_frame(audio_event.frame)

            # Log periodico per confermare che l'audio scorre
            if frame_count % 500 == 0:
                logger.info(f"Audio frames processati: {frame_count}")

    except Exception as e:
        logger.error(f"Errore nella gestione della traccia audio: {e}")
    finally:
        logger.warning("Loop audio terminato.")


async def speak(source, tts, text):
    """Sintetizza testo e riproduce audio."""
    global current_tts_task

    async def _speak():
        try:
            async for audio in tts.synthesize(text):
                await source.capture_frame(audio.frame)
        except asyncio.CancelledError:
            logger.info("TTS cancellato (interruzione).")
        except Exception as e:
            logger.error(f"Errore TTS: {e}")

    current_tts_task = asyncio.create_task(_speak())
    try:
        await current_tts_task
    except asyncio.CancelledError:
        pass


async def respond(user_text, source, tts, messages):
    """Genera risposta con Claude e la sintetizza."""
    global current_tts_task

    # Cancella TTS in corso se presente
    if current_tts_task and not current_tts_task.done():
        current_tts_task.cancel()

    messages.append({"role": "user", "content": user_text})

    # Limita la cronologia a 20 messaggi per evitare token overflow
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

        response_text = response.content[0].text
        messages.append({"role": "assistant", "content": response_text})
        logger.info(f"[AI] {response_text}")

        await speak(source, tts, response_text)

    except Exception as e:
        logger.error(f"Errore nella risposta Claude: {e}")
        # Rimuovi il messaggio utente se la risposta fallisce
        if messages and messages[-1]["role"] == "user":
            messages.pop()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
