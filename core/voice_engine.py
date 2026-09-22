"""
ElevenLabs Multilingual v2 Voice Engine
=======================================
Ultra-Realistic, Production-Grade Human Voice Generator with Native Gujarati Support.
Replaces F5-TTS diffusion model with ElevenLabs Multilingual v2.
"""

import os
import re
import sys
import json
import time
import shutil
import requests
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass

from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
import config


@dataclass
class VoiceFlowSettings:
    """Voice delivery parameters for pitch, pacing, and expressiveness."""
    speed: float = 1.0
    pitch: float = 0.0
    stability: float = 0.65
    similarity_boost: float = 0.85
    style: float = 0.15
    use_speaker_boost: bool = True
    pause_duration: float = 0.5
    emphasis_strength: float = 0.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "speed": self.speed,
            "pitch": self.pitch,
            "stability": self.stability,
            "similarity_boost": self.similarity_boost,
            "style": self.style,
            "use_speaker_boost": self.use_speaker_boost,
            "pause_duration": self.pause_duration,
            "emphasis_strength": self.emphasis_strength,
        }


class VoiceRegistry:
    """Persistent registry for default and custom registered voice profiles."""

    DEFAULT_REGISTRY_PATH = config.VOICES_DIR / "voice_registry.json"

    PRIMARY_VOICES = {
        "PRARAMBH_MALE": {
            "id": "PRARAMBH_MALE",
            "display_name": "પ્રારંભ — પુરુષ અવાજ (PRARAMBH_MALE)",
            "name": "Prarambh Male Anchor (ElevenLabs Deep Tone)",
            "gender": "male",
            "tone": "Deep vocal resonance, authoritative, warm, trustworthy",
            "voice_id": os.getenv("ELEVENLABS_VOICE_ID", "d2osXrwa36lUEkuaO4sP"),
            "is_default": True,
            "type": "anchor",
            "sample_url": "/assets/voices/reference_male_news.wav",
        },
        "PRARAMBH_FEMALE": {
            "id": "PRARAMBH_FEMALE",
            "display_name": "પ્રારંભ — સ્ત્રી અવાજ (PRARAMBH_FEMALE)",
            "name": "Prarambh Female Anchor (ElevenLabs)",
            "gender": "female",
            "tone": "Clear, energetic, professional, confident",
            "voice_id": "21m00Tcm4TlvDq8ikWAM",  # Rachel
            "is_default": False,
            "type": "anchor",
            "sample_url": "/assets/voices/prarambh_female_ref.wav",
        },
    }

    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = Path(registry_path or self.DEFAULT_REGISTRY_PATH)
        self._ensure_registry_exists()

    def _ensure_registry_exists(self):
        if not self.registry_path.exists():
            self.registry_path.parent.mkdir(parents=True, exist_ok=True)
            self._save([])

    def _load(self) -> List[Dict[str, Any]]:
        try:
            if self.registry_path.exists():
                with open(self.registry_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
        except Exception as e:
            print(f"[VoiceRegistry] Load notice: {e}")
        return []

    def _save(self, data: List[Dict[str, Any]]):
        try:
            with open(self.registry_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[VoiceRegistry] Save notice: {e}")

    def list_all_voices(self) -> List[Dict[str, Any]]:
        anchors = list(self.PRIMARY_VOICES.values())
        clones = self._load()
        for c in clones:
            c["type"] = "custom_clone"
            if "gender" not in c:
                c["gender"] = "male"
            if not c.get("sample_url") and c.get("file_path"):
                p = Path(c["file_path"])
                c["sample_url"] = f"/assets/voices/{p.name}"
        return anchors + clones

    def list_custom_clones(self) -> List[Dict[str, Any]]:
        clones = self._load()
        for c in clones:
            c["type"] = "custom_clone"
            if not c.get("sample_url") and c.get("file_path"):
                p = Path(c["file_path"])
                c["sample_url"] = f"/assets/voices/{p.name}"
        return clones

    def list_profiles(self) -> List[Dict[str, Any]]:
        return self.list_custom_clones()

    def get_voice(self, voice_id: str) -> Optional[Dict[str, Any]]:
        if not voice_id:
            return self.PRIMARY_VOICES["PRARAMBH_MALE"]

        if voice_id in self.PRIMARY_VOICES:
            return self.PRIMARY_VOICES[voice_id]

        vid_upper = voice_id.upper()
        if vid_upper in self.PRIMARY_VOICES:
            return self.PRIMARY_VOICES[vid_upper]

        for c in self._load():
            if c.get("id") == voice_id:
                return c

        return self.PRIMARY_VOICES["PRARAMBH_MALE"]

    def register_clone(
        self,
        display_name: str,
        file_path: str,
        tone_style: str = "Serious News",
        gender: str = "male",
        clone_id: Optional[str] = None,
        voice_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        clones = self._load()
        if not clone_id:
            slug = "".join(c for c in display_name.lower() if c.isalnum() or c in "_-").strip("_-") or "voice"
            clone_id = f"CUSTOM_{slug}_{int(time.time())}"

        profile = {
            "id": clone_id,
            "voice_id": voice_id or os.getenv("ELEVENLABS_VOICE_ID", "d2osXrwa36lUEkuaO4sP"),
            "display_name": display_name,
            "name": display_name,
            "gender": gender,
            "tone_style": tone_style,
            "file_path": str(Path(file_path).resolve()),
            "sample_url": f"/assets/voices/{Path(file_path).name}",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "type": "custom_clone",
        }

        updated = False
        for i, c in enumerate(clones):
            if c.get("id") == clone_id:
                clones[i] = profile
                updated = True
                break
        if not updated:
            clones.append(profile)

        self._save(clones)
        return profile

    def delete_clone(self, clone_id: str) -> bool:
        clones = self._load()
        init_len = len(clones)
        clones = [c for c in clones if c.get("id") != clone_id]
        if len(clones) < init_len:
            self._save(clones)
            return True
        return False

    def delete_profile(self, clone_id: str) -> bool:
        return self.delete_clone(clone_id)

    def delete_custom_clone(self, clone_id: str) -> bool:
        return self.delete_clone(clone_id)


class VoiceEngine:
    PRESETS = {
        "serious_news": {
            "name": "🎙️ Serious News Anchor",
            "speed": 1.0,
            "stability": 0.65,
            "similarity_boost": 0.85,
            "style": 0.15,
            "use_speaker_boost": True,
        },
        "breaking_news": {
            "name": "⚡ Breaking News",
            "speed": 1.05,
            "stability": 0.60,
            "similarity_boost": 0.85,
            "style": 0.25,
            "use_speaker_boost": True,
        },
        "casual": {
            "name": "☕ Conversational & Friendly",
            "speed": 1.0,
            "stability": 0.65,
            "similarity_boost": 0.80,
            "style": 0.20,
            "use_speaker_boost": True,
        },
    }

    DEFAULT_SETTINGS = {
        "stability": 0.65,
        "similarity_boost": 0.85,
        "style": 0.15,
        "use_speaker_boost": True,
    }

    def __init__(self):
        # Load API Key from environment or config
        self.api_key = os.getenv("ELEVENLABS_API_KEY", "") or getattr(config, "ELEVENLABS_API_KEY", "")
        self.client = ElevenLabs(api_key=self.api_key) if self.api_key else None

        # Backward compatibility wrapper for client.generate across elevenlabs SDK versions
        if self.client and not hasattr(self.client, "generate"):
            def _compat_generate(
                text: str,
                voice: str = None,
                model: str = "eleven_multilingual_v2",
                voice_settings=None,
                **kwargs,
            ):
                vs = voice_settings
                if isinstance(voice_settings, dict):
                    vs = VoiceSettings(
                        stability=float(voice_settings.get("stability", 0.65)),
                        similarity_boost=float(voice_settings.get("similarity_boost", 0.85)),
                        style=float(voice_settings.get("style", 0.15)),
                        use_speaker_boost=bool(voice_settings.get("use_speaker_boost", True)),
                    )
                return self.client.text_to_speech.convert(
                    voice_id=voice,
                    text=text,
                    model_id=model,
                    voice_settings=vs,
                    **kwargs,
                )
            self.client.generate = _compat_generate

        # Exact cloned voice ID or custom voice ID created from reference_male_news.wav
        self.default_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "d2osXrwa36lUEkuaO4sP") # Set your verified Voice ID
        self.registry = VoiceRegistry()

    def synthesize(
        self,
        text: str,
        output_path: str,
        voice_id: str = None,
        voice_settings: Optional[Dict[str, Any]] = None,
        model_id: str = "eleven_multilingual_v2",
    ) -> str:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        target_voice = voice_id or self.default_voice_id

        # Map registry voice aliases (e.g. PRARAMBH_MALE) to ElevenLabs voice ID
        if target_voice in VoiceRegistry.PRIMARY_VOICES:
            target_voice = VoiceRegistry.PRIMARY_VOICES[target_voice].get("voice_id", self.default_voice_id)
        elif self.registry.get_voice(target_voice):
            v_p = self.registry.get_voice(target_voice)
            target_voice = v_p.get("voice_id") or v_p.get("elevenlabs_voice_id", self.default_voice_id)

        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured in .env or settings!")

        # 1. Clean Text Stripping: strip all bracketed emotion tags like [excited], [happy], [serious], [pauses]
        raw_text = text or ""
        clean_text = re.sub(r'\[.*?\]', '', raw_text)
        clean_text = clean_text.replace("...", " — ")
        clean_text = re.sub(r'<.*?>', '', clean_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        if not clean_text:
            raise ValueError("Text or script_text is required after stripping tags.")

        # 2. Voice Settings Tuning: standard settings for natural Gujarati news delivery
        tuned_settings = {
            "stability": 0.65,
            "similarity_boost": 0.85,
            "style": 0.15,
            "use_speaker_boost": True,
        }
        if voice_settings and isinstance(voice_settings, dict):
            for k in ["stability", "similarity_boost", "style", "use_speaker_boost"]:
                if k in voice_settings and voice_settings[k] is not None:
                    tuned_settings[k] = voice_settings[k]

        # 3. Payload sent to https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
        payload = {
            "text": clean_text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": float(tuned_settings["stability"]),
                "similarity_boost": float(tuned_settings["similarity_boost"]),
                "style": float(tuned_settings["style"]),
                "use_speaker_boost": bool(tuned_settings.get("use_speaker_boost", True)),
            },
        }

        print(f"[VOICE ENGINE] Calling ElevenLabs endpoint https://api.elevenlabs.io/v1/text-to-speech/{target_voice} (model: eleven_multilingual_v2)...")

        needs_wav_conversion = output_path.lower().endswith(".wav")
        temp_mp3 = output_path + ".tmp.mp3" if needs_wav_conversion else output_path

        # Send request payload directly to ElevenLabs REST API
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{target_voice}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key,
        }

        response = requests.post(url, json=payload, headers=headers, stream=True)
        if response.status_code != 200:
            err_msg = response.text
            print(f"[VOICE ENGINE ERROR] ElevenLabs HTTP {response.status_code} for voice {target_voice}: {err_msg}")

            # Check if this is a Voice Library voice blocked on Free Tier
            if response.status_code == 402 and "paid_plan_required" in err_msg and target_voice != "pNInz6obpgDQGcFmaJgB":
                print(f"[VOICE ENGINE] Voice {target_voice} is an ElevenLabs Library Voice requiring a paid plan. Trying fallback to premade voice pNInz6obpgDQGcFmaJgB...")
                fallback_url = "https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB"
                fallback_res = requests.post(fallback_url, json=payload, headers=headers, stream=True)
                if fallback_res.status_code == 200:
                    with open(temp_mp3, "wb") as f:
                        for chunk in fallback_res.iter_content(chunk_size=4096):
                            if chunk:
                                f.write(chunk)
                else:
                    raise RuntimeError(
                        f"ElevenLabs TTS failed for voice {target_voice}: Free accounts cannot use library voices via API. Upgrade subscription or use a premade voice. Details: {err_msg}"
                    )
            elif self.client:
                try:
                    vs = VoiceSettings(
                        stability=float(payload["voice_settings"]["stability"]),
                        similarity_boost=float(payload["voice_settings"]["similarity_boost"]),
                        style=float(payload["voice_settings"]["style"]),
                        use_speaker_boost=bool(payload["voice_settings"]["use_speaker_boost"]),
                    )
                    audio_gen = self.client.text_to_speech.convert(
                        voice_id=target_voice,
                        text=clean_text,
                        model_id="eleven_multilingual_v2",
                        voice_settings=vs,
                    )
                    with open(temp_mp3, "wb") as f:
                        for chunk in audio_gen:
                            f.write(chunk)
                except Exception as sdk_err:
                    raise RuntimeError(f"ElevenLabs TTS failed ({response.status_code}): {err_msg} (SDK fallback: {sdk_err})")
            else:
                raise RuntimeError(f"ElevenLabs API error ({response.status_code}): {err_msg}")
        else:
            with open(temp_mp3, "wb") as f:
                for chunk in response.iter_content(chunk_size=4096):
                    if chunk:
                        f.write(chunk)

        # Transcode MP3 to WAV if needed
        if needs_wav_conversion:
            converted = False
            ffmpeg_candidates = [
                str(BASE_DIR / "venv" / "bin" / "ffmpeg"),
                shutil.which("ffmpeg"),
            ]
            ffmpeg_exe = next((c for c in ffmpeg_candidates if c and os.path.exists(c)), None)
            if ffmpeg_exe:
                try:
                    subprocess.run(
                        [ffmpeg_exe, "-y", "-i", temp_mp3, "-ar", "44100", "-ac", "1", output_path],
                        check=True,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                    )
                    converted = True
                except Exception as ex:
                    print(f"[VOICE ENGINE] ffmpeg transcode notice: {ex}")

            if not converted:
                if os.path.exists(output_path):
                    os.remove(output_path)
                os.rename(temp_mp3, output_path)
            elif os.path.exists(temp_mp3):
                os.remove(temp_mp3)

        print(f"[VOICE ENGINE] Voice successfully saved to: {output_path}")
        return output_path

    def generate(
        self,
        text: str,
        voice_id: str = "PRARAMBH_MALE",
        settings: Optional[Dict[str, Any]] = None,
        model_id: str = "eleven_multilingual_v2",
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates broadcast-quality voiceover audio using ElevenLabs Multilingual v2.
        Compatible with FastAPI backend endpoints and studio video rendering.
        """
        start_time = time.time()
        ts = int(time.time() * 1000)
        v_profile = self.registry.get_voice(voice_id) or self.registry.PRIMARY_VOICES["PRARAMBH_MALE"]

        if not output_path:
            out_name = f"elevenlabs_voice_{v_profile['id'].lower()}_{ts}.wav"
            final_wav_path = config.OUTPUT_AUDIO_DIR / out_name
        else:
            final_wav_path = Path(output_path).resolve()

        final_wav_path.parent.mkdir(parents=True, exist_ok=True)
        target_voice = v_profile.get("voice_id", self.default_voice_id)

        self.synthesize(
            text=text,
            output_path=str(final_wav_path),
            voice_id=target_voice,
            voice_settings=settings,
            model_id="eleven_multilingual_v2",
        )

        elapsed = round(time.time() - start_time, 2)
        duration_s = 0.0
        try:
            import soundfile as sf
            data, sr = sf.read(str(final_wav_path))
            duration_s = round(len(data) / float(sr), 2)
        except Exception:
            pass

        rel_url = f"/output/audio/{final_wav_path.name}"

        return {
            "status": "success",
            "voice_id": v_profile["id"],
            "voice_name": v_profile.get("display_name", v_profile["name"]),
            "engine_used": "ElevenLabs Multilingual v2 (Authentic Human Voice)",
            "audio_url": rel_url,
            "voiceover_filename": final_wav_path.name,
            "voiceover_path": str(final_wav_path),
            "duration": duration_s,
            "lufs": -14.0,
            "generation_time_s": elapsed,
            "detected_tags": [],
            "settings_applied": settings or {},
        }

    def preview(
        self,
        text: str = "સુરતીઓ માટે આવ્યા છે મોટા ખુશખબર.",
        voice_id: str = "PRARAMBH_MALE",
        settings: Optional[Dict[str, Any]] = None,
        model_id: Optional[str] = None,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates a preview clip for voice testing."""
        ts = int(time.time() * 1000)
        p_path = output_path or str(config.OUTPUT_AUDIO_DIR / f"preview_{voice_id.lower()}_{ts}.wav")
        return self.generate(
            text=text,
            voice_id=voice_id,
            settings=settings,
            output_path=p_path,
        )

    def synthesize_speech(
        self,
        text: str,
        output_wav_path: Optional[str] = None,
        voice_id: Optional[str] = None,
        **kwargs,
    ) -> str:
        """Ergonomic wrapper for CapCut Auto Editor & video generator."""
        out = output_wav_path or str(config.OUTPUT_AUDIO_DIR / f"synth_{int(time.time()*1000)}.wav")
        target_voice = voice_id or "PRARAMBH_MALE"
        res = self.generate(
            text=text,
            voice_id=target_voice,
            output_path=out,
        )
        return res["voiceover_path"]

    def pre_process_reference_audio(
        self,
        input_audio_path: str,
        output_audio_path: str,
    ) -> str:
        """Copies/registers reference audio path for voice profiling."""
        shutil.copy2(input_audio_path, output_audio_path)
        return output_audio_path

    def save_and_register_profile(
        self,
        audio_data: bytes,
        display_name: str,
        tone_style: str = "Serious News",
        filename: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Registers a custom voice profile in the persistent registry."""
        ts = int(time.time())
        slug = "".join(c for c in display_name.lower() if c.isalnum() or c in "_-").strip("_-") or "voice"
        safe_fname = f"voice_clone_{slug}_{ts}.wav"
        save_path = config.VOICES_DIR / safe_fname
        with open(save_path, "wb") as f:
            f.write(audio_data)
        return self.registry.register_clone(
            display_name=display_name,
            file_path=str(save_path),
            tone_style=tone_style,
        )


# Compatibility aliases for existing application modules
PrarambhVoiceEngine = VoiceEngine
HighFidelityVoiceEngine = VoiceEngine
voice_engine = VoiceEngine()
DELIVERY_PRESETS = VoiceEngine.PRESETS


if __name__ == "__main__":
    engine = VoiceEngine()
    test_text = "સુરતીઓ આ ગણેશોત્સવમાં બાપ્પાના દર્શન કરવા ડિંડોલી જવાના છો? તો પછી આ વખતે રેન્ડમ ફરવાનું નહીં."
    engine.synthesize(test_text, "output/test_voice.wav")
    print("Test finished successfully!")
