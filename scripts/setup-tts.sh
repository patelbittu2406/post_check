#!/usr/bin/env bash
set -e

echo "================================================================"
echo "      Setting Up Local Gujarati Regional Accent TTS System      "
echo "================================================================"

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

if [ ! -d "venv" ]; then
    echo "[1/4] Creating virtual environment..."
    python3 -m venv venv
fi

echo "[2/4] Activating virtual environment..."
source venv/bin/activate

echo "[3/4] Installing / Verifying Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install fastapi uvicorn

echo "[4/4] Pre-caching local Gujarati model (facebook/mms-tts-guj)..."
python -c "
from transformers import VitsModel, AutoTokenizer
model_name = 'facebook/mms-tts-guj'
print('Checking model cache for:', model_name)
AutoTokenizer.from_pretrained(model_name)
VitsModel.from_pretrained(model_name)
print('Model verified locally!')
"

echo "================================================================"
echo "    Local Gujarati Regional TTS Setup Completed Successfully!   "
echo "================================================================"
