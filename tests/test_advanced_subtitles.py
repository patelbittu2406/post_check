"""
Tests for Advanced Subtitle Engine (CapCut/Hormozi style).
Covers presets, word chunking, ASS style builder, karaoke animation, and generator fallback.
"""

import unittest
from pathlib import Path
import sys

# Ensure root directory is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from core.ass_presets import SUBTITLE_PRESETS, get_preset, list_presets
from core.ass_style_builder import ASSStyleBuilder
from core.word_chunker import WordChunker
from core.karaoke_animator import KaraokeAnimator
from core.whisper_transcriber import WhisperTranscriber
from core.advanced_subtitles import AdvancedSubtitleGenerator


class TestSubtitlePresets(unittest.TestCase):
    """Test subtitle presets and lookup utilities."""

    def test_preset_definitions(self):
        expected_presets = ["hormozi", "capcut", "neon", "minimal"]
        for p in expected_presets:
            self.assertIn(p, SUBTITLE_PRESETS)
            preset = SUBTITLE_PRESETS[p]
            self.assertIn("id", preset)
            self.assertIn("name", preset)
            self.assertIn("base_color", preset)
            self.assertIn("highlight_color", preset)
            self.assertIn("font_size", preset)
            self.assertIn("chunk_size", preset)
            self.assertIn("animation", preset)
            self.assertTrue(1 <= preset["chunk_size"] <= 3)

    def test_get_preset_existing_and_fallback(self):
        hormozi = get_preset("hormozi")
        self.assertIn("Hormozi", hormozi["name"])

        capcut = get_preset("capcut")
        self.assertIn("CapCut", capcut["name"])

        # Unknown fallback
        unknown = get_preset("invalid_preset_name")
        self.assertIn("id", unknown)

    def test_list_presets(self):
        presets = list_presets()
        self.assertIsInstance(presets, list)
        self.assertGreaterEqual(len(presets), 4)
        preset_ids = [p["id"] for p in presets]
        self.assertTrue("hormozi_classic" in preset_ids or "hormozi" in preset_ids)
        self.assertTrue("capcut_default" in preset_ids or "capcut" in preset_ids)



class TestASSColorConversion(unittest.TestCase):
    """Test RGB to ASS (BGR &HAABBGGRR) color conversion."""

    def test_white(self):
        ass_color = ASSStyleBuilder.rgb_to_ass_color("#FFFFFF")
        self.assertEqual(ass_color, "&H00FFFFFF")

    def test_black(self):
        ass_color = ASSStyleBuilder.rgb_to_ass_color("#000000")
        self.assertEqual(ass_color, "&H00000000")

    def test_rgb_to_bgr_ordering(self):
        # Red #FF0000 -> BGR &H000000FF
        self.assertEqual(ASSStyleBuilder.rgb_to_ass_color("#FF0000"), "&H000000FF")
        # Blue #0000FF -> BGR &H00FF0000
        self.assertEqual(ASSStyleBuilder.rgb_to_ass_color("#0000FF"), "&H00FF0000")
        # Yellow #FFCC00 (R=FF, G=CC, B=00) -> &H0000CCFF
        self.assertEqual(ASSStyleBuilder.rgb_to_ass_color("#FFCC00"), "&H0000CCFF")

    def test_with_alpha(self):
        ass_color = ASSStyleBuilder.rgb_to_ass_color("#FFFFFF", alpha=0x80)
        self.assertEqual(ass_color, "&H80FFFFFF")


class TestWordChunker(unittest.TestCase):
    """Test word-level timing grouping and burst boundary rules."""

    def setUp(self):
        self.sample_words = [
            {"word": "સુરતના", "start": 0.0, "end": 0.4},
            {"word": "વેસુ", "start": 0.45, "end": 0.8},
            {"word": "વિસ્તારમાં", "start": 0.85, "end": 1.3},
            {"word": "આજે", "start": 1.35, "end": 1.6},
            {"word": "ભારે", "start": 1.65, "end": 1.9},
            {"word": "વરસાદ", "start": 1.95, "end": 2.3},
            {"word": "વરસ્યો.", "start": 2.35, "end": 2.7},
            {"word": "લોકો", "start": 3.5, "end": 3.8},  # Gap > 0.25s (pause)
            {"word": "ઉમટ્યા.", "start": 3.85, "end": 4.2},
        ]

    def test_chunk_size_2(self):
        chunker = WordChunker(max_words=2)
        chunks = chunker.group(self.sample_words)

        self.assertTrue(len(chunks) >= 4)
        for chunk in chunks:
            self.assertTrue(1 <= len(chunk) <= 2)

    def test_chunk_size_3(self):
        chunker = WordChunker(max_words=3)
        chunks = chunker.group(self.sample_words)

        for chunk in chunks:
            self.assertTrue(1 <= len(chunk) <= 3)

    def test_pause_break(self):
        chunker = WordChunker(max_words=3, pause_threshold=0.25)
        chunks = chunker.group(self.sample_words)

        # The word 'લોકો' (start 3.5 after 2.7) should start a new chunk
        chunk_words = [[w["word"] for w in c] for c in chunks]
        # Verify 'લોકો' is at the start of its chunk
        found_loko = False
        for c in chunk_words:
            if c and c[0] == "લોકો":
                found_loko = True
                break
        self.assertTrue(found_loko, "'લોકો' should start a new chunk due to pause break")


