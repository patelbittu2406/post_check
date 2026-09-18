#!/usr/bin/env bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BASE_DIR"

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

echo "================================================================"
echo "      Running Local Gujarati Regional Accent TTS Tests          "
echo "================================================================"

echo "[1/3] Running Gujarati Text Normalizer Unit Tests..."
python tests/test_gujarati_normalizer.py

echo "[2/3] Running Gujarati Dialect & Phonology Unit Tests..."
python tests/test_dialect_engine.py

echo "[3/3] Running Master 5-Voice Regional Evaluation Test..."
python tests/test_local_tts.py

echo "================================================================"
echo "                  ALL TTS TESTS PASSED!                         "
echo "================================================================"
