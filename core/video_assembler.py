"""
Video Assembler Engine (V2)
Features:
1. Dual-Stripe Headline Badge Generator (Red Line 1 + Dodger Blue Line 2 with emojis).
2. Multi-Clip Auto Splicer (extracts 3-4s micro-clips and joins them to match timeline).
3. Single-Video Ingest (auto aspect-ratio fill and loop/trim).
4. Full FFmpeg compositor burning ASS subtitles, headline overlay, and ducked audio.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont

# Ensure project root is in path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import config

class VideoAssembler:
    """V2 Video composition engine with dual-stripe badges and multi-clip montages."""

    def __init__(self):
        self.ffmpeg_bin = config.get_ffmpeg_binary()
        self.ffprobe_bin = config.get_ffprobe_binary()
        self.font_path = config.FONTS_DIR / "NotoSansGujarati-Bold.ttf"

    def get_media_duration(self, media_path: str) -> float:
        """Extracts exact media duration via ffprobe."""
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
        except Exception:
            pass
        return 15.0

    def _sanitize_text_for_font(self, text: str) -> str:
        """Removes emoji/symbol characters that cause tofu boxes in Gujarati font."""
        import re
        if not text:
            return ""
        cleaned = re.sub(
            r'[\U00010000-\U0010ffff]|[\u2600-\u27bf]|[\u2300-\u23ff]|[\u2b50-\u2b55]|[\ufe00-\ufe0f]',
            '',
            text
        )
        return cleaned.strip()

    def generate_headline_overlay_image(
        self,
        line1_text: str,
        line2_text: str,
        output_png_path: str,
        line1_bg: str = "#FF0033",
        line1_text_color: str = "#FFFFFF",
        line2_bg: str = "#0080FF",
        line2_text_color: str = "#FFFFFF",
        start_y: int = 280,
        font_size: int = 44
    ) -> str:
        """
        Draws the dual-stripe rounded pill badges matching the reference screenshot:
        - Line 1: Rounded rectangle with Red background (#FF0033) & bold white text.
        - Line 2: Rounded rectangle with Dodger Blue background (#0080FF) & bold white text.
        - Horizontally centered, stacked vertically in the upper-center safe zone.
        """
        out_file = Path(output_png_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)

        # Sanitize to prevent [] tofu boxes from unsupported emojis in font
        clean_line1 = self._sanitize_text_for_font(line1_text) or line1_text
        clean_line2 = self._sanitize_text_for_font(line2_text) or line2_text

        img = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        try:
            font = ImageFont.truetype(str(self.font_path), font_size)
        except Exception:
            font = ImageFont.load_default()

        pad_x = 28
        pad_y = 14
        radius = 16
        gap = 12

        # 1. Measure Line 1
        bbox1 = draw.textbbox((0, 0), clean_line1, font=font)
        w1 = bbox1[2] - bbox1[0]
        h1 = bbox1[3] - bbox1[1]
        badge1_w = w1 + (pad_x * 2)
        badge1_h = h1 + (pad_y * 2)
        x1 = (config.VIDEO_WIDTH - badge1_w) // 2
        y1 = start_y

        # Draw subtle dropshadow for Line 1
        draw.rounded_rectangle(
            [x1 + 2, y1 + 3, x1 + badge1_w + 2, y1 + badge1_h + 3],
            radius=radius,
            fill=(0, 0, 0, 110)
        )
        # Draw Line 1 Pill Badge
        draw.rounded_rectangle(
            [x1, y1, x1 + badge1_w, y1 + badge1_h],
            radius=radius,
            fill=line1_bg
        )
        # Draw Line 1 Text
        draw.text(
            (x1 + pad_x - bbox1[0], y1 + pad_y - bbox1[1]),
            clean_line1,
            font=font,
            fill=line1_text_color
        )

        # 2. Measure Line 2
        bbox2 = draw.textbbox((0, 0), clean_line2, font=font)
        w2 = bbox2[2] - bbox2[0]
        h2 = bbox2[3] - bbox2[1]
        badge2_w = w2 + (pad_x * 2)
        badge2_h = h2 + (pad_y * 2)
        x2 = (config.VIDEO_WIDTH - badge2_w) // 2
        y2 = y1 + badge1_h + gap

        # Draw subtle dropshadow for Line 2
        draw.rounded_rectangle(
            [x2 + 2, y2 + 3, x2 + badge2_w + 2, y2 + badge2_h + 3],
            radius=radius,
            fill=(0, 0, 0, 110)
        )
        # Draw Line 2 Pill Badge
        draw.rounded_rectangle(
            [x2, y2, x2 + badge2_w, y2 + badge2_h],
            radius=radius,
            fill=line2_bg
        )
        # Draw Line 2 Text
        draw.text(
            (x2 + pad_x - bbox2[0], y2 + pad_y - bbox2[1]),
            clean_line2,
            font=font,
            fill=line2_text_color
        )

        img.save(out_file, "PNG")
        return str(out_file)

    def prepare_background_video(
        self,
        video_mode: str,
        single_video_path: Optional[str],
        multi_clip_paths: Optional[List[str]],
        target_duration: float,
        output_bg_path: str
    ) -> str:
        """
        Handles Mode A (Single Video) and Mode B (Multi-Clip Auto Montage).
        Produces a 1080x1920 30fps video matching target_duration.
        """
        out_bg = Path(output_bg_path).resolve()
        out_bg.parent.mkdir(parents=True, exist_ok=True)

        # Mode B: Multi-Clip Montage
        if video_mode == "multi" and multi_clip_paths and len(multi_clip_paths) > 1:
            print(f"[VideoAssembler] Creating Multi-Clip montage from {len(multi_clip_paths)} clips for {target_duration}s...")
            return self._create_multi_clip_montage(multi_clip_paths, target_duration, out_bg)

        # Mode A: Single Video
        src_video = single_video_path or str(config.BROLL_DIR / "surat_city_loop.mp4")
        if not Path(src_video).exists():
            src_video = str(config.BROLL_DIR / "surat_city_loop.mp4")

        print(f"[VideoAssembler] Processing Single Video background ({src_video})...")
        cmd = [
            self.ffmpeg_bin, "-y",
            "-stream_loop", "-1",
            "-i", str(src_video),
            "-vf", f"scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT},fps=30",
            "-t", f"{target_duration:.2f}",
            "-an",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            str(out_bg)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return str(out_bg)

    def _create_multi_clip_montage(
        self,
        clips: List[str],
        target_duration: float,
        output_path: Path
    ) -> str:
        """Slices and concatenates multiple real video clips seamlessly to fill target duration."""
        temp_dir = config.OUTPUT_DIR / f"temp_montage_{int(Path().resolve().stat().st_mtime)}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        num_clips = max(1, len(clips))
        # If user uploaded e.g. 3 clips for a 15s video, each gets ~5s. If cuts are faster, ~3-4s per cut.
        desired_slice_dur = max(2.5, min(6.0, target_duration / num_clips))
        needed_slices = max(num_clips, int(target_duration // desired_slice_dur) + (1 if target_duration % desired_slice_dur > 0.5 else 0))

        prepared_subclips = []
        clip_offsets = {c: 0.0 for c in clips}

        for i in range(needed_slices):
            src_file = clips[i % num_clips]
            src_dur = self.get_media_duration(src_file)
            
            slice_dur = min(desired_slice_dur, target_duration)
            curr_offset = clip_offsets.get(src_file, 0.0)

            # Ensure start offset doesn't exceed clip duration
            if curr_offset + slice_dur > src_dur:
                start_sec = 0.0
                clip_offsets[src_file] = slice_dur
            else:
                start_sec = curr_offset
                clip_offsets[src_file] = curr_offset + slice_dur

            sub_path = temp_dir / f"sub_{i:03d}.mp4"
            cmd = [
                self.ffmpeg_bin, "-y",
                "-ss", f"{start_sec:.2f}",
                "-i", str(src_file),
                "-t", f"{slice_dur:.2f}",
                "-vf", f"scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT},fps=30",
                "-an",
                "-c:v", "libx264",
                "-preset", "ultrafast",
                "-pix_fmt", "yuv420p",
                str(sub_path)
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if sub_path.exists() and sub_path.stat().st_size > 1000:
                prepared_subclips.append(sub_path)

        if not prepared_subclips:
            # Fallback to direct loop of first clip
            src_file = clips[0]
            cmd_fb = [
                self.ffmpeg_bin, "-y",
                "-stream_loop", "-1",
                "-i", str(src_file),
                "-t", f"{target_duration:.2f}",
                "-vf", f"scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT},fps=30",
                "-an",
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                str(output_path)
            ]
            subprocess.run(cmd_fb, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            return str(output_path)

        # Create concat demuxer text file
        concat_txt = temp_dir / "concat_list.txt"
        with open(concat_txt, "w") as f:
            for sub in prepared_subclips:
                f.write(f"file '{sub.name}'\n")

        # Concat and trim to exact duration
        cmd_concat = [
            self.ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_txt),
            "-t", f"{target_duration:.2f}",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            str(output_path)
        ]
        subprocess.run(cmd_concat, cwd=str(temp_dir), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        # Cleanup temp directory
        shutil.rmtree(temp_dir, ignore_errors=True)
        return str(output_path)

    def render_v2_reel(
        self,
        video_mode: str,
        single_video_path: Optional[str],
        multi_clip_paths: Optional[List[str]],
        voiceover_path: str,
        bg_music_path: str,
        ass_subtitle_path: str,
        headline_overlay_path: str,
        output_video_path: str,
        category_code: str = "N01",
        area: str = "Surat",
        date_str: str = "14/09/2026",
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Assembles complete V2 Instagram Reel:
        - 1080x1920 background (Single or Montage)
        - Dual-stripe headline badge overlay PNG
        - Burned ASS subtitles
        - Voiceover (vol 1.0) + Ducked BGM (vol 0.12)
        - Location & Date tag
        """
        out_file = Path(output_video_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)

        voice_dur = self.get_media_duration(voiceover_path)
        total_duration = voice_dur + config.VIDEO_BUFFER_DURATION

        if progress_callback:
            progress_callback(0.15, "Preparing 1080x1920 video background...")

        # 1. Prepare Background Video
        temp_bg = config.OUTPUT_VIDEOS_DIR / f"temp_bg_{int(Path().resolve().stat().st_mtime)}.mp4"
        self.prepare_background_video(
            video_mode=video_mode,
            single_video_path=single_video_path,
            multi_clip_paths=multi_clip_paths,
            target_duration=total_duration,
            output_bg_path=str(temp_bg)
        )

        if progress_callback:
            progress_callback(0.40, "Compositing dual-stripe headline, subtitles, and audio ducking...")

        # 2. Build FFmpeg Filtergraph
        rel_font = Path(self.font_path).relative_to(config.BASE_DIR) if self.font_path.is_relative_to(config.BASE_DIR) else self.font_path
        rel_ass = Path(ass_subtitle_path).relative_to(config.BASE_DIR) if Path(ass_subtitle_path).is_relative_to(config.BASE_DIR) else ass_subtitle_path
        rel_overlay = Path(headline_overlay_path).relative_to(config.BASE_DIR) if Path(headline_overlay_path).is_relative_to(config.BASE_DIR) else headline_overlay_path

        cat_badge = config.CATEGORY_METADATA.get(category_code.upper(), {}).get("badge", f"SURAT NEWS | {category_code}")
        badge_box_color = "red@0.85" if category_code.upper() == "C01" else "blue@0.85"
        loc_tag = f"SURAT ({area})  •  {date_str}".replace(":", "\\:")

        vf_graph = (
            f"[0:v][1:v]overlay=0:0[vwithbadge];"
            f"[vwithbadge]drawtext=fontfile='{rel_font}':text='{cat_badge}':fontsize=34:fontcolor=white:x=60:y=80:box=1:boxcolor={badge_box_color}:boxborderw=10,"
            f"drawtext=fontfile='{rel_font}':text='{loc_tag}':fontsize=30:fontcolor=white:x=(w-text_w)/2:y={config.LOCATION_TAG_Y}:box=1:boxcolor=black@0.6:boxborderw=10,"
            f"ass='{rel_ass}':fontsdir='assets/fonts'[vout]"
        )

        fade_out_start = max(0.0, total_duration - config.AUDIO_FADE_DURATION)
        af_complex = (
            f"[2:a]volume={config.VOICEOVER_VOLUME}[voice];"
            f"[3:a]volume={config.BG_MUSIC_DUCK_VOLUME},"
            f"afade=t=in:ss=0:d={config.AUDIO_FADE_DURATION},"
            f"afade=t=out:st={fade_out_start:.2f}:d={config.AUDIO_FADE_DURATION}[bg];"
            f"[voice][bg]amix=inputs=2:duration=first:dropout_transition=2[aout]"
        )

        cmd = [
            self.ffmpeg_bin, "-y",
            # Input 0: Background video (Mode A or B)
            "-i", str(temp_bg),
            # Input 1: Dual-stripe headline PNG overlay
            "-i", str(rel_overlay),
            # Input 2: Voiceover audio (.wav)
            "-i", str(voiceover_path),
            # Input 3: Background music (.mp3)
            "-stream_loop", "-1", "-i", str(bg_music_path),
            "-filter_complex", f"{vf_graph};{af_complex}",
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "21",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-t", f"{total_duration:.2f}",
            str(out_file)
        ]

        subprocess.run(cmd, cwd=str(config.BASE_DIR), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        if temp_bg.exists():
            temp_bg.unlink()

        if progress_callback:
            progress_callback(1.0, "V2 Reel Rendering Complete!")

        print(f"[VideoAssembler] Successfully rendered V2 Reel: {out_file} ({out_file.stat().st_size / (1024*1024):.2f} MB)")
        return str(out_file)


if __name__ == "__main__":
    print("=== Testing VideoAssembler (V2) ===")
    assembler = VideoAssembler()

    test_png = config.OUTPUT_DIR / "test_dual_stripe.png"
    print("Generating dual-stripe headline overlay PNG...")
    assembler.generate_headline_overlay_image(
        line1_text="તૈયારીઓ પૂર્ણ હતી... ભક્તો તૈયાર હતા...",
        line2_text="પણ બાપ્પાની મરજી કંઈક અલગ હતી! 🚩",
        output_png_path=str(test_png),
        line1_bg="#FF0033",
        line2_bg="#0080FF"
    )
    assert test_png.exists()
    assert test_png.stat().st_size > 5000
    print(f"[SUCCESS] Dual-stripe badge generated at: {test_png} ({test_png.stat().st_size} bytes)")
