"""
Unit tests for SceneAnalyzer (Scene detection & Farneback Optical Flow motion scoring)
"""

import os
import sys
import unittest
from pathlib import Path

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.scene_analyzer import SceneAnalyzer


class TestSceneAnalyzer(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.analyzer = SceneAnalyzer()
        cls.stock_clip = config.BROLL_DIR / "surat_city_loop.mp4"

    def test_get_clip_duration(self):
        if self.stock_clip.exists():
            dur = self.analyzer.get_clip_duration(str(self.stock_clip))
            self.assertGreater(dur, 0.0)
            print(f"[Test] Duration of stock clip: {dur:.2f}s")

    def test_motion_scoring(self):
        if self.stock_clip.exists():
            res = self.analyzer.score_segment_motion_and_sharpness(
                str(self.stock_clip),
                start_sec=0.0,
                end_sec=3.0,
                sample_fps=5.0
            )
            self.assertIn("motion_score", res)
            self.assertIn("sharpness_score", res)
            self.assertIn("final_score", res)
            self.assertGreaterEqual(res["final_score"], 0.0)
            self.assertLessEqual(res["final_score"], 1.0)
            print(f"[Test] Optical flow motion result: {res}")

    def test_analyze_clips(self):
        clips = [str(f) for f in config.USER_CLIPS_DIR.glob("*.mp4")]
        if not clips and self.stock_clip.exists():
            clips = [str(self.stock_clip)]

        if clips:
            segments = self.analyzer.analyze_clips(
                raw_clip_paths=clips,
                target_total_duration=30.0,
                intensity="balanced"
            )
            self.assertIsInstance(segments, list)
            self.assertGreater(len(segments), 0)
            for seg in segments:
                self.assertIn("clip_path", seg)
                self.assertIn("start", seg)
                self.assertIn("end", seg)
                self.assertIn("score", seg)
                self.assertGreater(seg["duration"], 0.0)
            print(f"[Test] Extracted {len(segments)} candidate segments")


if __name__ == "__main__":
    unittest.main()
