"""
Multi-Language Subtitle Style Engine — Core Orchestrator
=========================================================
Supports 20 viral subtitle presets with per-word language detection
(Gujarati script vs Latin display fonts) and inline ASS font switching.
100% local, zero API cost.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import config
from core.subtitle_presets import get_subtitle_preset, SUBTITLE_PRESETS_20
from core.language_detector import LanguageDetector
from core.word_chunker import WordChunker
from core.whisper_transcriber import WhisperTranscriber
from core.ass_multilang_builder import ASSMultiLangBuilder


class MultiLangSubtitleEngine:
    """
    Multi-Language Subtitle Style Engine for Prarambh Reel Studio.
    Renders mixed-language viral subtitles (e.g., White Gujarati + Yellow Anton English)
    with millisecond-precise Faster-Whisper timings and 20 distinct style presets.
    """

    def __init__(
        self,
        audio_path: Optional[str] = None,
        output_ass_path: Optional[str] = None,
        style_preset: str = "mixed_highlight",
        custom_style: Optional[Dict[str, Any]] = None,
        language: str = "gu",
        whisper_model: Optional[str] = None,
        chunk_size: Optional[int] = None,
        safe_zone_bottom_px: int = 420,
        script_text: Optional[str] = None,
        word_language_overrides: Optional[Dict[int, str]] = None,
    ):
        self.audio_path = audio_path
        self.output_ass_path = output_ass_path or str(config.OUTPUT_SUBTITLES_DIR / "subtitles.ass")
        self.style_preset_id = style_preset
        self.language = language
        self.whisper_model = whisper_model
        self.safe_zone_bottom_px = safe_zone_bottom_px
        self.script_text = WhisperTranscriber.clean_script_text(script_text) if script_text else None
        self.word_language_overrides = word_language_overrides or {}

        # Resolve Preset + Overrides
        self.preset = get_subtitle_preset(style_preset)
        if custom_style:
            self.preset.update(custom_style)

        # Allow explicit chunk size override
        if chunk_size is not None:
            self.preset["chunk_size"] = chunk_size

        self.margin_v = safe_zone_bottom_px + 40
        self.preset["margin_v"] = self.margin_v

        # Sub-modules
        self.detector = LanguageDetector(overrides=self.word_language_overrides)
        self.transcriber = WhisperTranscriber(model_size=whisper_model)
        self.chunker = WordChunker(
            max_words=self.preset.get("chunk_size", 3),
            pause_threshold=config.SUBTITLE_DEFAULTS.get("pause_threshold", 0.25),
            min_chunk_duration=config.SUBTITLE_DEFAULTS.get("min_chunk_duration", 0.3),
            max_chunk_duration=config.SUBTITLE_DEFAULTS.get("max_chunk_duration", 1.5),
        )
        self.ass_builder = ASSMultiLangBuilder(self.preset)
        self.ass_builder.styler.detector = self.detector
        self.last_words: List[Dict[str, Any]] = []
        self.last_chunks: List[List[Dict[str, Any]]] = []
        self.last_enriched: List[Dict[str, Any]] = []

    def set_word_language_override(self, word_index: int, language: str) -> None:
        """Sets or resets forced language ('gu', 'en', 'auto') for a word index."""
        self.detector.set_override(word_index, language)

    def transcribe_words(self) -> List[Dict[str, Any]]:
        """
        Extracts word timestamps from voiceover audio with Faster-Whisper,
        or falls back to script-based proportional timing.
        """
        if not self.audio_path or not Path(self.audio_path).exists():
            if self.script_text:
                print("[MultiLangSubtitleEngine] No audio file found; using script-based timing fallback.")
                return WhisperTranscriber.fallback_from_script(self.script_text, audio_duration=10.0)
            return []

        # Transcribe with Whisper
        words = self.transcriber.transcribe(
            audio_path=self.audio_path,
            language=self.language,
            initial_prompt=self.script_text,
        )

        # Fallback if Whisper returned 0 words
        if not words and self.script_text:
            print("[MultiLangSubtitleEngine] Whisper returned 0 words; using script fallback.")
            duration = WhisperTranscriber.get_audio_duration(self.audio_path)
            words = WhisperTranscriber.fallback_from_script(self.script_text, duration)

        return words

    def generate_ass_file(
        self,
        words: Optional[List[Dict[str, Any]]] = None,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Generates and writes the styled bilingual ASS subtitle file.
        """
        if words is None:
            words = self.transcribe_words()

        if not words and self.script_text:
            words = WhisperTranscriber.fallback_from_script(self.script_text, audio_duration=6.0)

        # Tag global word indices and detect language
        for idx, w in enumerate(words):
            w["global_index"] = idx

        enriched = self.detector.analyze_words(words)
        chunks = self.chunker.group(enriched)

        self.last_words = words
        self.last_enriched = enriched
        self.last_chunks = chunks

        ass_content = self.ass_builder.build_full_ass(chunks)

        out_file = Path(output_path or self.output_ass_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)

        with open(out_file, "w", encoding="utf-8") as f:
            f.write(ass_content)

        print(f"[MultiLangSubtitleEngine] Generated ASS: {out_file} ({len(chunks)} chunks, style: {self.style_preset_id})")
        return str(out_file)

    def generate_from_script(
        self,
        script_text: str,
        voiceover_duration: float = 6.0,
        output_path: Optional[str] = None,
    ) -> str:
        """
        Convenience: Generates bilingual subtitles directly from script text.
        """
        self.script_text = WhisperTranscriber.clean_script_text(script_text)
        words = WhisperTranscriber.fallback_from_script(self.script_text, voiceover_duration)
        return self.generate_ass_file(words=words, output_path=output_path)

    def burn_subtitles(self, video_path: str, output_path: str, ass_path: Optional[str] = None) -> str:
        """
        Burns the ASS subtitles into the MP4 video using FFmpeg with local fonts directory.
        """
        target_ass = ass_path or self.output_ass_path
        ffmpeg = config.get_ffmpeg_binary()
        fonts_dir = str(config.BASE_DIR / "assets" / "fonts").replace("\\", "/")

        escaped_ass = str(target_ass).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")

        cmd = [
            ffmpeg, "-y",
            "-i", str(video_path),
            "-vf", f"ass='{escaped_ass}':fontsdir='{fonts_dir}'",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "21",
            "-pix_fmt", "yuv420p",
            "-c:a", "copy",
            str(output_path),
        ]

        subprocess.run(
            cmd,
            cwd=str(config.BASE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
        )

        print(f"[MultiLangSubtitleEngine] Burned subtitles → {output_path}")
        return str(output_path)

    def render(self, progress_callback: Optional[Callable] = None) -> str:
        """Full pipeline runner."""
        if progress_callback:
            progress_callback("1. Transcribing audio with Faster-Whisper...", 15)

        words = self.transcribe_words()

        if progress_callback:
            progress_callback(f"2. Detecting scripts & applying '{self.style_preset_id}' style...", 45)

        ass_path = self.generate_ass_file(words=words)

        if progress_callback:
            progress_callback("3. ASS Subtitle generation ready", 85)

        return ass_path
