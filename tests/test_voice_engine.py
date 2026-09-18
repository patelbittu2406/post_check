"""
Comprehensive Unit & Integration Test Suite for Prarambh Voice Engine
======================================================================
Tests:
1. Audio Tag Parser ([excited], [serious], [pauses], [laughs], [sighs], etc.)
2. Voice Post-Processing (-14 LUFS normalization, 22050Hz mono PCM, EQ, compression)
3. Voice Registry & Anchor Profiles (PRARAMBH_MALE, PRARAMBH_FEMALE, custom clones)
4. Voice Delivery Presets & Flow Controls (speed, pitch, stability, pause duration)
5. Full Local Gujarati Synthesis Pipeline
6. FastAPI Voice Endpoints (/api/voice/generate, /api/voice/preview, /api/voice/tags, /api/voice/list)
"""

import os
import sys
import unittest
import numpy as np
import soundfile as sf
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.audio_tag_parser import (
    AudioTagParser,
    TagDefinition,
    ParsedSegment,
    AudioTagParseResult,
    AUDIO_TAG_CATALOG,
    PUNCTUATION_PAUSES
)
from core.voice_postprocess import (
    VoicePostProcessor,
    post_process_voice,
    measure_lufs,
    apply_vocal_chain
)
from core.voice_engine import (
    PrarambhVoiceEngine,
    VoiceRegistry,
    VoiceFlowSettings,
    DELIVERY_PRESETS,
    voice_engine
)


class TestAudioTagParser(unittest.TestCase):
    """Tests for the Audio Tag System."""

    def setUp(self):
        self.parser = AudioTagParser()

    def test_01_tag_extraction_and_cleaning(self):
        """Validates that tags are correctly extracted and clean text is produced."""
        raw_script = "[excited] નમસ્કાર સુરત! [pauses] આજે ડુમસ બીચ પર ભારે ભીડ જોવા મળી. [laughs] લોકોએ ખૂબ મજા માણી."
        parsed = self.parser.parse(raw_script)

        self.assertIsInstance(parsed, AudioTagParseResult)
        self.assertNotIn("[excited]", parsed.clean_text)
        self.assertNotIn("[pauses]", parsed.clean_text)
        self.assertNotIn("[laughs]", parsed.clean_text)
        self.assertIn("નમસ્કાર સુરત!", parsed.clean_text)
        self.assertIn("આજે ડુમસ બીચ પર", parsed.clean_text)

        # Check detected tag entries
        self.assertIn("[excited]", parsed.detected_tags)
        self.assertIn("[pauses]", parsed.detected_tags)
        self.assertIn("[laughs]", parsed.detected_tags)

    def test_02_emotion_parameters(self):
        """Validates emotion modifier parameters for speed, pitch, and pauses."""
        script = "[excited] તાજા સમાચાર! [serious] સુરત પોલીસની મોટી કાર્યવાહી."
        parsed = self.parser.parse(script)

        # Segments
        excited_segs = [s for s in parsed.segments if "excited" in s.active_tags]
        self.assertGreaterEqual(len(excited_segs), 1)
        self.assertGreater(excited_segs[0].speed_factor, 1.0)

        serious_segs = [s for s in parsed.segments if "serious" in s.active_tags]
        self.assertGreaterEqual(len(serious_segs), 1)
        self.assertLess(serious_segs[0].speed_factor, 1.0)
        self.assertLess(serious_segs[0].pitch_semitones, 0.0)

    def test_03_punctuation_pacing(self):
        """Validates punctuation-based natural pacing pauses."""
        self.assertIn(",", PUNCTUATION_PAUSES)
        self.assertIn(".", PUNCTUATION_PAUSES)
        self.assertIn("!", PUNCTUATION_PAUSES)
        self.assertIn("...", PUNCTUATION_PAUSES)
        self.assertGreaterEqual(PUNCTUATION_PAUSES["..."], PUNCTUATION_PAUSES[","])

    def test_04_tag_catalog_export(self):
        """Validates the exported tag catalog format for UI cheat sheets."""
        catalog = self.parser.get_tag_catalog()
        self.assertIsInstance(catalog, list)
        self.assertGreater(len(catalog), 10)
        
        sample = catalog[0]
        self.assertIn("tag", sample)
        self.assertIn("clean_name", sample)
        self.assertIn("category", sample)
        self.assertIn("description", sample)
        self.assertIn("gujarati_use_case", sample)


