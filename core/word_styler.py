"""
Word Styler for Prarambh Multi-Language Subtitle Engine
======================================================
Applies bilingual styling rules (font, color, scale, uppercase, glow)
per word and generates inline ASS override tags for seamless mid-line font switching.
"""

import re
from typing import Dict, Any, List, Optional
from core.language_detector import LanguageDetector


class WordStyler:
    """
    Transforms raw word timestamp objects into styled bilingual word chunks
    with inline ASS tags (\fn, \c, \fscx, \fscy, \b, \r).
    """

    def __init__(self, preset: Dict[str, Any], detector: Optional[LanguageDetector] = None):
        self.preset = preset
        self.detector = detector or LanguageDetector()

    @staticmethod
    def rgb_to_ass_bgr(hex_rgb: str, alpha: int = 0x00) -> str:
        """
        Convert '#RRGGBB' hex color string to ASS format '&HAABBGGRR'.
        ASS uses BGR byte ordering.
        """
        cleaned = hex_rgb.lstrip("#")
        if len(cleaned) != 6:
            return f"&H{alpha:02X}FFFFFF"
        r, g, b = cleaned[0:2], cleaned[2:4], cleaned[4:6]
        return f"&H{alpha:02X}{b}{g}{r}"

    def style_word(
        self,
        word: str,
        word_index: Optional[int] = None,
        duration_cs: Optional[int] = None,
        is_active_word: bool = False,
    ) -> str:
        """
        Converts a single word string into an inline ASS-formatted string.

        Example output for English word 'VIDEO' with mixed_highlight:
          {\fnAnton\c&H00D7FF&\fscx110\fscy110\b1}VIDEO{\r}
        """
        lang = self.detector.detect_word(word, word_index=word_index)

        # Handle mixed words like 'VIDEOમાં'
        if lang == "mixed":
            parts = self.detector.split_mixed_token(word)
            formatted_parts = []
            for sub_text, sub_lang in parts:
                formatted_parts.append(
                    self._format_sub_token(sub_text, sub_lang, is_active_word=is_active_word)
                )
            return "".join(formatted_parts)

        return self._format_sub_token(word, lang, duration_cs=duration_cs, is_active_word=is_active_word)

    def _format_sub_token(
        self,
        text: str,
        lang: str,
        duration_cs: Optional[int] = None,
        is_active_word: bool = False,
    ) -> str:
        """Formats a single token with inline ASS override tags."""
        base_font = self.preset.get("base_font", "Noto Sans Gujarati")
        base_color_ass = self.rgb_to_ass_bgr(self.preset.get("base_color", "#FFFFFF"))

        latin_font = self.preset.get("latin_font", "Anton")
        latin_color_ass = self.rgb_to_ass_bgr(self.preset.get("latin_color", "#FFD700"))
        latin_scale = int(self.preset.get("latin_scale", 1.10) * 100)
        latin_uppercase = self.preset.get("latin_uppercase", True)
        latin_bold = self.preset.get("latin_bold", True)

        tags = []

        if duration_cs is not None and duration_cs > 0:
            tags.append(f"\\kf{duration_cs}")

        if lang == "en":
            # English word: Apply display font + highlight color + scale + uppercase
            display_text = text.upper() if latin_uppercase else text
            if latin_font != base_font:
                tags.append(f"\\fn{latin_font}")
            tags.append(f"\\c{latin_color_ass}")
            if latin_scale != 100:
                tags.append(f"\\fscx{latin_scale}\\fscy{latin_scale}")
            if latin_bold:
                tags.append("\\b1")
            if self.preset.get("latin_glow") or (is_active_word and self.preset.get("glow")):
                glow_col = self.preset.get("glow_color") or self.preset.get("latin_color", "#FFD700")
                tags.append(f"\\3c{self.rgb_to_ass_bgr(glow_col)}\\blur3")
        else:
            # Gujarati or neutral word: Base font & color
            display_text = text
            tags.append(f"\\fn{base_font}")
            tags.append(f"\\c{base_color_ass}")
            tags.append("\\fscx100\\fscy100")
            if is_active_word and self.preset.get("glow") and self.preset.get("glow_color"):
                tags.append(f"\\3c{self.rgb_to_ass_bgr(self.preset['glow_color'])}\\blur3")

        tag_str = "".join(tags)
        if tag_str:
            return f"{{{tag_str}}}{display_text}{{\\r}}"
        return display_text

    def style_chunk(
        self,
        chunk: List[Dict[str, Any]],
        chunk_index: int = 0,
        enable_animation: bool = True,
    ) -> str:
        """
        Renders an entire 1-3 word chunk with per-word bilingual styling
        and chunk entrance animation.
        """
        styled_words = []
        for idx, w in enumerate(chunk):
            word_txt = w.get("word", "").strip()
            # Calculate duration in centiseconds
            duration_cs = max(1, int((w.get("end", 0.0) - w.get("start", 0.0)) * 100))
            styled = self.style_word(
                word_txt,
                word_index=w.get("global_index", idx),
                duration_cs=duration_cs if self.preset.get("animation") == "karaoke_fill" else None,
                is_active_word=(idx == 0),
            )
            styled_words.append(styled)

        chunk_text = " ".join(styled_words)

        # Apply chunk-level entrance animation prefix
        if enable_animation:
            anim_prefix = self.get_chunk_animation_tags()
            if anim_prefix:
                chunk_text = f"{{{anim_prefix}}}{chunk_text}"

        return chunk_text

    def get_chunk_animation_tags(self) -> str:
        """Builds entrance animation tags for the chunk."""
        anim = self.preset.get("animation", "bounce_soft")

        if anim == "bounce_soft":
            # 70% scale -> overshoot 108% -> settle 100%
            return "\\fscx70\\fscy70\\t(0,140,\\fscx108\\fscy108)\\t(140,240,\\fscx100\\fscy100)"
        elif anim == "bounce_hard":
            # 50% scale -> overshoot 115% -> settle 100%
            return "\\fscx50\\fscy50\\t(0,120,\\fscx115\\fscy115)\\t(120,220,\\fscx100\\fscy100)"
        elif anim == "pop":
            # Snappy scale up
            return "\\fscx60\\fscy60\\t(0,100,\\fscx112\\fscy112)\\t(100,180,\\fscx100\\fscy100)"
        elif anim == "slide_up":
            return "\\fad(120,80)"
        elif anim == "glitch":
            return "\\t(0,60,\\fscx110\\fscy90)\\t(60,120,\\fscx95\\fscy110)\\t(120,180,\\fscx100\\fscy100)"
        elif anim == "wave_bounce":
            return "\\fscx60\\fscy60\\t(0,130,\\fscx110\\fscy110)\\t(130,230,\\fscx100\\fscy100)"
        elif anim == "pulse":
            return "\\t(0,200,\\fscx105\\fscy105)\\t(200,400,\\fscx100\\fscy100)"
        elif anim == "typewriter":
            return "\\fad(40,40)"
        else:
            return "\\fad(60,60)"
