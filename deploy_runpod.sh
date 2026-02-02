#!/bin/bash
# ============================================================
# Deploy Script per RunPod GPU
# ============================================================
# Uso:
#   1. Copia questo script su RunPod
#   2. chmod +x deploy_runpod.sh
#   3. ./deploy_runpod.sh [local|api]
#
#   local = faster-whisper su GPU (gratis, ~0.5-1s latenza)
#   api   = OpenAI Whisper API (a pagamento, ~1-2s latenza)
# ============================================================

set -e

MODE="${1:-local}"
BOT_DIR="/bot"

echo "============================================"
echo "  Deploy Voice Agent su RunPod"
echo "  Modalita': $MODE"
echo "============================================"

# 1. Clona o aggiorna il repo
if [ -d "$BOT_DIR/.git" ]; then
    echo "[1/5] Aggiornamento repo..."
    cd "$BOT_DIR"
    git pull origin claude/fix-openai-stt-runpod-Vujsq
else
    echo "[1/5] Clone repo..."
    git clone -b claude/fix-openai-stt-runpod-Vujsq \
        https://github.com/antoncarlo/virtual-kin-connect.git "$BOT_DIR"
    cd "$BOT_DIR"
fi

# 2. Installa dipendenze base
echo "[2/5] Installazione dipendenze base..."
pip install --quiet --upgrade pip
pip install --quiet \
    "livekit>=1.0.0" \
    "livekit-agents>=1.3.0" \
    "livekit-plugins-cartesia>=1.0.0" \
    "livekit-plugins-silero>=1.0.0" \
    "anthropic>=0.40.0" \
    "python-dotenv>=1.0.0" \
    "numpy"

# 3. Dipendenze specifiche per modalita'
if [ "$MODE" = "local" ]; then
    echo "[3/5] Installazione faster-whisper (GPU locale)..."
    pip install --quiet \
        "livekit-plugins-deepgram>=1.0.0" \
        "faster-whisper>=1.0.0" \
        "ctranslate2>=4.0.0"

    # Pre-download modello Whisper
    WHISPER_SIZE="${WHISPER_MODEL_SIZE:-large-v3}"
    echo "  Pre-download modello Whisper $WHISPER_SIZE..."
    python -c "
from faster_whisper import WhisperModel
print('Scaricamento modello...')
model = WhisperModel('$WHISPER_SIZE', device='cuda', compute_type='float16')
print('Modello pronto!')
"
    AGENT_FILE="agent_whisper_local.py"
elif [ "$MODE" = "api" ]; then
    echo "[3/5] Installazione dipendenze Whisper API..."
    pip install --quiet \
        "livekit-plugins-deepgram>=1.0.0" \
        "httpx>=0.27.0"
    AGENT_FILE="agent_whisper_api.py"
else
    echo "ERRORE: Modalita' non valida. Usa 'local' o 'api'."
    exit 1
fi

# 4. Verifica .env
echo "[4/5] Verifica variabili d'ambiente..."
MISSING=""

if [ -z "$LIVEKIT_URL" ]; then MISSING="$MISSING LIVEKIT_URL"; fi
if [ -z "$LIVEKIT_API_KEY" ]; then MISSING="$MISSING LIVEKIT_API_KEY"; fi
if [ -z "$LIVEKIT_API_SECRET" ]; then MISSING="$MISSING LIVEKIT_API_SECRET"; fi
if [ -z "$CARTESIA_API_KEY" ]; then MISSING="$MISSING CARTESIA_API_KEY"; fi
if [ -z "$ANTHROPIC_API_KEY" ]; then MISSING="$MISSING ANTHROPIC_API_KEY"; fi

if [ "$MODE" = "api" ] && [ -z "$OPENAI_API_KEY" ]; then
    MISSING="$MISSING OPENAI_API_KEY"
fi

if [ -n "$MISSING" ]; then
    echo "  ATTENZIONE: Variabili mancanti:$MISSING"
    echo "  Assicurati di averle nel file .env o nelle env di RunPod"
fi

# Crea .env se non esiste
if [ ! -f "$BOT_DIR/.env" ]; then
    echo "  Creazione .env di esempio..."
    cp "$BOT_DIR/.env.example" "$BOT_DIR/.env" 2>/dev/null || true
    echo "  MODIFICA $BOT_DIR/.env con le tue chiavi API!"
fi

# 5. Avvia l'agent
echo "[5/5] Avvio agent..."
echo "  File: $AGENT_FILE"
echo "  Comando: python $AGENT_FILE dev"
echo "============================================"
echo ""

cd "$BOT_DIR"
python "$AGENT_FILE" dev
