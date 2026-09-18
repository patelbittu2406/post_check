"""
Unit & Integration Tests for MultiLangSubtitleEngine
===================================================
Tests bilingual font tag generation, reference sentence output,
and audio tag stripping.
"""

import unittest
from pathlib import Path
import tempfile
from core.multilang_subtitles import MultiLangSubtitleEngine


class TestMultiLangSubtitles(unittest.TestCase):
    def test_reference_sentence_bilingual_formatting(self):
        """
        Verifies the flagship sentence:
        'આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી'
        produces exact Anton + Yellow formatting on English words,
        and Noto Sans Gujarati on Gujarati words.
        """
        with tempfile.NamedTemporaryFile(suffix=".ass", delete=False) as f:
            temp_ass = f.name

        sample = "આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી"
        engine = MultiLangSubtitleEngine(
            output_ass_path=temp_ass,
            style_preset="mixed_highlight",
            script_text=sample,
        )

        out_path = engine.generate_from_script(sample, voiceover_duration=4.0)
        self.assertTrue(Path(out_path).exists())

        with open(out_path, "r", encoding="utf-8") as f:
            ass_text = f.read()

        # Check ASS headers
        self.assertIn("PrarambhBase", ass_text)
        self.assertIn("Noto Sans Gujarati", ass_text)
        self.assertIn("PrarambhLatin", ass_text)
        self.assertIn("Anton", ass_text)

        # Check Dialogue lines contain Anton font switch on English words
        self.assertIn(r"\fnAnton", ass_text)
        self.assertIn(r"\c&H0000D7FF", ass_text)  # #FFD700 in ASS BGR
        self.assertIn("VIDEO", ass_text)
        self.assertIn("CONTENT", ass_text)
        self.assertIn("VALUE", ass_text)

        # Check reset tag after Latin words
        self.assertIn(r"\r", ass_text)

        # Clean up
        Path(out_path).unlink(missing_ok=True)

    def test_audio_tag_stripping_in_subtitles(self):
        """
        Verifies that audio tags like [excited], [pauses], [serious]
        are completely stripped and never appear in ASS dialogue lines.
        """
        with tempfile.NamedTemporaryFile(suffix=".ass", delete=False) as f:
            temp_ass = f.name

        tagged_script = "[excited] સુરતના વેસુ વિસ્તારમાં [pauses] ભારે વરસાદ વચ્ચે પણ ભક્તોનો ઉત્સાહ જોવા મળ્યો!"
        engine = MultiLangSubtitleEngine(
            output_ass_path=temp_ass,
            style_preset="mixed_highlight",
            script_text=tagged_script,
        )

        out_path = engine.generate_from_script(tagged_script, voiceover_duration=5.0)
        with open(out_path, "r", encoding="utf-8") as f:
            ass_text = f.read()

        self.assertNotIn("[excited]", ass_text)
        self.assertNotIn("[pauses]", ass_text)
        self.assertNotIn("excited", ass_text)
        self.assertNotIn("pauses", ass_text)
        self.assertIn("સુરતના", ass_text)

        Path(out_path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
