"""
Tests for the Human-Matched Voice Pipeline (voice_pipeline.py)
Run: ./venv/bin/python tests/test_voice_pipeline.py
"""

import sys
import time
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config
from core.voice_pipeline import (
    GujaratiTextNormalizer,
    SegmentedTextProcessor,
    PauseClass,
    HumanReferenceAnalyzer,
    HumanMatchedSynthesizer,
    DeliveryStyle,
)



PASSED = []
FAILED = []

def test(name):
    def decorator(fn):
        def wrapper():
            try:
                fn()
                print(f"  [PASS] {name}")
                PASSED.append(name)
            except Exception as e:
                print(f"  [FAIL] {name}: {e}")
                traceback.print_exc()
                FAILED.append(name)
        return wrapper
    return decorator


# ── TEXT NORMALIZATION ─────────────────────────────────────────────────────────

@test("Gujarati digit to ASCII conversion")
def test_gujarati_digits():
    norm = GujaratiTextNormalizer()
    result = norm.normalize("આ ૧૦૦ રૂપિયા છે")
    assert "100" in result, f"Expected '100' in: {result}"

@test("Currency expansion (rupee symbol)")
def test_currency():
    norm = GujaratiTextNormalizer()
    result = norm.normalize("₹500 ખર્ચ થયા")
    assert "500 રૂ" in result or "500" in result, f"Unexpected: {result}"

@test("Whitespace normalization")
def test_whitespace():
    norm = GujaratiTextNormalizer()
    result = norm.normalize("  a   b  \n\n\n\nc  ")
    assert "   " not in result, f"Triple spaces remain: {result}"
    assert result.count("\n\n") <= 1, f"Multiple blank lines: {result}"

@test("Ensure sentence ending period")
def test_sentence_ending():
    norm = GujaratiTextNormalizer()
    result = norm.normalize("સુરત સ્માર્ટ સિટી")
    assert result.endswith("."), f"No period: {result}"


# ── SENTENCE SEGMENTATION ──────────────────────────────────────────────────────

@test("Segments single Gujarati sentence")
def test_single_segment():
    seg = SegmentedTextProcessor()
    segs = seg.segment("આજે ભારે વરસાદ આવ્યો.")
    assert len(segs) >= 1, "Expected at least 1 segment"
    assert segs[0].text.strip(), "First segment is empty"

@test("Segments multiple sentences")
def test_multi_segment():
    seg = SegmentedTextProcessor()
    text = "આ પ્રથમ વાક્ય છે. આ બીજું વાક્ય છે. આ ત્રીજું છે."
    segs = seg.segment(text)
    assert len(segs) == 3, f"Expected 3 segments, got {len(segs)}"

@test("Long sentence is split at comma boundary")
def test_long_sentence_split():
    seg = SegmentedTextProcessor()
    long_text = ("a " * 100 + ", " + "b " * 100).strip() + "."
    segs = seg.segment(long_text)
    assert len(segs) >= 2, f"Long sentence was not split: {len(segs)} segments"

@test("All segments have valid pause_after values")
def test_pause_class_validity():
    seg = SegmentedTextProcessor()
    segs = seg.segment("સ્ટેટ. સ્ટેટ? સ્ટેટ!")
    valid = set(PauseClass)
    valid_vals = {v.value for v in valid}
    for s in segs:
        assert s.pause_after in valid_vals, f"Invalid pause class: {s.pause_after}"


# ── REFERENCE AUDIO ANALYSIS ───────────────────────────────────────────────────

HUMAN_REF = str(config.VOICES_DIR / "WhatsApp Ptt 2026-09-13 at 10.29.00 PM.mp3")

@test("Human reference file exists")
def test_reference_exists():
    assert Path(HUMAN_REF).exists(), f"Not found: {HUMAN_REF}"

