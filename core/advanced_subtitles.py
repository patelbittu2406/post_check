"""
Advanced Subtitle Generator — CapCut / Hormozi-style viral subtitle engine.
Orchestrates Faster-Whisper transcription, word chunking, ASS generation,
karaoke animation, and FFmpeg burn-in.

100% local, zero API cost.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from core.ass_presets import get_preset, SUBTITLE_PRESETS
from core.whisper_transcriber import WhisperTranscriber
from core.word_chunker import WordChunker
from core.ass_style_builder import ASSStyleBuilder
from core.karaoke_animator import KaraokeAnimator


class AdvancedSubtitleGenerator:
    """
    CapCut / Hormozi-style advanced subtitle generator for Prarambh Reel Studio.
    Produces word-by-word animated ASS subtitles with color highlighting,
    bounce/pop effects, glow, and pill backgrounds.
    100% local, zero API cost.
    """

    def __init__(
        self,
        audio_path: Optional[str] = None,
        output_ass_path: Optional[str] = None,
        language: str = "gu",
        model_size: Optional[str] = None,
        base_color: str = "#FFFFFF",
        highlight_color: str = "#FFCC00",
        glow_color: str = "#FFD700",
        font_size: int = 72,
        font_name: str = "Noto Sans Gujarati",
        chunk_size: int = 2,
        style_preset: Optional[str] = "hormozi",
        animation: str = "bounce",
        enable_glow: bool = True,
        enable_pill_bg: bool = False,
        safe_zone_bottom_px: int = 420,
        outline_width: int = 5,
        shadow: int = 3,
        script_text: Optional[str] = None,
    ):
        # Apply preset first, then allow per-parameter overrides
        if style_preset and style_preset in SUBTITLE_PRESETS:
            preset = get_preset(style_preset)
            base_color = preset.get("base_color", base_color)
            highlight_color = preset.get("highlight_color", highlight_color)
            glow_color = preset.get("glow_color", glow_color) or highlight_color
            font_size = preset.get("font_size", font_size)
            font_name = preset.get("font_name", font_name)
            chunk_size = preset.get("chunk_size", chunk_size)
            animation = preset.get("animation", animation)
            enable_glow = preset.get("enable_glow", enable_glow)
            enable_pill_bg = preset.get("enable_pill_bg", enable_pill_bg)
            outline_width = preset.get("outline_width", outline_width)
            shadow = preset.get("shadow", shadow)

        self.audio_path = audio_path
        self.output_ass_path = output_ass_path
        self.language = language
        self.model_size = model_size
        self.base_color = base_color
        self.highlight_color = highlight_color
        self.glow_color = glow_color or highlight_color
        self.font_size = font_size
        self.font_name = font_name
        self.chunk_size = chunk_size
        self.style_preset = style_preset
        self.animation = animation
        self.enable_glow = enable_glow
        self.enable_pill_bg = enable_pill_bg
        self.safe_zone_bottom_px = safe_zone_bottom_px
        self.outline_width = outline_width
        self.shadow = shadow
        self.script_text = WhisperTranscriber.clean_script_text(script_text) if script_text else None

        # Computed
        self.margin_v = safe_zone_bottom_px + 40

        # Sub-components
        self._transcriber = WhisperTranscriber(model_size=model_size)
        self._chunker = WordChunker(
            max_words=chunk_size,
            pause_threshold=config.SUBTITLE_DEFAULTS.get("pause_threshold", 0.25),
            min_chunk_duration=config.SUBTITLE_DEFAULTS.get("min_chunk_duration", 0.3),
            max_chunk_duration=config.SUBTITLE_DEFAULTS.get("max_chunk_duration", 1.5),
        )
        self._style_builder = ASSStyleBuilder(
            font_name=font_name,
            font_size=font_size,
            base_color=base_color,
            highlight_color=highlight_color,
            glow_color=self.glow_color,
            outline_width=outline_width,
            shadow=shadow,
            margin_v=self.margin_v,
            enable_pill_bg=enable_pill_bg,
        )
        self._animator = KaraokeAnimator(
            base_ass_color=self._style_builder.base_ass,
            highlight_ass_color=self._style_builder.highlight_ass,
            glow_ass_color=self._style_builder.glow_ass,
            animation=animation,
            enable_glow=enable_glow,
            outline_width=outline_width,
        )

    # ------------------------------------------------------------------
    # Method A: Transcribe with word timestamps
    # ------------------------------------------------------------------
    def transcribe_with_word_timestamps(self) -> List[Dict[str, Any]]:
        """
        Get millisecond-precise word timings from the voiceover audio.
        Falls back to script-based proportional timing if Whisper fails.

        Returns:
            List of word dicts: [{"word": "સુરત", "start": 0.42, "end": 0.87, "confidence": 0.94}]
        """
        if not self.audio_path or not Path(self.audio_path).exists():
            if self.script_text:
                print("[AdvancedSubtitleGenerator] No audio; using script fallback.")
                return WhisperTranscriber.fallback_from_script(
                    self.script_text,
                    config.SUBTITLE_DEFAULTS.get("max_chunk_duration", 1.5) * 20
                )
            return []

        # Try Faster-Whisper first
        words = self._transcriber.transcribe(
            self.audio_path,
            language=self.language,
            initial_prompt=self.script_text,
        )

        # Fallback to script-based timing
        if not words and self.script_text:
            print("[AdvancedSubtitleGenerator] Whisper returned no words; using script fallback.")
            duration = WhisperTranscriber.get_audio_duration(self.audio_path)
            words = WhisperTranscriber.fallback_from_script(self.script_text, duration)

        return words

    # ------------------------------------------------------------------
    # Method B: Group words into chunks
    # ------------------------------------------------------------------
    def group_words_into_chunks(self, words: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Group words into 1-3 word bursts with smart boundaries.
        Returns list of chunks, each chunk being a list of word dicts.
        """
        return self._chunker.group(words)

    # ------------------------------------------------------------------
    # Method C: Generate ASS style header
    # ------------------------------------------------------------------
    def generate_ass_style_header(self) -> str:
        """Build the ASS file header with Prarambh-specific styling."""
        return self._style_builder.build_header()

    # ------------------------------------------------------------------
    # Method D: Build dialogue events
    # ------------------------------------------------------------------
    def build_dialogue_events(self, chunks: List[List[Dict[str, Any]]]) -> List[str]:
        """
        Convert chunks into ASS Dialogue: lines with per-word karaoke
        animations, bounce/pop effects, and glow.
        """
        dialogue_lines = []

        for chunk in chunks:
            if not chunk:
                continue

            start_time = chunk[0]["start"]
            end_time = chunk[-1]["end"]

            # Build animated text with karaoke tags
            text = self._animator.build_dialogue_text(chunk, include_chunk_anim=True)

            # Build Dialogue: line
            line = self._style_builder.build_dialogue_line(
                start_time=start_time,
                end_time=end_time,
                text=text,
                style="Prarambh",
            )
            dialogue_lines.append(line)

        return dialogue_lines

    # ------------------------------------------------------------------
    # Method E: Generate ASS file
    # ------------------------------------------------------------------
    def generate_ass_file(
        self,
        words: Optional[List[Dict]] = None,
        chunks: Optional[List[List[Dict]]] = None,
    ) -> str:
        """
        Full ASS file generation pipeline.
        Optionally accepts pre-computed words/chunks for reuse.

        Returns:
            Path to the generated ASS file.
        """
        if words is None:
            words = self.transcribe_with_word_timestamps()

        if chunks is None:
            chunks = self.group_words_into_chunks(words)

        # Build complete ASS content
        dialogue_lines = self.build_dialogue_events(chunks)
        ass_content = self._style_builder.build_full_ass(dialogue_lines)

        # Write to file
        out_path = Path(self.output_ass_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        print(f"[AdvancedSubtitleGenerator] Generated ASS: {out_path} "
              f"({len(chunks)} chunks, {len(words)} words)")

        return str(out_path)

    # ------------------------------------------------------------------
    # Method F: Burn subtitles onto video
    # ------------------------------------------------------------------
    def burn_subtitles(self, video_path: str, output_path: str) -> str:
        """
        Burn ASS subtitles onto video using FFmpeg.
        The ass= filter overlays the styled subtitles directly.
        """
        ffmpeg = config.get_ffmpeg_binary()
        ass_path = self.output_ass_path

        # Escape special characters for FFmpeg filter
        escaped_ass = str(ass_path).replace("\\", "/").replace(":", "\\:").replace("'", "\\'")

        cmd = [
            ffmpeg, "-y",
            "-i", str(video_path),
            "-vf", f"ass='{escaped_ass}':fontsdir='assets/fonts'",
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

        print(f"[AdvancedSubtitleGenerator] Burned subtitles → {output_path}")
        return output_path

    # ------------------------------------------------------------------
    # Method G: Render (full pipeline orchestrator)
    # ------------------------------------------------------------------
    def render(self, progress_callback: Optional[Callable] = None) -> str:
        """
        Run the full subtitle pipeline:
        1. Transcribe audio → word timestamps
        2. Group into chunks
        3. Build ASS styles + dialogue
        4. Write ASS file

        Returns:
            Path to the generated ASS file.
        """
        if progress_callback:
            progress_callback("1. Transcribing audio with Faster-Whisper...", 10)

        words = self.transcribe_with_word_timestamps()

        if progress_callback:
            progress_callback(f"2. Grouping {len(words)} words into chunks...", 30)

        chunks = self.group_words_into_chunks(words)

        if progress_callback:
            progress_callback(f"3. Building ASS styles ({len(chunks)} chunks)...", 50)

        ass_path = self.generate_ass_file(words=words, chunks=chunks)

        if progress_callback:
            progress_callback("4. ASS file ready for burn-in", 80)

        return ass_path

    # ------------------------------------------------------------------
    # Convenience: Generate from script text (no audio, no Whisper)
    # ------------------------------------------------------------------
    def generate_from_script(
        self,
        script_text: str,
        voiceover_duration: float,
        output_ass_path: Optional[str] = None,
    ) -> str:
        """
        Generate subtitles from script text + duration only.
        Fallback when Whisper is unavailable or audio doesn't exist.
        """
        clean_text = WhisperTranscriber.clean_script_text(script_text)
        self.script_text = clean_text
        if output_ass_path:
            self.output_ass_path = output_ass_path

        words = WhisperTranscriber.fallback_from_script(clean_text, voiceover_duration)
        chunks = self.group_words_into_chunks(words)
        return self.generate_ass_file(words=words, chunks=chunks)

    # ------------------------------------------------------------------
    # Convenience: One-shot generate ASS from audio (server-compatible API)
    # ------------------------------------------------------------------
    def generate_ass_subtitles(
        self,
        audio_path: str,
        output_ass_path: str,
        script_text: Optional[str] = None,
        font_size: Optional[int] = None,
        primary_color: Optional[str] = None,
        outline_color: Optional[str] = None,
        y_offset: Optional[int] = None,
        **kwargs,
    ) -> str:
        """
        Drop-in compatible API for the legacy SubtitleGenerator.generate_ass_subtitles().
        Allows the server to call this without changing existing render logic.
        """
        self.audio_path = audio_path
        self.output_ass_path = output_ass_path
        self.script_text = WhisperTranscriber.clean_script_text(script_text) if script_text else None

        if font_size is not None:
            self.font_size = font_size
            self._style_builder.font_size = font_size
        if y_offset is not None:
            self.margin_v = y_offset
            self._style_builder.margin_v = y_offset

        return self.render()


# ---------------------------------------------------------------------------
# Quick CLI test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=== Testing AdvancedSubtitleGenerator ===")

    # Test with script fallback (no audio needed)
    gen = AdvancedSubtitleGenerator(
        output_ass_path=str(config.OUTPUT_SUBTITLES_DIR / "test_advanced.ass"),
        style_preset="hormozi",
    )

    test_script = "સુરતના અડાજણ વિસ્તારમાં આજે સવારે ભારે વરસાદ વરસ્યો. રસ્તાઓ પર પાણી ભરાયા."
    ass_path = gen.generate_from_script(test_script, voiceover_duration=8.0)

    content = Path(ass_path).read_text(encoding="utf-8")
    assert "PlayResX: 1080" in content, "PlayResX check failed"
    assert "PlayResY: 1920" in content, "PlayResY check failed"
    assert "Prarambh" in content, "Style name check failed"
    assert "\\kf" in content, "Karaoke tag check failed"
    assert "\\fscx" in content or "\\fad" in content, "Animation tag check failed"
    assert "Dialogue:" in content, "Dialogue line check failed"

    print(f"[SUCCESS] Generated: {ass_path}")
    print(f"[Preview]:\n{content[:600]}...")
