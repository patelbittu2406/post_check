"""
Asset Generator
Generates broadcast background music (.mp3) and a 1080x1920 sample B-roll motion video
featuring a sleek Surat news backdrop.
"""

import math
import wave
import struct
import subprocess
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from PIL import Image, ImageDraw, ImageFont

import config

def generate_sample_bgm():
    """Generates a clean, subtle 30-second news beat audio loop."""
    audio_path = config.AUDIO_DIR / "surat_news_bgm.wav"
    mp3_path = config.AUDIO_DIR / "surat_news_bgm.mp3"

    sample_rate = 44100
    duration = 30.0  # seconds
    total_samples = int(sample_rate * duration)

    print("[Assets] Generating ambient news background audio...")
    with wave.open(str(audio_path), "w") as wav_file:
        wav_file.setnchannels(2)  # Stereo
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)

        # Generate a gentle synth pad / bass rhythm
        bpm = 110
        beat_interval = 60.0 / bpm
        frames = []

        for i in range(total_samples):
            t = i / sample_rate
            
            # Subtle low bass pulse on quarter notes
            beat_pos = (t % beat_interval) / beat_interval
            pulse = math.exp(-beat_pos * 8.0)
            bass = math.sin(2 * math.pi * 110.0 * t) * pulse * 0.35

            # Warm chord pad (F# minor chords: F#3, A3, C#4)
            pad1 = math.sin(2 * math.pi * 185.0 * t) * 0.15
            pad2 = math.sin(2 * math.pi * 220.0 * t) * 0.12
            pad3 = math.sin(2 * math.pi * 277.18 * t) * 0.10
            pad = (pad1 + pad2 + pad3) * (0.8 + 0.2 * math.sin(2 * math.pi * 0.2 * t))

            # Light ticker high-hat click on 8th notes
            tick_pos = (t % (beat_interval / 2)) / (beat_interval / 2)
            tick = math.exp(-tick_pos * 25.0) * 0.08

            val = bass + pad + tick
            sample_val = int(max(-32767, min(32767, val * 32767 * 0.5)))
            frames.append(struct.pack("<hh", sample_val, sample_val))

            if len(frames) >= 4096:
                wav_file.writeframes(b"".join(frames))
                frames = []

        if frames:
            wav_file.writeframes(b"".join(frames))

    # Convert to MP3
    ffmpeg_bin = config.get_ffmpeg_binary()
    subprocess.run([
        ffmpeg_bin, "-y", "-i", str(audio_path),
        "-codec:a", "libmp3lame", "-qscale:a", "2",
        str(mp3_path)
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if audio_path.exists():
        audio_path.unlink()
    print(f"[Assets] Created sample BGM at: {mp3_path}")
    return mp3_path


def generate_sample_broll():
    """Generates a 15-second 1080x1920 B-roll motion video representing Surat."""
    broll_video = config.BROLL_DIR / "surat_city_loop.mp4"
    if broll_video.exists() and broll_video.stat().st_size > 100000:
        return broll_video

    print("[Assets] Generating 1080x1920 sample B-roll motion video...")
    temp_frame = config.ASSETS_DIR / "temp_broll_frame.png"

    # Create a 1080x1920 graphic backdrop
    img = Image.new("RGB", (1080, 1920), color=(15, 23, 42))  # Deep slate
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(1920):
        r = int(15 + (y / 1920) * 20)
        g = int(23 + (y / 1920) * 35)
        b = int(42 + (y / 1920) * 60)
        draw.line([(0, y), (1080, y)], fill=(r, g, b))

    # Geometric grid lines / city tech aesthetic
    for x in range(0, 1080, 80):
        draw.line([(x, 0), (x, 1920)], fill=(30, 41, 59), width=1)
    for y in range(0, 1920, 80):
        draw.line([(0, y), (1080, y)], fill=(30, 41, 59), width=1)

    # Central watermark / skyline silhouette
    draw.rectangle([(120, 700), (960, 1220)], fill=(24, 34, 60), outline=(56, 189, 248), width=3)
    draw.text((200, 880), "SURAT HYPERLOCAL NEWS", fill=(255, 255, 255))
    draw.text((260, 960), "DIGITAL BROADCAST ENGINE", fill=(148, 163, 184))

    img.save(temp_frame)

    # Use FFmpeg to create a slow-moving zoom/pan video from image
    ffmpeg_bin = config.get_ffmpeg_binary()
    cmd = [
        ffmpeg_bin, "-y",
        "-loop", "1",
        "-i", str(temp_frame),
        "-vf", "scale=1080:1920,zoompan=z='min(zoom+0.0015,1.2)':d=375:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25",
        "-t", "15",
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-preset", "fast",
        str(broll_video)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if temp_frame.exists():
        temp_frame.unlink()

    print(f"[Assets] Created sample B-roll at: {broll_video}")
    return broll_video


def generate_sample_user_clips():
    """Ensures high-quality 1080x1920 sample video clips with distinct motion in assets/user_clips/."""
    ffmpeg_bin = config.get_ffmpeg_binary()
    clips_info = [
        ("vesu_traffic_clip.mp4", "assets/user_clips/vesu_traffic_clip.mp4"),
        ("adajan_rain_clip.mp4", "assets/user_clips/adajan_rain_clip.mp4"),
        ("diamond_bourse_clip.mp4", "assets/user_clips/diamond_bourse_clip.mp4"),
        ("ganesh_utsav_clip.mp4", "assets/user_clips/ganesh_utsav_clip.mp4"),
    ]

    generated = []
    for filename, rel_path in clips_info:
        clip_path = config.USER_CLIPS_DIR / filename
        if clip_path.exists() and clip_path.stat().st_size > 100000:
            generated.append(str(clip_path))
            continue
        # Fallback if clip missing: create smooth gradient news background
        cmd = [
            ffmpeg_bin, "-y",
            "-f", "lavfi", "-i", "color=c=0x0a192f:s=1080x1920:d=15:r=30",
            "-vf", "drawbox=x=0:y=0:w=1080:h=1920:color=0x1e3a8a@0.4:t=fill",
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            str(clip_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        print(f"[Assets] Generated sample user clip: {clip_path}")
        generated.append(str(clip_path))

    return generated



if __name__ == "__main__":
    generate_sample_bgm()
    generate_sample_broll()
    generate_sample_user_clips()

