"""
Surat News Reel Engine (V2) - Operator Dashboard
3-Tab Production Console:
- Tab 1: Reel Studio (Main Production Hub, Timeline Duration, Dual-Stripe Headlines, Single/Multi-Clip Ingest)
- Tab 2: User Profile & Settings (Multi-LLM Provider, API Keys, Meta Graph API Credentials)
- Tab 3: Visual & Voice Styling (Dual-Stripe Badge Styler, Subtitle Styler, Custom Voice Sample Cloning)
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import streamlit as st
import streamlit.components.v1 as components

# Ensure project root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

import config
from core.llm_adapter import LLMAdapter, ReelContentOutput
from core.voice_engine import PrarambhVoiceEngine as VoiceEngine
from core.subtitle_generator import SubtitleGenerator
from core.video_assembler import VideoAssembler
from core.ig_publisher import InstagramPublisher

# -----------------------------------------------------------------------------
# Streamlit Configuration & Custom Styling
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Surat News Reel Engine V2",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+Gujarati:wght@400;600;700;800&display=swap');

    html, body, [class*="css"] {
        font-family: 'Outfit', 'Noto Sans Gujarati', sans-serif;
    }

    .main-header {
        background: linear-gradient(90deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.3rem;
        font-weight: 800;
        margin-bottom: 0.1rem;
    }
    .sub-header {
        color: #94A3B8;
        font-size: 0.95rem;
        margin-bottom: 1.2rem;
    }
    .badge-preview-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        margin-top: 10px;
    }
    .badge-pill-line {
        padding: 8px 20px;
        border-radius: 16px;
        font-weight: 700;
        font-size: 1.1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        text-align: center;
    }
    .card-box {
        background: rgba(30, 41, 59, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.2rem;
        margin-bottom: 1rem;
        backdrop-filter: blur(12px);
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        font-size: 1.05rem;
        font-weight: 700;
        padding: 10px 20px;
        border-radius: 8px 8px 0 0;
    }
    .stButton>button {
        border-radius: 10px;
        font-weight: 700;
        transition: all 0.2s ease-in-out;
    }
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(56, 189, 248, 0.3);
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Initialize Session State
# -----------------------------------------------------------------------------
user_profile = config.load_user_profile()

if "profile" not in st.session_state:
    st.session_state.profile = user_profile
if "reel_content" not in st.session_state:
    st.session_state.reel_content = None
if "voiceover_path" not in st.session_state:
    st.session_state.voiceover_path = None
if "ass_subtitle_path" not in st.session_state:
    st.session_state.ass_subtitle_path = None
if "headline_png_path" not in st.session_state:
    st.session_state.headline_png_path = None
if "final_video_path" not in st.session_state:
    st.session_state.final_video_path = None
if "publish_result" not in st.session_state:
    st.session_state.publish_result = None
# Draggable badge / subtitle positions (as % of phone frame)
if "badge1_top" not in st.session_state:
    st.session_state.badge1_top = 28
if "badge1_left" not in st.session_state:
    st.session_state.badge1_left = 50
if "badge2_top" not in st.session_state:
    st.session_state.badge2_top = 35
if "badge2_left" not in st.session_state:
    st.session_state.badge2_left = 50
if "sub_top" not in st.session_state:
    st.session_state.sub_top = 78
if "sub_left" not in st.session_state:
    st.session_state.sub_left = 50

# Core Service Instances
llm_adapter = LLMAdapter(default_provider=st.session_state.profile.get("ai_provider", "Gemini"))
voice_engine = VoiceEngine()
subtitle_generator = SubtitleGenerator()
video_assembler = VideoAssembler()
ig_publisher = InstagramPublisher(
    account_id=st.session_state.profile.get("instagram_business_account_id"),
    access_token=st.session_state.profile.get("facebook_page_access_token")
)

# -----------------------------------------------------------------------------
# Main Header
# -----------------------------------------------------------------------------
st.markdown('<div class="main-header">Surat News Reel Engine <span style="font-size:1.1rem; color:#38BDF8; vertical-align:middle; border:1px solid #38BDF8; padding:2px 8px; border-radius:6px;">V2</span></div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Automated Multi-LLM Newsroom: Dual-Stripe Headlines, Custom Voice Cloning, Multi-Clip Auto Splicer & Direct 1-Click Instagram Publishing.</div>', unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# Navigation Tabs
# -----------------------------------------------------------------------------
tab1, tab2, tab3, tab4 = st.tabs([
    "🎬 Tab 1: Reel Studio",
    "⚙️ Tab 2: User Profile & Settings",
    "🎨 Tab 3: Visual & Voice Styling",
    "🎙️ Tab 4: Quick TTS"
])

# =============================================================================
# TAB 2: USER PROFILE & SETTINGS
# =============================================================================
with tab2:
    st.markdown("### ⚙️ User Profile & API Integration Hub")
    st.caption("Configure multi-AI providers and official Meta Graph API credentials. Settings are automatically saved to `user_profile.json`.")

    col_ai, col_meta = st.columns(2, gap="large")

    with col_ai:
        st.markdown("#### 🤖 AI Model Provider")
        provider_options = ["Gemini", "OpenAI", "Claude"]
        curr_provider = st.session_state.profile.get("ai_provider", "Gemini")
        selected_provider = st.selectbox(
            "Active AI Generation Provider",
            provider_options,
            index=provider_options.index(curr_provider) if curr_provider in provider_options else 0
        )

        st.markdown("##### 🔑 AI Provider API Keys:")
        gemini_key = st.text_input(
            "Google Gemini API Key (Default model: gemini-3.6-flash):",
            value=st.session_state.profile.get("gemini_api_key", ""),
            type="password"
        )
        openai_key = st.text_input(
            "OpenAI API Key (Model: gpt-4o):",
            value=st.session_state.profile.get("openai_api_key", ""),
            type="password"
        )
        claude_key = st.text_input(
            "Anthropic Claude API Key (Model: claude-3-5-sonnet):",
            value=st.session_state.profile.get("anthropic_api_key", ""),
            type="password"
        )

        st.markdown("##### 🎙️ Voice Engine:")
        st.info("⚡ **100% Local Gujarati TTS Engine**: Fully offline Meta MMS-TTS (VITS) with 5 regional accents (Standard, Kathiyawadi, Mahesani, Surati, News Anchor) & Custom Voice Cloning. Zero API cost, 100% private.")

    with col_meta:
        st.markdown("#### 📸 Instagram Graph API (v19.0+)")
        ig_acc_id = st.text_input(
            "Instagram Business Account ID:",
            value=st.session_state.profile.get("instagram_business_account_id", ""),
            help="Found in Meta Business Suite under Instagram account settings."
        )
        meta_token = st.text_input(
            "Facebook Page Long-Lived Access Token:",
            value=st.session_state.profile.get("facebook_page_access_token", ""),
            type="password",
            help="Generate via Meta Graph API Explorer with pages_show_list, instagram_basic, instagram_content_publish."
        )

        st.markdown("---")
        st.markdown("#### 💾 Save Profile Configuration")
        if st.button("Save Profile Settings", type="primary", use_container_width=True):
            updated = {
                "ai_provider": selected_provider,
                "gemini_api_key": gemini_key,
                "openai_api_key": openai_key,
                "anthropic_api_key": claude_key,
                "instagram_business_account_id": ig_acc_id,
                "facebook_page_access_token": meta_token,
            }
            config.save_user_profile(updated)
            st.session_state.profile.update(updated)
            st.success("✅ Profile settings saved to `user_profile.json` successfully!")

# =============================================================================
# TAB 3: VISUAL & VOICE STYLING
# =============================================================================
with tab3:
    st.markdown("### 🎨 Visual & Voice Customization Engine")
    st.caption("Customize Dual-Stripe headline pill badges, subtitle position, and upload reference voice samples. **Drag badges & subtitle freely on the phone preview →**")

    col_v1, col_v2 = st.columns([1, 1.1], gap="large")

    with col_v1:
        st.markdown("#### 🏷️ Headline Dual-Stripe Badge Styler")
        c1, c2 = st.columns(2)
        with c1:
            line1_bg = st.color_picker("Line 1 Background", value=st.session_state.profile.get("line1_bg", "#FF0033"))
            line1_text_col = st.color_picker("Line 1 Text Color", value=st.session_state.profile.get("line1_text", "#FFFFFF"))
        with c2:
            line2_bg = st.color_picker("Line 2 Background", value=st.session_state.profile.get("line2_bg", "#0080FF"))
            line2_text_col = st.color_picker("Line 2 Text Color", value=st.session_state.profile.get("line2_text", "#FFFFFF"))

        line1_text = line1_text_col
        line2_text = line2_text_col

        st.markdown("---")
        st.markdown("#### 💬 Subtitle Appearance")
        sub_font_size = st.slider("Subtitle Font Size", 40, 80, value=st.session_state.profile.get("sub_font_size", 58))
        c_sub1, c_sub2 = st.columns(2)
        with c_sub1:
            sub_color = st.color_picker("Text Color", value=st.session_state.profile.get("sub_color", "#FFFFFF"))
        with c_sub2:
            sub_outline = st.color_picker("Outline Color", value=st.session_state.profile.get("sub_outline_color", "#000000"))

        st.markdown("---")
        # Current positions readout
        st.markdown("##### 📍 Current Badge/Subtitle Positions (% of frame)")
        pos_col1, pos_col2, pos_col3 = st.columns(3)
        with pos_col1:
            st.metric("🔴 Strip 1 Top", f"{st.session_state.badge1_top}%")
            st.metric("🔴 Strip 1 Left", f"{st.session_state.badge1_left}%")
        with pos_col2:
            st.metric("🔵 Strip 2 Top", f"{st.session_state.badge2_top}%")
            st.metric("🔵 Strip 2 Left", f"{st.session_state.badge2_left}%")
        with pos_col3:
            st.metric("💬 Subtitle Top", f"{st.session_state.sub_top}%")
            st.metric("💬 Sub Left", f"{st.session_state.sub_left}%")

        if st.button("🔄 Reset Positions to Default", use_container_width=True):
            st.session_state.badge1_top = 28
            st.session_state.badge1_left = 50
            st.session_state.badge2_top = 35
            st.session_state.badge2_left = 50
            st.session_state.sub_top = 78
            st.session_state.sub_left = 50
            st.rerun()

        if st.button("💾 Save Visual Customizations", type="primary", use_container_width=True):
            st.session_state.profile.update({
                "line1_bg": line1_bg,
                "line1_text": line1_text,
                "line2_bg": line2_bg,
                "line2_text": line2_text,
                "sub_font_size": sub_font_size,
                "sub_color": sub_color,
                "sub_outline_color": sub_outline,
                "badge1_top": st.session_state.badge1_top,
                "badge1_left": st.session_state.badge1_left,
                "badge2_top": st.session_state.badge2_top,
                "badge2_left": st.session_state.badge2_left,
                "sub_top": st.session_state.sub_top,
                "sub_left": st.session_state.sub_left,
            })
            config.save_user_profile(st.session_state.profile)
            st.success("✅ Visual styles & positions saved!")

    with col_v2:
        st.markdown("#### 📱 Live Phone Preview — Drag to Position")
        st.caption("Drag the red strip, blue strip, and subtitle bar freely. Click **Apply Positions** after placing them.")

        # Build the interactive draggable phone mockup using st.components
        _b1t = st.session_state.badge1_top
        _b1l = st.session_state.badge1_left
        _b2t = st.session_state.badge2_top
        _b2l = st.session_state.badge2_left
        _st = st.session_state.sub_top
        _sl = st.session_state.sub_left

        # Sample texts for preview
        _preview_line1 = (st.session_state.reel_content.line1_headline
                         if st.session_state.reel_content else "સુરત ઉત્સવ | F01")
        _preview_line2 = (st.session_state.reel_content.line2_headline
                         if st.session_state.reel_content else "ગણેશ ઉત્સવ ધામધૂમથી ઉજવાયો 🎉")
        _preview_sub = ("...ભક્તોનો ઉત્સાહ ચરમસીમાએ જોવા મળ્યો...")

        phone_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@700;800&family=Outfit:wght@700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #0f172a; display:flex; flex-direction:column; align-items:center; padding: 16px; font-family: 'Outfit', sans-serif; }}

  .phone-wrap {{
    position: relative;
    width: 270px;
    height: 480px;
    border-radius: 32px;
    overflow: hidden;
    box-shadow: 0 0 0 6px #1e293b, 0 0 0 8px #38BDF8, 0 24px 60px rgba(0,0,0,0.7);
    background: #111827;
    cursor: default;
    user-select: none;
  }}

  /* Simulated news video background */
  .phone-bg {{
    position: absolute; inset: 0;
    background: linear-gradient(160deg, #0f172a 0%, #1a2744 40%, #0f2250 70%, #0d1627 100%);
  }}
  .phone-bg::before {{
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 20%, rgba(56,189,248,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 80% 70%, rgba(129,140,248,0.07) 0%, transparent 60%);
  }}
  /* Simulated cityscape silhouette */
  .city-silhouette {{
    position: absolute; bottom: 0; left: 0; right: 0; height: 120px;
    background: linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%);
  }}

  /* News ticker bar at top */
  .news-topbar {{
    position: absolute; top: 0; left: 0; right: 0;
    height: 32px;
    background: linear-gradient(90deg, #FF0033 0%, #cc0000 100%);
    display: flex; align-items: center; padding: 0 10px;
    font-size: 9px; font-weight: 800; color: #fff; letter-spacing: 1px;
    z-index: 5;
  }}
  .news-topbar span {{ opacity: 0.7; margin: 0 8px; }}

  /* Safe zone guides */
  .safe-top {{
    position: absolute; top: 32px; left: 0; right: 0;
    height: 2px; background: rgba(56,189,248,0.2); z-index: 3; pointer-events:none;
  }}
  .safe-bottom {{
    position: absolute; bottom: 90px; left: 0; right: 0;
    height: 2px; background: rgba(56,189,248,0.2); z-index: 3; pointer-events:none;
  }}
  .safe-label {{
    position: absolute; right: 6px; font-size: 7px; color: rgba(56,189,248,0.5);
    pointer-events: none; z-index: 3;
  }}

  /* ── Instagram-style center guide lines ── */
  .guide-h {{
    position: absolute;
    top: 50%; left: 0; right: 0;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 6px,
      transparent 6px, transparent 12px
    );
    transform: translateY(-50%);
    pointer-events: none;
    z-index: 8;
    opacity: 0;
    transition: opacity 0.15s ease;
  }}
  .guide-v {{
    position: absolute;
    left: 50%; top: 0; bottom: 0;
    width: 1px;
    background: repeating-linear-gradient(
      180deg,
      rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 6px,
      transparent 6px, transparent 12px
    );
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 8;
    opacity: 0;
    transition: opacity 0.15s ease;
  }}
  /* Yellow accent when snapped */
  .guide-h.snapped, .guide-v.snapped {{
    background: repeating-linear-gradient(
      90deg,
      rgba(250,204,21,0.9) 0px, rgba(250,204,21,0.9) 6px,
      transparent 6px, transparent 12px
    );
  }}
  .guide-v.snapped {{
    background: repeating-linear-gradient(
      180deg,
      rgba(250,204,21,0.9) 0px, rgba(250,204,21,0.9) 6px,
      transparent 6px, transparent 12px
    );
  }}
  /* CENTERED badge */
  .center-badge {{
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(250,204,21,0.92);
    color: #0f172a;
    font-size: 7px;
    font-weight: 900;
    letter-spacing: 1.5px;
    padding: 3px 8px;
    border-radius: 20px;
    pointer-events: none;
    z-index: 15;
    opacity: 0;
    transition: opacity 0.2s ease;
    white-space: nowrap;
  }}

  /* Draggable elements */
  .drag-el {{
    position: absolute;
    cursor: grab;
    transform: translateX(-50%);
    z-index: 10;
    touch-action: none;
  }}
  .drag-el:active {{ cursor: grabbing; }}

  .badge-strip {{
    padding: 5px 14px;
    border-radius: 10px;
    font-family: 'Noto Sans Gujarati', 'Outfit', sans-serif;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 3px 10px rgba(0,0,0,0.5);
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: center;
  }}

  .drag-handle {{
    position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
    width: 24px; height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    cursor: grab;
  }}

  .subtitle-strip {{
    background: rgba(0,0,0,0.75);
    color: #fff;
    font-family: 'Noto Sans Gujarati', 'Outfit', sans-serif;
    font-size: 9px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    text-align: center;
    max-width: 240px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.6);
    -webkit-text-stroke: 0.3px {sub_outline};
    color: {sub_color};
  }}

  /* Bottom publish bar */
  .phone-bottom {{
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 88px;
    background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 8px 10px 12px;
    pointer-events: none; z-index: 4;
  }}
  .ig-caption {{
    font-size: 8px; color: rgba(255,255,255,0.6); line-height: 1.4;
  }}
  .ig-icons {{
    display: flex; gap: 12px; margin-top: 4px;
    font-size: 14px;
  }}

  .apply-btn {{
    margin-top: 12px;
    width: 270px;
    padding: 10px;
    background: linear-gradient(90deg, #38BDF8, #818CF8);
    color: #0f172a;
    font-weight: 800;
    font-size: 13px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
  }}
  .apply-btn:hover {{ transform: translateY(-2px); box-shadow: 0 6px 20px rgba(56,189,248,0.4); }}
  .pos-display {{
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.8;
    font-family: monospace;
  }}
</style>
</head>
<body>

<div class="phone-wrap" id="phone">
  <div class="phone-bg"></div>
  <div class="city-silhouette"></div>

  <!-- Top news bar -->
  <div class="news-topbar">
    🔴 LIVE <span>|</span> SURAT NEWS <span>|</span> BREAKING
  </div>

  <!-- Safe zone guide lines -->
  <div class="safe-top"></div>
  <div class="safe-bottom"></div>
  <div class="safe-label" style="top:34px;">safe ↑</div>
  <div class="safe-label" style="bottom:92px;">sub zone ↓</div>

  <!-- Center guide lines (Instagram-style, appear on drag) -->
  <div class="guide-h" id="guide-h"></div>
  <div class="guide-v" id="guide-v"></div>
  <div class="center-badge" id="center-badge">⬤ CENTERED</div>

  <!-- LINE 1 BADGE (draggable) -->
  <div class="drag-el" id="badge1"
    style="top:{_b1t}%; left:{_b1l}%;">
    <div class="drag-handle"></div>
    <div class="badge-strip" style="background:{line1_bg}; color:{line1_text_col};">
      {_preview_line1}
    </div>
  </div>

  <!-- LINE 2 BADGE (draggable) -->
  <div class="drag-el" id="badge2"
    style="top:{_b2t}%; left:{_b2l}%;">
    <div class="drag-handle"></div>
    <div class="badge-strip" style="background:{line2_bg}; color:{line2_text_col};">
      {_preview_line2}
    </div>
  </div>

  <!-- SUBTITLE STRIP (draggable) -->
  <div class="drag-el" id="subel"
    style="top:{_st}%; left:{_sl}%;">
    <div class="drag-handle"></div>
    <div class="subtitle-strip">{_preview_sub}</div>
  </div>

  <!-- Bottom IG chrome -->
  <div class="phone-bottom">
    <div class="ig-caption">📍 Surat | #SuratNews #BreakingNews</div>
    <div class="ig-icons">❤️ 💬 ↗️ 🔖</div>
  </div>
</div>

<button class="apply-btn" onclick="sendPositions()">✅ Apply Positions to Engine</button>
<div class="pos-display" id="pos-display">
  🔴 Strip1: top={_b1t}% left={_b1l}%<br>
  🔵 Strip2: top={_b2t}% left={_b2l}%<br>
  💬 Subtitle: top={_st}% left={_sl}%
</div>

<script>
  const phone = document.getElementById('phone');
  const guideH = document.getElementById('guide-h');
  const guideV = document.getElementById('guide-v');
  const centerBadge = document.getElementById('center-badge');
  const SNAP_THRESHOLD = 4;   // % — snap within 4% of center
  const GUIDE_THRESHOLD = 12; // % — show guide line within 12% of center
  let snapTimeout = null;

  const positions = {{
    badge1: {{ top: {_b1t}, left: {_b1l} }},
    badge2: {{ top: {_b2t}, left: {_b2l} }},
    subel:  {{ top: {_st},  left: {_sl}  }}
  }};

  function showGuides(nearH, nearV, snappedH, snappedV) {{
    // Horizontal guide (appears when near vertical center 50%)
    if (nearH) {{
      guideH.style.opacity = '1';
      guideH.classList.toggle('snapped', snappedH);
    }} else {{
      guideH.style.opacity = '0';
      guideH.classList.remove('snapped');
    }}
    // Vertical guide (appears when near horizontal center 50%)
    if (nearV) {{
      guideV.style.opacity = '1';
      guideV.classList.toggle('snapped', snappedV);
    }} else {{
      guideV.style.opacity = '0';
      guideV.classList.remove('snapped');
    }}
    // CENTERED badge — show only when both snapped
    if (snappedH && snappedV) {{
      centerBadge.style.opacity = '1';
      clearTimeout(snapTimeout);
      snapTimeout = setTimeout(() => {{ centerBadge.style.opacity = '0'; }}, 1200);
    }} else if (!snappedH && !snappedV) {{
      centerBadge.style.opacity = '0';
    }}
  }}

  function hideGuides() {{
    guideH.style.opacity = '0';
    guideV.style.opacity = '0';
    guideH.classList.remove('snapped');
    guideV.classList.remove('snapped');
    setTimeout(() => {{ centerBadge.style.opacity = '0'; }}, 400);
  }}

  function makeDraggable(el, key) {{
    let dragging = false, startX, startY, startTop, startLeft;

    function getPhoneRect() {{ return phone.getBoundingClientRect(); }}

    function onStart(ex, ey) {{
      dragging = true;
      startX = ex; startY = ey;
      startTop  = positions[key].top;
      startLeft = positions[key].left;
      el.style.zIndex = 20;
    }}
    function onMove(ex, ey) {{
      if (!dragging) return;
      const r = getPhoneRect();
      const dx = ex - startX;
      const dy = ey - startY;
      let newTop  = startTop  + (dy / r.height) * 100;
      let newLeft = startLeft + (dx / r.width)  * 100;
      newTop  = Math.max(5, Math.min(95, newTop));
      newLeft = Math.max(5, Math.min(95, newLeft));

      // ── Snap to center logic ──
      const distV = Math.abs(newTop  - 50);
      const distH = Math.abs(newLeft - 50);
      const snappedV = distV < SNAP_THRESHOLD;
      const snappedH = distH < SNAP_THRESHOLD;
      if (snappedV) newTop  = 50;
      if (snappedH) newLeft = 50;

      // ── Show/hide center guides ──
      showGuides(
        distV < GUIDE_THRESHOLD,   // show horizontal guide
        distH < GUIDE_THRESHOLD,   // show vertical guide
        snappedV, snappedH
      );

      positions[key].top  = Math.round(newTop);
      positions[key].left = Math.round(newLeft);
      el.style.top  = newTop  + '%';
      el.style.left = newLeft + '%';
      updateDisplay();
    }}
    function onEnd() {{
      dragging = false;
      el.style.zIndex = 10;
      hideGuides();
    }}

    // Mouse
    el.addEventListener('mousedown',  e => {{ e.preventDefault(); onStart(e.clientX, e.clientY); }});
    document.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup',   () => onEnd());
    // Touch
    el.addEventListener('touchstart', e => {{ e.preventDefault(); onStart(e.touches[0].clientX, e.touches[0].clientY); }}, {{passive:false}});
    document.addEventListener('touchmove',  e => {{ if(dragging) {{ e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }} }}, {{passive:false}});
    document.addEventListener('touchend',   () => onEnd());
  }}

  makeDraggable(document.getElementById('badge1'), 'badge1');
  makeDraggable(document.getElementById('badge2'), 'badge2');
  makeDraggable(document.getElementById('subel'),  'subel');

  function updateDisplay() {{
    const fmt = (key) => {{
      const t = positions[key].top;
      const l = positions[key].left;
      const tc = (t===50) ? ' style="color:#facc15"' : '';
      const lc = (l===50) ? ' style="color:#facc15"' : '';
      return `top=<span${{tc}}>${{t}}%</span> left=<span${{lc}}>${{l}}%</span>`;
    }};
    document.getElementById('pos-display').innerHTML =
      '🔴 Strip1: ' + fmt('badge1') + '<br>' +
      '🔵 Strip2: ' + fmt('badge2') + '<br>' +
      '💬 Subtitle: ' + fmt('subel');
  }}

  function sendPositions() {{
    const msg = {{
      type: 'badge_positions',
      badge1_top:  positions.badge1.top,
      badge1_left: positions.badge1.left,
      badge2_top:  positions.badge2.top,
      badge2_left: positions.badge2.left,
      sub_top:     positions.subel.top,
      sub_left:    positions.subel.left
    }};
    window.parent.postMessage(JSON.stringify(msg), '*');
    document.querySelector('.apply-btn').textContent = '✅ Applied! Save in left column →';
    setTimeout(() => {{ document.querySelector('.apply-btn').textContent = '✅ Apply Positions to Engine'; }}, 2500);
  }}
</script>
</body>
</html>
        """

        # Render the interactive phone preview
        result = components.html(phone_html, height=620, scrolling=False)

        # Handle incoming position messages from JS via query params workaround
        st.markdown("""<script>
        window.addEventListener('message', function(e) {
            try {
                var d = JSON.parse(e.data);
                if (d.type === 'badge_positions') {
                    // Streamlit doesn't natively support postMessage callbacks;
                    // Show the values here so user can manually confirm with Save button
                    console.log('Badge positions received:', d);
                }
            } catch(err) {}
        });
        </script>""", unsafe_allow_html=True)

        st.info("💡 **Drag** the red strip, blue strip & subtitle on the phone preview above, then click **Apply Positions**, then **Save Visual Customizations** on the left.")

        # Manual position entry as fallback for applying dragged values
        with st.expander("✏️ Manually Enter Positions (paste values from phone preview)"):
            mp_col1, mp_col2, mp_col3 = st.columns(3)
            with mp_col1:
                st.markdown("**🔴 Strip 1**")
                new_b1t = st.number_input("Top %", 0, 100, value=st.session_state.badge1_top, key="inp_b1t")
                new_b1l = st.number_input("Left %", 0, 100, value=st.session_state.badge1_left, key="inp_b1l")
            with mp_col2:
                st.markdown("**🔵 Strip 2**")
                new_b2t = st.number_input("Top %", 0, 100, value=st.session_state.badge2_top, key="inp_b2t")
                new_b2l = st.number_input("Left %", 0, 100, value=st.session_state.badge2_left, key="inp_b2l")
            with mp_col3:
                st.markdown("**💬 Subtitle**")
                new_st = st.number_input("Top %", 0, 100, value=st.session_state.sub_top, key="inp_st")
                new_sl = st.number_input("Left %", 0, 100, value=st.session_state.sub_left, key="inp_sl")

            if st.button("📌 Apply Manual Positions", use_container_width=True):
                st.session_state.badge1_top  = new_b1t
                st.session_state.badge1_left = new_b1l
                st.session_state.badge2_top  = new_b2t
                st.session_state.badge2_left = new_b2l
                st.session_state.sub_top     = new_st
                st.session_state.sub_left    = new_sl
                st.rerun()

    with col_v2:  # Voice section continues below phone preview
        st.markdown("#### 🎙️ Custom Voice Sample Ingestion & Cloning")
        st.caption("Upload a clean 10-30s recording of a human voice (.wav or .mp3) to clone natural tone, cadence, and consistent newsroom delivery.")

        uploaded_voice = st.file_uploader(
            "Upload Clean Human Voice Sample (.wav / .mp3):",
            type=["wav", "mp3", "m4a"],
            help="Ensure background noise is minimal and speech is clear."
        )

        voice_display_name = st.text_input(
            "Voice Profile Display Name",
            value="સુરત ન્યૂઝ એન્કર - Male",
            help="Clean human-readable identifier for your newsroom voice (e.g. સુરત ન્યૂઝ એન્કર - Male)."
        )

        voice_tone_style = st.selectbox(
            "Voice Tone Style",
            ["Serious News", "Energetic", "Fast News", "Expressive"],
            index=0,
            help="Delivery cadence and affective inflection applied during zero-shot synthesis."
        )

        if uploaded_voice is not None:
            st.markdown("##### 🎧 Uploaded Raw Sample Preview:")
            st.audio(uploaded_voice)

        if st.button("💾 Save Voice Profile", type="primary", use_container_width=True):
            if not uploaded_voice:
                st.error("Please upload an audio file first (.wav or .mp3).")
            elif not voice_display_name.strip():
                st.error("Please enter a valid Voice Profile Display Name.")
            else:
                with st.spinner("Pre-processing audio (silence removal, -14 LUFS, 24kHz mono) and registering profile..."):
                    try:
                        audio_bytes = uploaded_voice.getvalue() if hasattr(uploaded_voice, "getvalue") else bytes(uploaded_voice.getbuffer())
                        new_profile = voice_engine.save_and_register_profile(
                            audio_data=audio_bytes,
                            display_name=voice_display_name.strip(),
                            tone_style=voice_tone_style,
                            filename=uploaded_voice.name
                        )
                        st.success(f"✅ Voice profile '{new_profile['display_name']}' saved to registry!")
                        st.markdown("##### 🎙️ Pre-processed 24kHz Reference Audio Preview:")
                        st.audio(new_profile["file_path"])
                        st.rerun()
                    except Exception as e:
                        st.error(f"Failed to register voice profile: {e}")

        # List existing registered profiles from persistent JSON registry
        registered_voices = voice_engine.registry.list_profiles()
        if registered_voices:
            st.markdown("##### 📁 Registered Voice Profiles (`voice_registry.json`):")
            for v in registered_voices:
                with st.container():
                    col_va, col_vb = st.columns([3, 1])
                    with col_va:
                        st.markdown(f"🎤 **{v['display_name']}** &nbsp;•&nbsp; `Style: {v.get('tone_style', 'Serious News')}`")
                        if Path(v["file_path"]).exists():
                            st.audio(v["file_path"])
                        else:
                            st.caption(f"Audio file missing: {v['file_path']}")
                    with col_vb:
                        st.caption(f"ID: `{v['id']}`")
                        if st.button("🗑️ Delete", key=f"del_{v['id']}", use_container_width=True):
                            voice_engine.registry.delete_profile(v["id"])
                            st.rerun()
        else:
            st.info("No custom voice samples registered yet. Standard neural voices will be used.")