@test("Human reference analysis returns valid metrics")
def test_reference_analysis():
    if not Path(HUMAN_REF).exists():
        raise FileNotFoundError(HUMAN_REF)
    analyzer = HumanReferenceAnalyzer(HUMAN_REF)
    m = analyzer.analyze(force=True)
    assert m.duration_s > 0, "Duration must be > 0"
    assert m.integrated_lufs < 0, "LUFS must be negative"
    assert m.lra_lu >= 0, "LRA must be >= 0"
    assert m.xtts_speed > 0, "XTTS speed must be > 0"
    print(f"      duration={m.duration_s:.1f}s | lufs={m.integrated_lufs:.1f} | "
          f"lra={m.lra_lu:.1f} | pauses={m.pause_count} | speed={m.xtts_speed:.2f}")

@test("Reference analysis cache works (second call is faster)")
def test_reference_cache():
    if not Path(HUMAN_REF).exists():
        raise FileNotFoundError(HUMAN_REF)
    analyzer = HumanReferenceAnalyzer(HUMAN_REF)
    t1 = time.time()
    analyzer.analyze(force=True)
    t_first = time.time() - t1
    t2 = time.time()
    analyzer.analyze(force=False)
    t_cached = time.time() - t2
    assert t_cached < t_first, f"Cache was not faster: {t_cached:.3f}s >= {t_first:.3f}s"


# ── VOICE ANALYZER ─────────────────────────────────────────────────────────────

@test("AudioProfile analysis of human reference")
def test_audio_profile():
    if not Path(HUMAN_REF).exists():
        raise FileNotFoundError(HUMAN_REF)
    analyzer = HumanReferenceAnalyzer(HUMAN_REF)
    metrics = analyzer.analyze()
    assert metrics.duration_s > 0, "Duration must be > 0"
    assert metrics.estimated_wpm > 0, "Estimated WPM must be > 0"




# ── SYNTHESIS TEST (Edge-TTS fallback — no XTTS download needed) ───────────────

@test("HumanMatchedSynthesizer generates WAV (Edge-TTS mode)")
def test_synthesize_edge_tts_mode():
    if not Path(HUMAN_REF).exists():
        raise FileNotFoundError(HUMAN_REF)
    out = config.OUTPUT_AUDIO_DIR / f"test_pipeline_{int(time.time())}.wav"
    synth = HumanMatchedSynthesizer(HUMAN_REF)
    result = synth.synthesize(
        text="આ એક ટેસ્ટ છે. પ્રણાલી ચાલી રહી છે.",
        output_path=str(out),
        delivery_style=DeliveryStyle.NEWS_NEUTRAL,
        use_xtts=False  # Force Edge-TTS for fast test
    )
    assert Path(result).exists(), f"Output not created: {result}"
    size = Path(result).stat().st_size
    assert size > 5000, f"Output too small: {size} bytes"
    print(f"      Generated: {result} ({size//1024} KB)")


# ── MAIN ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  VOICE PIPELINE TEST SUITE")
    print("=" * 60 + "\n")

    tests = [
        test_gujarati_digits,
        test_currency,
        test_whitespace,
        test_sentence_ending,
        test_single_segment,
        test_multi_segment,
        test_long_sentence_split,
        test_pause_class_validity,
        test_reference_exists,
        test_reference_analysis,
        test_reference_cache,
        test_audio_profile,
        test_synthesize_edge_tts_mode,
    ]

    print("Text Normalization:")
    test_gujarati_digits()
    test_currency()
    test_whitespace()
    test_sentence_ending()

    print("\nSentence Segmentation:")
    test_single_segment()
    test_multi_segment()
    test_long_sentence_split()
    test_pause_class_validity()

    print("\nReference Audio Analysis:")
    test_reference_exists()
    test_reference_analysis()
    test_reference_cache()

    print("\nVoice Analyzer:")
    test_audio_profile()

    print("\nSynthesis (Edge-TTS mode):")

    test_synthesize_edge_tts_mode()

    print("\n" + "=" * 60)
    print(f"  RESULTS: {len(PASSED)} passed, {len(FAILED)} failed")
    if FAILED:
        print(f"  FAILED:  {', '.join(FAILED)}")
    print("=" * 60 + "\n")
    sys.exit(0 if not FAILED else 1)
