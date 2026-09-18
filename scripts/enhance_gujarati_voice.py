#!/usr/bin/env python3
"""
CLI Tool: Gujarati Conversational Voice Enhancer
=================================================
Enhance speech flow, pacing, micro-pauses, and delivery of Gujarati voiceovers
while 100% preserving original voice identity, tone, accent, and words.

Usage:
  # 1. Synthesize script with conversational creator delivery:
  python scripts/enhance_gujarati_voice.py --text "Gen Z હવે ભજન ક્લબિંગ કરવા માટે વૃંદાવન કે ઋષિકેશ જવાની જરૂર નથી..." --voice gu-standard --output output/audio/creator_reel.wav

  # 2. Enhance an existing audio recording's flow and mastering:
  python scripts/enhance_gujarati_voice.py --input-audio input.wav --output output/enhanced.wav
"""

import sys
import argparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.voice_flow_enhancer import flow_enhancer
from core.tts.local_tts_engine import LocalTTSEngine
from core.voice_analyzer import analyze_audio, compare_profiles


def main():
    parser = argparse.ArgumentParser(description="Gujarati Conversational Voice Delivery & Flow Enhancer")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--text", type=str, help="Gujarati script text to synthesize with conversational creator delivery")
    group.add_argument("--input-audio", type=str, help="Path to existing audio recording to enhance")

    parser.add_argument("--voice", type=str, default="gu-standard", help="Voice ID (gu-standard, gu-kathiyawadi, gu-surati, gu-news-anchor, gu-mahesani)")
    parser.add_argument("--speed", type=float, default=1.0, help="Base speaking speed (default: 1.0)")
    parser.add_argument("--output", type=str, default=None, help="Output WAV file path")
    parser.add_argument("--compare", action="store_true", help="Generate acoustic analysis comparison")

    args = parser.parse_args()

    if args.text:
        print("================================================================")
        print("       GUJARATI CONVERSATIONAL VOICE SYNTHESIS ENGINE          ")
        print("================================================================")
        print(f"Voice ID:     {args.voice}")
        print(f"Base Speed:   {args.speed:.2f}x")
        print(f"Script Text:  {args.text[:80]}...")
        print("----------------------------------------------------------------")

        engine = LocalTTSEngine()
        out_path = args.output or str(config.OUTPUT_AUDIO_DIR / f"creator_delivery_{args.voice}.wav")
        res = engine.synthesize(
            text=args.text,
            voice_id=args.voice,
            output_path=out_path,
            speed_override=args.speed,
            conversational_flow=True
        )

        print("----------------------------------------------------------------")
        print(f"✅ Conversational Audio Ready: {res['audio_path']}")
        print(f"⏱️ Duration:                  {res['duration']}s")
        print(f"🧩 Thought Groups Count:      {res['thought_groups_count']}")
        print(f"🎭 Discourse Roles:           {', '.join(res['roles'])}")
        print("================================================================")

        if args.compare:
            analyze_audio(res["audio_path"], label=f"Enhanced ({args.voice})")

    elif args.input_audio:
        print("================================================================")
        print("        GUJARATI AUDIO FLOW & MASTERS POLISH ENGINE             ")
        print("================================================================")
        print(f"Input Audio:  {args.input_audio}")
        out_path = args.output or str(Path(args.input_audio).with_suffix(".enhanced.wav"))
        enhanced_file = flow_enhancer.enhance_existing_audio(args.input_audio, out_path)

        print("----------------------------------------------------------------")
        print(f"✅ Enhanced Audio Saved: {enhanced_file}")
        print("================================================================")

        if args.compare:
            p_in = analyze_audio(args.input_audio, label="Original Audio")
            p_out = analyze_audio(enhanced_file, label="Enhanced Audio")
            compare_profiles(p_in, p_out)


if __name__ == "__main__":
    main()