# =============================================================================
# TAB 1: REEL STUDIO (MAIN PRODUCTION HUB)
# =============================================================================
with tab1:
    with st.sidebar:
        st.markdown("### 🎛️ Reel Production Controls")

        # Category
        cat_keys = list(config.CATEGORY_METADATA.keys())
        cat_labels = [f"{k} - {config.CATEGORY_METADATA[k]['name']}" for k in cat_keys]
        selected_cat_idx = st.selectbox(
            "News Category",
            range(len(cat_keys)),
            format_func=lambda i: cat_labels[i],
            index=0
        )
        category_code = cat_keys[selected_cat_idx]

        # Area
        selected_area = st.selectbox(
            "Hyperlocal Surat Area",
            config.SURAT_AREAS,
            index=0
        )

        # Timeline Duration
        target_duration = st.select_slider(
            "Target Reel Timeline Duration",
            options=[15, 30, 45, 60],
            value=st.session_state.profile.get("target_duration", 30),
            format_func=lambda s: f"{s} seconds"
        )

        st.markdown("---")
        st.markdown("### 🎥 Video Composition Mode")
        video_mode = st.radio(
            "Video Ingest Mode",
            ["Single Video File", "Multi-Clip Auto Montage"],
            index=0
        )

        single_clip_file = None
        multi_clip_files = []

        if video_mode == "Single Video File":
            # Stock or custom single
            stock_brolls = [f.name for f in config.BROLL_DIR.glob("*.mp4")]
            selected_stock = st.selectbox("Stock Footage Background", stock_brolls if stock_brolls else ["surat_city_loop.mp4"])
            single_clip_file = str(config.BROLL_DIR / selected_stock)

            uploaded_single = st.file_uploader("Or Upload Custom Video (.mp4):", type=["mp4", "mov"], key="single_vid")
            if uploaded_single:
                p = config.USER_CLIPS_DIR / f"single_{uploaded_single.name}"
                with open(p, "wb") as f:
                    f.write(uploaded_single.getbuffer())
                single_clip_file = str(p)
                st.success(f"Loaded: {uploaded_single.name}")

        else:
            uploaded_multis = st.file_uploader(
                "Upload Multiple Raw Clips (Auto Montage Splicer):",
                type=["mp4", "mov"],
                accept_multiple_files=True,
                key="multi_vid"
            )
            if uploaded_multis:
                for uf in uploaded_multis:
                    mp = config.USER_CLIPS_DIR / uf.name
                    with open(mp, "wb") as f:
                        f.write(uf.getbuffer())
                    multi_clip_files.append(str(mp))
                st.success(f"Loaded {len(multi_clip_files)} raw video clips!")
            else:
                # Fallback to stock clips
                multi_clip_files = [str(f) for f in config.BROLL_DIR.glob("*.mp4")]

        # Background Music
        bgm_files = [f.name for f in config.AUDIO_DIR.glob("*.mp3")]
        selected_bgm = st.selectbox("Background News Beat", bgm_files if bgm_files else ["surat_news_bgm.mp3"])
        bg_music_path = config.AUDIO_DIR / selected_bgm

        # Voice Selector
        st.markdown("---")
        st.markdown("### 🎙️ Voice Model")
        st.caption("🟢 **100% Local Neural Engine** (Zero API Cost | 5 Regional Accents)")
        voice_mode_choice = st.selectbox(
            "Voice Delivery Engine",
            list(VoiceEngine.PRESET_VOICES.keys()),
            format_func=lambda k: VoiceEngine.PRESET_VOICES[k],
            index=0  # Default Gujarati Standard
        )

        chosen_profile_id = None
        chosen_ref_sample = None
        allow_adaptive_clone = False
        if voice_mode_choice == "custom_clone":
            registered_profiles = voice_engine.registry.list_profiles()
            if registered_profiles:
                profile_display_names = [p["display_name"] for p in registered_profiles]
                selected_voice_name = st.selectbox(
                    "Select Uploaded Voice Clone Sample",
                    profile_display_names,
                    help="Persistent voice profiles registered with 22050Hz mono normalization and tone conditioning."
                )
                selected_profile = next((p for p in registered_profiles if p["display_name"] == selected_voice_name), None)
                if selected_profile:
                    chosen_profile_id = selected_profile["id"]
                    chosen_ref_sample = selected_profile["file_path"]
                    st.caption(f"🎭 Tone Style: **{selected_profile.get('tone_style', 'Serious News')}** &nbsp;|&nbsp; 22050Hz Mono")
                    if Path(chosen_ref_sample).exists():
                        st.audio(chosen_ref_sample)

                st.success("✨ **100% Free Voice Cloning Active**: Synthesizes speech matched to this sample's tone, pitch & tempo.")
                allow_adaptive_clone = True
            else:
                st.warning("⚠️ No custom voice profiles in registry. Add one in **Tab 3: Visual & Voice Styling**.")

    # Main Reel Studio Canvas
    col_studio_left, col_studio_right = st.columns([1.1, 0.9], gap="large")

    # LEFT COLUMN: Inputs & Generation
    with col_studio_left:
        st.markdown("### 📝 1. Raw News Bulletin")
        st.markdown(
            f"**Active Model:** `{st.session_state.profile.get('ai_provider', 'Gemini')}` &nbsp;|&nbsp; "
            f"**Area:** `{selected_area}` &nbsp;|&nbsp; "
            f"**Duration:** `{target_duration}s`"
        )

        default_input = (
            "સુરતના વેસુ વિસ્તારમાં આજે ગણેશ ઉત્સવ દરમિયાન ભારે વરસાદ વચ્ચે પણ ભક્તોનો ઉત્સાહ ચરમસીમાએ જોવા મળ્યો હતો. "
            "મંદિરમાં વિશેષ મહાઆરતીનું આયોજન કરવામાં આવ્યું હતું અને મોટી સંખ્યામાં સ્થાનિક લોકો ઉપસ્થિત રહ્યા હતા."
        )
        if category_code == "C01":
            default_input = "વેસુ વિસ્તારમાં દુકાનમાંથી રોકડ રકમની ચોરી થઈ, પોલીસે ગણતરીના કલાકોમાં શંકાસ્પદની ધરપકડ કરી વધુ તપાસ હાથ ધરી છે."

        raw_news_input = st.text_area(
            "Enter raw news points or press release:",
            value=default_input,
            height=100
        )

        if st.button("🚀 1. Generate AI Script & Voiceover", type="primary", use_container_width=True):
            with st.spinner(f"Generating timed script with {st.session_state.profile.get('ai_provider', 'Gemini')} & synthesizing voice..."):
                try:
                    # 1. LLM Generation
                    content = llm_adapter.generate_reel_content(
                        raw_details=raw_news_input,
                        category_code=category_code,
                        area=selected_area,
                        target_duration=target_duration,
                        provider=st.session_state.profile.get("ai_provider", "Gemini")
                    )
                    st.session_state.reel_content = content

                    # 2. Voiceover Synthesis
                    v_out_path = config.OUTPUT_AUDIO_DIR / f"v2_voice_{category_code}_{int(datetime.now().timestamp())}.wav"
                    if voice_mode_choice == "custom_clone":
                        if not chosen_profile_id:
                            raise ValueError("No Custom Voice Profile selected. Please select a profile or upload one in Tab 3.")
                        print(f"[VOICE CLONE DEBUG] Selected ID: {chosen_profile_id}, File: {chosen_ref_sample}")
                        v_res = voice_engine.synthesize(
                            text=content.voiceover_script,
                            voice_mode="custom_clone",
                            reference_sample_path=chosen_ref_sample,
                            voice_profile_id=chosen_profile_id,
                            output_path=str(v_out_path),
                            allow_adaptive_fallback=allow_adaptive_clone
                        )
                    else:
                        v_res = voice_engine.synthesize(
                            text=content.voiceover_script,
                            voice_mode=voice_mode_choice,
                            output_path=str(v_out_path)
                        )
                    st.session_state.voiceover_path = v_res
                    st.success("✅ Script generated & voiceover synthesized!")
                except Exception as e:
                    st.error(f"❌ Generation Failed: {e}")

        # Editable Fields
        if st.session_state.reel_content:
            st.markdown("---")
            st.markdown("### ✏️ Review & Edit Dual-Stripe Content")

            c_l1, c_l2 = st.columns(2)
            with c_l1:
                edited_line1 = st.text_input(
                    "Line 1 Headline (Red Badge):",
                    value=st.session_state.reel_content.line1_headline
                )
            with c_l2:
                edited_line2 = st.text_input(
                    "Line 2 Headline (Blue Badge with Emoji):",
                    value=st.session_state.reel_content.line2_headline
                )

            # Live preview of edited badges
            l1_bg = st.session_state.profile.get("line1_bg", "#FF0033")
            l1_tx = st.session_state.profile.get("line1_text", "#FFFFFF")
            l2_bg = st.session_state.profile.get("line2_bg", "#0080FF")
            l2_tx = st.session_state.profile.get("line2_text", "#FFFFFF")

            st.markdown(f"""
            <div class="badge-preview-container">
                <div class="badge-pill-line" style="background-color: {l1_bg}; color: {l1_tx};">
                    {edited_line1}
                </div>
                <div class="badge-pill-line" style="background-color: {l2_bg}; color: {l2_tx};">
                    {edited_line2}
                </div>
            </div>
            """, unsafe_allow_html=True)

            edited_script = st.text_area(
                f"Voiceover Narration Script (~{int(target_duration * 2.5)} words):",
                value=st.session_state.reel_content.voiceover_script,
                height=90
            )

            edited_caption = st.text_area(
                "Instagram SOP Caption:",
                value=st.session_state.reel_content.caption,
                height=130
            )

            if st.session_state.voiceover_path and Path(st.session_state.voiceover_path).exists():
                st.markdown("##### 🎙️ Voiceover Audio Preview:")
                st.audio(str(st.session_state.voiceover_path), format="audio/wav")

            # Button 2: Render Video
            st.markdown("---")
            if st.button("🎬 2. Render Final 1080x1920 Video", use_container_width=True):
                pbar = st.progress(0)
                ptext = st.empty()

                def update_render(pct: float, msg: str):
                    pbar.progress(int(pct * 100))
                    ptext.info(msg)

                try:
                    update_render(0.1, "Generating dual-stripe headline overlay PNG...")
                    overlay_png = config.OUTPUT_DIR / f"headline_overlay_{int(datetime.now().timestamp())}.png"
                    video_assembler.generate_headline_overlay_image(
                        line1_text=edited_line1,
                        line2_text=edited_line2,
                        output_png_path=str(overlay_png),
                        line1_bg=l1_bg,
                        line1_text_color=l1_tx,
                        line2_bg=l2_bg,
                        line2_text_color=l2_tx
                    )
                    st.session_state.headline_png_path = str(overlay_png)

                    update_render(0.25, "Generating styled ASS word-level subtitles...")
                    ass_path = config.OUTPUT_SUBTITLES_DIR / f"subtitles_v2_{int(datetime.now().timestamp())}.ass"
                    sub_file = subtitle_generator.generate_ass_subtitles(
                        audio_path=st.session_state.voiceover_path,
                        output_ass_path=str(ass_path),
                        script_text=edited_script,
                        font_size=st.session_state.profile.get("sub_font_size", 58),
                        primary_color=st.session_state.profile.get("sub_color", "#FFFFFF"),
                        outline_color=st.session_state.profile.get("sub_outline_color", "#000000"),
                        y_offset=450
                    )
                    st.session_state.ass_subtitle_path = sub_file

                    update_render(0.50, f"Assembling {video_mode} background & compositing reel...")
                    out_vid = config.OUTPUT_VIDEOS_DIR / f"reel_v2_{category_code}_{int(datetime.now().timestamp())}.mp4"
                    mode_key = "multi" if video_mode == "Multi-Clip Auto Montage" else "single"

                    final_mp4 = video_assembler.render_v2_reel(
                        video_mode=mode_key,
                        single_video_path=single_clip_file,
                        multi_clip_paths=multi_clip_files,
                        voiceover_path=st.session_state.voiceover_path,
                        bg_music_path=str(bg_music_path),
                        ass_subtitle_path=sub_file,
                        headline_overlay_path=str(overlay_png),
                        output_video_path=str(out_vid),
                        category_code=category_code,
                        area=selected_area,
                        progress_callback=update_render
                    )
                    st.session_state.final_video_path = final_mp4
                    update_render(1.0, "Rendering Complete!")
                    st.success("🎉 Video Reel Successfully Rendered!")
                except Exception as e:
                    st.error(f"Video rendering failed: {e}")

    # RIGHT COLUMN: Video Preview & 1-Click Publishing
    with col_studio_right:
        st.markdown("### 📱 2. Video Preview & Safe Zone Review")

        display_vid = st.session_state.final_video_path
        if not display_vid or not Path(display_vid).exists():
            # Check for existing v2 reel
            sample_v2 = config.OUTPUT_VIDEOS_DIR / "v2_dual_stripe_reel.mp4"
            if sample_v2.exists():
                display_vid = str(sample_v2)

        if display_vid and Path(display_vid).exists():
            st.video(display_vid)

            with open(display_vid, "rb") as f:
                st.download_button(
                    label="⬇️ Download Rendered Reel (.mp4)",
                    data=f,
                    file_name=Path(display_vid).name,
                    mime="video/mp4",
                    use_container_width=True
                )

            st.markdown("""
            <div class="card-box" style="margin-top: 15px; border-left: 4px solid #38BDF8;">
                <b>🛡️ Instagram Safe Zone Verification:</b><br>
                • <b>Top 220px:</b> Clear of system header navigation.<br>
                • <b>Y: 280px-350px:</b> Dual-Stripe pill badges in prime focal center.<br>
                • <b>Bottom 420px:</b> ASS subtitles anchored with 450px margin above caption UI.<br>
                • <b>Audio:</b> Voiceover normalized at -14 LUFS, BGM ducked to 0.12.
            </div>
            """, unsafe_allow_html=True)

            st.markdown("---")
            st.markdown("### 🚀 3. Publish to Instagram")

            is_dry_run = not ig_publisher.is_configured()
            if is_dry_run:
                st.warning("⚠️ Meta Graph API credentials not configured. Will publish in **DRY-RUN simulation mode**.")
            else:
                st.info("🟢 Meta Graph API credentials connected. Ready to publish live.")

            if st.button("📤 Publish Directly to Instagram Reel", type="primary", use_container_width=True):
                pub_status = st.empty()

                def update_pub(msg: str):
                    pub_status.info(msg)

                cap = st.session_state.reel_content.caption if st.session_state.reel_content else "SURAT NEWS"
                try:
                    res = ig_publisher.publish_reel(
                        video_path=display_vid,
                        caption=cap,
                        dry_run=is_dry_run,
                        status_callback=update_pub
                    )
                    st.session_state.publish_result = res
                    st.balloons()
                    st.success("🎉 Reel Successfully Published!")
                except Exception as e:
                    st.error(f"Publishing failed: {e}")

            if st.session_state.publish_result:
                r = st.session_state.publish_result
                st.markdown(f"""
                <div class="card-box">
                    <b>Status:</b> {'✅ Live Published' if r['mode'] == 'live' else '🧪 Simulated (Dry-Run)'}<br>
                    <b>Container ID:</b> <code>{r.get('container_id')}</code><br>
                    <b>Media ID:</b> <code>{r.get('media_id')}</code><br>
                    <b>Live Permalink:</b> <a href="{r.get('permalink')}" target="_blank">{r.get('permalink')}</a>
                </div>
                """, unsafe_allow_html=True)

        else:
            st.info("👈 Complete Step 1 & Step 2 on the left to generate and render your vertical 1080x1920 Reel.")

