"""
Smart 9:16 Framing & Auto-Cropping Engine for CapCut-Style Auto Video Editor
Analyzes video frames with OpenCV Face Detection (Haar Cascade) & Saliency
to intelligently frame subjects at rule-of-thirds (1080x1920) without awkward cuts.
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

import cv2
import numpy as np

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import config


class SmartFramer:
    """
    Subject-aware 9:16 vertical crop generator.
    Detects faces and visual saliency to position subjects at rule-of-thirds.
    """

    def __init__(self, target_width: int = 1080, target_height: int = 1920):
        self.target_w = target_width
        self.target_h = target_height
        self.target_aspect = target_width / target_height  # 9/16 = 0.5625

        # Load Haar Cascade face classifier with safe fallback
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            self.face_cascade = None


    def analyze_frame_subject(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyzes a single frame for face position or saliency centroid.
        Returns normalized coordinates (0.0 to 1.0) of the main subject.
        """
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # 1. Face Detection
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(int(w * 0.08), int(h * 0.08))
        )

        if len(faces) > 0:
            # Pick the largest face detected
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            fx, fy, fw, fh = largest_face
            center_x = (fx + fw / 2.0) / w
            center_y = (fy + fh / 2.0) / h
            return {
                "detected": True,
                "type": "face",
                "center_x": float(center_x),
                "center_y": float(center_y),
                "box": [float(fx / w), float(fy / h), float(fw / w), float(fh / h)]
            }

        # 2. Visual Saliency / Edge Centroid Fallback
        edges = cv2.Canny(gray, 50, 150)
        moments = cv2.moments(edges)
        if moments["m00"] > 0:
            cx = float(moments["m10"] / moments["m00"]) / w
            cy = float(moments["m01"] / moments["m00"]) / h
            return {
                "detected": True,
                "type": "saliency",
                "center_x": float(np.clip(cx, 0.2, 0.8)),
                "center_y": float(np.clip(cy, 0.2, 0.8)),
                "box": None
            }

        # 3. Center Fallback
        return {
            "detected": False,
            "type": "center",
            "center_x": 0.5,
            "center_y": 0.5,
            "box": None
        }

    def compute_segment_framing(
        self,
        clip_path: str,
        start_sec: float,
        end_sec: float
    ) -> Dict[str, Any]:
        """
        Samples the middle frame and quarter frames of a segment to determine
        the optimal crop centering offset.
        """
        cap = cv2.VideoCapture(str(clip_path))
        if not cap.isOpened():
            return {"crop_x_percent": 0.5, "crop_y_percent": 0.33, "type": "center"}

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080

        # Sample at midpoint
        mid_time = (start_sec + end_sec) / 2.0
        mid_frame_idx = int(mid_time * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, mid_frame_idx)
        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            return {"crop_x_percent": 0.5, "crop_y_percent": 0.33, "type": "center"}

        subject_info = self.analyze_frame_subject(frame)
        cx = subject_info["center_x"]
        cy = subject_info["center_y"]

        # Rule of thirds adjustment:
        # If face detected, place face center slightly above mid-height (~35% from top)
        if subject_info["type"] == "face":
            target_y_center = 0.35
        else:
            target_y_center = 0.50

        return {
            "orig_width": width,
            "orig_height": height,
            "subject_center_x": cx,
            "subject_center_y": cy,
            "crop_x_percent": round(cx, 3),
            "crop_y_percent": round(target_y_center, 3),
            "framing_type": subject_info["type"]
        }

    def generate_ffmpeg_crop_filter(
        self,
        framing_info: Dict[str, Any],
        target_w: int = 1080,
        target_h: int = 1920
    ) -> str:
        """
        Builds a safe, high-performance FFmpeg scale+crop filter string
        that guarantees 1080x1920 9:16 output with subject centering.
        """
        cx = framing_info.get("crop_x_percent", 0.5)
        cy = framing_info.get("crop_y_percent", 0.5)

        # Scale so that video fills the entire 1080x1920 canvas
        # crop: x offset dynamic based on subject center
        scale_filter = f"scale={target_w}:{target_h}:force_original_aspect_ratio=increase"
        crop_filter = f"crop={target_w}:{target_h}:x=(in_w-{target_w})*{cx:.3f}:y=(in_h-{target_h})*{cy:.3f}"

        return f"{scale_filter},{crop_filter}"

