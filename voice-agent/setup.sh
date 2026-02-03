#!/bin/bash
echo "=== VOICE AGENT SETUP ==="

# Installa dipendenze
pip install livekit>=1.0.23 livekit-agents>=1.3.12 livekit-plugins-openai>=1.3.12 livekit-plugins-cartesia>=1.3.12 livekit-plugins-silero>=1.3.12 python-dotenv>=1.0.0 anthropic>=0.77.0 --break-system-packages

# Crea link simbolico
rm -rf /bot 2>/dev/null
ln -s /workspace/voice-agent /bot

echo "=== SETUP COMPLETATO ==="
echo "Per avviare: cd /bot && python agent_working.py dev"
