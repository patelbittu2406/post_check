"""
Motion & Dynamic Ken Burns Effects Engine for CapCut-Style Auto Video Editor
Generates smooth Ken Burns zoom-in, zoom-out, pan-left, pan-right, and punch-flash FFmpeg filters.
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import config


class MotionEffectsEngine:
    """
    Constructs high-aesthetic FFmpeg motion filters for vertical 1080x1920 video.
    Supports Zoom In, Zoom Out, Pan Left, Pan Right, and Punch + White Flash entry.
    """

    def __init__(self, fps: int = 30, width: int = 1080, height: int = 1920):
        self.fps = fps
        self.width = width
        self.height = height

    def get_motion_params(self, intensity: str = "balanced") -> Dict[str, Any]:
        """Returns zoom and pan speed configurations based on intensity level."""
        if intensity == "fast_cuts":
            return {
                "max_zoom": 1.15,
                "zoom_speed": 0.0022,
                "pan_range": 0.15,
                "flash_dur": 0.18,
            }
        elif intensity == "subtle":
            return {
                "max_zoom": 1.06,
                "zoom_speed": 0.0008,
                "pan_range": 0.08,
                "flash_dur": 0.12,
            }
        else:  # balanced
            return {
                "max_zoom": 1.10,
                "zoom_speed": 0.0014,
                "pan_range": 0.10,
                "flash_dur": 0.15,
            }

    def build_segment_filter(
        self,
        motion_type: str,
        duration: float,
        intensity: str = "balanced",
        crop_filter: Optional[str] = None
    ) -> str:
        """
        Generates the combined FFmpeg video filter chain for a single segment:
        [Input] -> Scale/Crop -> Ken Burns Motion / Pan -> Flash / Color -> 1080x1920 @ 30fps
        """
        frames = max(1, int(round(duration * self.fps)))
        params = self.get_motion_params(intensity)
        max_z = params["max_zoom"]
        z_speed = params["zoom_speed"]
        flash_d = params["flash_dur"]

        # Base scale and crop to ensure 1080x1920
        if crop_filter:
            base_prep = crop_filter
        else:
            base_prep = f"scale={self.width}:{self.height}:force_original_aspect_ratio=increase,crop={self.width}:{self.height}"

        # Build motion filter
        if motion_type == "zoom_in":
            # Smooth zoom in from 1.0 to max_z centered
            motion_str = (
                f"zoompan=z='min(zoom+{z_speed:.5f},{max_z:.2f})':"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={self.width}x{self.height}:fps={self.fps}"
            )
            filter_chain = f"{base_prep},{motion_str}"

        elif motion_type == "zoom_out":
            # Smooth zoom out from max_z to 1.0 centered
            motion_str = (
                f"zoompan=z='if(lte(zoom,1.0),{max_z:.2f},max(1.001,zoom-{z_speed:.5f}))':"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={self.width}x{self.height}:fps={self.fps}"
            )
            filter_chain = f"{base_prep},{motion_str}"

        elif motion_type == "pan_left":
            # Constant slight zoom (1.08) panning from right to left
            pan_z = max(1.08, max_z * 0.95)
            motion_str = (
                f"zoompan=z={pan_z:.2f}:"
                f"x='(iw-iw/zoom)*(1-on/{frames})':y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={self.width}x{self.height}:fps={self.fps}"
            )
            filter_chain = f"{base_prep},{motion_str}"

        elif motion_type == "pan_right":
            # Constant slight zoom (1.08) panning from left to right
            pan_z = max(1.08, max_z * 0.95)
            motion_str = (
                f"zoompan=z={pan_z:.2f}:"
                f"x='(iw-iw/zoom)*(on/{frames})':y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={self.width}x{self.height}:fps={self.fps}"
            )
            filter_chain = f"{base_prep},{motion_str}"

        elif motion_type == "punch_flash":

            # Zoom in + 0.15s white flash transition entry
            motion_str = (
                f"zoompan=z='min(zoom+{z_speed * 1.5:.5f},{max_z * 1.05:.2f})':"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"d={frames}:s={self.width}x{self.height}:fps={self.fps}"
            )
            flash_filter = f"fade=t=in:st=0:d={flash_d:.2f}:color=white"
            filter_chain = f"{base_prep},{motion_str},{flash_filter}"

        else:  # static / fallback
            filter_chain = f"{base_prep},fps={self.fps}"

        return filter_chain
