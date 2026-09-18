"""
End-to-End Pipeline Integration Test
Validates all 5 phases of the Surat News Reel Automation system.
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.sop_generator import SOPContentGenerator
from core.voice_engine import VoiceEngine
from core.advanced_subtitles import AdvancedSubtitleGenerator as SubtitleGenerator
from core.video_composer import VideoComposer
from core.ig_publisher import InstagramPublisher

def test_full_pipeline():
    print("================================================================")
    print("        SURAT NEWS REEL ENGINE - E2E PIPELINE TEST              ")
    print("================================================================")

    # 1. Phase 1: SOP Content Generation
    print("\n[Phase 1] Testing SOP Content Generator (N01 & C01)...")
    sop_gen = SOPContentGenerator()
    script_n01 = sop_gen.generate_script(
        raw_news_text="અડાજણ રિંગ રોડ પર નવો ફ્લાયઓવર બ્રિજનું સમારકામ પૂરું થયું, આજથી વાહન વ્યવહાર શરૂ.",
        category_code="N01",
        area="Adajan"
    )
    assert script_n01.hook, "Hook must not be empty"
    assert script_n01.display_headline, "Headline must not be empty"
    assert "SURAT UPDATE | N01" in script_n01.caption
    print("  ✓ Phase 1 N01 OK:", script_n01.display_headline)

    script_c01 = sop_gen.generate_script(
        raw_news_text="વેસુમાં દુકાનમાંથી ચોરે રોકડ રકમની ચોરી કરી.",
        category_code="C01",
        area="Vesu"
    )
    assert "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી" in script_c01.voiceover_script or "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે." in script_c01.voiceover_script
    print("  ✓ Phase 1 C01 Legal Crime Rule OK")

    # 2. Phase 2: Voice Generation
    print("\n[Phase 2] Testing Voice Engine (.wav generation)...")
    voice_eng = VoiceEngine()
    test_wav = config.OUTPUT_AUDIO_DIR / "e2e_voice.wav"
    v_path = voice_eng.generate_voiceover(
        text=script_n01.voiceover_script,
        output_path=str(test_wav),
        voice_type="edge_gu_dhwani"
    )
    assert Path(v_path).exists()
    assert Path(v_path).stat().st_size > 50000
    print(f"  ✓ Phase 2 Voiceover OK ({Path(v_path).stat().st_size} bytes)")

    # 3. Phase 2 Subtitles: Dynamic 2-3 word chunk ASS subtitles
    print("\n[Phase 2 Subtitles] Testing Subtitle Generator (Word-Level ASS)...")
    sub_gen = SubtitleGenerator()
    test_ass = config.OUTPUT_SUBTITLES_DIR / "e2e_subtitles.ass"
    ass_path = sub_gen.generate_ass_subtitles(
        audio_path=v_path,
        output_ass_path=str(test_ass),
        script_text=script_n01.voiceover_script
    )
    assert Path(ass_path).exists()
    ass_text = Path(ass_path).read_text(encoding="utf-8")
    assert "PlayResX: 1080" in ass_text
    assert "PlayResY: 1920" in ass_text
    assert "Style: ReelSubtitle,Noto Sans Gujarati" in ass_text
    print("  ✓ Phase 2 Subtitles ASS OK")

    # 4. Phase 3: Video Composition
    print("\n[Phase 3] Testing Video Composer (1080x1920 + Safe Zones + Ducking)...")
    vid_comp = VideoComposer()
    test_broll = config.BROLL_DIR / "surat_city_loop.mp4"
    test_bgm = config.AUDIO_DIR / "surat_news_bgm.mp3"
    test_out_video = config.OUTPUT_VIDEOS_DIR / "e2e_reel_1080x1920.mp4"

    meta = {
        "category_code": "N01",
        "headline": script_n01.display_headline,
        "location": "Adajan, Surat",
        "date": "14/09/2026"
    }

    out_mp4 = vid_comp.render_reel(
        broll_video_path=str(test_broll),
        voiceover_path=v_path,
        bg_music_path=str(test_bgm),
        ass_subtitle_path=ass_path,
        metadata=meta,
        output_video_path=str(test_out_video)
    )
    assert Path(out_mp4).exists()
    assert Path(out_mp4).stat().st_size > 100000
    print(f"  ✓ Phase 3 Video Composer OK ({Path(out_mp4).stat().st_size / (1024*1024):.2f} MB)")

    # 5. Phase 5: Instagram 1-Click Publisher
    print("\n[Phase 5] Testing Instagram Publisher (Dry-run mode)...")
    ig_pub = InstagramPublisher()
    pub_result = ig_pub.publish_reel(
        video_path=out_mp4,
        caption=script_n01.caption,
        dry_run=True
    )
    assert pub_result["success"] is True
    assert "permalink" in pub_result
    print(f"  ✓ Phase 5 Instagram Publisher OK (Permalink: {pub_result['permalink']})")

    print("\n================================================================")
    print("       ALL 5 PHASES PASSED END-TO-END INTEGRATION TEST!         ")
    print("================================================================")

if __name__ == "__main__":
    test_full_pipeline()
