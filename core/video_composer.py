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

    def generate_ass_from_timeline_subtitles(
        self,
        subtitles: list,
        output_ass_path: str,
        font_size: int = 68,
        highlight_color: str = "&H0000D7FF"
    ) -> str:
        """
        Creates an ASS subtitle file from Track 1 timeline subtitle items:
        subtitles = [{"text": "...", "start": 0.5, "end": 2.2}, ...]
        """
        out_p = Path(output_ass_path).resolve()
        out_p.parent.mkdir(parents=True, exist_ok=True)

        def _to_ass_time(sec: float) -> str:
            sec = max(0.0, float(sec))
            h = int(sec // 3600)
            m = int((sec % 3600) // 60)
            s = sec % 60
            return f"{h}:{m:02d}:{s:05.2f}"

        ass_header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Noto Sans Gujarati,{font_size},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,2,60,60,420,1
Style: Highlight,Noto Sans Gujarati,{font_size + 4},{highlight_color},&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,3,2,60,60,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []
        for item in subtitles:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            start_s = float(item.get("start", 0.0))
            end_s = float(item.get("end", start_s + 1.5))
            if end_s <= start_s:
                end_s = start_s + 0.5
            start_fmt = _to_ass_time(start_s)
            end_fmt = _to_ass_time(end_s)
            events.append(f"Dialogue: 0,{start_fmt},{end_fmt},Highlight,,0,0,0,,{text}")

        full_ass = ass_header + "\n".join(events) + "\n"
        out_p.write_text(full_ass, encoding="utf-8")
        return str(out_p)

    def render_timeline_reel(
        self,
        timeline_data: Dict[str, Any],
        output_video_path: str,
        progress_callback: Optional[callable] = None
    ) -> str:
        """
        Renders an interactive multi-track timeline video:
        - Resolves Track 2 video clips, applies start/end trims and sequential ordering.
        - Assembles chained xfade transitions (Cross-Dissolve, Fade to Black, Push).
        - Generates and burns dual-stripe headline overlay (Line 1 Red, Line 2 Blue).
        - Generates and burns Track 1 word/phrase subtitles directly into 1080x1920 video.
        - Mixes Track 3 voiceover and auto-ducked background music.
        """
        import time
        from core.video_assembler import VideoAssembler

        ts = int(time.time())
        out_file = Path(output_video_path).resolve()
        out_file.parent.mkdir(parents=True, exist_ok=True)

        if progress_callback:
            progress_callback(0.1, "Analyzing timeline tracks and clips...")

        # 1. Resolve clips
        raw_clips = timeline_data.get("clips", [])
        if not raw_clips:
            # Fallback to default stock b-roll
            raw_clips = [{
                "filename": "surat_city_loop.mp4",
                "trim_start": 0.0,
                "trim_end": 15.0,
                "duration": 15.0,
                "transition_out": "none"
            }]

        resolved_clips = []
        for c in raw_clips:
            fn = c.get("filename") or c.get("name") or "surat_city_loop.mp4"
            p = Path(fn)
            if not p.is_absolute():
                candidates = [
                    config.USER_CLIPS_DIR / fn,
                    config.BROLL_DIR / fn,
                    config.OUTPUT_VIDEOS_DIR / fn,
                    Path(fn)
                ]
                found_p = None
                for cand in candidates:
                    if cand.exists():
                        found_p = cand
                        break
                if not found_p:
                    # fallback to any available stock broll
                    stocks = list(config.BROLL_DIR.glob("*.mp4"))
                    found_p = stocks[0] if stocks else config.BROLL_DIR / "surat_city_loop.mp4"
                p = found_p

            src_dur = self.get_media_duration(str(p))
            t_start = max(0.0, float(c.get("trim_start", 0.0)))
            t_end = float(c.get("trim_end", 0.0))
            if t_end <= t_start:
                t_end = t_start + max(1.0, float(c.get("duration", 4.0)))
            if src_dur > 0:
                t_end = min(t_end, src_dur)
            dur = max(0.4, t_end - t_start)

            trans = (c.get("transition_out") or "none").lower()
            trans_dur = min(float(c.get("transition_duration", 0.4)), dur * 0.45)

            resolved_clips.append({
                "path": str(p),
                "trim_start": t_start,
                "trim_end": t_end,
                "duration": dur,
                "transition_out": trans,
                "transition_duration": trans_dur
            })

        # 2. Resolve Audio
        voice_path = None
        voice_fn = timeline_data.get("voiceover_filename")
        if voice_fn:
            candidates = [
                config.OUTPUT_AUDIO_DIR / voice_fn,
                Path(voice_fn)
            ]
            for cand in candidates:
                if cand.exists():
                    voice_path = str(cand)
                    break

        voice_dur = self.get_media_duration(voice_path) if voice_path else 0.0

        bgm_path = None
        bgm_fn = timeline_data.get("bg_music_filename", "surat_news_bgm.mp3")
        if bgm_fn:
            cand = config.AUDIO_DIR / bgm_fn
            if cand.exists():
                bgm_path = str(cand)

        bgm_duck = float(timeline_data.get("bgm_duck_volume", 0.12))

        # 3. Compute timeline durations and xfade transitions
        xfade_map = {
            "dissolve": "fade",
            "cross_dissolve": "fade",
            "fade": "fade",
            "fadeblack": "fadeblack",
            "fade_black": "fadeblack",
            "black": "fadeblack",
            "push": "slideleft",
            "slide": "slideleft",
            "slideleft": "slideleft",
            "none": "fade"
        }

        num_clips = len(resolved_clips)
        filter_steps = []

        # Trim & scale each clip
        for i, c in enumerate(resolved_clips):
            filter_steps.append(
                f"[{i}:v]trim=start={c['trim_start']:.2f}:end={c['trim_end']:.2f},"
                f"setpts=PTS-STARTPTS,scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,"
                f"crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT},setsar=1,fps=30[vclip{i}]"
            )

        # Chained xfade
        if num_clips == 1:
            filter_steps.append("[vclip0]copy[vbase]")
            total_video_dur = resolved_clips[0]["duration"]
        else:
            last_label = "[vclip0]"
            accum_offset = 0.0
            for i in range(num_clips - 1):
                curr_dur = resolved_clips[i]["duration"]
                trans_type = resolved_clips[i]["transition_out"]
                xf_type = xfade_map.get(trans_type, "fade")
                t_dur = resolved_clips[i]["transition_duration"]
                if trans_type == "none":
                    t_dur = 0.02
                    xf_type = "fade"

                if i == 0:
                    accum_offset = curr_dur - t_dur
                else:
                    accum_offset = accum_offset + curr_dur - t_dur

                accum_offset = max(0.1, accum_offset)
                next_label = f"[vxf{i+1}]" if i < num_clips - 2 else "[vbase]"
                filter_steps.append(
                    f"{last_label}[vclip{i+1}]xfade=transition={xf_type}:duration={t_dur:.2f}:offset={accum_offset:.2f}{next_label}"
                )
                last_label = next_label

            total_video_dur = accum_offset + resolved_clips[-1]["duration"]

        target_total_dur = max(total_video_dur, voice_dur + 0.5)

        # Pad video if voiceover is longer than visual clips
        active_vlabel = "[vbase]"
        if voice_dur > total_video_dur:
            pad_needed = voice_dur - total_video_dur + 0.5
            filter_steps.append(f"[vbase]tpad=stop_mode=clone:stop_duration={pad_needed:.2f}[vpadded]")
            active_vlabel = "[vpadded]"
            total_video_dur = target_total_dur

        # 4. Generate Headline Overlay PNG
        assembler = VideoAssembler()
        hl_overlay_png = config.OUTPUT_DIR / f"timeline_hl_{ts}.png"
        line1_text = timeline_data.get("line1_text", "સુરત ન્યૂઝ | LIVE")
        line2_text = timeline_data.get("line2_text", "બ્રેકિંગ અપડેટ્સ")
        assembler.generate_headline_overlay_image(
            line1_text=line1_text,
            line2_text=line2_text,
            output_png_path=str(hl_overlay_png),
            line1_bg=timeline_data.get("line1_bg", "#FF0033"),
            line1_text_color=timeline_data.get("line1_text_color", "#FFFFFF"),
            line2_bg=timeline_data.get("line2_bg", "#0080FF"),
            line2_text_color=timeline_data.get("line2_text_color", "#FFFFFF"),
            font_size=44
        )

        idx_headline = num_clips
        filter_steps.append(f"{active_vlabel}[{idx_headline}:v]overlay=0:0[vwithhl]")
        active_vlabel = "[vwithhl]"

        # 5. Burn ASS Subtitles
        ass_path = None
        subs = timeline_data.get("subtitles", [])
        if subs:
            ass_path = self.generate_ass_from_timeline_subtitles(
                subtitles=subs,
                output_ass_path=str(config.OUTPUT_SUBTITLES_DIR / f"timeline_subs_{ts}.ass")
            )
        elif timeline_data.get("ass_subtitle_path"):
            ass_path = timeline_data.get("ass_subtitle_path")

        if ass_path and Path(ass_path).exists():
            rel_ass = Path(ass_path).relative_to(config.BASE_DIR) if Path(ass_path).is_relative_to(config.BASE_DIR) else ass_path
            filter_steps.append(f"{active_vlabel}ass='{rel_ass}':fontsdir='assets/fonts'[vout]")
        else:
            filter_steps.append(f"{active_vlabel}copy[vout]")

        # 6. Audio Mixing
        next_input_idx = idx_headline + 1
        has_voice = bool(voice_path)
        idx_voice = next_input_idx if has_voice else None
        if has_voice:
            next_input_idx += 1

        has_bgm = bool(bgm_path)
        idx_bgm = next_input_idx if has_bgm else None

        if has_voice and has_bgm:
            fade_out_st = max(0.0, target_total_dur - config.AUDIO_FADE_DURATION)
            filter_steps.append(
                f"[{idx_voice}:a]volume=1.0[voice];"
                f"[{idx_bgm}:a]volume={bgm_duck},"
                f"afade=t=in:ss=0:d={config.AUDIO_FADE_DURATION},"
                f"afade=t=out:st={fade_out_st:.2f}:d={config.AUDIO_FADE_DURATION}[bgm];"
                f"[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]"
            )
        elif has_voice:
            filter_steps.append(f"[{idx_voice}:a]volume=1.0[aout]")
        elif has_bgm:
            fade_out_st = max(0.0, target_total_dur - config.AUDIO_FADE_DURATION)
            filter_steps.append(
                f"[{idx_bgm}:a]volume=0.35,"
                f"afade=t=in:ss=0:d=0.5,"
                f"afade=t=out:st={fade_out_st:.2f}:d=0.5[aout]"
            )
        else:
            filter_steps.append("aevalsrc=0:d=10[aout]")

        filter_complex_str = ";\n".join(filter_steps)

        # 7. Assemble Command
        cmd = [self.ffmpeg_bin, "-y"]
        for c in resolved_clips:
            cmd.extend(["-i", c["path"]])

        cmd.extend(["-i", str(hl_overlay_png)])

        if has_voice:
            cmd.extend(["-i", voice_path])
        if has_bgm:
            cmd.extend(["-stream_loop", "-1", "-i", bgm_path])

        has_nvenc = self._check_nvenc_available()
        v_codec = "h264_nvenc" if has_nvenc else "libx264"
        codec_params = ["-preset", "fast", "-cq", "22"] if has_nvenc else ["-preset", "fast", "-crf", "21"]

        cmd.extend([
            "-filter_complex", filter_complex_str,
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", v_codec,
            *codec_params,
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-t", f"{target_total_dur:.2f}",
            str(out_file)
        ])

        if progress_callback:
            progress_callback(0.5, "Executing FFmpeg timeline composition...")

        print(f"[VideoComposer] Rendering timeline reel ({target_total_dur:.1f}s, {num_clips} clips) to: {out_file}")
        proc = subprocess.run(
            cmd,
            cwd=str(config.BASE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if proc.returncode != 0:
            print("[Error] Timeline render failed:", proc.stderr[-1000:])
            raise RuntimeError(f"FFmpeg failed with exit code {proc.returncode}:\n{proc.stderr[-500:]}")

        if progress_callback:
            progress_callback(1.0, "Timeline reel rendering complete!")

        print(f"[SUCCESS] Timeline Reel rendered: {out_file} ({out_file.stat().st_size / (1024*1024):.2f} MB)")
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