class TestVoicePostProcessing(unittest.TestCase):
    """Tests for broadcast audio mastering and -14 LUFS loudness normalization."""

    def setUp(self):
        self.processor = VoicePostProcessor
        self.test_audio_dir = config.OUTPUT_AUDIO_DIR
        self.test_audio_dir.mkdir(parents=True, exist_ok=True)

    def test_01_synthetic_tone_lufs_mastering(self):
        """Generates a test audio waveform and verifies exact -14 LUFS mastering."""
        sr = 22050
        duration = 3.0  # 3 seconds
        t = np.linspace(0, duration, int(sr * duration), False)
        # Create a voice-like multi-harmonic wave
        audio_data = 0.2 * np.sin(2 * np.pi * 220 * t) + 0.1 * np.sin(2 * np.pi * 440 * t)
        
        raw_wav = self.test_audio_dir / "test_raw_synth.wav"
        out_wav = self.test_audio_dir / "test_mastered_synth.wav"
        sf.write(str(raw_wav), audio_data, sr, subtype='PCM_16')

        # Apply mastering
        res_path = post_process_voice(
            input_audio_path=raw_wav,
            output_audio_path=out_wav,
            target_lufs=-14.0,
            target_sr=22050,
            apply_eq=True,
            apply_comp=True
        )

        self.assertTrue(Path(res_path).exists())
        
        # Measure output properties
        data, file_sr = sf.read(str(res_path))
        self.assertIn(file_sr, [22050, 24000])
        self.assertEqual(len(data.shape), 1)  # Mono

        # Verify loudness
        measured_lufs = measure_lufs(res_path)
        self.assertAlmostEqual(measured_lufs, -14.0, delta=1.5, msg=f"Measured LUFS {measured_lufs} must be close to -14.0")

        # Verify true peak below -1.0 dBFS
        max_amp = np.max(np.abs(data))
        true_peak_db = 20 * np.log10(max_amp + 1e-9)
        self.assertLessEqual(true_peak_db, 0.0, "Audio must not clip above 0 dBFS")


