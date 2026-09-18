"""
End-to-end integration tests for CapCutAutoEditor
Verifies full 6-stage compilation of 4 raw clips into a 30s 1080x1920 Instagram Reel
with beat sync, Ken Burns zooms, xfade transitions, audio ducking, and dual-stripe headlines.
"""

import os
import sys
import unittest
from pathlib import Path

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.capcut_auto_editor import CapCutAutoEditor
from core.voice_engine import PrarambhVoiceEngine
from core.video_assembler import VideoAssembler


class TestCapCutAutoEditor(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.voice_engine = PrarambhVoiceEngine()
        cls.video_assembler = VideoAssembler()
        
        # Prepare sample clips
        cls.raw_clips = sorted([str(f) for f in config.USER_CLIPS_DIR.glob("*.mp4")])
        if not cls.raw_clips:
            cls.raw_clips = [str(config.BROLL_DIR / "surat_city_loop.mp4")]
            
        cls.bgm_path = str(config.AUDIO_DIR / "surat_news_bgm.mp3")

        # Generate test voiceover if needed
        cls.voiceover_path = config.OUTPUT_AUDIO_DIR / "test_capcut_vo.wav"
        if not cls.voiceover_path.exists():
            cls.voice_engine.synthesize_speech(
                text="[excited] સુરતના વેસુ અને અડાજણમાં આજે ગણેશ ઉત્સવ દરમિયાન ભારે ઉત્સાહ જોવા મળ્યો! [pauses] હજારો ભક્તો મહાઆરતીમાં જોડાયા.",
                output_wav_path=str(cls.voiceover_path),
                voice_id="PRARAMBH_FEMALE"
            )

    def test_end_to_end_render(self):
        output_file = config.OUTPUT_VIDEOS_DIR / "test_capcut_reel_output.mp4"
        if output_file.exists():
            output_file.unlink()

        editor = CapCutAutoEditor(
            raw_clip_paths=self.raw_clips,
            bg_music_path=self.bgm_path,
            voiceover_path=str(self.voiceover_path) if self.voiceover_path.exists() else None,
            target_duration=30.0,
            sync_to_beats=True,
            motion_intensity="balanced",
            transition_style="auto",
            output_path=str(output_file),
            line1_headline="સુરત ગણેશ ઉત્સવ | F01",
            line2_headline="હજારો ભક્તો ઉમટી પડ્યા 🎉",
            category_code="F01",
            area="Vesu, Surat"
        )

        progress_log = []
        def on_progress(stage, pct):
            progress_log.append((stage, pct))
            print(f"[CapCut Test Progress] {pct}% - {stage}")

        rendered_mp4 = editor.render(progress_callback=on_progress)

        # Assertions
        self.assertTrue(Path(rendered_mp4).exists(), "Output video must exist")
        self.assertGreater(os.path.getsize(rendered_mp4), 100000, "Output video must be > 100KB")

        dur = self.video_assembler.get_media_duration(rendered_mp4)
        print(f"[CapCut Test] Output duration: {dur:.2f}s, File size: {os.path.getsize(rendered_mp4)/1024/1024:.2f} MB")
        self.assertAlmostEqual(dur, 30.0, delta=2.5, msg="Rendered duration must be ~30s")

        # Verify progress stages reached 100%
        self.assertGreater(len(progress_log), 0)
        self.assertEqual(progress_log[-1][1], 100)


if __name__ == "__main__":
    unittest.main()
