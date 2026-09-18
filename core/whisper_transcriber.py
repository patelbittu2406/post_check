"""
Whisper Transcriber — Faster-Whisper wrapper for word-level timestamps.
Provides millisecond-precise word timings from voiceover audio.
Falls back to proportional script-based timing when Whisper is unavailable.
"""

import os
import re
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config


class WhisperTranscriber:
    """
    Faster-Whisper wrapper that extracts word-level timestamps from audio.
    Auto-detects GPU/CPU and selects optimal compute type.
    """

    def __init__(self, model_size: Optional[str] = None, device: str = "auto"):
        self._explicit_model = model_size
        self.device = device
        self._model = None

    @staticmethod
    def clean_script_text(text: Optional[str]) -> str:
        """
        Removes all audio tags ([excited], [pauses], [serious], <tag>, etc.)
        from the script text so they never leak into subtitles.
        """
        if not text:
            return ""
        # Strip bracketed tags [tag] and angled tags <tag>
        cleaned = re.sub(r"\[.*?\]|<.*?>", " ", text)
        # Normalize whitespace
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned

    def _get_model(self):
        """Lazy-load Faster-Whisper model with GPU/CPU auto-detection."""
        if self._model is not None:
            return self._model

        try:
            from faster_whisper import WhisperModel
            import torch

            if self.device == "auto":
                dev = "cuda" if torch.cuda.is_available() else "cpu"
            else:
                dev = self.device

            compute = "float16" if dev == "cuda" else "int8"
            model_to_use = self._explicit_model or ("large-v3" if dev == "cuda" else "base")
            print(f"[WhisperTranscriber] Loading model '{model_to_use}' on {dev} ({compute})...")

            self._model = WhisperModel(
                model_to_use,
                device=dev,
                compute_type=compute
            )
            return self._model

        except ImportError:
            print("[WhisperTranscriber] faster-whisper not installed. Using fallback timing.")
            return None
        except Exception as e:
            print(f"[WhisperTranscriber] Model load failed: {e}. Trying 'base' model on CPU...")
            try:
                from faster_whisper import WhisperModel
                self._model = WhisperModel("base", device="cpu", compute_type="int8")
                return self._model
            except Exception as e2:
                print(f"[WhisperTranscriber] Base model also failed: {e2}. Using script fallback.")
                return None

    def transcribe(
        self,
        audio_path: str,
        language: str = "gu",
        initial_prompt: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Transcribe audio and extract word-level timestamps.

        Returns:
            List of dicts: [{"word": "સુરત", "start": 0.42, "end": 0.87, "confidence": 0.94}, ...]
        """
        model = self._get_model()
        if model is None:
            return []

        # Clean any tags from the initial prompt
        cleaned_prompt = self.clean_script_text(initial_prompt) if initial_prompt else None

        try:
            segments, info = model.transcribe(
                audio_path,
                language=language,
                word_timestamps=True,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
                beam_size=5,
                best_of=5,
                temperature=0.0,
                initial_prompt=cleaned_prompt[:200] if cleaned_prompt else None,
            )

            words = []
            for segment in segments:
                if segment.words:
                    for w in segment.words:
                        cleaned = w.word.strip()
                        # Ensure no stray bracketed tags or symbols enter word list
                        if (
                            cleaned
                            and not (cleaned.startswith("[") and cleaned.endswith("]"))
                            and not (cleaned.startswith("<") and cleaned.endswith(">"))
                        ):
                            words.append({
                                "word": cleaned,
                                "start": round(w.start, 3),
                                "end": round(w.end, 3),
                                "confidence": round(getattr(w, 'probability', 0.9), 3),
                            })

            if words:
                words = self._refine_timings(words)
                return words

        except Exception as e:
            print(f"[WhisperTranscriber] Transcription failed: {e}")

        return []

    def _refine_timings(self, words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Post-process word timings to fix gaps and overlaps.
        Uses stable-ts if available, otherwise applies simple gap filling.
        """
        # Simple gap-filling: if gap between words > 0 and < 0.1s, extend previous word
        for i in range(len(words) - 1):
            gap = words[i + 1]["start"] - words[i]["end"]
            if 0 < gap < 0.1:
                # Split the gap
                mid = words[i]["end"] + gap / 2
                words[i]["end"] = round(mid, 3)
                words[i + 1]["start"] = round(mid, 3)
            elif gap < 0:
                # Fix overlap
                mid = (words[i]["end"] + words[i + 1]["start"]) / 2
                words[i]["end"] = round(mid, 3)
                words[i + 1]["start"] = round(mid, 3)

        return words

    @staticmethod
    def fallback_from_script(
        script_text: str,
        audio_duration: float
    ) -> List[Dict[str, Any]]:
        """
        Generate proportional word timings from script text and audio duration.
        Used when Whisper fails or is unavailable.
        Audio tags ([excited], [pauses], etc.) are automatically stripped.
        """
        clean_text = WhisperTranscriber.clean_script_text(script_text)
        raw_words = clean_text.split()
        if not raw_words:
            raw_words = ["સુરત", "સમાચાર", "અપડેટ"]

        # Filter out any lingering bracket tags
        raw_words = [
            w.strip() for w in raw_words 
            if w.strip() 
            and not (w.strip().startswith("[") and w.strip().endswith("]"))
            and not (w.strip().startswith("<") and w.strip().endswith(">"))
        ]
        if not raw_words:
            raw_words = ["સુરત", "સમાચાર", "અપડેટ"]

        # Weight by character length for more natural timing
        total_chars = sum(len(w) for w in raw_words)
        if total_chars == 0:
            total_chars = len(raw_words)

        words = []
        current_time = 0.0
        for w in raw_words:
            word_duration = (len(w) / total_chars) * audio_duration
            word_duration = max(word_duration, 0.15)  # minimum 150ms per word
            words.append({
                "word": w.strip(),
                "start": round(current_time, 3),
                "end": round(current_time + word_duration, 3),
                "confidence": 0.5,  # low confidence = fallback
            })
            current_time += word_duration

        # Scale to fit exact duration
        if words and words[-1]["end"] != audio_duration:
            scale = audio_duration / words[-1]["end"]
            for w in words:
                w["start"] = round(w["start"] * scale, 3)
                w["end"] = round(w["end"] * scale, 3)

        return words

    @staticmethod
    def get_audio_duration(audio_path: str) -> float:
        """Get audio duration in seconds via ffprobe."""
        ffprobe = config.get_ffprobe_binary()
        cmd = [
            ffprobe, "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path)
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception:
            pass
        return 15.0
