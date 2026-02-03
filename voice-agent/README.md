# Voice Agent per RunPod GPU

Voice agent multilingua con:
- **STT**: Whisper locale su GPU (faster-whisper) - multilingua perfetto, gratis
- **LLM**: Claude (Anthropic API)
- **TTS**: Cartesia sonic-multilingual
- **VAD**: Silero (rileva inizio/fine parlato + barge-in)

## Setup Rapido su Nuova GPU RunPod

```bash
cd /workspace
git clone https://github.com/antoncarlo/virtual-kin-connect.git
cd virtual-kin-connect/voice-agent
chmod +x setup.sh
./setup.sh
```

## Configurazione Chiavi API

Crea il file `.env` con le tue chiavi:

```bash
cat > .env << 'EOF'
LIVEKIT_URL=wss://TUO-PROGETTO.livekit.cloud
LIVEKIT_API_KEY=LA_TUA_API_KEY
LIVEKIT_API_SECRET=IL_TUO_API_SECRET
CARTESIA_API_KEY=LA_TUA_CARTESIA_KEY
ANTHROPIC_API_KEY=LA_TUA_ANTHROPIC_KEY
EOF
```

### Dove trovare le chiavi

| Variabile | Dove trovarla |
|-----------|---------------|
| `LIVEKIT_URL` | [LiveKit Cloud](https://cloud.livekit.io) → Settings |
| `LIVEKIT_API_KEY` | Stessa pagina LiveKit |
| `LIVEKIT_API_SECRET` | Stessa pagina LiveKit |
| `CARTESIA_API_KEY` | [Cartesia](https://play.cartesia.ai) → API Keys |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) → API Keys |

## Avvio

```bash
python agent_working.py dev
```

## File disponibili

| File | Descrizione |
|------|-------------|
| `agent_working.py` | Agent principale con Whisper locale su GPU |
| `setup.sh` | Script installazione dipendenze |
| `requirements.txt` | Dipendenze Python |
| `.env.example` | Template per le variabili d'ambiente |

## Architettura

```
Utente parla → LiveKit → VAD (Silero) → Whisper (GPU) → Claude → Cartesia TTS → LiveKit → Utente sente
```

1. **VAD** rileva quando l'utente inizia/smette di parlare
2. **Audio accumulato** durante il parlato
3. **Whisper** trascrive il segmento (auto-detect lingua)
4. **Claude** genera la risposta nella stessa lingua
5. **Cartesia** sintetizza la voce
6. **Barge-in**: se l'utente interrompe, il TTS si ferma

## Configurazione Avanzata

Variabili opzionali nel `.env`:

```bash
# Modello Whisper: small, medium, large-v3 (default: medium)
WHISPER_MODEL_SIZE=medium

# Device: cuda, cpu (default: cuda)
WHISPER_DEVICE=cuda

# Precisione: float16, int8, float32 (default: float16)
WHISPER_COMPUTE_TYPE=float16

# Voice ID Cartesia (default: voce maschile italiana)
CARTESIA_VOICE_ID=a0e99841-438c-4a64-b679-ae501e7d6091
```

## Troubleshooting

### Agent non parla
- Controlla che `CARTESIA_API_KEY` sia corretta
- Guarda i log per `>>> Errore TTS`

### Agent non sente
- Controlla i log per `>>> Frame: 500 | silenzio` - se non appare, il microfono non è connesso
- Verifica che il client LiveKit stia pubblicando audio

### Whisper non si carica
- La prima volta scarica ~1.5GB (medium) o ~3GB (large-v3)
- Se timeout, aumenta la memoria GPU o usa `WHISPER_MODEL_SIZE=small`

### Trascrizione vuota
- Controlla `>>> Inizio parlato` e `>>> Fine parlato` nei log
- Se non appaiono, il VAD non rileva il parlato (volume troppo basso?)

## Log attesi (funzionamento normale)

```
=== ENTRYPOINT AVVIATO ===
=== Connesso alla room: ... ===
>>> TTS: Ciao! Ci sono...
>>> Caricamento Whisper medium su cuda...
>>> Whisper caricato e pronto!
>>> TTS: Perfetto, sono pronto...
=== Traccia audio: ... ===
>>> Frame: 500 | silenzio
>>> Inizio parlato
>>> Fine parlato. Frame: 342
>>> Trascrizione: 2.1s
>>> Lingua: it | Testo: ciao come stai
[UTENTE] (it) ciao come stai
[AI] Ciao! Tutto bene, grazie. Tu come stai?
>>> TTS: Ciao! Tutto bene...
>>> TTS completato
```