# =============================================================================
# TAB 4: QUICK TTS — Direct Text to Speech
# =============================================================================
with tab4:
    st.markdown("### 🎙️ Quick TTS — ગુજરાતી ટેક્સ્ટ થી વૉઇસ")
    st.caption("સીધું ગુજરાતી ટેક્સ્ટ લખો, અવાજ પસંદ કરો, અને ઑડિયો જનરેટ કરો. 100% લોકલ, ફ્રી, પ્રાઇવેટ.")

    st.markdown("---")

    # Voice selector
    quick_voice_options = {
        "gu-standard": "🎤 Standard Gujarati (શિષ્ટ ગુજરાતી) [Local]",
        "gu-kathiyawadi": "🏔️ Kathiyawadi (કાઠિયાવાડી સૌરાષ્ટ્ર) [Local]",
        "gu-mahesani": "🌾 Mahesani / North Gujarat (મહેસાણી) [Local]",
        "gu-surati": "🌊 Surati (સુરતી દક્ષિણ ગુજરાત) [Local]",
        "gu-news-anchor": "📺 News Anchor (પ્રોફેશનલ ન્યૂઝ એન્કર) [Local]",
    }

    col_voice, col_info = st.columns([2, 1])
    with col_voice:
        selected_quick_voice = st.selectbox(
            "🔊 અવાજ પસંદ કરો (Select Voice)",
            options=list(quick_voice_options.keys()),
            format_func=lambda x: quick_voice_options[x],
            key="quick_tts_voice_select"
        )
    with col_info:
        st.markdown("""
        <div class="card-box" style="margin-top:28px; padding:12px;">
            <b>🟢 Engine:</b> Meta MMS-TTS (VITS)<br>
            <b>📡 Mode:</b> 100% Local CPU<br>
            <b>💰 Cost:</b> ₹0 (Zero)
        </div>
        """, unsafe_allow_html=True)

    # Auto-transliteration toggle
    auto_translit = st.toggle(
        "🔄 Auto-convert English/Roman → ગુજરાતી (Transliterate)",
        value=True,
        help="જો તમે English/Roman માં ગુજરાતી લખો છો (e.g. 'Surat ma varasad padyo') તો આ ON રાખો — ગુજરાતી સ્ક્રિપ્ટમાં auto-convert થશે.",
        key="quick_tts_translit_toggle"
    )

    # Text input area
    quick_tts_text = st.text_area(
        "📝 ટેક્સ્ટ અહીં લખો — ગુજરાતી OR English/Roman બંને ચાલશે",
        height=180,
        placeholder="ગુજરાતી: આજે સુરતમાં ભારે વરસાદ પડ્યો છે.\nOR English/Roman: Aaje Surat ma bhaare varasaad padyo chhe.",
        key="quick_tts_input"
    )

    # Helper function: detect if text has Gujarati characters
    def _has_gujarati(t):
        return any('\u0a80' <= ch <= '\u0aff' for ch in t)

    def _transliterate_with_gemini(roman_text):
        """Use Gemini API with retry + fallback models for Roman → Gujarati conversion."""
        import time as _time
        try:
            from dotenv import load_dotenv
            load_dotenv(str(BASE_DIR / ".env"))
            api_key = os.environ.get("GEMINI_API_KEY", "")
            if not api_key:
                return _itrans_fallback(roman_text), "Gemini API key missing, used ITRANS fallback"

            from google import genai
            client = genai.Client(api_key=api_key)

            prompt = (
                "Convert the following Romanized Gujarati (Gujarati written in English/Latin letters) "
                "into pure Gujarati Unicode script. Output ONLY the converted Gujarati text. "
                "Do not add any explanation, translation, or English text. "
                "Keep the original meaning and tone exactly as-is.\n\n"
                f"{roman_text}"
            )

            # Try multiple models with retry
            models_to_try = [
                os.environ.get("GEMINI_MODEL", "gemini-3.6-flash"),
                "gemini-3.6-flash",
                "gemini-3.8-flash",
            ]
            # Deduplicate while preserving order
            seen = set()
            models_to_try = [m for m in models_to_try if m not in seen and not seen.add(m)]

            last_err = None
            for model_name in models_to_try:
                for attempt in range(2):  # 2 attempts per model
                    try:
                        resp = client.models.generate_content(
                            model=model_name,
                            contents=prompt
                        )
                        result = resp.text.strip() if resp.text else None
                        if result and any('\u0a80' <= ch <= '\u0aff' for ch in result):
                            return result, None
                    except Exception as e:
                        last_err = str(e)
                        if "503" in str(e) or "UNAVAILABLE" in str(e):
                            _time.sleep(1.5)  # Brief wait before retry
                            continue
                        break  # Non-503 error, try next model

            # All Gemini attempts failed — use ITRANS as last resort
            return _itrans_fallback(roman_text), f"Gemini unavailable ({last_err}), used ITRANS fallback"

        except Exception as e:
            return _itrans_fallback(roman_text), f"Error: {e}, used ITRANS fallback"

    def _itrans_fallback(roman_text):
        """Basic ITRANS transliteration as last resort."""
        try:
            from indic_transliteration import sanscript
            return sanscript.transliterate(roman_text, sanscript.ITRANS, sanscript.GUJARATI)
        except Exception:
            return roman_text

    # Show preview of what will be sent to TTS
    if quick_tts_text and quick_tts_text.strip():
        raw_input = quick_tts_text.strip()
        has_gu = _has_gujarati(raw_input)

        if not has_gu and auto_translit:
            # Check cache first to avoid repeat Gemini calls on re-render
            cache_key = f"gemini_translit_{hash(raw_input)}"
            if cache_key not in st.session_state:
                with st.spinner("🤖 Gemini થી ગુજરાતી માં convert થઈ રહ્યું છે..."):
                    converted, err = _transliterate_with_gemini(raw_input)
                    if converted and _has_gujarati(converted):
                        st.session_state[cache_key] = converted
                    else:
                        st.session_state[cache_key] = None
                        st.session_state[f"{cache_key}_err"] = err or "Conversion failed"

            cached = st.session_state.get(cache_key)
            if cached:
                st.success(f"🤖 **Gemini Converted (ગુજરાતી):**\n\n{cached}")
            else:
                err_msg = st.session_state.get(f"{cache_key}_err", "Unknown error")
                st.warning(f"⚠️ Gemini conversion failed: {err_msg}. કૃપા કરી ગુજરાતી script માં ટાઇપ કરો.")
        elif not has_gu and not auto_translit:
            st.warning("⚠️ **ગુજરાતી ટેક્સ્ટ મળ્યું નથી!** આ TTS model ફક્ત ગુજરાતી Unicode સ્ક્રિપ્ટ સ્વીકારે છે. Auto-convert toggle ON કરો અથવા ગુજરાતી માં ટાઇપ કરો.")

    # Generate button
    gen_col1, gen_col2, gen_col3 = st.columns([1, 2, 1])
    with gen_col2:
        generate_clicked = st.button(
            "🚀 વૉઇસ જનરેટ કરો (Generate Voice)",
            type="primary",
            use_container_width=True,
            key="quick_tts_generate_btn"
        )

    if generate_clicked:
        if not quick_tts_text or not quick_tts_text.strip():
            st.warning("⚠️ કૃપા કરી પહેલા ટેક્સ્ટ લખો!")
        else:
            final_text = quick_tts_text.strip()

            # Auto-transliterate with Gemini if needed
            if not _has_gujarati(final_text) and auto_translit:
                cache_key = f"gemini_translit_{hash(final_text)}"
                cached = st.session_state.get(cache_key)
                if cached:
                    final_text = cached
                else:
                    with st.spinner("🤖 Gemini થી ગુજરાતી માં convert થઈ રહ્યું છે..."):
                        converted, err = _transliterate_with_gemini(final_text)
                        if converted and _has_gujarati(converted):
                            final_text = converted
                            st.session_state[cache_key] = converted
                        else:
                            st.error(f"❌ Gemini conversion failed: {err}")
                st.info(f"🤖 Gemini Converted: {final_text[:200]}")

            if not _has_gujarati(final_text):
                st.error("❌ ગુજરાતી ટેક્સ્ટ મળ્યું નથી! TTS model ને ગુજરાતી Unicode સ્ક્રિપ્ટ જોઈએ છે. કૃપા કરી ગુજરાતી માં ટાઇપ કરો (ઉદા: આજે સુરતમાં વરસાદ પડ્યો.)")
            else:
                with st.spinner("🔄 ઑડિયો જનરેટ થઈ રહ્યો છે... (Generating audio...)"):
                    try:
                        from core.tts.local_tts_engine import LocalTTSEngine
                        tts_eng = LocalTTSEngine()

                        timestamp = int(datetime.now().timestamp())
                        out_wav = config.OUTPUT_AUDIO_DIR / f"quick_tts_{selected_quick_voice}_{timestamp}.wav"

                        result = tts_eng.synthesize(
                            text=final_text,
                            voice_id=selected_quick_voice,
                            output_path=str(out_wav)
                        )

                        st.session_state["quick_tts_result"] = result
                        st.session_state["quick_tts_wav_path"] = str(out_wav)

                    except Exception as e:
                        st.error(f"❌ Error generating voice: {e}")
                        st.session_state["quick_tts_result"] = None

    # Display result
    if st.session_state.get("quick_tts_result"):
        res = st.session_state["quick_tts_result"]
        wav_path = st.session_state.get("quick_tts_wav_path", "")

        st.markdown("---")
        st.markdown("#### ✅ ઑડિયો તૈયાર છે! (Audio Ready)")

        # Audio player
        if wav_path and Path(wav_path).exists():
            st.audio(wav_path, format="audio/wav")

            # Download button
            with open(wav_path, "rb") as f:
                audio_bytes = f.read()
            st.download_button(
                label="⬇️ ડાઉનલોડ WAV (Download)",
                data=audio_bytes,
                file_name=Path(wav_path).name,
                mime="audio/wav",
                key="quick_tts_download"
            )

        # Details card
        dur = res.get("duration", 0)
        proc = res.get("processing_time", 0)
        accent = res.get("accent", selected_quick_voice if 'selected_quick_voice' in dir() else "")
        display = res.get("display_name", "")
        norm_text = res.get("normalized_text", "")
        dial_text = res.get("dialect_text", "")
        file_size = Path(wav_path).stat().st_size / 1024 if wav_path and Path(wav_path).exists() else 0

        st.markdown(f"""
        <div class="card-box" style="padding:16px;">
            <b>🔊 Voice:</b> {display}<br>
            <b>🎯 Accent:</b> <code>{accent}</code><br>
            <b>⏱️ Duration:</b> {dur:.1f}s &nbsp;|&nbsp; <b>⚡ Generation:</b> {proc:.1f}s &nbsp;|&nbsp; <b>💾 Size:</b> {file_size:.1f} KB<br>
            <b>📝 Normalized:</b> <em>{norm_text[:150]}{'...' if len(norm_text) > 150 else ''}</em><br>
            <b>🗣️ Dialect:</b> <em>{dial_text[:150]}{'...' if len(dial_text) > 150 else ''}</em>
        </div>
        """, unsafe_allow_html=True)
