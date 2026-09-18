#!/usr/bin/env bash
# =============================================================================
# Prarambh Reel Studio - Single Launcher Script
# Starts FastAPI REST Backend (Port 8000) and Next.js Frontend (Port 3000)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo " 🎨 Starting Prarambh Reel Studio (V2)"
echo " 'Surat ના સમાચાર, હવે Reels માં.'"
echo "=========================================================="

# 0. Clean up any stale processes holding ports 8000 or 3000
echo "🧹 Checking port availability..."
fuser -k 8000/tcp 3000/tcp 2>/dev/null || true
sleep 1

# Activate Python Virtual Environment
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Clean Next.js cache to avoid webpack packfile strategy collisions
rm -rf frontend/.next

# Safe Graceful Cleanup Function (Avoids recursive traps & segfaults)
cleanup() {
    trap - SIGINT SIGTERM EXIT
    echo -e "\n🛑 Stopping Prarambh Reel Studio..."
    if [ -n "$BACKEND_PID" ]; then
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
    fi
    fuser -k 8000/tcp 3000/tcp 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend in Background
echo "🚀 [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait briefly for FastAPI to initialize
sleep 2

# 2. Start Next.js Frontend
echo "✨ [2/2] Launching Next.js 14 Frontend on http://localhost:3000 ..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo "=========================================================="
echo " 🟢 Prarambh Reel Studio is Live!"
echo " 👉 Web Application: http://localhost:3000"
echo " 👉 REST API Docs:   http://localhost:8000/docs"
echo "=========================================================="
echo "Press Ctrl+C to stop all servers."

# Wait for background processes
wait "$BACKEND_PID" "$FRONTEND_PID"
