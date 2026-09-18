"""
Beat & Rhythm Synchronization Engine for CapCut-Style Auto Video Editor
Extracts musical BPM, beat grids, downbeat accents, voiceover speech pauses,
and accurately snaps video segment cuts to the audio pulse.
"""

import os
import sys
import math
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import numpy as np
import librosa
from pydub import AudioSegment
from pydub.silence import detect_silence

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import config


class BeatSyncEngine:
    """
    Rhythm alignment engine utilizing Librosa onset tracking and Pydub silence extraction
    to snap cuts strictly to musical beats and speech pauses.
    """

    def __init__(
        self,
        snap_tolerance: float = 0.35,
        min_segment_dur: float = 1.5,
        max_segment_dur: float = 4.5,
    ):
        self.snap_tolerance = snap_tolerance
        self.min_segment_dur = min_segment_dur
        self.max_segment_dur = max_segment_dur
        self.ffprobe_bin = config.get_ffprobe_binary()

    def get_audio_duration(self, audio_path: str) -> float:
        """Extracts audio file duration in seconds."""
        try:
            cmd = [
                self.ffprobe_bin,
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(audio_path)
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode == 0 and res.stdout.strip():
                return float(res.stdout.strip())
        except Exception:
            pass
        return 30.0

    def detect_beats_and_pauses(
        self,
        bg_music_path: Optional[str] = None,
        voiceover_path: Optional[str] = None,
        target_duration: float = 30.0
    ) -> Dict[str, Any]:
        """
        Analyzes BGM for tempo (BPM), beat frames, and downbeat accents.
        Analyzes voiceover for sentence pauses and boundary cuts.
        """
        tempo_bpm = 120.0
        beat_times: List[float] = []
        downbeat_times: List[float] = []
        pause_times: List[float] = []

        # 1. BGM Beat Tracking via Librosa
        if bg_music_path and Path(bg_music_path).exists():
            try:
                y, sr = librosa.load(str(bg_music_path), sr=22050, mono=True)
                duration = librosa.get_duration(y=y, sr=sr)
                
                # Beat tracking
                tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='frames')
                if isinstance(tempo, np.ndarray):
                    tempo = float(tempo[0]) if len(tempo) > 0 else 120.0
                tempo_bpm = float(tempo)
                
                b_times = librosa.frames_to_time(beat_frames, sr=sr)
                beat_times = [round(float(t), 3) for t in b_times if t <= (target_duration + 5.0)]

                # Downbeat detection (bar accents every 4 beats)
                if len(beat_times) >= 4:
                    downbeat_times = [beat_times[i] for i in range(0, len(beat_times), 4)]
                else:
                    downbeat_times = list(beat_times)
            except Exception as e:
                print(f"[BeatSyncEngine] Librosa beat detection warning: {e}")
                # Fallback synthetic 120 BPM grid
                interval = 60.0 / 120.0
                beat_times = [round(i * interval, 3) for i in range(int(target_duration / interval) + 4)]
                downbeat_times = beat_times[::4]
        else:
            # Synthetic 120 BPM grid fallback
            interval = 60.0 / 120.0
            beat_times = [round(i * interval, 3) for i in range(int(target_duration / interval) + 4)]
            downbeat_times = beat_times[::4]

        # 2. Voiceover Pause Detection via Pydub
        if voiceover_path and Path(voiceover_path).exists():
            try:
                ext = Path(voiceover_path).suffix.lower().lstrip(".")
                audio = AudioSegment.from_file(str(voiceover_path), format=ext if ext in ["wav", "mp3", "ogg"] else "wav")
                # Detect silence >= 250ms with threshold -36 dBFS
                silences = detect_silence(audio, min_silence_len=250, silence_thresh=-36)
                for s_start, s_end in silences:
                    mid_pause = (s_start + s_end) / 2000.0  # convert ms to sec
                    if mid_pause > 0.5 and mid_pause <= (target_duration + 5.0):
                        pause_times.append(round(mid_pause, 3))
            except Exception as e:
                print(f"[BeatSyncEngine] Pydub pause detection warning: {e}")

        # 3. Create Unified Cut Candidates
        all_cuts = []
        for d in downbeat_times:
            all_cuts.append({"time": d, "type": "downbeat", "priority": 1})
        for p in pause_times:
            all_cuts.append({"time": p, "type": "pause", "priority": 2})
        for b in beat_times:
            if not any(abs(b - d) < 0.1 for d in downbeat_times):
                all_cuts.append({"time": b, "type": "beat", "priority": 3})

        all_cuts.sort(key=lambda x: x["time"])

        return {
            "tempo_bpm": round(tempo_bpm, 1),
            "beat_times": beat_times,
            "downbeat_times": downbeat_times,
            "pause_times": pause_times,
            "cut_candidates": all_cuts,
        }

    def snap_cuts_to_beats(
        self,
        segments: List[Dict[str, Any]],
        audio_info: Dict[str, Any],
        target_duration: float = 30.0,
        sync_to_beats: bool = True,
        motion_intensity: str = "balanced",
        transition_style: str = "auto"
    ) -> List[Dict[str, Any]]:
        """
        Takes raw candidate segments and snaps cut boundaries to downbeats and pauses.
        Assigns Ken Burns motion types and transition styles cyclically.
        """
        if not segments:
            return []

        candidates = audio_info.get("cut_candidates", [])
        downbeats = set(audio_info.get("downbeat_times", []))
        pauses = set(audio_info.get("pause_times", []))

        # Motion effect sequence cycle
        motion_cycle = ["zoom_in", "zoom_out", "pan_left", "pan_right", "punch_flash", "zoom_in", "zoom_out"]
        
        # Transition cycle
        if transition_style == "smooth":
            trans_cycle = ["dissolve", "dissolve", "whip_left", "dissolve"]
        elif transition_style == "punchy":
            trans_cycle = ["whip_left", "flash", "whip_right", "hard_cut", "dissolve"]
        else:  # auto
            trans_cycle = ["dissolve", "whip_left", "flash", "dissolve", "whip_right", "hard_cut"]

        timeline_segments: List[Dict[str, Any]] = []
        current_time = 0.0
        seg_idx = 0

        while current_time < target_duration and seg_idx < len(segments):
            seg = segments[seg_idx]
            raw_dur = seg.get("duration", 3.0)
            
            # Target cut timestamp before snapping
            target_cut = current_time + raw_dur
            snapped_cut = target_cut
            is_downbeat_cut = False
            is_pause_cut = False

            if sync_to_beats and candidates:
                # Find nearest cut candidate within snap_tolerance
                best_cand = None
                min_diff = self.snap_tolerance

                for cand in candidates:
                    cand_time = cand["time"]
                    if cand_time <= current_time + self.min_segment_dur:
                        continue
                    diff = abs(cand_time - target_cut)
                    if diff < min_diff:
                        # Prioritize downbeats and pauses
                        min_diff = diff
                        best_cand = cand

                if best_cand:
                    snapped_cut = best_cand["time"]
                    if best_cand["type"] == "downbeat":
                        is_downbeat_cut = True
                    elif best_cand["type"] == "pause":
                        is_pause_cut = True
                else:
                    # Fallback to nearest 0.5s grid
                    snapped_cut = round(target_cut * 2.0) / 2.0
            else:
                snapped_cut = round(target_cut * 2.0) / 2.0

            # Ensure minimum segment duration
            seg_dur = max(self.min_segment_dur, snapped_cut - current_time)
            
            # Cap at target duration if nearing the end
            if current_time + seg_dur > target_duration + 0.5:
                seg_dur = max(self.min_segment_dur, target_duration - current_time)
                snapped_cut = current_time + seg_dur

            # Source clip start/end adjustment
            src_start = seg.get("start", 0.0)
            src_end = src_start + seg_dur

            # Select motion type
            motion_type = motion_cycle[seg_idx % len(motion_cycle)]
            if motion_intensity == "subtle" and motion_type == "punch_flash":
                motion_type = "zoom_in"

            # Select contextual transition
            if is_downbeat_cut:
                trans_out = "whip_left" if (seg_idx % 2 == 0) else "flash"
            elif is_pause_cut:
                trans_out = "dissolve"
            else:
                trans_out = trans_cycle[seg_idx % len(trans_cycle)]

            trans_in = timeline_segments[-1]["transition_out"] if timeline_segments else "none"

            timeline_seg = {
                "index": seg_idx,
                "clip_path": seg["clip_path"],
                "clip_name": seg.get("clip_name", Path(seg["clip_path"]).name),
                "source_start": round(src_start, 2),
                "source_end": round(src_end, 2),
                "timeline_start": round(current_time, 2),
                "timeline_end": round(current_time + seg_dur, 2),
                "duration": round(seg_dur, 2),
                "motion_type": motion_type,
                "transition_in": trans_in,
                "transition_out": trans_out,
                "is_downbeat": is_downbeat_cut,
                "score": seg.get("score", 0.5),
                "motion_score": seg.get("motion_score", 0.5),
            }

            timeline_segments.append(timeline_seg)
            current_time += seg_dur
            seg_idx += 1

            if current_time >= target_duration:
                break

        # Adjust final segment duration if slight duration drift
        if timeline_segments:
            final_seg = timeline_segments[-1]
            drift = target_duration - final_seg["timeline_end"]
            if abs(drift) > 0.1 and (final_seg["duration"] + drift) >= self.min_segment_dur:
                final_seg["timeline_end"] = round(target_duration, 2)
                final_seg["duration"] = round(final_seg["timeline_end"] - final_seg["timeline_start"], 2)
                final_seg["source_end"] = round(final_seg["source_start"] + final_seg["duration"], 2)
            final_seg["transition_out"] = "none"

        return timeline_segments
