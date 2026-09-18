import os
import shutil
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Ensure local venv/bin is on system PATH for ffmpeg/ffprobe
venv_bin = str(BASE_DIR / "venv" / "bin")
if venv_bin not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{venv_bin}:{os.environ.get('PATH', '')}"

# ---------------------------------------------------------------------------
# API Credentials
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


INSTAGRAM_BUSINESS_ACCOUNT_ID = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
FACEBOOK_PAGE_ACCESS_TOKEN = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL", "")

import json

# User Profile Config File
USER_PROFILE_PATH = BASE_DIR / "user_profile.json"

# ---------------------------------------------------------------------------
# Project Directories
# ---------------------------------------------------------------------------
ASSETS_DIR = BASE_DIR / "assets"
BROLL_DIR = ASSETS_DIR / "broll"
AUDIO_DIR = ASSETS_DIR / "audio"
FONTS_DIR = ASSETS_DIR / "fonts"
TEMPLATES_DIR = ASSETS_DIR / "templates"
VOICES_DIR = ASSETS_DIR / "voices"
USER_CLIPS_DIR = ASSETS_DIR / "user_clips"

OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_AUDIO_DIR = OUTPUT_DIR / "audio"
OUTPUT_SUBTITLES_DIR = OUTPUT_DIR / "subtitles"
OUTPUT_VIDEOS_DIR = OUTPUT_DIR / "videos"

for d in [
    BROLL_DIR, AUDIO_DIR, FONTS_DIR, TEMPLATES_DIR, VOICES_DIR, USER_CLIPS_DIR,
    OUTPUT_AUDIO_DIR, OUTPUT_SUBTITLES_DIR, OUTPUT_VIDEOS_DIR
]:
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# IndicF5 Voice Engine (Local, Zero-Cost, Ultra-Natural Gujarati)
# ---------------------------------------------------------------------------
INDICF5_MODEL_ID = os.getenv("INDICF5_MODEL_ID", "ai4bharat/IndicF5")
INDICF5_MALE_REF_AUDIO = VOICES_DIR / "prarambh_male_ref.wav"
INDICF5_FEMALE_REF_AUDIO = VOICES_DIR / "prarambh_female_ref.wav"
VOICE_REGISTRY_PATH = VOICES_DIR / "voice_registry.json"

