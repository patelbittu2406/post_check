"""
Transition Engine for CapCut-Style Auto Video Editor
Constructs chained multi-input FFmpeg xfade filtergraphs for cross-dissolves, whip pans, white flashes, and hard cuts.
"""

import os
import sys
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import config


class TransitionEngine:
    """
    Manages multi-segment xfade transitions with exact cumulative offset calculations
    and FFmpeg command execution.
    """

    TRANSITION_MAP = {
        "dissolve": {"xfade": "fade", "duration": 0.40},
        "whip_left": {"xfade": "slideleft", "duration": 0.30},
        "whip_right": {"xfade": "slideright", "duration": 0.30},
        "flash": {"xfade": "fadewhite", "duration": 0.20},
        "wipe_left": {"xfade": "wipeleft", "duration": 0.30},
        "wipe_right": {"xfade": "wiperight", "duration": 0.30},
        "zoom_in": {"xfade": "zoomin", "duration": 0.35},
        "hard_cut": {"xfade": "fade", "duration": 0.04},  # virtually instant
        "none": {"xfade": "fade", "duration": 0.04},
    }

    def __init__(self):
        self.ffmpeg_bin = config.get_ffmpeg_binary()

    def get_transition_spec(self, transition_name: str) -> Dict[str, Any]:
        """Returns xfade transition filter name and duration."""
        name = (transition_name or "dissolve").lower().strip()
        return self.TRANSITION_MAP.get(name, self.TRANSITION_MAP["dissolve"])

    def build_xfade_filtergraph(
        self,
        segment_durations: List[float],
        transition_names: List[str]
    ) -> Tuple[str, str, float]:
        """
        Builds the FFmpeg complex filter graph for N input clips.
        Returns:
            filter_complex_str: Chained xfade expression
            final_output_label: "[vfinal]"
            total_duration: Exact resulting duration after overlaps
        """
        n = len(segment_durations)
        if n == 0:
            return "", "", 0.0
        if n == 1:
            return "[0:v]copy[vfinal]", "[vfinal]", segment_durations[0]

        filter_steps = []
        last_label = "[0:v]"
        accum_offset = 0.0

        for i in range(n - 1):
            curr_dur = segment_durations[i]
            trans_name = transition_names[i] if i < len(transition_names) else "dissolve"
            trans_spec = self.get_transition_spec(trans_name)
            
            t_name = trans_spec["xfade"]
            t_dur = min(trans_spec["duration"], curr_dur * 0.45)  # never exceed half segment

            if i == 0:
                accum_offset = curr_dur - t_dur
            else:
                accum_offset = accum_offset + curr_dur - t_dur

            accum_offset = max(0.1, accum_offset)
            next_label = f"[v{i+1:02d}]" if i < n - 2 else "[vfinal]"

            step = (
                f"{last_label}[{i+1}:v]xfade="
                f"transition={t_name}:duration={t_dur:.2f}:offset={accum_offset:.2f}"
                f"{next_label}"
            )
            filter_steps.append(step)
            last_label = next_label

        total_duration = accum_offset + segment_durations[-1]
        filter_complex = ";\n".join(filter_steps)

        return filter_complex, "[vfinal]", total_duration

    def render_xfade_montage(
        self,
        segment_paths: List[str],
        segment_durations: List[float],
        transition_names: List[str],
        output_video_path: str
    ) -> str:
        """
        Takes N prepared segment video files and renders them into a single seamless
        video file with xfade transitions applied.
        """
        out_path = Path(output_video_path).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)

        n = len(segment_paths)
        if n == 0:
            raise ValueError("No segments provided to render_xfade_montage")

        if n == 1:
            # Simple copy/re-encode
            cmd = [
                self.ffmpeg_bin, "-y",
                "-i", str(segment_paths[0]),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "fast",
                "-r", "30",
                str(out_path)
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            return str(out_path)

        filter_graph, final_label, _ = self.build_xfade_filtergraph(segment_durations, transition_names)

        # Build FFmpeg command with N inputs
        cmd = [self.ffmpeg_bin, "-y"]
        for p in segment_paths:
            cmd.extend(["-i", str(p)])

        cmd.extend([
            "-filter_complex", filter_graph,
            "-map", final_label,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-r", "30",
            "-an",
            str(out_path)
        ])

        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode != 0:
            print(f"[TransitionEngine] FFmpeg xfade failed, falling back to concat demuxer: {res.stderr}")
            return self._fallback_concat_demuxer(segment_paths, out_path)

        return str(out_path)

    def _fallback_concat_demuxer(self, segment_paths: List[str], output_path: Path) -> str:
        """Robust fallback if xfade filter graph fails due to any reason."""
        temp_txt = output_path.parent / f"concat_{os.getpid()}.txt"
        with open(temp_txt, "w") as f:
            for p in segment_paths:
                f.write(f"file '{Path(p).resolve()}'\n")

        cmd = [
            self.ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(temp_txt),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "fast",
            "-r", "30",
            "-an",
            str(output_path)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if temp_txt.exists():
            temp_txt.unlink()
        return str(output_path)
