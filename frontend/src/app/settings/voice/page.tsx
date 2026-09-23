"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { 
  fetchVoices, 
  previewVoiceAPI, 
  uploadVoiceCloneAPI, 
  deleteVoiceCloneAPI, 
  VoiceOption, 
  VoiceFlowSettings 
} from "@/lib/api";
import { toast } from "sonner";
import { 
  Mic2, 
  UploadCloud, 
  Play, 
  Pause, 
  Trash2, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  Save, 
  Sliders, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Zap,
  Tag
} from "lucide-react";
import { useDropzone } from "react-dropzone";

const SMART_DEFAULTS: VoiceFlowSettings = {
  speed: 1.0,
  pitch: 0.0,
  stability: 0.75,
  similarity_boost: 0.85,
  style: 0.20,
  pause_duration: 0.5,
  emphasis_strength: 0.5,
};

export default function VoiceSettingsPage() {
  const { profile, saveProfile, updateDraft } = useStore();

  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("PRARAMBH_MALE");
  const [voiceSettings, setVoiceSettings] = useState<VoiceFlowSettings>(SMART_DEFAULTS);

  // Advanced sliders accordion state (hidden by default)
  const [showAdvancedSliders, setShowAdvancedSliders] = useState(false);

  // New Voice Upload State
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneTone, setCloneTone] = useState("Serious News");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sample playback
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadVoiceData = async () => {
    try {
      const res = await fetchVoices();
      setVoices(res.voices || []);
    } catch (e) {
      console.warn("Could not load voices:", e);
    }
  };

  useEffect(() => {
    loadVoiceData();
    if (profile.default_voice) {
      setSelectedVoice(profile.default_voice);
    }
    if (profile.voice_settings) {
      setVoiceSettings({
        ...SMART_DEFAULTS,
        ...profile.voice_settings,
        speed: profile.voice_settings.speed ?? 1.0,
        stability: profile.voice_settings.stability ?? 0.75,
        similarity_boost: profile.voice_settings.similarity_boost ?? 0.85,
      });
    }
  }, [profile]);

  const activeVoiceObj = voices.find((v) => v.id === selectedVoice) || voices[0] || {
    id: "PRARAMBH_MALE",
    display_name: "પ્રારંભ — પુરુષ અવાજ (ElevenLabs Multilingual v2)",
    tone: "Deep vocal resonance, authoritative, trustworthy",
    sample_url: "/assets/voices/reference_male_news.wav",
  };

  const handleTogglePlaySample = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlayingSample(true);
    } else {
      audioRef.current.pause();
      setIsPlayingSample(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setCloneFile(f);
      if (!cloneName) {
        setCloneName(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
      toast.info(`Selected audio: ${f.name}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".m4a", ".aac"] },
    maxFiles: 1,
  });

  const handleRegisterClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneFile || !cloneName.trim()) {
      toast.warning("કૃપા કરીને અવાજનું નામ દાખલ કરો અને ઓડિયો ફાઇલ પસંદ કરો.");
      return;
    }

    setUploading(true);
    const tId = toast.loading("Uploading and registering voice sample...");
    const formData = new FormData();
    formData.append("file", cloneFile);
    formData.append("display_name", cloneName.trim());
    formData.append("tone_style", cloneTone);

    try {
      await uploadVoiceCloneAPI(formData);
      toast.success(`🎉 Voice sample "${cloneName}" registered!`, { id: tId });
      setCloneFile(null);
      setCloneName("");
      loadVoiceData();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: tId });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClone = async (cloneId: string) => {
    try {
      await deleteVoiceCloneAPI(cloneId);
      toast.success("Voice sample deleted.");
      if (selectedVoice === cloneId) setSelectedVoice("PRARAMBH_MALE");
      loadVoiceData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleQuickPreview = async () => {
    setPreviewing(true);
    const tId = toast.loading("🎙️ ElevenLabs Multilingual v2 પ્રીવ્યૂ બની રહ્યું છે...");
    try {
      const res = await previewVoiceAPI({
        text: "સુરતીઓ આ ગણેશોત્સવમાં બાપ્પાના દર્શન કરવા ડિંડોલી જવાના છો? તો પછી આ વખતે રેન્ડમ ફરવાનું નહીં.",
        voice_id: selectedVoice,
        settings: voiceSettings,
      });
      if (res && res.audio_url) {
        setPreviewUrl(res.audio_url);
        toast.success("✅ Voice preview ready!", { id: tId });
      }
    } catch (e: any) {
      toast.error(`Preview failed: ${e.message}`, { id: tId });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSaveAllSettings = async () => {
    setSaving(true);
    try {
      await saveProfile({
        default_voice: selectedVoice,
        voice_settings: voiceSettings,
      });
      updateDraft({
        selectedVoiceMode: selectedVoice,
        voiceSettings: voiceSettings,
      });
      toast.success("✓ Voice settings saved persistently to user_profile.json!");
    } catch (e: any) {
      toast.error(`Failed to save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Mic2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-inter">
              Voice Engine & Cloning (ElevenLabs Multilingual v2)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Native Gujarati neural speech synthesis with authentic human breathing and deep resonance.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAllSettings}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 shrink-0"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Voice Settings</span>
        </button>
      </div>

      {/* ── 1. ACTIVE REFERENCE VOICE PLAYER ───────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h2 className="text-sm font-bold text-slate-900 font-inter">
              Active Reference Voice
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
            <ShieldCheck className="w-3.5 h-3.5" /> ElevenLabs Multilingual v2
          </span>
        </div>

        {/* Voice Selector Dropdown */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Select Active Voice Profile:</label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.display_name || v.name} {v.is_default ? "★ (Default Male Anchor)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Card with Audio Player */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 font-gujarati">
                {activeVoiceObj.display_name || activeVoiceObj.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                {activeVoiceObj.id}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {activeVoiceObj.tone || "Deep vocal resonance, authoritative, warm, trustworthy"}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {activeVoiceObj.sample_url && (
              <>
                <audio
                  ref={audioRef}
                  src={activeVoiceObj.sample_url}
                  onEnded={() => setIsPlayingSample(false)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleTogglePlaySample}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {isPlayingSample ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-indigo-600" />}
                  <span>{isPlayingSample ? "Pause" : "Listen Reference"}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleQuickPreview}
              disabled={previewing}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>Test Speech</span>
            </button>
          </div>
        </div>

        {/* Test Speech Player */}
        {previewUrl && (
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-indigo-700">Generated Test Audio:</span>
            <audio src={previewUrl} controls className="h-8 max-w-[280px]" />
          </div>
        )}
      </div>

      {/* ── 2. UPLOAD NEW VOICE SAMPLE ──────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h2 className="text-sm font-bold text-slate-900 font-inter">
              Upload New Voice Sample (Custom Voice Cloner)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            10-30 સેકન્ડનો સ્પષ્ટ ગુજરાતી અવાજ
          </span>
        </div>

        <form onSubmit={handleRegisterClone} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voice Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Voice Profile Name (અવાજનું નામ):</label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="દા.ત. નરેશભાઈ સુરત ન્યૂઝ એન્કર"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* Tone Style Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Tone & Style (અંદાજ):</label>
              <select
                value={cloneTone}
                onChange={(e) => setCloneTone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white"
              >
                <option value="Serious News">🎙️ Serious News Anchor (ગંભીર અને સ્પષ્ટ)</option>
                <option value="Breaking News">⚡ Breaking News (ઝડપી અને ઉર્જાવાન)</option>
                <option value="Conversational">☕ Friendly & Conversational (સરળ અને મૈત્રીપૂર્ણ)</option>
              </select>
            </div>
          </div>

          {/* Audio Dropzone */}
          <div
            {...getRootProps()}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50/50"
                : "border-slate-200 hover:border-indigo-300 bg-slate-50/70"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-8 h-8 text-indigo-500 mb-1.5 opacity-80" />
            <p className="text-xs font-bold text-slate-800">
              {cloneFile ? `Selected: ${cloneFile.name}` : "Drag & Drop clean voice sample (WAV / MP3)"}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Natural speech without background music or heavy echo
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !cloneFile || !cloneName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-xs"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <span>Register Voice Sample</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── 3. ADVANCED SLIDERS (COLLAPSIBLE ACCORDION) ──────────────────────── */}
      <div className="rounded-2xl bg-white border border-[#E5E7EB] overflow-hidden shadow-xs">
        <button
          onClick={() => setShowAdvancedSliders(!showAdvancedSliders)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Advanced Voice Sliders (Speed, Stability, Similarity)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              Smart Defaults Active
            </span>
          </div>
          {showAdvancedSliders ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvancedSliders && (
          <div className="p-6 pt-2 border-t border-slate-200 space-y-6">
            <p className="text-xs text-slate-500">
              Adjust speech pacing and emotional stability for ElevenLabs Multilingual v2. Defaults are calibrated for optimal Gujarati broadcast delivery.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Speed Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">Speed (Pacing)</span>
                  <span className="text-indigo-600 font-mono">{voiceSettings.speed.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={0.8}
                  max={1.25}
                  step={0.05}
                  value={voiceSettings.speed}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, speed: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Default: 1.0x (Natural Broadcast)</span>
              </div>

              {/* Stability Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">Stability</span>
                  <span className="text-indigo-600 font-mono">{voiceSettings.stability.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, stability: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Default: 0.75 (Consistent Tone)</span>
              </div>

              {/* Similarity Boost Slider */}
              <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-800">Similarity Boost</span>
                  <span className="text-amber-600 font-mono">{voiceSettings.similarity_boost.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.0}
                  step={0.05}
                  value={voiceSettings.similarity_boost}
                  onChange={(e) => setVoiceSettings({ ...voiceSettings, similarity_boost: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400 block">Default: 0.85 (High Voice Match)</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setVoiceSettings(SMART_DEFAULTS)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Smart Defaults</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
