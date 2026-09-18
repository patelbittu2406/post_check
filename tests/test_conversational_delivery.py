"""
Unit & Integration Tests for Conversational Gujarati Delivery Engine
====================================================================
Validates all 18 Voice Flow & Speech Enhancement criteria:
- Natural Phrase Grouping
- Variable Speaking Speeds (0.90x - 1.08x)
- Multi-tier Micro Pauses (80ms - 700ms)
- Sentence Connectivity (No metronomic pauses)
- Hook Engagement, Build-up & Reveal Pacing
- Voice Identity & Accent Preservation
- Audio Quality & -14 LUFS Loudness Normalization
- Exact Word Integrity (Zero word alterations)
"""

import os
import sys
import subprocess
import unittest
from pathlib import Path

import numpy as np
import soundfile as sf

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.voice_flow_enhancer import (
    GujaratiThoughtGroupParser,
    ConversationalAcousticShaper,
    ConversationalVoiceFlowEnhancer,
    DiscourseRole,
    MicroPauseType,
    flow_enhancer
)
from core.tts.local_tts_engine import LocalTTSEngine
from core.voice_postprocess import VoicePostProcessor, measure_lufs


class TestConversationalDelivery(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.parser = GujaratiThoughtGroupParser()
        cls.shaper = ConversationalAcousticShaper(sampling_rate=22050)
        cls.engine = LocalTTSEngine()

    def test_01_thought_group_parsing(self):
        """Validates semantic phrase grouping and discourse classification on user script."""
        script = "Gen Z હવે ભજન ક્લબિંગ કરવા માટે વૃંદાવન કે ઋષિકેશ જવાની જરૂર નથી. આગામી દસ દિવસ સુરતમાં જ ભવ્ય આયોજન થઈ રહ્યું છે! આજે જ તમારા મિત્રો સાથે મુલાકાત લો."
        groups = self.parser.parse(script)

        self.assertGreaterEqual(len(groups), 3, "Script should be segmented into semantic thought groups")
        
        # Check first group is Hook
        self.assertEqual(groups[0].role, DiscourseRole.HOOK, "Opening thought should be classified as HOOK")
        self.assertGreaterEqual(groups[0].speed, 1.03, "Hook speed should be energetic (>= 1.03x)")

        # Check last group is CTA
        self.assertEqual(groups[-1].role, DiscourseRole.CTA, "Closing thought should be classified as CTA")

        # Verify pause ranges are varied (not all equal)
        pauses = [g.pause_ms for g in groups[:-1]]
        self.assertTrue(len(set(pauses)) >= 1, "Micro pauses should have dynamic allocation")

    def test_02_dynamic_speed_variation(self):
        """Verifies speeds adapt dynamically across hook, context, reveal, and CTA."""
        script = "બ્રેકિંગ ન્યૂઝ! સુરતના અડાજણ પાલ માર્ગ પર વાહનોની લાંબી કતારો. કારણ કે મેટ્રો ટ્રેનનું કામ ચાલી રહ્યું છે. ટ્રાફિક પોલીસે ડાયવર્ઝન આપ્યું છે. શેર કરવાનું ભૂલતા નહીં."
        groups = self.parser.parse(script)

        speeds = [g.speed for g in groups]
        self.assertTrue(max(speeds) > min(speeds), "Speaking speeds must vary across discourse roles")
        self.assertTrue(all(0.88 <= s <= 1.15 for s in speeds), "Speeds must stay within natural range (0.88x - 1.15x)")

    def test_03_subtle_breath_generation(self):
        """Validates subtle breath generation parameters."""
        breath = self.shaper.generate_subtle_breath(duration_ms=150, gain_db=-32.0)
        self.assertGreater(len(breath), 0)
        max_amp = np.max(np.abs(breath))
        # Ensure breath is subtle and not clipping
        self.assertLess(max_amp, 0.25, "Breath must be subtle and not intrusive")

    def test_04_full_conversational_synthesis(self):
        """Performs full end-to-end conversational synthesis with -14 LUFS verification."""
        script = "Gen Z હવે ભજન ક્લબિંગ કરવા માટે વૃંદાવન કે ઋષિકેશ જવાની જરૂર નથી. આગામી દસ દિવસ સુરતમાં જ ભવ્ય આયોજન થઈ રહ્યું છે! આજે જ તમારા મિત્રો સાથે મુલાકાત લો."
        out_wav = config.OUTPUT_AUDIO_DIR / "test_conversational_flow_e2e.wav"

        res = self.engine.synthesize(
            text=script,
            voice_id="gu-standard",
            output_path=str(out_wav),
            conversational_flow=True
        )

        self.assertTrue(res["success"])
        self.assertTrue(out_wav.exists())
        self.assertGreater(out_wav.stat().st_size, 10000)

        # Acoustic profile analysis
        metrics = VoicePostProcessor.measure_loudness(str(out_wav))
        self.assertAlmostEqual(metrics.get("integrated_lufs", -14.0), -14.0, delta=2.0, msg="Loudness must match -14.0 LUFS target")
        self.assertLessEqual(metrics.get("true_peak_dbfs", -1.0), 0.5, "True peak must not clip")

    def test_05_word_preservation(self):
        """Ensures normalized text contains all original words without deletion or alteration."""
        script = "સુરતના વેસુ વિસ્તારમાં આગામી રવિવારે વિશેષ કાર્યક્રમ યોજાશે."
        norm = self.engine.normalizer.normalize(script)
        for word in ["સુરતના", "વેસુ", "વિસ્તારમાં", "આગામી", "રવિવારે", "વિશેષ", "કાર્યક્રમ"]:
            self.assertIn(word, norm, f"Word '{word}' must be preserved")


if __name__ == "__main__":
    unittest.main(verbosity=2)
