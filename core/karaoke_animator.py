"""
Karaoke Animator — Generates ASS animation tags for word-level effects.
Handles bounce/pop/slide animations, karaoke color highlighting, glow, and fade.
"""

from typing import List, Dict, Any, Optional


class KaraokeAnimator:
    """
    Generates per-word and per-chunk ASS override tags for
    CapCut/Hormozi-style animated subtitles.
    """

    def __init__(
        self,
        base_ass_color: str = "&H00FFFFFF",
        highlight_ass_color: str = "&H0000CCFF",
        glow_ass_color: str = "&H0000D7FF",
        animation: str = "bounce",
        enable_glow: bool = True,
        outline_width: int = 5,
    ):
        self.base_ass_color = base_ass_color
        self.highlight_ass_color = highlight_ass_color
        self.glow_ass_color = glow_ass_color
        self.animation = animation
        self.enable_glow = enable_glow
        self.outline_width = outline_width

    def build_chunk_animation(self) -> str:
        """
        Build chunk-level entrance animation tags.
        Returns the ASS override string (without outer braces).
        """
        if self.animation == "bounce":
            # Scale from 60% → overshoot 110% → settle 100%
            return (
                "\\fscx60\\fscy60"
                "\\t(0,150,\\fscx110\\fscy110)"
                "\\t(150,250,\\fscx100\\fscy100)"
            )
        elif self.animation == "pop":
            # Scale from 50% → overshoot 115% → settle 100% (more dramatic)
            return (
                "\\fscx50\\fscy50"
                "\\t(0,120,\\fscx115\\fscy115)"
                "\\t(120,220,\\fscx100\\fscy100)"
            )
        elif self.animation == "slide":
            # No scale, will use \move in the dialogue line
            return "\\fad(120,80)"
        elif self.animation == "none":
            return "\\fad(80,80)"
        else:
            return ""

    def build_word_karaoke_tags(
        self,
        chunk: List[Dict[str, Any]],
        word_index: int,
    ) -> str:
        """
        Build per-word karaoke tags for a single word within a chunk.

        Uses \\k (karaoke fill) for word-level color transition timing.
        The duration in centiseconds controls how long before this word
        highlights.

        Args:
            chunk: The full chunk of words.
            word_index: Index of the current word within the chunk.

        Returns:
            ASS override string for this word (without outer braces).
        """
        word = chunk[word_index]
        duration_cs = max(1, int((word["end"] - word["start"]) * 100))

        tags = f"\\kf{duration_cs}"

        if word_index == 0:
            # First word: starts highlighted immediately
            tags += f"\\c{self.highlight_ass_color}"
            if self.enable_glow:
                tags += f"\\3c{self.glow_ass_color}\\blur2"
        else:
            # Subsequent words: base color, karaoke will highlight them in sequence
            tags += f"\\c{self.base_ass_color}"
            if self.enable_glow:
                tags += "\\blur0"

        return tags

    def build_glow_tags(self) -> str:
        """Build glow effect tags for the active word."""
        if not self.enable_glow:
            return ""
        return f"\\3c{self.glow_ass_color}\\blur3\\bord{self.outline_width}"

    def build_fade_tags(self, fade_in_ms: int = 100, fade_out_ms: int = 100) -> str:
        """Build fade-in/fade-out tags."""
        return f"\\fad({fade_in_ms},{fade_out_ms})"

    def build_dialogue_text(
        self,
        chunk: List[Dict[str, Any]],
        include_chunk_anim: bool = True,
    ) -> str:
        """
        Build the complete ASS dialogue text for a chunk with all effects.

        This creates the text portion of a Dialogue: line, including:
        - Chunk-level entrance animation (bounce/pop)
        - Per-word karaoke timing (\\kf)
        - Per-word color highlighting
        - Glow on active word

        Returns:
            The complete text field for an ASS Dialogue: line.
        """
        parts = []

        # Chunk-level animation (applied to first word)
        chunk_anim = self.build_chunk_animation() if include_chunk_anim else ""

        for i, word in enumerate(chunk):
            word_tags = self.build_word_karaoke_tags(chunk, i)

            if i == 0 and chunk_anim:
                # First word: include chunk animation + word karaoke
                combined = f"{{{chunk_anim}{word_tags}}}{word['word']}"
            else:
                # Subsequent words: space before word, word karaoke
                combined = f"{{{word_tags}}} {word['word']}"

            parts.append(combined)

        return "".join(parts)
