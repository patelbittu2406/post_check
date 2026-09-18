# 🎨 Prarambh Reel Studio (V2) — Canva-Grade UI & Engine

> **"Surat ના સમાચાર, હવે Reels માં."**
> AI-Powered Hyperlocal Gujarati Instagram Reel Production Platform

---

## 🌟 Overview

**Prarambh Reel Studio** is a modern SaaS video creation studio built for rapid generation of 1080x1920 (9:16) vertical Instagram Reels from raw Gujarati news bulletins.

Migrated from Streamlit to a **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion** frontend and a high-performance **FastAPI** Python REST backend, Prarambh provides a pixel-perfect, Canva/Linear-grade user experience with real-time video simulation, interactive dual-stripe headline badges, and 1-click Instagram publishing.

---

## 🏷️ Brand Identity & Design System

- **Product Name:** **Prarambh** (પ્રારંભ)
- **Palette:**
  - **Brand Pink:** `#E91E63` / `#C2185B` / `#F06292`
  - **Brand Yellow:** `#FDD835` / `#FFEB3B`
  - **Brand Cyan:** `#00BCD4` / `#0097A7`
  - **Brand Gradient:** `linear-gradient(135deg, #E91E63 0%, #FDD835 50%, #00BCD4 100%)`
  - **Dark Base:** `#0A0A0F`, **Surface:** `#12121A`, **Elevated:** `#1A1A24`, **Border:** `#26262F`
- **Typography:** Outfit (Display), Inter (Body), Noto Sans Gujarati (Subtitles & Headlines), JetBrains Mono (Code/Timers)

---

## 🗺️ Information Architecture (Routes)

```
/                       → Redirects to Studio
/dashboard              → 🎬 Canva-grade 3-Column Reel Studio Canvas
/library                → 📚 All rendered reels, drafts, MP4 downloads & quick-publish
/analytics              → 📊 KPIs, Reels velocity charts, and category breakdown
/settings               → ⚙️ Linear-style dedicated Settings Hub
   ├── /settings/profile      → Avatar, presenter title, channel handle, timezone
   ├── /settings/ai-models    → 🤖 Multi-LLM API Keys (Gemini, OpenAI, Claude) & Test latency
   ├── /settings/instagram    → 📸 Meta Graph API credentials & Dry-Run test publisher
   ├── /settings/voice        → 🎙️ Regional Gujarati accents & Zero-Shot Voice Cloner
   ├── /settings/branding     → 🎨 Prarambh Watermark & Dual-Stripe pill colors
   ├── /settings/assets       → 📦 BGM soundtracks & B-roll footage library
   └── /settings/advanced     → ⚡ Safe-zone margins (220px/420px), -14 LUFS & BGM ducking
```

---

## 🎬 Dashboard (3-Column Reel Studio)

```
┌────────────────────────┬───────────────────────────┬────────────────────────┐
│  LEFT (340px)          │        CENTER             │   RIGHT (360px)        │
│  Production Controls   │   9:16 Phone Preview      │   Inspector & Render   │
│  - News Category       │   + Realtime Overlays     │   - Dual-Stripe Editor │
│  - Surat Area          │   - Top Safe Zone (220px) │   - Script & Audio     │
│  - Video Composition   │   - Dual-Stripe Badges    │   - 1080x1920 Render   │
│  - BGM Ducking         │   - Word ASS Subtitles    │   - 1-Click Instagram  │
│  - Voice Engine        │   - Bottom Safe (420px)   │   - MP4 Download       │
│  - Raw News Input      │   + Timeline Scrubber     │                        │
└────────────────────────┴───────────────────────────┴────────────────────────┘
```

---

## 🚀 How to Run

### Quick Start (Single Command)

```bash
./run.sh
```

