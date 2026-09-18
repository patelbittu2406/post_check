"""
ASS Style Presets — 20 Viral Presets for Prarambh Reel Studio
=============================================================
Provides backward compatibility aliases and bridges to core.subtitle_presets.
"""

from typing import Dict, Any, List
from core.subtitle_presets import SUBTITLE_PRESETS_20, get_subtitle_preset, list_subtitle_presets, get_preset_categories

# Legacy alias mappings
_LEGACY_ALIASES = {
    "hormozi": "hormozi_classic",
    "capcut": "capcut_default",
    "neon": "neon_cyber",
    "minimal": "capcut_default",
}

# Create unified dictionary with both 20 presets and legacy aliases
SUBTITLE_PRESETS: Dict[str, Dict[str, Any]] = dict(SUBTITLE_PRESETS_20)
for legacy_key, target_key in _LEGACY_ALIASES.items():
    if target_key in SUBTITLE_PRESETS_20:
        alias_preset = dict(SUBTITLE_PRESETS_20[target_key])
        alias_preset["id"] = legacy_key
        SUBTITLE_PRESETS[legacy_key] = alias_preset


def get_preset(name: str) -> dict:
    """Returns a preset by name, resolving legacy aliases and defaulting to 'mixed_highlight'."""
    resolved = _LEGACY_ALIASES.get(name, name)
    preset = get_subtitle_preset(resolved)
    return preset


def list_presets() -> List[Dict[str, Any]]:
    """Returns presets as a list."""
    return list_subtitle_presets()


