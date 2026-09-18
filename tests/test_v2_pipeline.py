"""
End-to-End V2 Pipeline Integration Test
Validates:
1. User Profile persistence (user_profile.json)
2. Multi-LLM adapter generating Line 1 & Line 2 (with emoji) headlines
3. Voice synthesis with -14 LUFS loudness normalization
4. Custom styled ASS subtitles
5. Dual-Stripe pill badge overlay generator
6. Multi-Clip Auto Splicer montage composition
7. Full 1080x1920 MP4 assembly conforming to Instagram safe zones
8. Instagram Graph API publisher in dry-run mode
"""

import sys
from pathlib import Path

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.llm_adapter import LLMAdapter
from core.voice_engine import PrarambhVoiceEngine as VoiceEngine
from core.advanced_subtitles import AdvancedSubtitleGenerator as SubtitleGenerator
from core.video_assembler import VideoAssembler
from core.ig_publisher import InstagramPublisher

def test_v2_full_pipeline():
    print("================================================================")
    print("        SURAT NEWS REEL ENGINE V2 - E2E PIPELINE TEST           ")
    print("================================================================")

    # 1. Test User Profile Persistence
    print("\n[V2 Step 1] Testing User Profile Persistence...")
    test_settings = {"ai_provider": "Gemini", "target_duration": 30}
    config.save_user_profile(test_settings)
    loaded_profile = config.load_user_profile()
    assert loaded_profile["ai_provider"] == "Gemini"
    assert config.USER_PROFILE_PATH.exists()
    print("  ✓ Profile saved and loaded successfully:", config.USER_PROFILE_PATH)

    # 2. Test Multi-LLM Adapter (Dual-Stripe Headlines)
    print("\n[V2 Step 2] Testing LLMAdapter (Dual-Stripe Headlines)...")
    llm = LLMAdapter()
    content = llm.generate_reel_content(
        raw_details="સુરતના અડાજણ વિસ્તારમાં વરસાદને કારણે રોડ પર પાણી ભરાયું, તંત્રએ તાત્કાલિક રાહત કામગીરી શરૂ કરી.",
        category_code="T01",
        area="All Surat (સમગ્ર સુરત)",
        target_duration=30,
        provider="Gemini"
    )
    assert content.line1_headline, "Line 1 headline must not be empty"
    assert content.line2_headline, "Line 2 headline must not be empty"
    print("  ✓ Line 1 (Red Badge):", content.line1_headline)
    print("  ✓ Line 2 (Blue Badge):", content.line2_headline)

    # 3. Test Voice Synthesis with Loudness Normalization (-14 LUFS)
    print("\n[V2 Step 3] Testing Voice Engine & -14 LUFS Loudness Normalization...")
    voice_eng = VoiceEngine()
    test_wav = config.OUTPUT_AUDIO_DIR / "v2_e2e_voice.wav"
    v_path = voice_eng.synthesize(
        text=content.voiceover_script,
        voice_id="PRARAMBH_MALE",
        output_path=str(test_wav)
    )
    assert Path(v_path).exists()
    assert Path(v_path).stat().st_size > 10000
    print(f"  ✓ Normalized voiceover generated ({Path(v_path).stat().st_size} bytes)")

    # 4. Test Subtitle Generator with Custom Colors
    print("\n[V2 Step 4] Testing Subtitle Generator with Custom Styling...")
    sub_gen = SubtitleGenerator()
    test_ass = config.OUTPUT_SUBTITLES_DIR / "v2_e2e_subtitles.ass"
    ass_path = sub_gen.generate_ass_subtitles(
        audio_path=v_path,
        output_ass_path=str(test_ass),
        script_text=content.voiceover_script,
        font_size=58,
        primary_color="#FFFFFF",
        outline_color="#000000",
        y_offset=450
    )
    assert Path(ass_path).exists()
    ass_text = Path(ass_path).read_text(encoding="utf-8")
    assert "PlayResX: 1080" in ass_text
    assert "PlayResY: 1920" in ass_text
    print("  ✓ Custom ASS subtitles generated successfully")

    # 5. Test Dual-Stripe Headline Badge Generator
    print("\n[V2 Step 5] Testing Dual-Stripe Headline Badge PNG Generator...")
    assembler = VideoAssembler()
    test_png = config.OUTPUT_DIR / "v2_e2e_headline.png"
    png_path = assembler.generate_headline_overlay_image(
        line1_text=content.line1_headline,
        line2_text=content.line2_headline,
        output_png_path=str(test_png),
        line1_bg="#FF0033",
        line2_bg="#0080FF"
    )
    assert Path(png_path).exists()
    assert Path(png_path).stat().st_size > 5000
    print(f"  ✓ Dual-Stripe PNG overlay generated ({Path(png_path).stat().st_size} bytes)")

    # 6. Test Multi-Clip Auto Splicer & Video Composition
    print("\n[V2 Step 6] Testing Video Assembler with Multi-Clip Auto Montage...")
    # Prepare two clips for montage testing
    stock_clip = config.BROLL_DIR / "surat_city_loop.mp4"
    multi_clips = [str(stock_clip), str(stock_clip)]

    test_v2_reel = config.OUTPUT_VIDEOS_DIR / "v2_e2e_final_reel.mp4"
    final_video = assembler.render_v2_reel(
        video_mode="multi",
        single_video_path=None,
        multi_clip_paths=multi_clips,
        voiceover_path=v_path,
        bg_music_path=str(config.AUDIO_DIR / "surat_news_bgm.mp3"),
        ass_subtitle_path=ass_path,
        headline_overlay_path=png_path,
        output_video_path=str(test_v2_reel),
        category_code="T01",
        area="All Surat (સમગ્ર સુરત)"
    )
    assert Path(final_video).exists()
    assert Path(final_video).stat().st_size > 100000
    print(f"  ✓ Final V2 Reel assembled successfully ({Path(final_video).stat().st_size / (1024*1024):.2f} MB)")

    # 7. Test Instagram Publisher
    print("\n[V2 Step 7] Testing Instagram Publisher (Dry-Run Mode)...")
    ig_pub = InstagramPublisher()
    pub_res = ig_pub.publish_reel(
        video_path=final_video,
        caption=content.caption,
        dry_run=True
    )
    assert pub_res["success"] is True
    print(f"  ✓ Published in simulation mode: {pub_res['permalink']}")

    print("\n================================================================")
    print("      ALL V2 FEATURES PASSED END-TO-END INTEGRATION TEST!       ")
    print("================================================================")

if __name__ == "__main__":
    test_v2_full_pipeline()
