"""
Subtitle Generator Module
Extracts word-level timestamps using Faster-Whisper and formats them into
dynamic 2-3 word chunk Advanced SubStation Alpha (.ass) subtitles configured
strictly for 1080x1920 Instagram Reel safe zones (bottom margin 450px).
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Any

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class SubtitleGenerator:
    """Generates word-level ASS subtitles with dynamic 2-3 word chunking."""

    def __init__(self, model_size: str = "base", device: str = "auto"):
        self.model_size = model_size
        self.device = device
        self._model = None

    def _get_whisper_model(self):
        """Lazy loader for Faster-Whisper model."""
        if self._model is None:
            try:
                from faster_whisper import WhisperModel
                dev = "cuda" if self.device == "cuda" else ("cpu" if self.device == "cpu" else "auto")
                compute = "float16" if dev == "cuda" else "int8"
                print(f"[SubtitleGenerator] Loading Faster-Whisper model ({self.model_size}) on {dev}...")
                self._model = WhisperModel(self.model_size, device=dev, compute_type=compute)
            except Exception as e:
                print(f"[Warning] Could not load faster-whisper ({e}). Fallback timing will be used if needed.")
                self._model = None
        return self._model

    def _format_timestamp_ass(self, seconds: float) -> str:
        """Converts float seconds to ASS timestamp format: H:MM:SS.cc"""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int(round((seconds - int(seconds)) * 100))
        if centis >= 100:
            secs += 1
            centis = 0
        return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

    def _get_audio_duration(self, audio_path: str) -> float:
        """Extracts exact audio duration in seconds using ffprobe."""
        ffprobe_bin = config.get_ffprobe_binary()
        cmd = [
            ffprobe_bin,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path)
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception:
            pass
        return 15.0

    def _is_gujarati(self, text: Optional[str]) -> bool:
        if not text:
            return False
        return any('\u0a80' <= ch <= '\u0aff' for ch in text)

    def extract_word_timestamps(self, audio_path: str, script_text: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Extracts word-level timestamps.
        Uses Faster-Whisper if available, with robust fallback to script-based timing.
        """
        model = self._get_whisper_model()
        words_data = []

        is_gu = self._is_gujarati(script_text)
        lang = "gu" if is_gu else "en"

        if model:
            try:
                segments, info = model.transcribe(
                    audio_path,
                    beam_size=5,
                    word_timestamps=True,
                    language=lang,
                    initial_prompt=script_text[:100] if script_text else None
                )
                for segment in segments:
                    if segment.words:
                        for w in segment.words:
                            cleaned_w = w.word.strip()
                            if cleaned_w:
                                words_data.append({
                                    "word": cleaned_w,
                                    "start": w.start,
                                    "end": w.end,
                                })
                if words_data:
                    return words_data
            except Exception as e:
                print(f"[Warning] Faster-Whisper transcription failed: {e}. Using fallback word timing.")

        # Fallback: estimate word timestamps from audio duration and script text
        duration = self._get_audio_duration(audio_path)
        raw_words = (script_text or "સુરત સમાચાર અપડેટ").replace("\n", " ").split()
        if not raw_words:
            raw_words = ["સુરત", "સમાચાર", "અપડેટ"]

        time_per_word = duration / max(len(raw_words), 1)
        for i, w in enumerate(raw_words):
            start = i * time_per_word
            end = min((i + 1) * time_per_word, duration)
            words_data.append({
                "word": w.strip(),
                "start": start,
                "end": end,
            })
        return words_data

    def group_into_dynamic_chunks(
        self,
        words_data: List[Dict[str, Any]],
        max_words_per_chunk: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Groups words into dynamic chunks of 2-3 words maximum.
        SOP Rule: Strictly NO full paragraphs on screen.
        """
        chunks = []
        i = 0
        n = len(words_data)

        while i < n:
            # Chunk size: 2 or 3 words
            remaining = n - i
            if remaining == 4:
                chunk_size = 2  # Split 4 as 2 + 2 instead of 3 + 1
            else:
                chunk_size = min(max_words_per_chunk, remaining)

            group = words_data[i : i + chunk_size]
            chunk_text = " ".join(item["word"] for item in group)
            start_time = group[0]["start"]
            end_time = group[-1]["end"]

            # Ensure minimum display time of 0.4s for readability
            if end_time - start_time < 0.4:
                end_time = start_time + 0.4

            chunks.append({
                "text": chunk_text,
                "start": start_time,
                "end": end_time,
            })
            i += chunk_size

        return chunks

    @staticmethod
    def hex_to_ass_color(hex_str: str, alpha: str = "00") -> str:
        """Converts '#RRGGBB' to ASS color format '&HAABBGGRR'."""
        cleaned = hex_str.lstrip("#")
        if len(cleaned) == 6:
            r, g, b = cleaned[0:2], cleaned[2:4], cleaned[4:6]
            return f"&H{alpha}{b}{g}{r}"
        return "&H00FFFFFF"

    def generate_ass_subtitles(
        self,
        audio_path: str,
        output_ass_path: str,
        script_text: Optional[str] = None,
        font_size: int = 58,
        primary_color: str = "#FFFFFF",
        outline_color: str = "#000000",
        outline_thickness: int = 4,
        box_style: bool = False,
        y_offset: int = 450
    ) -> str:
        """
        Generates an Advanced SubStation Alpha (.ass) file configured strictly
        for 1080x1920 portrait reels with customizable styles.
        """
        out_path = Path(output_ass_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)

        words_data = self.extract_word_timestamps(audio_path, script_text)
        chunks = self.group_into_dynamic_chunks(words_data, max_words_per_chunk=3)

        ass_primary = self.hex_to_ass_color(primary_color)
        ass_outline = self.hex_to_ass_color(outline_color)
        ass_back = "&H80000000" if box_style else "&H00000000"
        border_style = 3 if box_style else 1  # 3 = opaque box, 1 = outline + shadow

        ass_content = f"""[Script Info]
; Script generated by Surat News Reel Engine (V2)
ScriptType: v4.00+
PlayResX: {config.VIDEO_WIDTH}
PlayResY: {config.VIDEO_HEIGHT}
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ReelSubtitle,Noto Sans Gujarati,{font_size},{ass_primary},&H000000FF,{ass_outline},{ass_back},1,0,0,0,100,100,0,0,{border_style},{outline_thickness},0,2,60,60,{y_offset},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        for item in chunks:
            start_str = self._format_timestamp_ass(item["start"])
            end_str = self._format_timestamp_ass(item["end"])
            text = item["text"].replace("\n", " ").strip()
            line = f"Dialogue: 0,{start_str},{end_str},ReelSubtitle,,0,0,0,,{text}\n"
            ass_content += line

        with open(out_path, "w", encoding="utf-8") as f:
            f.write(ass_content)

        return str(out_path)


if __name__ == "__main__":
    print("=== Testing SubtitleGenerator ===")
    generator = SubtitleGenerator()

    test_audio = config.OUTPUT_AUDIO_DIR / "test_voiceover.wav"
    test_ass = config.OUTPUT_SUBTITLES_DIR / "test_subtitles.ass"

    if not test_audio.exists():
        print("[Notice] Generating test audio first...")
        from core.voice_engine import VoiceEngine
        v_engine = VoiceEngine()
        v_engine.generate_voiceover("સુરતના અડાજણ વિસ્તારમાં આજે સવારે નવા ફ્લાયઓવર બ્રિજનું કામ પૂર્ણ થયું છે.", str(test_audio))

    print(f"Generating ASS subtitles to: {test_ass}")
    script = "સુરતના અડાજણ વિસ્તારમાં આજે સવારે નવા ફ્લાયઓવર બ્રિજનું કામ પૂર્ણ થયું છે."
    ass_path = generator.generate_ass_subtitles(str(test_audio), str(test_ass), script_text=script)

    assert Path(ass_path).exists(), "Output .ass does not exist!"
    content = Path(ass_path).read_text(encoding="utf-8")
    print(f"\n[Preview of generated .ass]:\n{content[:450]}...\n")
    assert "PlayResX: 1080" in content
    assert "PlayResY: 1920" in content
    assert "ReelSubtitle" in content
    assert "Dialogue:" in content
    print("[SUCCESS] SubtitleGenerator unit tests passed!")
