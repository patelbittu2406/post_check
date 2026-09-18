"""
Video Composer Engine
Assembles the final 9:16 Instagram Reel (1080x1920) conforming strictly to
Instagram safe zones, overlaying dynamic badges, headline banners, location tags,
word-level ASS subtitles, and mixing audio with auto-ducking.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class VideoComposer:
    """FFmpeg-based programmatic video composition engine."""

    def __init__(self):
        self.ffmpeg_bin = config.get_ffmpeg_binary()
        self.ffprobe_bin = config.get_ffprobe_binary()
        self.font_path = config.FONTS_DIR / "NotoSansGujarati-Bold.ttf"

    def get_media_duration(self, media_path: str) -> float:
        """Retrieves exact duration of an audio or video file."""
        cmd = [
            self.ffprobe_bin,
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(media_path)
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception as e:
            print(f"[Warning] Failed to get duration for {media_path}: {e}")
        return 15.0

    def _check_nvenc_available(self) -> bool:
        """Checks if NVENC GPU acceleration is available and operational."""
        test_cmd = [
            self.ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.1",
            "-c:v", "h264_nvenc",
            "-f", "null", "-"
        ]
        try:
            res = subprocess.run(test_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return res.returncode == 0
        except Exception:
            return False

    def _escape_ffmpeg_text(self, text: str) -> str:
        """Escapes text for FFmpeg drawtext filter."""
        # Escape colons, backslashes, percent, and single quotes
        escaped = text.replace("\\", "\\\\")
        escaped = escaped.replace("'", "'\\''")
        escaped = escaped.replace(":", "\\:")
        escaped = escaped.replace("%", "\\%")
        return escaped

    def render_reel(
        self,
        broll_video_path: str,
        voiceover_path: str,
        bg_music_path: str,
        ass_subtitle_path: str,
        metadata: Dict[str, Any],
        output_video_path: str,
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Renders complete 1080x1920 Instagram Reel with safe zone compliance:
        - Category Badge (Top-Left: x=60, y=80)
        - Safe Center Headline Banner (y=300, 54pt text)
        - Location & Date Tag (y=1440, 60px above bottom UI safe zone)
        - Word-level ASS Subtitles (Bottom-Center margin 450px)
        - Voiceover at 1.0 volume + Auto-ducked BGM to 0.12
        - Trimmed to voiceover duration + 1.0s buffer
        """
        out_file = Path(output_video_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)

        voice_duration = self.get_media_duration(voiceover_path)
        total_duration = voice_duration + config.VIDEO_BUFFER_DURATION

        if progress_callback:
            progress_callback(0.1, "Analyzing media assets and safe zones...")

        category_code = metadata.get("category_code", "N01").upper()
        cat_info = config.CATEGORY_METADATA.get(category_code, config.CATEGORY_METADATA["N01"])
        badge_text = cat_info.get("badge", f"SURAT NEWS | {category_code}")
        headline = metadata.get("headline", "સુરતના મહત્વના સમાચાર")
        location = metadata.get("location", "Adajan, Surat")
        date_str = metadata.get("date", "14/09/2026")
        loc_date_tag = f"SURAT ({location})  •  {date_str}"

        # Category badge colors
        badge_colors = {
            "C01": "red@0.85",
            "N01": "blue@0.85",
            "T01": "orange@0.85",
            "A01": "darkgreen@0.85",
            "F01": "purple@0.85",
            "B01": "darkgoldenrod@0.85"
        }
        badge_box_color = badge_colors.get(category_code, "blue@0.85")

        # Escaped text strings
        esc_badge = self._escape_ffmpeg_text(badge_text)
        esc_headline = self._escape_ffmpeg_text(headline)
        esc_tag = self._escape_ffmpeg_text(loc_date_tag)

        # Build relative paths to avoid issues with spaces in directory path
        rel_font = Path(self.font_path).relative_to(config.BASE_DIR) if self.font_path.is_relative_to(config.BASE_DIR) else self.font_path
        rel_ass = Path(ass_subtitle_path).relative_to(config.BASE_DIR) if Path(ass_subtitle_path).is_relative_to(config.BASE_DIR) else ass_subtitle_path

        # Construct Video Filter Graph:
        # 1. Scale & aspect ratio crop to exact 1080x1920
        # 2. Draw Top-Left Category Badge (x=60, y=80)
        # 3. Draw Center Headline Banner (y=300, 54pt)
        # 4. Draw Location & Date Tag (y=1440)
        # 5. Burn in ASS Subtitles (with fontsdir)
        vf_filters = [
            f"scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase",
            f"crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}",
            # Top-Left Category Badge
            f"drawtext=fontfile='{rel_font}':text='{esc_badge}':fontsize=36:fontcolor=white:x={config.CATEGORY_BADGE_X}:y={config.CATEGORY_BADGE_Y}:box=1:boxcolor={badge_box_color}:boxborderw=12",
            # Headline Banner in Safe Center (y=300)
            f"drawtext=fontfile='{rel_font}':text='{esc_headline}':fontsize={config.HEADLINE_FONT_SIZE}:fontcolor=white:x=(w-text_w)/2:y={config.HEADLINE_Y}:box=1:boxcolor=black@0.75:boxborderw=20",
            # Location & Date Tag (60px above bottom UI safe zone)
            f"drawtext=fontfile='{rel_font}':text='{esc_tag}':fontsize=32:fontcolor=white:x=(w-text_w)/2:y={config.LOCATION_TAG_Y}:box=1:boxcolor=black@0.6:boxborderw=10",
            # Burn ASS subtitles
            f"ass='{rel_ass}':fontsdir='assets/fonts'"
        ]
        vf_str = ",".join(vf_filters)

        # Audio Filter Graph:
        # Input 1: Voiceover (.wav) -> vol 1.0 (target -14 LUFS)
        # Input 2: Background Music (.mp3) -> ducked to 0.12 (target -28 LUFS) with 0.5s fade in/out
        fade_out_start = max(0.0, total_duration - config.AUDIO_FADE_DURATION)
        af_complex = (
            f"[1:a]volume={config.VOICEOVER_VOLUME}[voice];"
            f"[2:a]volume={config.BG_MUSIC_DUCK_VOLUME},"
            f"afade=t=in:ss=0:d={config.AUDIO_FADE_DURATION},"
            f"afade=t=out:st={fade_out_start:.2f}:d={config.AUDIO_FADE_DURATION}[bg];"
            f"[voice][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )

        # Encoder selection
        has_nvenc = self._check_nvenc_available()
        v_codec = "h264_nvenc" if has_nvenc else "libx264"
        codec_params = ["-preset", "fast", "-cq", "22"] if has_nvenc else ["-preset", "fast", "-crf", "21"]

        cmd = [
            self.ffmpeg_bin, "-y",
            # Input 0: Loop B-Roll video / image
            "-stream_loop", "-1", "-i", str(broll_video_path),
            # Input 1: Voiceover (.wav)
            "-i", str(voiceover_path),
            # Input 2: Background Music (.mp3)
            "-stream_loop", "-1", "-i", str(bg_music_path),
            "-filter_complex", f"[0:v]{vf_str}[vout];{af_complex}",
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", v_codec,
            *codec_params,
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-t", f"{total_duration:.2f}",
            str(out_file)
        ]

        if progress_callback:
            progress_callback(0.4, "Executing FFmpeg composition & audio ducking...")

        print(f"[VideoComposer] Rendering reel ({total_duration:.1f}s) to: {out_file}")
        process = subprocess.run(
            cmd,
            cwd=str(config.BASE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if process.returncode != 0:
            print("[Error] FFmpeg execution failed:", process.stderr[-1000:])
            raise RuntimeError(f"FFmpeg failed with exit code {process.returncode}:\n{process.stderr[-500:]}")

        if progress_callback:
            progress_callback(1.0, "Reel rendering complete!")

        print(f"[SUCCESS] Reel rendered successfully: {out_file} ({out_file.stat().st_size / (1024*1024):.2f} MB)")
        return str(out_file)


if __name__ == "__main__":
    print("=== Testing VideoComposer ===")
    composer = VideoComposer()

    test_broll = config.BROLL_DIR / "surat_city_loop.mp4"
    test_voice = config.OUTPUT_AUDIO_DIR / "test_voiceover.wav"
    test_bgm = config.AUDIO_DIR / "surat_news_bgm.mp3"
    test_ass = config.OUTPUT_SUBTITLES_DIR / "test_subtitles.ass"
    test_out_video = config.OUTPUT_VIDEOS_DIR / "test_reel_1080x1920.mp4"

    meta = {
        "category_code": "N01",
        "headline": "અડાજણમાં નવો ફ્લાયઓવર શરૂ",
        "location": "Adajan, Surat",
        "date": "14/09/2026"
    }

    out_path = composer.render_reel(
        broll_video_path=str(test_broll),
        voiceover_path=str(test_voice),
        bg_music_path=str(test_bgm),
        ass_subtitle_path=str(test_ass),
        metadata=meta,
        output_video_path=str(test_out_video)
    )

    assert Path(out_path).exists(), f"Rendered video does not exist: {out_path}"
    assert Path(out_path).stat().st_size > 50000, "Rendered video file is suspiciously small!"
    print(f"\n[SUCCESS] VideoComposer rendered complete 1080x1920 Reel: {out_path}")
