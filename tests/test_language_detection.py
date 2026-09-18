"""
Unit Tests for Script & Language Detection Engine
==================================================
Tests per-word Gujarati, Latin, Neutral, and Mixed classification.
"""

import unittest
from core.language_detector import LanguageDetector


class TestLanguageDetection(unittest.TestCase):
    def setUp(self):
        self.detector = LanguageDetector()

    def test_pure_gujarati_words(self):
        words = ["સુરત", "વરસાદ", "ઉત્સવ", "આનો", "મતલબ", "તમારો"]
        for w in words:
            self.assertEqual(
                self.detector.classify_word(w),
                "gu",
                f"Expected '{w}' to be classified as 'gu'",
            )

    def test_pure_latin_words(self):
        words = ["VIDEO", "CONTENT", "VALUE", "Breaking", "Surat", "reels", "NEWS"]
        for w in words:
            self.assertEqual(
                self.detector.classify_word(w),
                "en",
                f"Expected '{w}' to be classified as 'en'",
            )

    def test_neutral_numbers_and_punctuation(self):
        neutrals = ["100%", "2026", "—", ",", "...", "123", "!"]
        for w in neutrals:
            self.assertEqual(
                self.detector.classify_word(w),
                "neutral",
                f"Expected '{w}' to be classified as 'neutral'",
            )

    def test_analyze_words_stream(self):
        raw_words = [
            {"word": "આનો", "start": 0.0, "end": 0.4},
            {"word": "મતલબ", "start": 0.4, "end": 0.8},
            {"word": "છે", "start": 0.8, "end": 1.0},
            {"word": "તમારો", "start": 1.0, "end": 1.4},
            {"word": "VIDEO", "start": 1.4, "end": 1.9},
            {"word": "ના", "start": 1.9, "end": 2.1},
            {"word": "CONTENT", "start": 2.1, "end": 2.6},
            {"word": "માં", "start": 2.6, "end": 2.8},
            {"word": "VALUE", "start": 2.8, "end": 3.3},
            {"word": "નથી", "start": 3.3, "end": 3.7},
        ]
        analyzed = self.detector.analyze_words(raw_words)

        self.assertEqual(len(analyzed), 10)
        self.assertEqual(analyzed[0]["language"], "gu")
        self.assertEqual(analyzed[4]["language"], "en")
        self.assertEqual(analyzed[4]["word"], "VIDEO")
        self.assertEqual(analyzed[6]["language"], "en")
        self.assertEqual(analyzed[6]["word"], "CONTENT")
        self.assertEqual(analyzed[8]["language"], "en")
        self.assertEqual(analyzed[8]["word"], "VALUE")
        self.assertEqual(analyzed[9]["language"], "gu")

    def test_manual_overrides(self):
        raw_words = [
            {"word": "100", "start": 0.0, "end": 0.5},
            {"word": "Surat", "start": 0.5, "end": 1.0},
        ]
        overrides = {0: "en", 1: "gu"}
        analyzed = self.detector.analyze_words(raw_words, overrides=overrides)

        self.assertEqual(analyzed[0]["language"], "en")
        self.assertEqual(analyzed[1]["language"], "gu")


if __name__ == "__main__":
    unittest.main()