This starts:
1. **FastAPI Backend:** [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive Swagger Docs at `/docs`)
2. **Next.js 14 Frontend:** [http://localhost:3000](http://localhost:3000)

### Manual Start

**Backend:**
```bash
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user-profile` | Fetch active user profile from `user_profile.json` |
| `PUT` | `/api/user-profile` | Save updated credentials and layout styles |
| `POST` | `/api/generate-script` | Multi-LLM script & dual-stripe headline generation |
| `POST` | `/api/generate-voice` | Voiceover synthesis (Local neural fallback & Cloned Voice) |
| `POST` | `/api/voice/generate` | Mastered voice synthesis with audio tags and flow tuning |
| `POST` | `/api/voice/preview` | Real-time flow settings preview audio generation |
| `GET` | `/api/voice/list` | List default anchors (`PRARAMBH_MALE`, `PRARAMBH_FEMALE`) & clones |
| `GET` | `/api/voice/tags` | List all emotion, delivery, and reaction audio tags |
| `POST` | `/api/voice/clone/upload` | Upload & master reference audio for custom voice cloning |
| `DELETE` | `/api/voice/clone/{id}` | Delete custom voice profile from registry |
| `POST` | `/api/render-video` | 1080x1920 MP4 reel assembly with ASS subtitles & badges |
| `POST` | `/api/capcut/render` | 🎬 1-Click CapCut-grade beat-synced 30s Reel compiler |
| `GET` | `/api/capcut/status/{id}` | Poll CapCut render job status and stage progress |
| `WS` | `/api/capcut/ws/{id}` | WebSocket real-time 6-stage render progress updates |
| `POST` | `/api/capcut/analyze` | Fast motion scoring and beat-cut analysis for timeline preview |
| `GET` | `/api/capcut/presets` | Get CapCut presets (Serious Anchor, Fast News, Festive) |
| `POST` | `/api/capcut/preview-segment` | Render 3s preview of any micro-segment with motion/crop |
| `POST` | `/api/publish-instagram` | Meta Graph API Reel publisher (live & dry-run simulation) |
| `GET` | `/api/library` | List rendered MP4 reels with metadata |
| `GET` | `/api/analytics` | KPIs, render performance, and category distribution metrics |

---

## 🎬 CapCut-Style Auto Video Editor (Local, Free, Zero-Cost)

Prarambh Reel Studio features a local automatic video editor that takes **2–5 raw video clips + BGM + voiceover** and compiles a **beat-synced, motion-driven 30-second 1080x1920 Instagram Reel**:

1. **Smart Highlight Extraction:** PySceneDetect (`ContentDetector` + `AdaptiveDetector`) + OpenCV Farneback Dense Optical Flow & Laplacian sharpness ranking.
2. **Beat & Rhythm Sync:** Librosa BPM tracking & downbeat accent detection + voiceover pause detection (pauses > 300ms) with cut snapping within ±0.35s tolerance.
3. **Smart 9:16 Vertical Framing:** OpenCV Haar Cascade face detection with rule-of-thirds (face at top 1/3) & saliency centroid auto-cropping to 1080x1920.
4. **Dynamic Ken Burns Motion:** Zoom In (1.00 → 1.10), Zoom Out (1.10 → 1.00), Pan Left, Pan Right, and Punch + White Flash on musical accents.
5. **Multi-Input XFade Transitions:** Cross-dissolve, whip pan left/right, white flash, and hard cuts chained via FFmpeg.
6. **Sidechain Audio Ducking & Mastering:** BGM ducked to 0.12 under voiceover, mastered to `-14 LUFS` EBU R128 loudness.
7. **Overlay Compositing:** Dual-stripe headline badges (Line 1 Red + Line 2 Dodger Blue), burned ASS subtitles, and Surat category location tags.


---

## 🎙️ IndicF5 Voice Engine & Audio Tags System

Prarambh 2.0 features a 100% local, zero-cost broadcast voice engine with **exact TWO primary anchor voices** (`PRARAMBH_MALE` & `PRARAMBH_FEMALE`), custom zero-shot cloning, and full ElevenLabs-grade expressive audio tag support:

- **Emotion Tags:** `[excited]`, `[happy]`, `[serious]`, `[sad]`, `[angry]`, `[concerned]`, `[curious]`, `[confident]`, `[nervous]`, `[whispers]`
- **Delivery Tags:** `[pauses]`, `[shouts]`, `[softly]`, `[stammers]`
- **Reaction Tags:** `[laughs]`, `[sighs]`, `[gasps]`, `[clears throat]`, `[gulps]`
- **Broadcast Mastering:** Exact `-14 LUFS` EBU R128 loudness normalization, 22050Hz 16-bit Mono PCM WAV, de-esser, parametric vocal EQ (<80Hz cut, 2.5-4kHz boost), and 2:1 compression.

---

---

## 🎬 Multi-Language Subtitle Style Engine (20 Viral Presets + Bilingual Font Logic)

Prarambh 2.0 introduces a **bilingual subtitle rendering engine** designed to replicate viral Instagram Reels from top Indian and global creators (Hormozi, Nas Daily, viral Gujarati finance/news channels).

### 🎯 Flagship Visual Breakdown (`mixed_highlight`)

```
┌─────────────────────────────────────────────┐
│                                             │
│   આનો મતલબ છે તમારો   VIDEO   ના           │
│   ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔   ▔▔▔▔▔   ▔▔▔           │
│   (White Gujarati)   (Yellow  (White       │
│                       Anton)   Gujarati)   │
│                                             │
│   CONTENT   માં   VALUE   નથી              │
│   ▔▔▔▔▔▔▔   ▔▔▔   ▔▔▔▔▔   ▔▔▔▔             │
│   (Yellow   (White (Yellow (White          │
│    Anton)   Guj)   Anton)  Guj)            │
│                                             │
└─────────────────────────────────────────────┘
```

- **Gujarati Words:** Noto Sans Gujarati Bold (`#FFFFFF` White, 72px)
- **English Words:** Anton Regular (`#FFD700` Yellow, UPPERCASE, 110% scale)
- **Inline Font Switching:** Uses ASS `\fnAnton\c&H00D7FF&\fscx110\fscy110` mid-line overrides
- **Effects:** 5px high-contrast black outline, 3px soft shadow, 140ms soft bounce chunk entrance

### 🌟 All 20 Production-Ready Style Presets

| # | Style ID | Name | Category | Latin Font | Colors (Guj / Eng) | Best For |
|---|---|---|---|---|---|---|
| 1 | `mixed_highlight` | Mixed Language Highlight | Bilingual | Anton | `#FFFFFF` / `#FFD700` | Flagship viral news & motivational reels |
| 2 | `hormozi_classic` | Hormozi Classic | Bold | Anton | `#FFFFFF` / `#FFCC00` | Finance, high-energy motivation |
| 3 | `capcut_default` | CapCut Default | Minimal | Montserrat | `#FFFFFF` / `#00E5FF` | Clean rounded dark pill overlays |
| 4 | `neon_cyber` | Neon Cyber | Cyber | Bebas Neue | `#FFFFFF` / `#00FFFF` | Cyberpunk, tech, crime alerts |
| 5 | `gujarati_pride` | Gujarati Pride | Bilingual | Anton | `#FF6600` / `#FFFFFF` | Saffron Gujarati words + white Latin |
| 6 | `news_anchor` | News Anchor | News | Montserrat | `#FFFFFF` / `#FFCC00` | Serious broadcast news lower-third ticker |
| 7 | `karaoke_fill` | Karaoke Fill | Bold | Anton | `#FFFFFF` / `#FFD700` | Word-by-word karaoke sweep fill |
| 8 | `typewriter` | Typewriter | Minimal | Poppins | `#FFFFFF` / `#00FF66` | Terminal letter reveal with neon green cursor |
| 9 | `word_stack` | Word Stack | Bold | Anton | `#FFFFFF` / `#FF3366` | Single oversized punchy word bursts |
| 10 | `gradient_pop` | Gradient Pop | Cyber | Poppins | `#FFFFFF` / `#FF6EC7` | Vibrant ultraviolet & pink pop |
| 11 | `outline_only` | Outline Only | Minimal | Anton | `#000000` / `#000000` | Transparent fill with thick white & gold stroke |
| 12 | `two_line_split` | Two-Line Split | Bilingual | Anton | `#FFFFFF` / `#FFD700` | Gujarati line 1, English keywords line 2 |
| 13 | `emoji_enhanced` | Emoji Enhanced | Festive | Anton | `#FFFFFF` / `#FFD700` | Auto emoji flair on power words |
| 14 | `boxed_words` | Boxed Words | Minimal | Poppins | `#FFFFFF` / `#FFD700` | Per-word colored box container |
| 15 | `rainbow_wave` | Rainbow Wave | Festive | Anton | `#FFFFFF` / `#00E5FF` | Animated color spectrum sequence |
| 16 | `shadow_depth` | Shadow Depth | Bold | Anton | `#FFFFFF` / `#FFD700` | Extruded 3D drop shadow for depth |
| 17 | `glow_pulse` | Glow Pulse | Cyber | Poppins | `#FFFFFF` / `#00E5FF` | Soft atmospheric breathing cyan glow |
| 18 | `bounce_wave` | Bounce Wave | Bold | Anton | `#FFFFFF` / `#00FF7F` | Rhythmic overshoot wave bounce |
| 19 | `shake_emphasis` | Shake Emphasis | News | Anton | `#FFFFFF` / `#FF1744` | Alert vibration & urgent red keywords |
| 20 | `festive_gujarati` | Festive Gujarati | Festive | Poppins | `#FFD700` / `#FFFFFF` | Marigold gold + crimson red for Navratri/Diwali |

---

## ⌨️ Keyboard Shortcuts

- <kbd>⌘K</kbd> or <kbd>Ctrl+K</kbd> — Open Command Palette
- <kbd>/</kbd> — Focus search
- <kbd>ESC</kbd> — Close modals and palette

