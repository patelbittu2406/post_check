"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { 
  fetchVoices, 
  fetchAudioTags,
  previewVoiceAPI,
  uploadVoiceCloneAPI, 
  deleteVoiceCloneAPI, 
  VoiceOption,
  VoicePreset,
  VoiceFlowSettings,
  AudioTagInfo
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
  Radio,
  Sliders,
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  BookOpen,
  Heart,
  HelpCircle,
  Activity,
  Wand2
} from "lucide-react";
import { useDropzone } from "react-dropzone";

const DEFAULT_SETTINGS: VoiceFlowSettings = {
  speed: 1.0,
  pitch: 0.0,
  stability: 0.35,
  similarity_boost: 0.80,
  style: 0.45,
  pause_duration: 0.5,
  emphasis_strength: 0.5,
};

const PRESET_CONFIGS: Record<string, { name: string; icon: string; settings: VoiceFlowSettings }> = {
  fast_news: {
    name: "Fast News",
    icon: "⚡",
    settings: {
      speed: 1.25,
      pitch: 0.5,
      stability: 0.25,
      similarity_boost: 0.80,
      style: 0.60,
      pause_duration: 0.2,
      emphasis_strength: 0.7,
    }
  },
  serious_anchor: {
    name: "Serious Anchor",
    icon: "🎙️",
    settings: {
      speed: 0.95,
      pitch: -0.5,
      stability: 0.45,
      similarity_boost: 0.85,
      style: 0.30,
      pause_duration: 0.8,
      emphasis_strength: 0.6,
    }
  },
  energetic: {
    name: "Energetic",
    icon: "🎉",
    settings: {
      speed: 1.10,
      pitch: 0.8,
      stability: 0.20,
      similarity_boost: 0.80,
      style: 0.70,
      pause_duration: 0.3,
      emphasis_strength: 0.8,
    }
  },
  storytelling: {
    name: "Storytelling",
    icon: "📖",
    settings: {
      speed: 0.90,
      pitch: -0.2,
      stability: 0.40,
      similarity_boost: 0.80,
      style: 0.55,
      pause_duration: 1.0,
      emphasis_strength: 0.5,
    }
  },
  emotional: {
    name: "Emotional",
    icon: "😢",
    settings: {
      speed: 0.85,
      pitch: -0.8,
      stability: 0.15,
      similarity_boost: 0.75,
      style: 0.80,
      pause_duration: 1.2,
      emphasis_strength: 0.4,
    }
  },
};

const TONES = [
  { id: "Neutral", label: "Neutral", emoji: "🎙️" },
  { id: "Happy", label: "Happy", emoji: "😊" },
  { id: "Serious", label: "Serious", emoji: "🧐" },
  { id: "Excited", label: "Excited", emoji: "🔥" },
  { id: "Concerned", label: "Concerned", emoji: "⚠️" },
  { id: "Angry", label: "Angry", emoji: "⚡" },
  { id: "Sad", label: "Sad", emoji: "😢" },
  { id: "Curious", label: "Curious", emoji: "🤔" },
];

