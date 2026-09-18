# 🚀 How to Run the Code

This quick-start guide explains how to configure and run the **Surat News Reel Engine (V2)**.

For full architectural details and directory breakdown, see [README.md](file:///home/dev/Documents/Post%20check/README.md).

---

## ⚡ Quick Steps to Run

### Step 1: Open Terminal in Project Directory
```bash
cd "/home/dev/Documents/Post check"
```

### Step 2: Activate the Virtual Environment
A Python 3.10 virtual environment is already prepared:
```bash
source venv/bin/activate
```
*(On Windows PowerShell: `.\venv\Scripts\Activate.ps1`)*

### Step 3: Verify Environment Configuration
Ensure `.env` exists and contains your keys:
```bash
cp .env.example .env   # (if not already created)
```
In `.env`:
- `GEMINI_API_KEY`: Your Gemini API key *(an offline rule-based generator is used as automatic fallback if omitted or offline)*.
- `INSTAGRAM_BUSINESS_ACCOUNT_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN`: *(Optional, dry-run mode is enabled by default)*.

### Step 4: Launch the Streamlit Web Application
```bash
streamlit run app.py
```
Open your browser at:
👉 **`http://localhost:8501`**

---

## 🎬 How to Use the Web Dashboard

1. **Tab 1: Reel Studio**:
   - Select News Category (e.g. `N01` General News, `C01` Crime Watch with legal protection rules, `T01` Traffic, etc.).
   - Select Hyperlocal Surat Area (e.g. *Adajan*, *Vesu*, *Varachha*).
   - Select Target Duration (`15s`, `30s`, `45s`, `60s`).
   - Choose Video Ingest Mode (*Single Video File* or *Multi-Clip Auto Montage*).
   - Click **🚀 1. Generate AI Script & Voiceover** to create dual-stripe headlines and timed Gujarati narration.
   - Review or edit the headlines, script, and caption.
   - Click **🎬 2. Render Final 1080x1920 Video** to assemble the composite MP4 with ducked background music.
   - Preview the vertical reel, download the `.mp4`, or click **📤 Publish Directly to Instagram Reel**.

2. **Tab 2: User Profile & Settings**:
   - Select your preferred AI Model Provider (`Gemini`, `OpenAI`, or `Claude`).
   - Enter your API credentials and save them directly to `user_profile.json`.

3. **Tab 3: Visual & Voice Styling**:
   - Customize Line 1 / Line 2 badge colors and subtitle fonts.
   - Test positioning on the interactive smartphone drag-and-drop preview.
   - Upload custom voice audio samples to register new voice clone profiles.

---

## 🧪 CLI Test & Utility Commands

You can also run backend pipeline scripts from the command line:

```bash
# 1. Generate sample news beat loop (.mp3) and 1080x1920 b-roll video (.mp4)
python assets/generate_sample_assets.py

# 2. Run End-to-End V2 integration test
python tests/test_v2_pipeline.py

# 3. Run baseline pipeline test
python tests/test_pipeline.py

# 4. Run voice engine & preprocessing test
python tests/test_voice_pipeline.py
```
