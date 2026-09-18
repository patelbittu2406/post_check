"""
Language Detector for Prarambh Multi-Language Subtitle Engine
=============================================================
Per-word script classification (Gujarati Unicode U+0A80–U+0AFF vs Latin A-Za-z).
Supports user-defined per-word language overrides and mixed token analysis.
"""

import re
from typing import Dict, Optional, List, Tuple


class LanguageDetector:
    """
    Detects script language for individual words and phrases.
    Enables bilingual subtitle styling (Gujarati white + English yellow display font).
    """

    GUJARATI_PATTERN = re.compile(r"[\u0A80-\u0AFF]")
    LATIN_PATTERN = re.compile(r"[A-Za-z]")
    DIGIT_PUNCT_PATTERN = re.compile(r"^[0-9\s.,!?:;%—\-+*#@&\"'()\[\]{}।]+$")

    def __init__(self, overrides: Optional[Dict[int, str]] = None):
        """
        Args:
            overrides: Optional mapping of word index to forced language ("gu" | "en").
        """
        self.overrides = overrides or {}

    def set_override(self, word_index: int, language: str) -> None:
        """Set manual language override for a specific word index."""
        if language in ("gu", "en", "auto"):
            if language == "auto":
                self.overrides.pop(word_index, None)
            else:
                self.overrides[word_index] = language

    def detect_word(self, word: str, word_index: Optional[int] = None) -> str:
        """
        Classifies word script into:
        - 'gu' : Gujarati script
        - 'en' : Latin / English script
        - 'mixed' : contains both Gujarati and Latin characters (e.g. 'VIDEOમાં')
        - 'neutral' : digits, punctuation, or symbols without letters
        """
        if word_index is not None and word_index in self.overrides:
            return self.overrides[word_index]

        cleaned = word.strip()
        if not cleaned:
            return "neutral"

        has_gujarati = bool(self.GUJARATI_PATTERN.search(cleaned))
        has_latin = bool(self.LATIN_PATTERN.search(cleaned))

        if has_gujarati and has_latin:
            return "mixed"
        elif has_gujarati:
            return "gu"
        elif has_latin:
            return "en"
        elif self.DIGIT_PUNCT_PATTERN.match(cleaned):
            return "neutral"
        else:
            return "neutral"

    def classify_word(self, word: str, word_index: Optional[int] = None) -> str:
        """Alias for detect_word."""
        return self.detect_word(word, word_index=word_index)

    def detect_word_language(self, word: str) -> str:
        """Returns 'gu', 'en', 'mixed', or 'neutral' for a word."""
        return self.detect_word(word)

    def split_mixed_token(self, token: str) -> List[Tuple[str, str]]:
        """
        Splits a mixed token like 'VIDEOમાં' into [('VIDEO', 'en'), ('માં', 'gu')].
        Returns list of (sub_word, language) pairs.
        """
        if self.detect_word(token) != "mixed":
            return [(token, self.detect_word(token))]

        parts: List[Tuple[str, str]] = []
        current_script = None
        current_chars: List[str] = []

        for ch in token:
            if self.GUJARATI_PATTERN.match(ch):
                script = "gu"
            elif self.LATIN_PATTERN.match(ch):
                script = "en"
            else:
                script = current_script or "neutral"

            if current_script is None or script == current_script or script == "neutral":
                current_chars.append(ch)
                if current_script is None and script != "neutral":
                    current_script = script
            else:
                if current_chars:
                    parts.append(("".join(current_chars), current_script or "neutral"))
                current_chars = [ch]
                current_script = script

        if current_chars:
            parts.append(("".join(current_chars), current_script or "neutral"))

        return parts

    def analyze_words(self, words: List[Dict], overrides: Optional[Dict[int, str]] = None) -> List[Dict]:
        """
        Enriches a list of word timestamp dicts with language metadata.
        Each word dict receives a 'language' key ('gu' | 'en' | 'mixed' | 'neutral').
        """
        active_overrides = dict(self.overrides)
        if overrides:
            active_overrides.update(overrides)

        enriched = []
        for idx, w in enumerate(words):
            word_text = w.get("word", "")
            target_idx = w.get("global_index", idx)
            if target_idx in active_overrides:
                lang = active_overrides[target_idx]
            else:
                lang = self.detect_word(word_text, word_index=target_idx)
            item = dict(w)
            item["language"] = lang
            enriched.append(item)
        return enriched

