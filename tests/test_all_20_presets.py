"""
Unit Tests for All 20 Subtitle Presets
======================================
Verifies every preset in SUBTITLE_PRESETS_20 is structurally valid,
and can generate compliant 1080x1920 ASS subtitle script content.
"""

import unittest
from core.subtitle_presets import (
    SUBTITLE_PRESETS_20,
    get_subtitle_preset,
    list_subtitle_presets,
    get_preset_categories,
)
from core.ass_multilang_builder import ASSMultiLangBuilder


class TestAll20Presets(unittest.TestCase):
    def test_preset_count(self):
        self.assertEqual(
            len(SUBTITLE_PRESETS_20),
            20,
            f"Expected exactly 20 presets, found {len(SUBTITLE_PRESETS_20)}",
        )

    def test_preset_required_fields(self):
        required_fields = [
            "id",
            "name",
            "category",
            "icon",
            "description",
            "base_font",
            "base_size",
            "base_color",
            "base_outline",
            "base_outline_width",
            "base_shadow",
            "latin_font",
            "latin_color",
            "latin_scale",
            "latin_uppercase",
            "latin_bold",
            "chunk_size",
            "animation",
            "glow",
            "pill_bg",
            "margin_v",
        ]

        for preset_id, preset in SUBTITLE_PRESETS_20.items():
            for field in required_fields:
                self.assertIn(
                    field,
                    preset,
                    f"Preset '{preset_id}' missing required field '{field}'",
                )

    def test_categories(self):
        categories = get_preset_categories()
        self.assertGreaterEqual(len(categories), 6)
        cat_ids = [c["id"] for c in categories]
        self.assertIn("bilingual", cat_ids)
        self.assertIn("bold", cat_ids)
        self.assertIn("minimal", cat_ids)
        self.assertIn("festive", cat_ids)
        self.assertIn("cinematic", cat_ids)
        self.assertIn("creative", cat_ids)

    def test_ass_generation_for_all_20_presets(self):
        sample_words = [
            {"word": "આનો", "start": 0.0, "end": 0.4, "language": "gu"},
            {"word": "મતલબ", "start": 0.4, "end": 0.8, "language": "gu"},
            {"word": "છે", "start": 0.8, "end": 1.0, "language": "gu"},
            {"word": "VIDEO", "start": 1.0, "end": 1.5, "language": "en"},
            {"word": "ના", "start": 1.5, "end": 1.8, "language": "gu"},
            {"word": "CONTENT", "start": 1.8, "end": 2.4, "language": "en"},
            {"word": "VALUE", "start": 2.4, "end": 3.0, "language": "en"},
            {"word": "નથી", "start": 3.0, "end": 3.5, "language": "gu"},
        ]

        chunks = [
            sample_words[0:3],
            sample_words[3:5],
            sample_words[5:8],
        ]

        for preset_id in SUBTITLE_PRESETS_20.keys():
            builder = ASSMultiLangBuilder(style_preset=preset_id)
            ass_content = builder.build_ass(chunks)

            # Assert valid ASS structure
            self.assertIn("[Script Info]", ass_content)
            self.assertIn("PlayResX: 1080", ass_content)
            self.assertIn("PlayResY: 1920", ass_content)
            self.assertIn("[V4+ Styles]", ass_content)
            self.assertIn("Style: PrarambhBase", ass_content)
            self.assertIn("Style: PrarambhLatin", ass_content)
            self.assertIn("[Events]", ass_content)
            self.assertIn("Dialogue: 0,", ass_content)


if __name__ == "__main__":
    unittest.main()