export default function VoiceSettingsPage() {
  const { profile, saveProfile, loadProfile, updateDraft } = useStore();

  const [selectedVoice, setSelectedVoice] = useState<string>(profile.default_voice || "PRARAMBH_MALE");
  const [selectedTone, setSelectedTone] = useState<string>(profile.default_tone || "Serious News");
  const [voiceSettings, setVoiceSettings] = useState<VoiceFlowSettings>(
    profile.voice_settings || DEFAULT_SETTINGS
  );
  const [activePreset, setActivePreset] = useState<string>(profile.active_voice_preset || "serious_anchor");

  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [customClones, setCustomClones] = useState<VoiceOption[]>([]);
  const [audioTags, setAudioTags] = useState<AudioTagInfo[]>([]);

  // Clone upload state
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [cloneTone, setCloneTone] = useState("Serious News");
  const [cloneGender, setCloneGender] = useState("male");
  const [normalize, setNormalize] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Audio Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  // Collapsible section states
  const [isTagReferenceOpen, setIsTagReferenceOpen] = useState(false);

  // Debounced preview timer
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadVoiceData = async () => {
    try {
      const [vData, tData] = await Promise.all([
        fetchVoices(),
        fetchAudioTags()
      ]);
      setVoices(vData.voices);
      setCustomClones(vData.custom_clones || []);
      setAudioTags(tData.tags || []);
    } catch (err) {
      console.warn("Error fetching voices:", err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadVoiceData();
  }, []);

  useEffect(() => {
    if (profile.default_voice) {
      setSelectedVoice(profile.default_voice);
    }
    if (profile.default_tone) {
      setSelectedTone(profile.default_tone);
    }
    if (profile.voice_settings) {
      setVoiceSettings(profile.voice_settings);
    }
    if (profile.active_voice_preset) {
      setActivePreset(profile.active_voice_preset);
    }
  }, [profile]);

  const playSampleAudio = (url: string, id: string) => {
    if (audioElemRef.current) {
      audioElemRef.current.pause();
    }
    if (playingId === id) {
      setPlayingId(null);
      return;
    }
    const a = new Audio(url);
    a.play().catch((e) => console.warn("Audio play error:", e));
    a.onended = () => setPlayingId(null);
    audioElemRef.current = a;
    setPlayingId(id);
  };

  const handleApplyPreset = (key: string) => {
    setActivePreset(key);
    if (PRESET_CONFIGS[key]) {
      setVoiceSettings({ ...PRESET_CONFIGS[key].settings });
      toast.info(`Applied ${PRESET_CONFIGS[key].name} flow preset`);
      triggerDebouncedPreview({ ...PRESET_CONFIGS[key].settings });
    }
  };

  const updateSetting = (key: keyof VoiceFlowSettings, val: number) => {
    setActivePreset("custom");
    const updated = { ...voiceSettings, [key]: val };
    setVoiceSettings(updated);
    triggerDebouncedPreview(updated);
  };

  const resetSetting = (key: keyof VoiceFlowSettings) => {
    updateSetting(key, DEFAULT_SETTINGS[key]);
  };

  const triggerDebouncedPreview = (settingsToUse: VoiceFlowSettings) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setGeneratingPreview(true);
        const res = await previewVoiceAPI({
          text: selectedVoice === "PRARAMBH_FEMALE" 
            ? "નમસ્કાર, આજના મુખ્ય સમાચારમાં આપનું સ્વાગત છે." 
            : "બ્રેકિંગ ન્યૂઝ, આ ક્ષણના સૌથી મોટા સમાચાર.",
          voice_id: selectedVoice,
          settings: settingsToUse,
        });
        setPreviewAudioUrl(res.audio_url);
        playSampleAudio(res.audio_url, "preview");
      } catch (e) {
        console.warn("Auto preview warning:", e);
      } finally {
        setGeneratingPreview(false);
      }
    }, 600);
  };

  const handleManualPreview = async () => {
    setGeneratingPreview(true);
    try {
      const res = await previewVoiceAPI({
        text: selectedVoice === "PRARAMBH_FEMALE" 
          ? "નમસ્કાર, આજના મુખ્ય સમાચારમાં આપનું સ્વાગત છે." 
          : "બ્રેકિંગ ન્યૂઝ, આ ક્ષણના સૌથી મોટા સમાચાર.",
        voice_id: selectedVoice,
        settings: voiceSettings,
      });
      setPreviewAudioUrl(res.audio_url);
      playSampleAudio(res.audio_url, "preview");
      toast.success("Preview generated with customized flow!");
    } catch (err: any) {
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveProfile({
        default_voice: selectedVoice,
        default_tone: selectedTone,
        voice_settings: voiceSettings,
        active_voice_preset: activePreset,
      });
      updateDraft({
        selectedVoiceMode: selectedVoice,
        voiceSettings: voiceSettings,
      });
      toast.success("✓ Ultra-natural voice settings saved permanently to user profile!");
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Dropzone for custom clone upload
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setCloneFile(f);
      if (!cloneName) {
        setCloneName(f.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
      }
      toast.info(`Selected audio sample: ${f.name}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".m4a", ".aac", ".ogg"],
    },
    maxFiles: 1,
  });

  const handleRegisterClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneFile || !cloneName.trim()) {
      toast.warning("Please provide a voice name and select an audio sample file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", cloneFile);
    formData.append("display_name", cloneName.trim());
    formData.append("tone_style", cloneTone);
    formData.append("gender", cloneGender);
    formData.append("normalize_audio", String(normalize));

    try {
      await uploadVoiceCloneAPI(formData);
      toast.success(`🎉 Voice Profile "${cloneName}" registered with -14 LUFS / 22050Hz normalization!`);
      setCloneFile(null);
      setCloneName("");
      loadVoiceData();
    } catch (err: any) {
      toast.error(`Clone upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClone = async (cloneId: string) => {
    try {
      await deleteVoiceCloneAPI(cloneId);
      toast.success("Voice profile removed");
      loadVoiceData();
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30">
              <Mic2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold font-outfit text-text-primary tracking-tight">
                Prarambh Voice Engine (AI4Bharat IndicF5)
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                100% Local, Zero-Cost, Ultra-Natural Gujarati Human Voice Anchors with Audio Tags.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualPreview}
            disabled={generatingPreview}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-text-primary bg-bg-elevated border border-border hover:border-brand-pink transition-all active:scale-95"
          >
            {generatingPreview ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-pink" />
            ) : (
              <Wand2 className="w-4 h-4 text-brand-yellow" />
            )}
            <span>Live Audition</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving Changes..." : "Save All Settings"}</span>
          </button>
        </div>
      </div>

      {/* ── 3.1 PRIMARY VOICE SELECTION CARDS ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Radio className="w-4 h-4 text-brand-pink" />
            Primary News Anchor Voices (Choose Base Persona)
          </h2>
          <span className="text-[11px] font-bold text-accent-success px-2.5 py-0.5 rounded-full bg-accent-success/10 border border-accent-success/20">
            ✓ 2 Human Voices (No Robotic TTS)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Male Anchor Card */}
          <div
            onClick={() => setSelectedVoice("PRARAMBH_MALE")}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none bg-bg-surface flex flex-col justify-between gap-4 ${
              selectedVoice === "PRARAMBH_MALE"
                ? "border-brand-pink bg-gradient-to-br from-brand-pink/10 via-bg-surface to-brand-yellow/5 shadow-lg glow-pink"
                : "border-border hover:border-brand-pink/50 bg-bg-surface/60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center text-xl">
                    🎙️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold font-outfit text-text-primary">
                      PRARAMBH_MALE
                    </h3>
                    <p className="text-xs font-gujarati text-brand-pink font-semibold">
                      પ્રારંભ — પુરુષ અવાજ (ગુજરાતી)
                    </p>
                  </div>
                </div>

                {selectedVoice === "PRARAMBH_MALE" && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-pink text-white shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selected
                  </span>
                )}
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Authoritative, deep, and warm delivery modeled for serious news anchoring, investigative reports, and breaking bulletins.
              </p>

              {/* Waveform Visualizer Mock */}
              <div className="h-8 rounded-lg bg-bg-elevated px-3 flex items-center justify-between gap-1 border border-border/50">
                {[40, 65, 30, 85, 95, 45, 70, 90, 60, 40, 80, 100, 75, 50, 90, 65, 45, 80, 55, 30, 85, 70, 40, 60].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full transition-all ${
                      selectedVoice === "PRARAMBH_MALE" && playingId === "male_sample"
                        ? "bg-brand-pink animate-pulse"
                        : "bg-text-muted/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playSampleAudio("/assets/voices/prarambh_male_ref.wav", "male_sample");
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary hover:border-brand-pink transition-colors"
              >
                {playingId === "male_sample" ? (
                  <Pause className="w-3.5 h-3.5 text-brand-pink fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-brand-pink fill-current ml-0.5" />
                )}
                <span>{playingId === "male_sample" ? "Pause Sample" : "Play Sample"}</span>
              </button>

              <span className="text-[11px] text-text-muted font-medium">
                Ref: 22050Hz Mono (-14 LUFS)
              </span>
            </div>
          </div>

          {/* Female Anchor Card */}
          <div
            onClick={() => setSelectedVoice("PRARAMBH_FEMALE")}
            className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer select-none bg-bg-surface flex flex-col justify-between gap-4 ${
              selectedVoice === "PRARAMBH_FEMALE"
                ? "border-brand-cyan bg-gradient-to-br from-brand-cyan/10 via-bg-surface to-brand-pink/5 shadow-lg glow-pink"
                : "border-border hover:border-brand-cyan/50 bg-bg-surface/60"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-xl">
                    🎙️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold font-outfit text-text-primary">
                      PRARAMBH_FEMALE
                    </h3>
                    <p className="text-xs font-gujarati text-brand-cyan font-semibold">
                      પ્રારંભ — સ્ત્રી અવાજ (ગુજરાતી)
                    </p>
                  </div>
                </div>

                {selectedVoice === "PRARAMBH_FEMALE" && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-brand-cyan text-white shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Selected
                  </span>
                )}
              </div>

              <p className="text-xs text-text-muted leading-relaxed">
                Clear, bright, and energetic prime-time delivery modeled for human-interest stories, festive celebrations, and lifestyle updates.
              </p>

              {/* Waveform Visualizer Mock */}
              <div className="h-8 rounded-lg bg-bg-elevated px-3 flex items-center justify-between gap-1 border border-border/50">
                {[50, 75, 40, 90, 80, 60, 85, 95, 70, 50, 90, 100, 85, 60, 95, 75, 55, 90, 65, 40, 95, 80, 50, 70].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full transition-all ${
                      selectedVoice === "PRARAMBH_FEMALE" && playingId === "female_sample"
                        ? "bg-brand-cyan animate-pulse"
                        : "bg-text-muted/30"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playSampleAudio("/assets/voices/prarambh_female_ref.wav", "female_sample");
                }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary hover:border-brand-cyan transition-colors"
              >
                {playingId === "female_sample" ? (
                  <Pause className="w-3.5 h-3.5 text-brand-cyan fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-brand-cyan fill-current ml-0.5" />
                )}
                <span>{playingId === "female_sample" ? "Pause Sample" : "Play Sample"}</span>
              </button>

              <span className="text-[11px] text-text-muted font-medium">
                Ref: 22050Hz Mono (-14 LUFS)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3.3 PRESET MODES & 3.2 VOICE FLOW CONTROLS ───────────────────────── */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-base font-bold font-outfit text-text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-yellow" />
              Voice Flow & Delivery Fine-Tuning
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Calibrate speed, pitch, stability, pause duration, and dramatic emphasis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setVoiceSettings(DEFAULT_SETTINGS);
              setActivePreset("custom");
              toast.info("Reset all sliders to engine defaults");
            }}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-pink transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Sliders</span>
          </button>
        </div>

        {/* 3.3 Preset Buttons */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Quick Delivery Presets:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(PRESET_CONFIGS).map(([k, p]) => (
              <button
                key={k}
                type="button"
                onClick={() => handleApplyPreset(k)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activePreset === k
                    ? "brand-gradient-bg text-white shadow-md glow-pink scale-102"
                    : "bg-bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-brand-pink/40"
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActivePreset("custom")}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePreset === "custom"
                  ? "bg-bg-elevated border-2 border-brand-yellow text-brand-yellow font-extrabold"
                  : "bg-bg-elevated border border-border text-text-muted hover:text-text-primary"
              }`}
            >
              <span>🔧</span>
              <span>Custom</span>
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 pt-2">
          {/* Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Speaking Speed (Pacing)
                <span className="text-[10px] text-text-muted" title="Controls speaking rate without altering pitch">(0.7x – 1.5x)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-pink">{voiceSettings.speed.toFixed(2)}x</span>
                <button
                  type="button"
                  onClick={() => resetSetting("speed")}
                  className="text-text-muted hover:text-brand-pink p-0.5"
                  title="Reset speed"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.5"
              step="0.05"
              value={voiceSettings.speed}
              onChange={(e) => updateSetting("speed", parseFloat(e.target.value))}
              className="w-full accent-brand-pink"
            />
          </div>

          {/* Pitch */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Voice Pitch Shift
                <span className="text-[10px] text-text-muted" title="Modifies pitch in semitones">(-5 to +5 st)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-cyan">
                  {voiceSettings.pitch > 0 ? `+${voiceSettings.pitch.toFixed(1)}` : voiceSettings.pitch.toFixed(1)} st
                </span>
                <button
                  type="button"
                  onClick={() => resetSetting("pitch")}
                  className="text-text-muted hover:text-brand-cyan p-0.5"
                  title="Reset pitch"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.2"
              value={voiceSettings.pitch}
              onChange={(e) => updateSetting("pitch", parseFloat(e.target.value))}
              className="w-full accent-brand-cyan"
            />
          </div>

          {/* Stability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Stability (Lower = More Expressive)
                <span className="text-[10px] text-text-muted">(0.0 – 1.0)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-yellow">{voiceSettings.stability.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => resetSetting("stability")}
                  className="text-text-muted hover:text-brand-yellow p-0.5"
                  title="Reset stability"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={voiceSettings.stability}
              onChange={(e) => updateSetting("stability", parseFloat(e.target.value))}
              className="w-full accent-brand-yellow"
            />
          </div>

          {/* Similarity Boost */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Similarity Boost (Base Clone Fidelity)
                <span className="text-[10px] text-text-muted">(0.0 – 1.0)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-accent-success">{voiceSettings.similarity_boost.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => resetSetting("similarity_boost")}
                  className="text-text-muted hover:text-accent-success p-0.5"
                  title="Reset similarity"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={voiceSettings.similarity_boost}
              onChange={(e) => updateSetting("similarity_boost", parseFloat(e.target.value))}
              className="w-full accent-accent-success"
            />
          </div>

          {/* Style Exaggeration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Style Exaggeration (Dramatic Inflection)
                <span className="text-[10px] text-text-muted">(0.0 – 1.0)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-pink">{voiceSettings.style.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => resetSetting("style")}
                  className="text-text-muted hover:text-brand-pink p-0.5"
                  title="Reset style"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={voiceSettings.style}
              onChange={(e) => updateSetting("style", parseFloat(e.target.value))}
              className="w-full accent-brand-pink"
            />
          </div>

          {/* Pause Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                Headline Boundary Pause
                <span className="text-[10px] text-text-muted">(0.0s – 2.0s)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-brand-cyan">{voiceSettings.pause_duration.toFixed(2)}s</span>
                <button
                  type="button"
                  onClick={() => resetSetting("pause_duration")}
                  className="text-text-muted hover:text-brand-cyan p-0.5"
                  title="Reset pause"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={voiceSettings.pause_duration}
              onChange={(e) => updateSetting("pause_duration", parseFloat(e.target.value))}
              className="w-full accent-brand-cyan"
            />
          </div>
        </div>
      </div>

      {/* ── 3.4 TONE & EMOTION DEFAULTS ───────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-yellow" />
            Default Emotional Tone (Base Script Coloring)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Applied as base emotion to every generation unless overridden by specific script tags.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTone(t.label)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedTone === t.label
                  ? "brand-gradient-bg text-white shadow-md glow-pink scale-105"
                  : "bg-bg-elevated border border-border text-text-muted hover:text-text-primary"
              }`}
            >
              <span className="text-base">{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3.5 CUSTOM VOICE CLONE UPLOAD ────────────────────────────────────── */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold font-outfit text-text-primary flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-brand-pink" />
            Custom Voice Clone Registration (Zero-Shot Ingest)
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Upload a clean 10–30 second audio clip of a Gujarati speaker to clone tone, pitch & delivery style.
          </p>
        </div>

        <form onSubmit={handleRegisterClone} className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-brand-pink bg-brand-pink/5"
                : cloneFile
                ? "border-accent-success bg-accent-success/5"
                : "border-border hover:border-brand-pink/50 bg-bg-elevated/40"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className={`w-8 h-8 ${cloneFile ? "text-accent-success" : "text-brand-pink"}`} />
              {cloneFile ? (
                <div>
                  <p className="text-xs font-bold text-text-primary">{cloneFile.name}</p>
                  <p className="text-[11px] text-accent-success font-medium">Ready for -14 LUFS / 22050Hz Pre-processing</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    Drag & drop voice audio sample here, or <span className="text-brand-pink">browse files</span>
                  </p>
                  <p className="text-[11px] text-text-muted">Supports MP3, WAV, M4A, AAC up to 30MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Voice Profile Display Name</label>
              <input
                type="text"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="e.g. Surat Prime Anchor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Tone Style</label>
              <select
                value={cloneTone}
                onChange={(e) => setCloneTone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              >
                <option value="Serious News">Serious News</option>
                <option value="Energetic">Energetic</option>
                <option value="Fast News">Fast News</option>
                <option value="Expressive">Expressive</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-primary">Gender / Timbre</label>
              <select
                value={cloneGender}
                onChange={(e) => setCloneGender(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-text-primary font-medium">
              <input
                type="checkbox"
                checked={normalize}
                onChange={(e) => setNormalize(e.target.checked)}
                className="rounded border-border text-brand-pink focus:ring-brand-pink"
              />
              <span>Normalize audio to -14 LUFS / 22050Hz Mono (Broadcast standard)</span>
            </label>

            <button
              type="submit"
              disabled={uploading || !cloneFile || !cloneName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all duration-150 disabled:opacity-40"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Sample...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Register Custom Voice Clone</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Registered Custom Clones List */}
        {customClones.length > 0 && (
          <div className="pt-4 border-t border-border space-y-3">
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Registered Custom Voice Clones ({customClones.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customClones.map((cp) => (
                <div
                  key={cp.id}
                  className="p-3.5 rounded-xl bg-bg-elevated border border-border flex items-center justify-between gap-3 group hover:border-brand-pink/40 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => cp.sample_url && playSampleAudio(cp.sample_url, cp.id)}
                      className="w-9 h-9 rounded-full bg-brand-pink/15 text-brand-pink border border-brand-pink/30 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
                    >
                      {playingId === cp.id ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="truncate">
                      <p className="text-xs font-bold text-text-primary truncate">{cp.display_name}</p>
                      <p className="text-[10px] text-text-muted">{cp.tone_style || "Serious News"} • {cp.gender}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteClone(cp.id)}
                    className="text-text-muted hover:text-accent-danger p-1.5 transition-colors"
                    title="Delete voice profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 2.2 COLLAPSIBLE AUDIO TAG REFERENCE ──────────────────────────────── */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsTagReferenceOpen(!isTagReferenceOpen)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-bg-elevated/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold font-outfit text-text-primary">
                Audio Tag Reference & Script Syntax Guide
              </h3>
              <p className="text-xs text-text-muted">
                ElevenLabs-style embedded emotion, pacing, and human reaction tags for Gujarati news.
              </p>
            </div>
          </div>

          {isTagReferenceOpen ? (
            <ChevronUp className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          )}
        </button>

        {isTagReferenceOpen && (
          <div className="p-6 pt-0 border-t border-border/50 space-y-6 text-xs">
            {/* Emotion Tags */}
            <div className="space-y-3 pt-4">
              <h4 className="font-extrabold text-brand-pink uppercase tracking-wider flex items-center gap-1.5">
                <span>🎭 Emotion Tags</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-elevated text-[11px] font-bold text-text-muted uppercase border-b border-border">
                      <th className="py-2.5 px-3">Tag Syntax</th>
                      <th className="py-2.5 px-3">Acoustic Effect</th>
                      <th className="py-2.5 px-3">Gujarati Newsroom Use Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {audioTags.filter((t) => t.category === "emotion").map((t) => (
                      <tr key={t.tag} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-brand-pink">{t.tag}</td>
                        <td className="py-2 px-3 text-text-primary">{t.description}</td>
                        <td className="py-2 px-3 text-text-muted font-gujarati">{t.gujarati_use_case}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery & Pacing Tags */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-brand-cyan uppercase tracking-wider flex items-center gap-1.5">
                <span>⏸️ Delivery & Pacing Tags</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-elevated text-[11px] font-bold text-text-muted uppercase border-b border-border">
                      <th className="py-2.5 px-3">Tag Syntax</th>
                      <th className="py-2.5 px-3">Acoustic Effect</th>
                      <th className="py-2.5 px-3">Use Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {audioTags.filter((t) => t.category === "delivery").map((t) => (
                      <tr key={t.tag} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-brand-cyan">{t.tag}</td>
                        <td className="py-2 px-3 text-text-primary">{t.description}</td>
                        <td className="py-2 px-3 text-text-muted font-gujarati">{t.gujarati_use_case}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Human Reaction Tags */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-brand-yellow uppercase tracking-wider flex items-center gap-1.5">
                <span>😄 Human Reaction Tags</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-elevated text-[11px] font-bold text-text-muted uppercase border-b border-border">
                      <th className="py-2.5 px-3">Tag Syntax</th>
                      <th className="py-2.5 px-3">Acoustic Effect</th>
                      <th className="py-2.5 px-3">Use Case</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {audioTags.filter((t) => t.category === "reaction").map((t) => (
                      <tr key={t.tag} className="hover:bg-bg-elevated/40 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-brand-yellow">{t.tag}</td>
                        <td className="py-2 px-3 text-text-primary">{t.description}</td>
                        <td className="py-2 px-3 text-text-muted font-gujarati">{t.gujarati_use_case}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Punctuation & Capitalization Rules */}
            <div className="p-4 rounded-xl bg-bg-elevated/60 border border-border space-y-2">
              <h4 className="font-bold text-text-primary text-xs flex items-center gap-1.5">
                <span>⌨️ Punctuation & Dynamic Rhythm Rules</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-muted">
                <li><span className="font-mono font-bold text-brand-pink">...</span> creates a 500ms dramatic suspense pause</li>
                <li><span className="font-mono font-bold text-brand-pink">!</span> adds high energy & crisp emphasis</li>
                <li><span className="font-mono font-bold text-brand-pink">ALL CAPS</span> increases volume and intensity</li>
                <li><span className="font-mono font-bold text-brand-pink">—</span> creates a 250ms sharp thought break</li>
                <li><span className="font-mono font-bold text-brand-pink">,</span> injects a natural short breath pause</li>
                <li><span className="font-mono font-bold text-brand-pink">&lt;tag&gt;</span> syntax is also fully supported</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