class TestKaraokeAnimator(unittest.TestCase):
    """Test ASS override animation and karaoke tag generator."""

    def setUp(self):
        self.animator = KaraokeAnimator(
            base_ass_color="&H00FFFFFF",
            highlight_ass_color="&H0000CCFF",
            glow_ass_color="&H0000D7FF",
            animation="bounce",
            enable_glow=True,
        )

    def test_bounce_animation_tags(self):
        anim_tags = self.animator.build_chunk_animation()
        self.assertIn("\\fscx", anim_tags)
        self.assertIn("\\fscy", anim_tags)
        self.assertIn("\\t(", anim_tags)

    def test_pop_animation_tags(self):
        pop_animator = KaraokeAnimator(animation="pop")
        anim_tags = pop_animator.build_chunk_animation()
        self.assertIn("\\fscx", anim_tags)
        self.assertIn("115", anim_tags)

    def test_slide_animation_tags(self):
        slide_animator = KaraokeAnimator(animation="slide")
        anim_tags = slide_animator.build_chunk_animation()
        self.assertIn("\\fad", anim_tags)

    def test_karaoke_tag_formatting(self):
        chunk = [
            {"word": "સુરત", "start": 0.0, "end": 0.5},
            {"word": "સમાચાર", "start": 0.5, "end": 1.2},
        ]
        tags = self.animator.build_word_karaoke_tags(chunk, word_index=0)
        # Should contain \kf karaoke timing in centiseconds (0.5s = 50cs)
        self.assertIn("\\kf", tags)
        self.assertIn("0000CCFF", tags)  # highlight color


class TestASSStyleBuilder(unittest.TestCase):
    """Test ASS header, styles, and dialogue formatting."""

    def test_header_resolution(self):
        builder = ASSStyleBuilder()
        header = builder.build_header()
        self.assertIn("PlayResX: 1080", header)
        self.assertIn("PlayResY: 1920", header)
        self.assertIn("[V4+ Styles]", header)
        self.assertIn("Style: Prarambh,", header)

    def test_dialogue_line_formatting(self):
        builder = ASSStyleBuilder()
        line = builder.build_dialogue_line(
            start_time=1.5,
            end_time=3.25,
            text="{\\fscx100}સુરત સમાચાર",
        )
        self.assertTrue(line.startswith("Dialogue: 0,"))
        self.assertIn("0:00:01.50", line)
        self.assertIn("0:00:03.25", line)
        self.assertIn("સુરત સમાચાર", line)


class TestAdvancedSubtitleGenerator(unittest.TestCase):
    """Test the full AdvancedSubtitleGenerator pipeline and fallback."""

    def setUp(self):
        self.output_ass = config.OUTPUT_SUBTITLES_DIR / "test_suite_subtitles.ass"

    def tearDown(self):
        if self.output_ass.exists():
            self.output_ass.unlink()

    def test_script_fallback_generation(self):
        gen = AdvancedSubtitleGenerator(
            output_ass_path=str(self.output_ass),
            style_preset="hormozi",
        )

        test_text = "સુરતના અડાજણમાં ભારે વરસાદ વરસ્યો. ભક્તોનો ઉત્સાહ ચરમસીમાએ પહોંચ્યો."
        ass_path = gen.generate_from_script(test_text, voiceover_duration=6.0)

        self.assertTrue(Path(ass_path).exists())
        content = Path(ass_path).read_text(encoding="utf-8")

        self.assertIn("PlayResX: 1080", content)
        self.assertIn("PlayResY: 1920", content)
        self.assertIn("Dialogue:", content)
        self.assertIn("\\kf", content)

    def test_all_presets_generate_distinct_styles(self):
        outputs = {}
        for preset_name in ["hormozi", "capcut", "neon", "minimal"]:
            out_file = config.OUTPUT_SUBTITLES_DIR / f"test_preset_{preset_name}.ass"
            gen = AdvancedSubtitleGenerator(
                output_ass_path=str(out_file),
                style_preset=preset_name,
            )
            ass_path = gen.generate_from_script("સુરત સમાચાર લાઈવ", voiceover_duration=3.0)
            outputs[preset_name] = Path(ass_path).read_text(encoding="utf-8")
            if out_file.exists():
                out_file.unlink()

        # Check each preset has different style / color definitions
        self.assertNotEqual(outputs["hormozi"], outputs["capcut"])
        self.assertNotEqual(outputs["neon"], outputs["minimal"])

    def test_audio_tags_stripped_from_subtitles(self):
        """Verify audio tags like [excited], [pauses], <whispers> NEVER appear in subtitles."""
        gen = AdvancedSubtitleGenerator(
            output_ass_path=str(self.output_ass),
            style_preset="hormozi",
        )

        script_with_tags = "[excited] સુરત સમાચાર... [pauses] ભારે વરસાદ [serious] શરુ થયો! [sighs]"
        ass_path = gen.generate_from_script(script_with_tags, voiceover_duration=5.0)

        content = Path(ass_path).read_text(encoding="utf-8")

        # Tags should not be present in Dialogue lines
        dialogue_lines = [l for l in content.splitlines() if l.startswith("Dialogue:")]
        full_sub_text = " ".join(dialogue_lines)

        self.assertNotIn("excited", full_sub_text)
        self.assertNotIn("pauses", full_sub_text)
        self.assertNotIn("serious", full_sub_text)
        self.assertNotIn("sighs", full_sub_text)
        self.assertNotIn("[", full_sub_text.replace("{\\", ""))  # Ignore ASS curly braces
        self.assertNotIn("]", full_sub_text.replace("{\\", ""))

        # Actual Gujarati words MUST be present
        self.assertIn("સુરત", full_sub_text)
        self.assertIn("સમાચાર", full_sub_text)
        self.assertIn("વરસાદ", full_sub_text)


if __name__ == "__main__":
    unittest.main()
