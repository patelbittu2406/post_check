#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

HOST="${TTS_HOST:-127.0.0.1}"
PORT="${TTS_PORT:-8000}"

echo "================================================================"
echo "    Starting Local Gujarati Regional TTS API Server             "
echo "    Host: http://$HOST:$PORT                                   "
echo "================================================================"

exec python -m uvicorn core.tts.local_api:app --host "$HOST" --port "$PORT"
