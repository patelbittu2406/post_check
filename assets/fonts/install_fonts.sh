#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📥 Installing Google Fonts for Bilingual Subtitles..."

# Anton Regular
if [ ! -f "Anton-Regular.ttf" ]; then
  echo "Downloading Anton-Regular.ttf..."
  curl -L -s -o "Anton-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
fi

# Bebas Neue
if [ ! -f "BebasNeue-Regular.ttf" ]; then
  echo "Downloading BebasNeue-Regular.ttf..."
  curl -L -s -o "BebasNeue-Regular.ttf" "https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf"
fi

# Montserrat ExtraBold / Variable
if [ ! -f "Montserrat-Variable.ttf" ]; then
  echo "Downloading Montserrat-Variable.ttf..."
  curl -L -s -o "Montserrat-Variable.ttf" "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf"
fi

# Poppins Black
if [ ! -f "Poppins-Black.ttf" ]; then
  echo "Downloading Poppins-Black.ttf..."
  curl -L -s -o "Poppins-Black.ttf" "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Black.ttf"
fi

# Poppins Bold
if [ ! -f "Poppins-Bold.ttf" ]; then
  echo "Downloading Poppins-Bold.ttf..."
  curl -L -s -o "Poppins-Bold.ttf" "https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf"
fi

# Register fonts in user fontconfig directory if fc-cache is available
mkdir -p ~/.fonts
cp -f *.ttf ~/.fonts/ 2>/dev/null || true
if command -v fc-cache >/dev/null 2>&1; then
  fc-cache -f ~/.fonts || true
fi

echo "✅ All bilingual fonts installed and verified in $SCRIPT_DIR"
ls -la *.ttf
