"""
Unit tests for BeatSyncEngine (Librosa BPM, beat tracking, downbeat accents & cut snapping)
"""

import os
import sys
import unittest
from pathlib import Path

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.beat_sync import BeatSyncEngine
from core.scene_analyzer import SceneAnalyzer


class TestBeatSyncEngine(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = BeatSyncEngine()
        cls.bgm_path = config.AUDIO_DIR / "surat_news_bgm.mp3"

    def test_detect_beats(self):
        if self.bgm_path.exists():
            info = self.engine.detect_beats_and_pauses(
                bg_music_path=str(self.bgm_path),
                target_duration=30.0
            )
            self.assertIn("tempo_bpm", info)
            self.assertIn("beat_times", info)
            self.assertIn("downbeat_times", info)
            self.assertIn("cut_candidates", info)
            self.assertGreater(len(info["beat_times"]), 0)
            self.assertGreater(info["tempo_bpm"], 50)
            print(f"[Test] Detected BPM: {info['tempo_bpm']}, Total Beats: {len(info['beat_times'])}, Downbeats: {len(info['downbeat_times'])}")

    def test_snap_cuts_to_beats(self):
        analyzer = SceneAnalyzer()
        clips = [str(f) for f in config.USER_CLIPS_DIR.glob("*.mp4")]
        if not clips:
            clips = [str(config.BROLL_DIR / "surat_city_loop.mp4")]

        raw_segs = analyzer.analyze_clips(clips, target_total_duration=30.0)
        audio_info = self.engine.detect_beats_and_pauses(
            bg_music_path=str(self.bgm_path) if self.bgm_path.exists() else None,
            target_duration=30.0
        )

        timeline = self.engine.snap_cuts_to_beats(
            segments=raw_segs,
            audio_info=audio_info,
            target_duration=30.0,
            sync_to_beats=True
        )

        self.assertIsInstance(timeline, list)
        self.assertGreater(len(timeline), 0)

        total_dur = sum(s["duration"] for s in timeline)
        print(f"[Test] Snapped timeline segments: {len(timeline)}, Total duration: {total_dur:.2f}s")
        self.assertAlmostEqual(total_dur, 30.0, delta=2.0)

        for s in timeline:
            self.assertIn("motion_type", s)
            self.assertIn("transition_out", s)
            self.assertIn("timeline_start", s)
            self.assertIn("timeline_end", s)


if __name__ == "__main__":
    unittest.main()
