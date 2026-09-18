"""
Local Gujarati TTS REST API Server
===================================
Provides a private, localhost-only HTTP API for speech synthesis:
- POST /api/tts/generate
- GET  /api/tts/voices
- GET  /api/tts/health
- GET  /api/tts/models
Default binding: 127.0.0.1:8000
"""

import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.tts.local_tts_engine import LocalTTSEngine

app = FastAPI(
    title="Local Gujarati Regional Accent TTS API",
    description="Private, zero-cost, 100% local Gujarati TTS engine with 5 regional accents.",
    version="2.0.0"
)

# Enable CORS for localhost frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501", "http://127.0.0.1:8501", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount audio output directory for direct browser streaming/download
AUDIO_OUTPUT_DIR = config.OUTPUT_AUDIO_DIR
AUDIO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(AUDIO_OUTPUT_DIR)), name="audio")


class GenerateRequest(BaseModel):
    text: str = Field(..., description="Gujarati news text to synthesize.")
    voiceId: str = Field("gu-standard", description="Selected voice ID (e.g. gu-standard, gu-kathiyawadi, gu-mahesani, gu-surati, gu-news-anchor).")
    speed: Optional[float] = Field(None, description="Optional speed multiplier override (e.g. 0.95 - 1.15).")


class GenerateResponse(BaseModel):
    status: str
    audioUrl: str
    audioPath: str
    voiceId: str
    accent: str
    displayName: str
    duration: float
    normalizedText: str
    dialectText: str
    processingTime: float


# Initialize Engine (Singleton)
tts_engine = LocalTTSEngine()


@app.get("/")
def root():
    return {
        "service": "Local Gujarati Regional Accent TTS API",
        "status": "online",
        "supportedVoices": len(tts_engine.get_available_voices()),
        "endpoints": [
            "/api/tts/generate",
            "/api/tts/voices",
            "/api/tts/health",
            "/api/tts/models"
        ]
    }


@app.get("/api/tts/health")
def get_health():
    import torch
    cache_count = len(list((config.OUTPUT_AUDIO_DIR / "tts_cache").glob("*.npy")))
    return {
        "status": "ready",
        "model": tts_engine.model_name,
        "device": str(tts_engine.device),
        "cudaAvailable": torch.cuda.is_available(),
        "samplingRate": tts_engine.sampling_rate,
        "cachedChunks": cache_count,
        "localExecution": True,
        "telemetry": False
    }


@app.get("/api/tts/models")
def get_models():
    return {
        "activeModel": {
            "name": tts_engine.model_name,
            "architecture": "VITS (Variational Inference with adversarial learning for end-to-end Text-to-Speech)",
            "vocoder": "HiFi-GAN neural vocoder (integrated)",
            "nativeLanguage": "Gujarati (gu-IN)",
            "samplingRate": tts_engine.sampling_rate
        },
        "supportedAccents": [
            "standard",
            "kathiyawadi",
            "mahesani",
            "surati",
            "news_anchor"
        ]
    }


@app.get("/api/tts/voices")
def get_voices():
    return tts_engine.get_available_voices()


@app.post("/api/tts/generate", response_model=GenerateResponse)
def generate_speech(req: GenerateRequest, request: Request):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Gujarati text must not be empty.")

    try:
        res = tts_engine.synthesize(
            text=req.text,
            voice_id=req.voiceId,
            speed_override=req.speed
        )

        audio_filename = Path(res["audio_path"]).name
        base_url = str(request.base_url).rstrip("/")
        audio_url = f"{base_url}/audio/{audio_filename}"

        return GenerateResponse(
            status="success",
            audioUrl=audio_url,
            audioPath=res["audio_path"],
            voiceId=res["voice_id"],
            accent=res["accent"],
            displayName=res["display_name"],
            duration=res["duration"],
            normalizedText=res["normalized_text"],
            dialectText=res["dialect_text"],
            processingTime=res["processing_time"]
        )
    except Exception as e:
        print(f"[API Error] TTS generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Gujarati voice generation temporarily failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("TTS_PORT", "8000"))
    host = os.getenv("TTS_HOST", "127.0.0.1")
    print(f"Starting Local Gujarati TTS API on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
