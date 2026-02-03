#!/bin/bash
# Setup script per Voice Agent su RunPod GPU

set -e

echo "============================================"
echo "  Setup Voice Agent - RunPod GPU"
echo "============================================"

# 1. Installa dipendenze Python
echo "[1/3] Installazione dipendenze Python..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# 2. Pre-download modello Whisper
echo "[2/3] Pre-download modello Whisper (medium)..."
WHISPER_SIZE="${WHISPER_MODEL_SIZE:-medium}"
python -c "
from faster_whisper import WhisperModel
print(f'Scaricamento modello Whisper {\"$WHISPER_SIZE\"}...')
model = WhisperModel('$WHISPER_SIZE', device='cuda', compute_type='float16')
print('Modello Whisper pronto!')
"

# 3. Verifica .env
echo "[3/3] Verifica configurazione..."
if [ ! -f ".env" ]; then
    echo ""
    echo "ATTENZIONE: File .env non trovato!"
    echo "Crea il file .env con le tue chiavi API:"
    echo ""
    echo "cat > .env << 'EOF'"
    echo "LIVEKIT_URL=wss://TUO-PROGETTO.livekit.cloud"
    echo "LIVEKIT_API_KEY=..."
    echo "LIVEKIT_API_SECRET=..."
    echo "CARTESIA_API_KEY=..."
    echo "ANTHROPIC_API_KEY=..."
    echo "EOF"
    echo ""
else
    echo "File .env trovato!"
fi

echo "============================================"
echo "  Setup completato!"
echo ""
echo "  Avvia con: python agent_working.py dev"
echo "============================================"