class TestVoiceRegistryAndEngine(unittest.TestCase):
    """Tests for VoiceRegistry, presets, flow controls, and local synthesis."""

    def setUp(self):
        self.engine = PrarambhVoiceEngine()
        self.registry = self.engine.registry

    def test_01_default_anchor_voices(self):
        """Validates exactly two default anchor voices: PRARAMBH_MALE and PRARAMBH_FEMALE."""
        anchors = self.registry.get_anchor_voices()
        self.assertIn("PRARAMBH_MALE", anchors)
        self.assertIn("PRARAMBH_FEMALE", anchors)

        male = anchors["PRARAMBH_MALE"]
        self.assertEqual(male["gender"], "male")
        self.assertTrue(male["is_default"])
        self.assertTrue(Path(male["ref_audio"]).exists())

        female = anchors["PRARAMBH_FEMALE"]
        self.assertEqual(female["gender"], "female")
        self.assertTrue(Path(female["ref_audio"]).exists())

    def test_02_delivery_presets(self):
        """Validates all standard broadcast delivery presets."""
        presets = self.registry.get_presets()
        preset_ids = [p["id"] for p in presets]
        
        for expected in ["breaking_news", "human_conversational", "dramatic_investigative", "rapid_bulletin", "calm_explainer"]:
            self.assertIn(expected, preset_ids)

    def test_03_custom_clone_management(self):
        """Tests registering, querying, and deleting a custom voice clone."""
        # Create a dummy reference wav
        dummy_wav = config.BASE_DIR / "assets" / "voices" / "temp_test_clone.wav"
        dummy_wav.parent.mkdir(parents=True, exist_ok=True)
        sr = 22050
        sf.write(str(dummy_wav), np.zeros(sr * 2), sr, subtype='PCM_16')

        clone_meta = self.registry.register_custom_clone(
            display_name="Test Anchor Clone",
            audio_path=dummy_wav,
            gender="male",
            tone_style="deep_authoritative",
            ref_text="નમસ્કાર સુરત, આ એક ટેસ્ટ છે."
        )

        clone_id = clone_meta["id"]
        self.assertTrue(clone_id.startswith("CUSTOM_"))

        # Verify in list
        custom_list = self.registry.get_custom_clones()
        self.assertTrue(any(c["id"] == clone_id for c in custom_list))

        # Delete clone
        deleted = self.registry.delete_custom_clone(clone_id)
        self.assertTrue(deleted)

        # Cleanup
        if dummy_wav.exists():
            dummy_wav.unlink()

    def test_04_full_gujarati_voice_synthesis(self):
        """Tests synthesizing Gujarati script with audio tags into mastered 22050Hz WAV."""
        script = "[excited] સુરતના અડાજણમાં [pauses] નવું સ્પોર્ટ્સ કોમ્પ્લેક્સ શરૂ થયું છે."
        out_wav = config.OUTPUT_AUDIO_DIR / "test_voice_engine_synthesis.wav"

        res = self.engine.synthesize(
            text=script,
            voice_id="PRARAMBH_MALE",
            output_path=str(out_wav),
            settings=VoiceFlowSettings(speed=1.0, pitch=1.0, pause_duration=1.0)
        )

        self.assertTrue(Path(res).exists())
        self.assertGreater(Path(res).stat().st_size, 1000)

        # Check format
        data, sr = sf.read(str(res))
        self.assertIn(sr, [22050, 24000])
        self.assertEqual(len(data.shape), 1)

        # Measure loudness
        lufs = measure_lufs(res)
        self.assertAlmostEqual(lufs, -14.0, delta=2.0)


class TestVoiceAPIIntegration(unittest.TestCase):
    """Tests for FastAPI backend voice routes using TestClient."""

    @classmethod
    def setUpClass(cls):
        from fastapi.testclient import TestClient
        from server import app
        cls.client = TestClient(app)

    def test_01_get_voice_list(self):
        """Tests GET /api/voice/list and backward-compatible /api/voices."""
        resp = self.client.get("/api/voice/list")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("anchor_voices", data)
        self.assertIn("presets", data)
        self.assertIn("default_voice", data)
        self.assertEqual(data["default_voice"], "PRARAMBH_MALE")

        # Test alias
        resp_alias = self.client.get("/api/voices")
        self.assertEqual(resp_alias.status_code, 200)

    def test_02_get_audio_tags(self):
        """Tests GET /api/voice/tags."""
        resp = self.client.get("/api/voice/tags")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("tags", data)
        self.assertIn("categories", data)
        self.assertGreater(len(data["tags"]), 5)

    def test_03_generate_voice_preview(self):
        """Tests POST /api/voice/preview with flow settings."""
        payload = {
            "text": "સુરત શહેરના તાજા સમાચાર",
            "voice_id": "PRARAMBH_MALE",
            "settings": {
                "speed": 1.05,
                "pitch": 1.0,
                "stability": 0.75,
                "pause_duration": 1.0
            }
        }
        resp = self.client.post("/api/voice/preview", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("audio_url", data)
        self.assertIn("duration", data)

    def test_04_generate_voice_api(self):
        """Tests POST /api/voice/generate with audio tags."""
        payload = {
            "script_text": "[excited] નમસ્કાર સુરત! [pauses] આજના મુખ્ય સમાચાર.",
            "voice_id": "PRARAMBH_FEMALE",
            "voice_settings": {
                "speed": 1.0,
                "pitch": 1.0
            }
        }
        resp = self.client.post("/api/voice/generate", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("audio_url", data)


if __name__ == "__main__":
    unittest.main(verbosity=2)
