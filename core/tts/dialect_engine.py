"""
Dialect & Phonology Engine
==========================
Transforms normalized Gujarati text into authentic regional dialect realization
and extracts regional prosody/acoustic parameters.
Supported Accents:
- standard: Neutral formal Gujarati broadcast
- kathiyawadi: Saurashtra verb contractions, cadence, resonant low-mid presence
- mahesani: North Gujarat palatal & sibilant shifts (છે->શે, ક્યાં->ચ્યાં), brisk tempo
- surati: South Gujarat melodic cadence, relaxed tempo, elongated vowel glides
- news_anchor: High-velocity broadcast anchor delivery with dynamic presence
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROFILES_DIR = Path(__file__).resolve().parent / "accent_profiles"
VOICES_CONFIG = Path(__file__).resolve().parent / "voices.json"


@dataclass
class AccentProfile:
    id: str
    language: str
    display_name: str
    speech_rate: float
    pitch_multiplier: float
    pause_multiplier: float
    noise_scale: float
    noise_scale_dur: float
    equalizer: Dict[str, float]
    prosody_rules: Dict[str, Any]
    pronunciation_rules: List[Dict[str, str]] = field(default_factory=list)
    vocabulary_overrides: List[Dict[str, str]] = field(default_factory=list)


class DialectEngine:
    """Manages linguistic profiles and applies regional transformations."""

    def __init__(self, profiles_dir: Optional[Path] = None):
        self.profiles_dir = Path(profiles_dir or PROFILES_DIR)
        self.profiles: Dict[str, AccentProfile] = {}
        self.voice_map: Dict[str, str] = {}  # voice_id -> accent_id
        self._load_profiles()
        self._load_voices_config()

    def _load_profiles(self):
        if not self.profiles_dir.exists():
            return
        for json_file in self.profiles_dir.glob("*.json"):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    profile = AccentProfile(
                        id=data["id"],
                        language=data.get("language", "gu-IN"),
                        display_name=data.get("displayName", data["id"]),
                        speech_rate=float(data.get("speechRate", 1.0)),
                        pitch_multiplier=float(data.get("pitchMultiplier", 1.0)),
                        pause_multiplier=float(data.get("pauseMultiplier", 1.0)),
                        noise_scale=float(data.get("noiseScale", 0.667)),
                        noise_scale_dur=float(data.get("noiseScaleDur", 0.8)),
                        equalizer=data.get("equalizer", {"lowGainDb": 0.0, "midGainDb": 0.0, "highGainDb": 0.0}),
                        prosody_rules=data.get("prosodyRules", {}),
                        pronunciation_rules=data.get("pronunciationRules", []),
                        vocabulary_overrides=data.get("vocabularyOverrides", [])
                    )
                    self.profiles[profile.id] = profile
            except Exception as e:
                print(f"[DialectEngine] Error loading profile {json_file.name}: {e}")

    def _load_voices_config(self):
        if VOICES_CONFIG.exists():
            try:
                with open(VOICES_CONFIG, "r", encoding="utf-8") as f:
                    voices = json.load(f)
                    for v in voices:
                        self.voice_map[v["id"]] = v.get("accent", "standard")
            except Exception as e:
                print(f"[DialectEngine] Error loading voices.json: {e}")

    def get_profile(self, voice_or_accent_id: str) -> AccentProfile:
        # Normalize: replace hyphens with underscores, strip gu-
        raw_id = self.voice_map.get(voice_or_accent_id, voice_or_accent_id).lower()
        if raw_id.startswith("gu-"):
            raw_id = raw_id[3:]
        raw_id = raw_id.replace("-", "_")

        if raw_id in self.profiles:
            return self.profiles[raw_id]
        if "standard" in self.profiles:
            return self.profiles["standard"]
        return AccentProfile(
            id="standard", language="gu-IN", display_name="Standard",
            speech_rate=1.0, pitch_multiplier=1.0, pause_multiplier=1.0,
            noise_scale=0.667, noise_scale_dur=0.8,
            equalizer={"lowGainDb": 0.0, "midGainDb": 0.0, "highGainDb": 0.0},
            prosody_rules={}
        )

    def _apply_gujarati_boundary(self, pat: str) -> str:
        """Replaces leading and trailing \\b with Gujarati Unicode boundaries."""
        p = pat
        if p.startswith(r"\b"):
            p = r"(?<![\u0A80-\u0AFF])" + p[2:]
        if p.endswith(r"\b"):
            p = p[:-2] + r"(?![\u0A80-\u0AFF])"
        return p

    def transform_text(self, text: str, voice_or_accent_id: str) -> Tuple[str, AccentProfile]:
        """
        Transforms text using regional vocabulary and pronunciation rules.
        Returns: (transformed_text, accent_profile)
        """
        profile = self.get_profile(voice_or_accent_id)
        result = text

        # 1. Apply vocabulary overrides
        for item in profile.vocabulary_overrides:
            src = item.get("source")
            tgt = item.get("target")
            if src and tgt:
                pat = rf"(?<![\u0A80-\u0AFF]){re.escape(src)}(?![\u0A80-\u0AFF])"
                result = re.sub(pat, tgt, result)

        # 2. Apply pronunciation & phonological rules
        for rule in profile.pronunciation_rules:
            pat = rule.get("pattern")
            repl = rule.get("replacement")
            if pat and repl is not None:
                try:
                    adapted_pat = self._apply_gujarati_boundary(pat)
                    result = re.sub(adapted_pat, repl, result)
                except Exception as e:
                    print(f"[DialectEngine] Rule error for {pat}: {e}")

        # Clean multiple spaces
        result = re.sub(r"\s+", " ", result).strip()
        return result, profile