def load_user_profile() -> dict:
    """Loads user profile settings with fallback to environment variables."""
    profile = {
        "ai_provider": "Gemini",
        "gemini_api_key": GEMINI_API_KEY,
        "openai_api_key": os.getenv("OPENAI_API_KEY", ""),
        "anthropic_api_key": os.getenv("ANTHROPIC_API_KEY", ""),
        "instagram_business_account_id": INSTAGRAM_BUSINESS_ACCOUNT_ID,
        "facebook_page_access_token": FACEBOOK_PAGE_ACCESS_TOKEN,
        "default_voice": "PRARAMBH_MALE",
        "default_tone": "Serious News",
        "voice_settings": {
            "speed": 1.0,
            "pitch": 0.0,
            "stability": 0.35,
            "similarity_boost": 0.80,
            "style": 0.45,
            "pause_duration": 0.5,
            "emphasis_strength": 0.5
        },
        "line1_bg": "#FF0033",
        "line1_text": "#FFFFFF",
        "line2_bg": "#0080FF",
        "line2_text": "#FFFFFF",
        "sub_font_size": 58,
        "sub_color": "#FFFFFF",
        "sub_outline_color": "#000000",
        "target_duration": 30,
        "target_lufs": -14,
        "bgm_duck_volume": 0.12,
        "script_pacing_wps": 2.5
    }
    if USER_PROFILE_PATH.exists():
        try:
            with open(USER_PROFILE_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                profile.update(saved)
        except Exception as e:
            print(f"[Warning] Failed to load user_profile.json: {e}")
    return profile

def save_user_profile(data: dict):
    """Saves user profile settings to local user_profile.json."""
    current = load_user_profile()
    current.update(data)
    with open(USER_PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------------------
# Visual Layout & Safe Zone Calibration (1080x1920 9:16 Vertical)
# ---------------------------------------------------------------------------
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920

# Safe zones in pixels (from edges)
SAFE_ZONE_TOP_NOTCH = 220    # Keep core headlines below this to avoid IG top nav
SAFE_ZONE_BOTTOM_UI = 420    # Keep critical text above this to avoid profile, audio & caption UI
SAFE_ZONE_LEFT_MARGIN = 60
SAFE_ZONE_RIGHT_MARGIN = 60

# Positioning offsets
CATEGORY_BADGE_X = 60
CATEGORY_BADGE_Y = 80
HEADLINE_Y = 300             # Bold headline banner
HEADLINE_FONT_SIZE = 54
LOCATION_TAG_Y = 1340        # Perfectly above subtitle zone
SUBTITLE_BOTTOM_MARGIN = 420 # Dynamic ASS bottom margin
SUBTITLE_FONT_SIZE = 64

# ---------------------------------------------------------------------------
# Audio Balance & Ducking Metrics
# ---------------------------------------------------------------------------
VOICEOVER_VOLUME = 1.0       # Normalized primary channel (~ -14 LUFS target)
BG_MUSIC_DUCK_VOLUME = 0.12   # Background instrumental ducked (~ -28 LUFS target)
BG_MUSIC_DEFAULT_VOLUME = 0.35
AUDIO_FADE_DURATION = 0.5     # Smooth fade-in and fade-out transition in seconds
VIDEO_BUFFER_DURATION = 1.0   # End buffer padding added to video in seconds

# ---------------------------------------------------------------------------
# Surat Hyperlocal SOP Categories & Areas
# ---------------------------------------------------------------------------
CATEGORY_METADATA = {
    "N01": {
        "name": "General News (સમાચાર)",
        "badge": "SURAT NEWS | N01",
        "hashtag": "#SuratNews",
        "cta": "સુરતના તાજા સમાચારો માટે ફોલો કરો.",
    },
    "C01": {
        "name": "Crime Watch (ગુનાખોરી)",
        "badge": "CRIME WATCH | C01",
        "hashtag": "#SuratCrime",
        "cta": "સુરક્ષિત રહો, સજાગ રહો. ફોલો કરો સુરત ક્રાઇમ અપડેટ.",
        "legal_replacement": "ચોરીના કેસમાં પોલીસે એક વ્યક્તિની અટકાયત કરી",
        "disclaimer": "માહિતી સત્તાવાર રિપોર્ટ પર આધારિત છે."
    },
    "T01": {
        "name": "Traffic & Roads (ટ્રાફિક)",
        "badge": "SURAT TRAFFIC | T01",
        "hashtag": "#SuratTraffic",
        "cta": "ટ્રાફિક નિયમોનું પાલન કરો, સુરક્ષિત મુસાફરી કરો.",
    },
    "A01": {
        "name": "Civic Awareness (જાગૃતિ)",
        "badge": "SURAT AWARENESS | A01",
        "hashtag": "#SuratAwareness",
        "cta": "જાગૃત નાગરિક બનો, સ્વચ્છ સુરત બનાવો.",
    },
    "F01": {
        "name": "Festivals & Events (ઉત્સવ)",
        "badge": "SURAT UTSAV | F01",
        "hashtag": "#SuratFestival",
        "cta": "ઉત્સવોના રંગ સુરતીઓ સંગ. ફોલો કરો સુરત અપડેટ.",
    },
    "B01": {
        "name": "Business & Diamond (વેપાર)",
        "badge": "SURAT BUSINESS | B01",
        "hashtag": "#SuratBusiness",
        "cta": "વેપાર-ઉદ્યોગના મહત્વના સમાચાર માટે જોડાયેલા રહો.",
    },
}

SURAT_AREAS = [
    "All Surat (સમગ્ર સુરત)",
    "Adajan",
    "Vesu",
    "Varachha",
    "Katargam",
    "City Light",
    "Pal",
    "Piplod",
    "Rander",
    "Althan",
    "Nanpura",
    "Athwa",
    "Udhna",
    "Dindoli",
    "Sarthana",
]

# ---------------------------------------------------------------------------
# FFmpeg Resolution Helper
# ---------------------------------------------------------------------------
def get_ffmpeg_binary() -> str:
    """Finds system ffmpeg, static_ffmpeg, or local bin path."""
    sys_path = shutil.which("ffmpeg")
    if sys_path:
        return sys_path
    
    # Try static_ffmpeg package
    try:
        import static_ffmpeg
        static_ffmpeg.add_paths()
        res = shutil.which("ffmpeg")
        if res:
            return res
    except Exception:
        pass

    # Check local virtualenv / bin
    local_bin = BASE_DIR / "venv" / "bin" / "ffmpeg"
    if local_bin.exists() and os.access(local_bin, os.X_OK):
        return str(local_bin)
    
    return "ffmpeg"


def get_ffprobe_binary() -> str:
    """Finds system ffprobe, static_ffmpeg, or local bin path."""
    sys_path = shutil.which("ffprobe")
    if sys_path:
        return sys_path

    try:
        import static_ffmpeg
        static_ffmpeg.add_paths()
        res = shutil.which("ffprobe")
        if res:
            return res
    except Exception:
        pass

    local_bin = BASE_DIR / "venv" / "bin" / "ffprobe"
    if local_bin.exists() and os.access(local_bin, os.X_OK):
        return str(local_bin)

    return "ffprobe"


# ---------------------------------------------------------------------------
# CapCut-Style Auto Video Editor Configuration & Presets
# ---------------------------------------------------------------------------
CAPCUT_DEFAULTS = {
    "target_duration": 30.0,
    "sync_to_beats": True,
    "motion_intensity": "balanced",       # subtle | balanced | fast_cuts
    "transition_style": "auto",           # auto | smooth | punchy
    "avg_segment_duration": 3.0,          # seconds
    "min_segment_duration": 1.5,
    "max_segment_duration": 4.0,
    "beat_snap_tolerance": 0.35,          # seconds
    "downbeat_priority": True,
    "smart_framing": True,
    "face_detection": True,
    "zoom_range_subtle": (1.00, 1.08),
    "zoom_range_fast": (1.00, 1.15),
    "transition_dissolve_duration": 0.40,
    "transition_whip_duration": 0.30,
    "flash_duration": 0.15,
    "bgm_duck_level": 0.12,
    "target_lufs": -14.0,
    "output_fps": 30,
    "output_resolution": (1080, 1920),
    "preserve_original_audio": False,     # Discard raw clip audio by default
}

CAPCUT_PRESETS = {
    "serious": {
        "id": "serious",
        "name": "Serious Anchor",
        "icon": "🎙️",
        "description": "Slow subtle zooms, smooth cross-dissolves, authoritative pacing",
        "motion_intensity": "subtle",
        "transition_style": "smooth",
        "avg_segment_duration": 3.5,
        "zoom_range": (1.00, 1.06),
        "bgm_duck_level": 0.10,
    },
    "fast": {
        "id": "fast",
        "name": "Fast News",
        "icon": "⚡",
        "description": "Fast energetic cuts, whip-pan transitions, dynamic zooms",
        "motion_intensity": "fast_cuts",
        "transition_style": "punchy",
        "avg_segment_duration": 2.0,
        "zoom_range": (1.00, 1.15),
        "bgm_duck_level": 0.14,
    },
    "festive": {
        "id": "festive",
        "name": "Festive & Vibrant",
        "icon": "🎉",
        "description": "Bright punchy cuts, white flash accents, dynamic zooms",
        "motion_intensity": "balanced",
        "transition_style": "punchy",
        "avg_segment_duration": 2.5,
        "zoom_range": (1.00, 1.12),
        "flash_boost": True,
        "bgm_duck_level": 0.12,
    },
}

# ---------------------------------------------------------------------------
# Advanced & Multi-Language Subtitle Engine Configuration (20 Presets)
# ---------------------------------------------------------------------------
SUBTITLE_DEFAULTS = {
    "language": "gu",
    "whisper_model": "base",
    "compute_type": "int8",               # int8 for CPU, float16 for GPU
    "chunk_size": 3,                      # 1-3 words per chunk
    "max_chunk_duration": 1.5,            # seconds
    "min_chunk_duration": 0.3,
    "pause_threshold": 0.25,              # seconds gap = new chunk
    "safe_zone_bottom_px": 420,
    "margin_v": 460,                      # safe_zone_bottom + 40
    "style_preset": "mixed_highlight",
    "base_color": "#FFFFFF",
    "highlight_color": "#FFD700",
    "glow_color": "#FFD700",
    "font_name": "Noto Sans Gujarati",
    "font_size": 72,
    "outline_width": 5,
    "shadow": 3,
    "animation": "bounce_soft",
    "enable_glow": False,
    "enable_pill_bg": False,
    "uppercase": False,
    "output_fps": 30,
    "output_resolution": (1080, 1920),
}

SUBTITLE_STYLE_DEFAULTS = {
    "active_style": "mixed_highlight",
    "language_detection": {
        "gujarati_range": (0x0A80, 0x0AFF),
        "latin_range": (0x0000, 0x024F),
        "mixed_threshold": 0.3,
    },
    "english_styling": {
        "default_font": "Anton",
        "default_color": "#FFD700",
        "default_scale": 1.10,
        "force_uppercase": True,
        "bold": True,
    },
    "gujarati_styling": {
        "default_font": "Noto Sans Gujarati",
        "default_color": "#FFFFFF",
        "default_scale": 1.0,
        "force_uppercase": False,
    },
    "safe_zone_bottom_px": 420,
    "margin_v": 460,
    "chunk_size": 3,
}

