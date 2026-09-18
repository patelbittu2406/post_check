# 🎬 Surat News Reel Engine (V2)

An automated AI newsroom pipeline designed to generate high-production, broadcast-grade **1080x1920 (9:16) vertical Instagram Reels** in authentic Gujarati with zero manual editing.

Features **Dual-Stripe Headlines**, **Multi-LLM Adaptation** (Gemini, OpenAI, Claude), **100% Free Voice Synthesis & Custom Cloning**, **Dynamic ASS Word-Level Subtitles**, **Multi-Clip Auto Splicer**, and **Direct 1-Click Instagram Publishing** via Meta Graph API.

---

## 📑 Table of Contents

1. [System Overview & Architecture](#-system-overview--architecture)
2. [Prerequisites](#-prerequisites)
3. [Quick Start Installation](#-quick-start-installation)
4. [Configuration (.env & User Profile)](#-configuration-env--user-profile)
5. [Running the Interactive Web Application](#-running-the-interactive-web-application)
6. [Web Dashboard Walkthrough](#-web-dashboard-walkthrough)
   - [Tab 1: Reel Studio](#tab-1--reel-studio)
   - [Tab 2: User Profile & Settings](#tab-2-user-profile--settings)
   - [Tab 3: Visual & Voice Styling](#tab-3-visual--voice-styling)
7. [Running Tests & Automation Scripts via CLI](#-running-tests--automation-scripts-via-cli)
8. [Directory Structure](#-directory-structure)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏗️ System Overview & Architecture

The engine transforms raw, factual Gujarati news notes into polished, vertical Instagram Reels:

```
[ Raw News Bulletin ] 
        │
        ▼
[ Multi-LLM Adapter ] ───► Dual-Stripe Headlines (Red/Blue Pill Badges) + Timed Script (~2.5 words/sec)
        │
        ├──► [ Voice Engine ] ──────► Normalized -14 LUFS Audio (Edge-TTS / Custom Clone)
        ├──► [ Subtitle Engine ] ───► Dynamic ASS Subtitles (Safe zone margin: 450px)
        └──► [ Video Assembler ] ──► FFmpeg Compositor (Montage Splicer + BGM Ducking to 0.12)
                    │
                    ▼
        [ 1080x1920 MP4 Reel ] 
                    │
                    ▼
      [ Instagram Graph API (v19.0+) ] ──► Live Publishing or Dry-Run Simulation
```

### Key Highlights:
- **Dual-Stripe Headlines**: Line 1 (Red pill badge: premise) and Line 2 (Blue pill badge: twist/resolution + contextual emoji).
- **Multi-LLM Support**: Google Gemini (default: `gemini-3.8-flash` / `gemini-3.6-flash`), OpenAI (`gpt-4o`), and Anthropic (`claude-3-5-sonnet`), with instant offline rule-based fallback.
- **100% Free Voice Engine**: Edge-TTS Gujarati voices (`Dhwani`, `Niranjan`) and zero-shot custom voice cloning with audio normalization (-14 LUFS, 22050Hz mono).
- **Instagram Safe Zones**: Calibrated for Instagram UI (top 220px header clearance, bottom 420px UI safe zone).
- **Audio Ducking**: Smart ducking of background music beat to 0.12 volume during voiceover.

---

## 💻 Prerequisites

Ensure your system meets the following requirements:
- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows (via WSL2).
- **Python**: Version `3.10` or higher (tested on `Python 3.10.12`).
- **FFmpeg & FFprobe**: Included automatically via the `static-ffmpeg` Python package; system `ffmpeg` also supported.
- **Gujarati Font**: Noto Sans Gujarati TTF is pre-bundled in `assets/fonts/NotoSansGujarati-Bold.ttf`.

---

## 🚀 Quick Start Installation

Follow these steps to set up the project locally:

### 1. Clone or Open the Project
```bash
cd "/home/dev/Documents/Post check"
```

### 2. Create and Activate Virtual Environment
```bash
# Create virtual environment (if not already created)
python3 -m venv venv

# Activate on Linux / macOS:
source venv/bin/activate

# Or activate on Windows (PowerShell):
# .\venv\Scripts\Activate.ps1
```

### 3. Install Required Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## ⚙️ Configuration (.env & User Profile)

### Step 1: Set Up `.env` File
Create a `.env` file from the provided template:
```bash
cp .env.example .env
```

Open `.env` and configure your API keys as needed:
```ini
# ===========================================================================
# Surat News Reel Engine - Environment Configuration
# ===========================================================================

# 1. Google Gemini API Key (Recommended for Gujarati scripts & headlines)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# 2. Meta Instagram Graph API (v19.0+) (Optional: leave blank for Dry-Run mode)
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_facebook_page_long_lived_access_token

# 3. Public Video Hosting (Optional: for Instagram Graph API video URL ingestion)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

> **Note:** If API keys are left blank or network errors occur, the system automatically uses the built-in **offline rule-based generator** so the pipeline never fails!

### Step 2: User Profile Settings (`user_profile.json`)
Settings configured in the Web Dashboard (such as active LLM provider, color palettes, subtitle font sizes, and target durations) are automatically saved to `user_profile.json`.

---

## 🖥️ Running the Interactive Web Application

Start the Streamlit Operator Dashboard:

```bash
# Ensure virtualenv is active
source venv/bin/activate

# Launch Streamlit
streamlit run app.py
```

Or run via Python module:
```bash
python -m streamlit run app.py
```

Once started, open your browser at:
👉 **`http://localhost:8501`**

---

## 🧭 Web Dashboard Walkthrough

The interface consists of 3 dedicated tabs:

### Tab 1: 🎬 Reel Studio
The main production console to generate, review, and render reels:

1. **Sidebar Production Controls**:
   - **News Category**: Select category (e.g., `N01` General News, `C01` Crime Watch, `T01` Traffic, `A01` Civic Awareness, `F01` Festivals & Events, `B01` Business).
   - **Hyperlocal Area**: Choose a specific Surat neighborhood (e.g., *Adajan*, *Vesu*, *Varachha*, *Katargam*, or *All Surat*).
   - **Timeline Duration**: Select `15`, `30`, `45`, or `60` seconds (script auto-paces at ~2.5 words per second).
   - **Video Ingest Mode**:
     - *Single Video File*: Select stock B-roll (`surat_city_loop.mp4`) or upload a custom video.
     - *Multi-Clip Auto Montage*: Upload multiple raw video clips; the system automatically splices and transitions them across the timeline.
   - **Background Music**: Select news beat background music.
   - **Voice Engine**: Choose between `Edge-TTS Gujarati Female (Dhwani)`, `Edge-TTS Gujarati Male (Niranjan)`, or your own `Custom Human Voice Clone`.

2. **Step 1 — Raw News Bulletin**:
   - Input raw Gujarati news facts, press releases, or bullet points.
   - Click **🚀 1. Generate AI Script & Voiceover**.
   - Review and customize:
     - **Line 1 Headline** (Red pill badge).
     - **Line 2 Headline** (Blue pill badge with contextual emoji).
     - **Voiceover Narration Script** (timed to selected duration).
     - **Instagram Caption** (with hashtags and CTAs).
   - Listen to the audio preview directly in the browser.

3. **Step 2 — Render Final 1080x1920 Video**:
   - Click **🎬 2. Render Final 1080x1920 Video**.
   - The engine generates the dual-stripe PNG overlay, creates ASS subtitles, normalizes audio to -14 LUFS, ducks BGM to 0.12, and renders the 1080x1920 MP4.

4. **Step 3 — Preview & 1-Click Publish**:
   - Preview the vertical video inside the phone mockup.
   - Click **⬇️ Download Rendered Reel (.mp4)** to save locally.
   - Click **📤 Publish Directly to Instagram Reel** to publish live (or dry-run simulate).

---

### Tab 2: ⚙️ User Profile & Settings
- **AI Model Provider**: Switch between `Gemini`, `OpenAI`, and `Claude`.
- **API Keys**: Enter and securely manage your Google Gemini, OpenAI, and Anthropic keys.
- **Meta Instagram Graph API**: Set your `Instagram Business Account ID` and `Facebook Page Long-Lived Access Token`.
- Click **Save Profile Settings** to persist configurations to `user_profile.json`.

---

### Tab 3: 🎨 Visual & Voice Styling
- **Dual-Stripe Badge Styler**: Pick custom background and text colors for Line 1 and Line 2 badges.
- **Subtitle Customizer**: Adjust subtitle font size, primary color, and outline color.
- **Interactive Phone Preview**: Drag and reposition headline badges and subtitles freely on the smartphone simulator with magnetic snap guides.
- **Custom Voice Sample Ingestion**:
  - Upload human voice reference audio (`.mp3`, `.wav`, `.m4a`).
  - Automatically normalizes audio to **22050Hz 16-bit mono WAV at -14 LUFS**.
  - Select tone style (*Serious News*, *Energetic*, *Fast News*, *Expressive*) and register the voice profile into `voice_registry.json`.

---

## 🧪 Running Tests & Automation Scripts via CLI

You can run standalone test suites and utility scripts directly from your terminal:

### 1. Generate Sample Assets (BGM & B-roll)
Generates the background news beat loop (`surat_news_bgm.mp3`) and sample 1080x1920 B-roll video (`surat_city_loop.mp4`):
```bash
python assets/generate_sample_assets.py
```

### 2. Run End-to-End V2 Integration Test
Tests user profile persistence, dual-stripe headline generation, voice synthesis (-14 LUFS), ASS subtitle styling, multi-clip video montage assembly, and Instagram dry-run publisher:
```bash
python tests/test_v2_pipeline.py
```

### 3. Run V1 Pipeline Integration Test
Validates the baseline 5-phase generation pipeline:
```bash
python tests/test_pipeline.py
```

### 4. Run Voice Pipeline Integration Test
Validates audio preprocessing, tone matching, and voice synthesis:
```bash
python tests/test_voice_pipeline.py
```

---

## 📁 Directory Structure

```
Post check/
├── app.py                      # Streamlit 3-Tab Operator Dashboard
├── config.py                   # Global configuration, safe zones, and paths
├── requirements.txt            # Python dependencies
├── user_profile.json           # User profile and UI state persistence
├── .env.example                # Template for environment variables
├── .env                        # Local environment configuration (API keys)
│
├── assets/                     # Media assets and templates
│   ├── audio/                  # Background music beats (.mp3)
│   ├── broll/                  # Stock vertical video footage (.mp4)
│   ├── fonts/                  # NotoSansGujarati-Bold.ttf
│   ├── templates/              # Visual templates
│   ├── user_clips/             # Uploaded user clips for auto-splicer
│   ├── voices/                 # Cloned voice reference samples & voice_registry.json
│   └── generate_sample_assets.py # Sample BGM and B-roll generation script
│
├── core/                       # Core engine modules
│   ├── llm_adapter.py          # Multi-LLM provider client (Gemini, OpenAI, Claude)
│   ├── sop_generator.py        # Gujarati news script & caption generation
│   ├── voice_engine.py         # Prarambh Voice Engine (IndicF5, Fallback Chain, Registry)
│   ├── audio_tag_parser.py     # Audio Tag Parser ([excited], [serious], [pauses], etc.)
│   ├── voice_postprocess.py    # Broadcast mastering (-14 LUFS, 22050Hz Mono PCM, EQ, Comp)
│   ├── subtitle_generator.py   # Word-level ASS subtitle generator
│   ├── video_assembler.py      # V2 video renderer, montage splicer, and dual-stripe overlays
│   ├── video_composer.py       # Baseline video compositing engine
│   └── ig_publisher.py         # Meta Instagram Graph API publisher (live & dry-run)
│
├── output/                     # Rendered outputs
│   ├── audio/                  # Synthesized voiceover files (.wav)
│   ├── subtitles/              # Generated ASS subtitle files (.ass)
│   └── videos/                 # Rendered 1080x1920 MP4 reels
│
└── tests/                      # Integration and unit tests
    ├── test_voice_engine.py    # Comprehensive voice engine & tag parser tests
    ├── test_v2_pipeline.py     # End-to-end V2 pipeline test
    ├── test_conversational_delivery.py # Speech pacing & thought-group tests
    └── test_pipeline.py        # Baseline pipeline test
```

---

## ❓ Troubleshooting & FAQs

### Q1: FFmpeg was not found on my system. Do I need to install it?
**No.** The project includes `static-ffmpeg` in `requirements.txt`. The helper functions in `config.py` automatically detect and resolve the bundled binary path. If you prefer to use system FFmpeg, install it via:
```bash
# Ubuntu / Debian:
sudo apt-get install -y ffmpeg

# macOS (Homebrew):
brew install ffmpeg
```

### Q2: What if my Gemini API key is missing or encounters a rate limit?
The `LLMAdapter` in `core/llm_adapter.py` includes an intelligent **rule-based offline fallback**. If an API key is missing or the provider returns an error (e.g., 503 or quota limit), it will automatically generate authentic Gujarati dual-stripe headlines and SOP scripts based on pre-calibrated news templates.

### Q3: How does Dry-Run mode work for Instagram publishing?
When `INSTAGRAM_BUSINESS_ACCOUNT_ID` or `FACEBOOK_PAGE_ACCESS_TOKEN` is not configured, the publisher runs in **Dry-Run mode**. It verifies video specifications, computes container dimensions, logs the simulated publish event, and outputs a simulated permalink without making actual external API calls.

### Q4: How do I add my own custom news background music?
Place any `.mp3` file into `assets/audio/`. The Web Dashboard will automatically detect and list it in the **Background News Beat** dropdown.

### Q5: Can I use custom video clips instead of stock footage?
**Yes.** In **Tab 1: Reel Studio**, choose either **Single Video File** or **Multi-Clip Auto Montage** and upload your `.mp4` or `.mov` clips directly through the UI. The engine will scale, crop to 1080x1920 (9:16), and splice the clips automatically.
