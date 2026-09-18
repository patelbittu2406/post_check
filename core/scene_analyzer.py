"""
Scene & Motion Analyzer for CapCut-Style Auto Video Editor
Extracts high-energy, motion-rich micro-segments using PySceneDetect and OpenCV Farneback Optical Flow.
"""

import os
import sys
import math
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np
from scenedetect import detect, ContentDetector, AdaptiveDetector

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import config


class SceneAnalyzer:
    """
    Analyzes raw video clips, detects scene boundaries, scores dense optical flow motion
    and frame sharpness, and extracts top balanced micro-segments.
    """

    def __init__(
        self,
        min_segment_len: float = 1.5,
        max_segment_len: float = 4.0,
        target_segment_len: float = 3.0,
        content_threshold: float = 27.0,
        min_scene_frames: int = 15,
        min_motion_threshold: float = 0.08,
    ):
        self.min_segment_len = min_segment_len
        self.max_segment_len = max_segment_len
        self.target_segment_len = target_segment_len
        self.content_threshold = content_threshold
        self.min_scene_frames = min_scene_frames
        self.min_motion_threshold = min_motion_threshold
        self.ffprobe_bin = config.get_ffprobe_binary()

    def get_clip_duration(self, clip_path: str) -> float:
        """Retrieves exact duration in seconds via ffprobe or cv2 fallback."""
        try:
            cmd = [
                self.ffprobe_bin,
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(clip_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception:
            pass

        try:
            cap = cv2.VideoCapture(str(clip_path))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
            cap.release()
            if frame_count > 0:
                return frame_count / fps
        except Exception:
            pass
        return 10.0

    def detect_clip_scenes(self, clip_path: str) -> List[Tuple[float, float]]:
        """
        Detects scene transitions using PySceneDetect ContentDetector.
        Falls back to sliding windows if single continuous clip or no cuts detected.
        """
        clip_path_str = str(clip_path)
        duration = self.get_clip_duration(clip_path_str)
        if duration <= self.min_segment_len:
            return [(0.0, max(0.5, duration))]

        scenes: List[Tuple[float, float]] = []
        try:
            detector = ContentDetector(
                threshold=self.content_threshold,
                min_scene_len=self.min_scene_frames
            )
            detected = detect(clip_path_str, detector)
            for start_time, end_time in detected:
                s = start_time.get_seconds()
                e = end_time.get_seconds()
                if (e - s) >= self.min_segment_len:
                    scenes.append((s, e))
        except Exception as e:
            print(f"[SceneAnalyzer] PySceneDetect warning on {clip_path}: {e}")

        # If no scenes or only 1 long scene detected, generate sliding window segments
        if len(scenes) < 2:
            step = max(1.5, self.target_segment_len * 0.75)
            window_size = self.target_segment_len
            t = 0.0
            scenes = []
            while t + self.min_segment_len <= duration:
                end_t = min(t + window_size, duration)
                scenes.append((t, end_t))
                t += step

        return scenes

    def score_segment_motion_and_sharpness(
        self,
        clip_path: str,
        start_sec: float,
        end_sec: float,
        sample_fps: float = 5.0
    ) -> Dict[str, Any]:
        """
        Samples frames at sample_fps, calculates Farneback dense optical flow magnitude
        and Laplacian sharpness score.
        """
        cap = cv2.VideoCapture(str(clip_path))
        if not cap.isOpened():
            return {
                "motion_score": 0.5,
                "sharpness_score": 0.5,
                "final_score": 0.5,
                "peak_time": (start_sec + end_sec) / 2.0
            }

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        frame_interval = max(1, int(fps / sample_fps))
        start_frame = int(start_sec * fps)
        end_frame = int(end_sec * fps)

        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        prev_gray = None
        motion_magnitudes = []
        sharpness_values = []
        frame_timestamps = []

        curr_frame_idx = start_frame
        while curr_frame_idx <= end_frame:
            ret, frame = cap.read()
            if not ret:
                break

            if (curr_frame_idx - start_frame) % frame_interval == 0:
                t = curr_frame_idx / fps
                # Downscale frame for fast flow calculation
                h, w = frame.shape[:2]
                small_w = 320
                small_h = int(h * (320 / max(1, w)))
                small_frame = cv2.resize(frame, (small_w, small_h), interpolation=cv2.INTER_LINEAR)
                gray = cv2.cvtColor(small_frame, cv2.COLOR_BGR2GRAY)

                # 1. Sharpness (Variance of Laplacian)
                lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
                sharpness_values.append(lap_var)
                frame_timestamps.append(t)

                # 2. Dense Optical Flow (Farneback)
                if prev_gray is not None:
                    flow = cv2.calcOpticalFlowFarneback(
                        prev_gray, gray, None,
                        pyr_scale=0.5, levels=3, winsize=15,
                        iterations=3, poly_n=5, poly_sigma=1.2, flags=0
                    )
                    mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
                    mean_mag = float(np.mean(mag))
                    motion_magnitudes.append(mean_mag)
                else:
                    motion_magnitudes.append(0.0)

                prev_gray = gray

            curr_frame_idx += 1

        cap.release()

        if not motion_magnitudes:
            return {
                "motion_score": 0.5,
                "sharpness_score": 0.5,
                "final_score": 0.5,
                "peak_time": (start_sec + end_sec) / 2.0
            }

        # Normalize motion score (typical Farneback mean mag 0.2 to 8.0)
        avg_motion = float(np.mean(motion_magnitudes))
        motion_norm = min(1.0, max(0.0, avg_motion / 5.0))

        # Normalize sharpness score (typical Laplacian variance 20 to 500)
        avg_sharpness = float(np.mean(sharpness_values)) if sharpness_values else 50.0
        sharpness_norm = min(1.0, max(0.0, avg_sharpness / 300.0))

        # Peak motion timestamp
        if motion_magnitudes and len(frame_timestamps) == len(motion_magnitudes):
            peak_idx = int(np.argmax(motion_magnitudes))
            peak_time = frame_timestamps[peak_idx]
        else:
            peak_time = (start_sec + end_sec) / 2.0

        final_score = (0.7 * motion_norm) + (0.3 * sharpness_norm)

        return {
            "motion_score": round(motion_norm, 3),
            "sharpness_score": round(sharpness_norm, 3),
            "final_score": round(final_score, 3),
            "peak_time": round(peak_time, 2)
        }

    def trim_around_peak(
        self,
        start_sec: float,
        end_sec: float,
        peak_time: float,
        clip_duration: float,
        target_len: float
    ) -> Tuple[float, float]:
        """Trims a segment to target_len centered around the peak motion timestamp."""
        seg_dur = end_sec - start_sec
        if seg_dur <= target_len:
            return (max(0.0, start_sec), min(clip_duration, end_sec))

        half = target_len / 2.0
        new_start = max(start_sec, peak_time - half)
        new_end = new_start + target_len

        if new_end > end_sec:
            new_end = end_sec
            new_start = max(start_sec, new_end - target_len)

        if new_end > clip_duration:
            new_end = clip_duration
            new_start = max(0.0, new_end - target_len)

        return (round(new_start, 2), round(new_end, 2))

    def analyze_clips(
        self,
        raw_clip_paths: List[str],
        target_total_duration: float = 30.0,
        intensity: str = "balanced"  # "subtle" | "balanced" | "fast_cuts"
    ) -> List[Dict[str, Any]]:
        """
        Main analysis method:
        Extracts, scores, and ranks micro-segments across all input clips.
        Ensures a balanced, high-energy compilation.
        """
        if not raw_clip_paths:
            return []

        # Pacing configuration based on intensity
        if intensity == "fast_cuts":
            target_seg_len = 2.0
            min_seg = 1.2
            max_seg = 2.8
        elif intensity == "subtle":
            target_seg_len = 3.5
            min_seg = 2.0
            max_seg = 4.5
        else:  # balanced
            target_seg_len = 3.0
            min_seg = 1.5
            max_seg = 3.8

        all_candidates_by_clip: Dict[str, List[Dict[str, Any]]] = {}

        for clip in raw_clip_paths:
            p = str(Path(clip).resolve())
            if not Path(p).exists():
                continue

            duration = self.get_clip_duration(p)
            scenes = self.detect_clip_scenes(p)
            candidates = []

            for s_start, s_end in scenes:
                # Score motion and sharpness
                score_data = self.score_segment_motion_and_sharpness(p, s_start, s_end)
                
                # Trim window centered on peak motion
                trim_s, trim_e = self.trim_around_peak(
                    s_start, s_end,
                    score_data["peak_time"],
                    duration,
                    target_seg_len
                )

                seg_dur = trim_e - trim_s
                if seg_dur >= min_seg:
                    candidates.append({
                        "clip_path": p,
                        "clip_name": Path(p).name,
                        "start": trim_s,
                        "end": trim_e,
                        "duration": round(seg_dur, 2),
                        "score": score_data["final_score"],
                        "motion_score": score_data["motion_score"],
                        "sharpness_score": score_data["sharpness_score"],
                        "peak_time": score_data["peak_time"],
                        "type": "high_motion" if score_data["motion_score"] > 0.4 else "scene_cut"
                    })

            # Sort candidates by score descending
            candidates.sort(key=lambda x: x["score"], reverse=True)
            all_candidates_by_clip[p] = candidates

        # Determine number of segments needed
        num_segments_needed = max(4, int(math.ceil(target_total_duration / target_seg_len)) + 2)

        # Balanced round-robin selection from all clips
        selected_segments: List[Dict[str, Any]] = []
        clip_list = [c for c in raw_clip_paths if str(Path(c).resolve()) in all_candidates_by_clip]
        if not clip_list:
            clip_list = list(all_candidates_by_clip.keys())

        clip_pointers = {c: 0 for c in clip_list}
        accumulated_duration = 0.0

        round_idx = 0
        while accumulated_duration < (target_total_duration + 5.0) and round_idx < 50:
            added_any = False
            for c in clip_list:
                candidates = all_candidates_by_clip.get(str(Path(c).resolve()), [])
                ptr = clip_pointers[c]
                if ptr < len(candidates):
                    cand = candidates[ptr]
                    clip_pointers[c] += 1
                    selected_segments.append(dict(cand))
                    accumulated_duration += cand["duration"]
                    added_any = True
                    if accumulated_duration >= (target_total_duration + 6.0):
                        break
            round_idx += 1
            if not added_any:
                # If clips ran out of unique scenes, loop back through top ones with offset
                for c in clip_list:
                    candidates = all_candidates_by_clip.get(str(Path(c).resolve()), [])
                    if candidates:
                        cand = dict(candidates[0])
                        selected_segments.append(cand)
                        accumulated_duration += cand["duration"]
                        if accumulated_duration >= (target_total_duration + 6.0):
                            break
                break

        # If still empty, create default fallback segments
        if not selected_segments and raw_clip_paths:
            for p in raw_clip_paths:
                dur = self.get_clip_duration(p)
                selected_segments.append({
                    "clip_path": str(Path(p).resolve()),
                    "clip_name": Path(p).name,
                    "start": 0.0,
                    "end": min(dur, target_seg_len),
                    "duration": min(dur, target_seg_len),
                    "score": 0.5,
                    "motion_score": 0.5,
                    "sharpness_score": 0.5,
                    "peak_time": min(dur, target_seg_len) / 2.0,
                    "type": "fallback"
                })

        return selected_segments
