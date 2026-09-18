"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  fetchCategories, 
  fetchAreas, 
  fetchVoices, 
  fetchBgmAssets, 
  fetchBrollAssets,
  generateScriptAPI,
  generateVoiceAPI,
  autoTagScriptAPI,
  uploadMediaAPI,
  Category,
  VoicePreset,
  VoiceProfile
} from "@/lib/api";
import { 
  fetchCapCutPresets, 
  renderCapCutReelAPI, 
  analyzeCapCutClipsAPI, 
  createCapCutWebSocket 
} from "@/lib/capcut/api";
import { CapCutPreset } from "@/lib/capcut/types";
import { StylePresetCards } from "@/components/capcut/StylePresetCards";
import { CapCutUploader } from "@/components/capcut/CapCutUploader";
import { SegmentTimeline } from "@/components/capcut/SegmentTimeline";
import { RenderProgress } from "@/components/capcut/RenderProgress";
import { toast } from "sonner";
import { 
  Sparkles, 
  Layers, 
  Film, 
  Music, 
  Mic, 
  Clock, 
  MapPin, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Loader2,
  UploadCloud,
  FileVideo,
  Volume2,
  Sliders,
  Upload,
  Trash2,
  CheckCircle2,
  Plus,
  Video,
  HardDrive,
  Zap,
  FileText,
  Edit3
} from "lucide-react";

export function NewsControls() {
  const { 
    draft, 
    updateDraft, 
    resetDraft, 
    profile, 
    isGeneratingScript, 
    setIsGeneratingScript,
    setIsGeneratingVoice
  } = useStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [voicePresets, setVoicePresets] = useState<VoicePreset[]>([]);
  const [customVoices, setCustomVoices] = useState<any[]>([]);
  const [bgmList, setBgmList] = useState<{ name: string; url: string }[]>([]);
  const [brollList, setBrollList] = useState<{ name: string; url: string }[]>([]);
  const [capcutPresets, setCapcutPresets] = useState<CapCutPreset[]>([]);

  // Local Video Upload State
  const [singleVideoSource, setSingleVideoSource] = useState<"upload" | "stock">(draft.uploadedSingleClip ? "upload" : "stock");
  const [isUploadingSingle, setIsUploadingSingle] = useState(false);
  const [isUploadingMulti, setIsUploadingMulti] = useState(false);
  const singleFileInputRef = React.useRef<HTMLInputElement>(null);
  const multiFileInputRef = React.useRef<HTMLInputElement>(null);

  // Script Input Mode: "raw" (AI writes full script) vs "direct" (custom script preserved, AI tags & voiceover)
  const [scriptInputMode, setScriptInputMode] = useState<"raw" | "direct">("raw");
  const [isDirectAutoTagging, setIsDirectAutoTagging] = useState(false);
  const [isDirectAutoTaggingAndVoicing, setIsDirectAutoTaggingAndVoicing] = useState(false);

  // CapCut live render state
  const [isRenderingCapCut, setIsRenderingCapCut] = useState(false);
  const [capcutStage, setCapcutStage] = useState("1. Analyzing Motion...");
  const [capcutProgress, setCapcutProgress] = useState(0);
  const [capcutMessage, setCapcutMessage] = useState("");
  const [capcutError, setCapcutError] = useState("");

  // Accordion open states
  const [openSections, setOpenSections] = useState({
    news: true,
    video: true,
    audio: false,
    voice: false,
  });

  const toggleSection = (s: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [c, a, v, bg, br, cp] = await Promise.all([
          fetchCategories(),
          fetchAreas(),
          fetchVoices(),
          fetchBgmAssets(),
          fetchBrollAssets(),
          fetchCapCutPresets().catch(() => ({ presets: [] })),
        ]);
        setCategories(c.categories);
        setAreas(a.areas);
        setVoicePresets(v.presets || []);
        setCustomVoices(v.custom_clones || []);
        setBgmList(bg.bgm_files);
        setBrollList(br.broll_files);
        if (cp?.presets) setCapcutPresets(cp.presets);
      } catch (e) {
        console.warn("Could not load studio options:", e);
      }
    }
    loadData();
  }, []);

  const handleSingleVideoUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isVideo = file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|mkv|webm|avi)$/i);
    if (!isVideo) {
      toast.error("Please upload an MP4, MOV, or WEBM video file");
      return;
    }

    setIsUploadingSingle(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const res = await uploadMediaAPI(file, "broll");
      if (res.filename) {
        updateDraft({ uploadedSingleClip: res.filename });
        toast.success(`✓ Uploaded ${file.name}!`, { id: toastId });
        fetchBrollAssets().then(br => setBrollList(br.broll_files)).catch(() => {});
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setIsUploadingSingle(false);
      if (singleFileInputRef.current) singleFileInputRef.current.value = "";
    }
  };

  const handleMultiVideoUpload = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const videoFiles = Array.from(files).filter(f => f.type.startsWith("video/") || f.name.match(/\.(mp4|mov|mkv|webm|avi)$/i));
    if (videoFiles.length === 0) {
      toast.error("Please upload MP4, MOV, or WEBM video files");
      return;
    }

    setIsUploadingMulti(true);
    const toastId = toast.loading(`Uploading ${videoFiles.length} clips...`);
    const newFilenames: string[] = [];
    try {
      for (const file of videoFiles) {
        const res = await uploadMediaAPI(file, "broll");
        if (res.filename) {
          newFilenames.push(res.filename);
        }
      }
      const existing = draft.uploadedMultiClips || [];
      updateDraft({ uploadedMultiClips: [...existing, ...newFilenames].slice(0, 8) });
      toast.success(`✓ Uploaded ${newFilenames.length} clips!`, { id: toastId });
      fetchBrollAssets().then(br => setBrollList(br.broll_files)).catch(() => {});
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: toastId });
    } finally {
      setIsUploadingMulti(false);
      if (multiFileInputRef.current) multiFileInputRef.current.value = "";
    }
  };

  const handleGenerateScriptAndVoice = async () => {
    if (!draft.rawDetails.trim()) {
      toast.warning("Please enter raw news bulletin points or press release");
      return;
    }

    setIsGeneratingScript(true);
    const toastId = toast.loading(`🤖 Generating Gujarati timed script with ${profile.ai_provider || "Gemini"}...`);

    try {
      // 1. Generate Script
      const scriptRes = await generateScriptAPI({
        raw_details: draft.rawDetails,
        category_code: draft.categoryCode,
        area: draft.area,
        target_duration: draft.targetDuration,
        provider: profile.ai_provider || "Gemini",
      });

      const sData = scriptRes.data;
      updateDraft({
        line1Headline: sData.line1_headline,
        line2Headline: sData.line2_headline,
        voiceoverScript: sData.voiceover_script,
        caption: sData.caption,
        hookSummary: sData.hook_summary,
      });

      toast.loading("🎙️ Synthesizing ultra-natural Gujarati voiceover...", { id: toastId });
      setIsGeneratingVoice(true);

      // 2. Synthesize Voice
      const voiceRes = await generateVoiceAPI({
        script_text: sData.voiceover_script,
        text: sData.voiceover_script,
        voice_id: draft.selectedVoiceMode || "PRARAMBH_FEMALE",
        voice_settings: draft.voiceSettings,
      });

      updateDraft({
        voiceoverAudioUrl: voiceRes.audio_url,
        voiceoverFilename: voiceRes.voiceover_filename,
      });

      toast.success("🎉 Script generated & voice synthesized!", { id: toastId });
    } catch (err: any) {
      toast.error(`Generation failed: ${err.message}`, { id: toastId });
    } finally {
      setIsGeneratingScript(false);
      setIsGeneratingVoice(false);
    }
  };

  const handleDirectAutoTagScript = async (generateVoiceAfter: boolean) => {
    if (!draft.voiceoverScript.trim()) {
      toast.warning("Please enter your Gujarati narration script first");
      return;
    }

    if (generateVoiceAfter) {
      setIsDirectAutoTaggingAndVoicing(true);
      setIsGeneratingVoice(true);
    } else {
      setIsDirectAutoTagging(true);
    }

    const toastId = toast.loading(
      generateVoiceAfter
        ? "🤖 Auto-tagging script & synthesizing voiceover..."
        : "✨ AI is analyzing emotions and inserting audio tags..."
    );

    try {
      const res = await autoTagScriptAPI({
        script_text: draft.voiceoverScript,
        category_code: draft.categoryCode,
        area: draft.area,
        provider: profile.ai_provider || "Gemini",
        generate_voice: generateVoiceAfter,
        voice_id: draft.selectedVoiceMode || "PRARAMBH_MALE",
        voice_settings: draft.voiceSettings,
      });

      if (res.tagged_script) {
        updateDraft({
          voiceoverScript: res.tagged_script,
          ...(generateVoiceAfter && res.audio_url
            ? {
                voiceoverAudioUrl: res.audio_url,
                voiceoverFilename: res.voiceover_filename,
              }
            : {}),
        });
      }

      if (generateVoiceAfter) {
        toast.success("🎉 Script auto-tagged & voiceover generated!", { id: toastId });
      } else {
        toast.success("✨ Audio tags added! (Exact script words preserved)", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Auto-tagging failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDirectAutoTagging(false);
      setIsDirectAutoTaggingAndVoicing(false);
      if (generateVoiceAfter) {
        setIsGeneratingVoice(false);
      }
    }
  };

  const handleSelectPreset = (preset: CapCutPreset) => {
    updateDraft({
      capcutPresetId: preset.id,
      capcutMotionIntensity: preset.motion_intensity,
      capcutTransitionStyle: preset.transition_style,
      bgmDuckVolume: preset.bgm_duck_level,
    });
    toast.info(`Applied style preset: ${preset.name} ${preset.icon}`);
  };

  const handleGenerateCapCutReel = async () => {
    setIsRenderingCapCut(true);
    setCapcutProgress(5);
    setCapcutStage("1. Analyzing Motion...");
    setCapcutMessage("Starting CapCut Beat-Synced Compilation...");
    setCapcutError("");

    try {
      const clips = draft.capcutClips && draft.capcutClips.length > 0
        ? draft.capcutClips
        : ["vesu_traffic_clip.mp4", "adajan_rain_clip.mp4", "diamond_bourse_clip.mp4", "ganesh_utsav_clip.mp4"];

      // 1. Trigger render API
      const res = await renderCapCutReelAPI({
        raw_clip_filenames: clips,
        bgm_filename: draft.selectedBgm,
        voiceover_filename: draft.voiceoverFilename || undefined,
        voiceover_script: draft.voiceoverScript,
        target_duration: draft.targetDuration,
        sync_to_beats: draft.capcutSyncToBeats,
        motion_intensity: draft.capcutMotionIntensity,
        transition_style: draft.capcutTransitionStyle,
        preset_id: draft.capcutPresetId,
        line1_text: draft.line1Headline,
        line2_text: draft.line2Headline,
        category_code: draft.categoryCode,
        area: draft.area,
      });

      const jobId = res.job_id;

      // 2. Connect WebSocket for live progress
      createCapCutWebSocket(
        jobId,
        (data) => {
          if (data.progress !== undefined) setCapcutProgress(data.progress);
          if (data.stage) setCapcutStage(data.stage);
          if (data.message) setCapcutMessage(data.message);

          if (data.status === "completed" && data.video_url) {
            updateDraft({
              renderedVideoUrl: data.video_url,
              renderedVideoFilename: data.video_filename || null,
            });
            setIsRenderingCapCut(false);
            toast.success("🎬 CapCut Reel rendered successfully!");
          } else if (data.status === "failed") {
            setCapcutError(data.error || "Render failed");
            setIsRenderingCapCut(false);
            toast.error(`CapCut Render failed: ${data.error || "Unknown error"}`);
          }
        },
        (err) => {
          console.warn("WS error:", err);
        }
      );

      // Pre-populate interactive timeline
      try {
        const analyzeRes = await analyzeCapCutClipsAPI({
          raw_clip_filenames: clips,
          bgm_filename: draft.selectedBgm,
          voiceover_filename: draft.voiceoverFilename || undefined,
          target_duration: draft.targetDuration,
          motion_intensity: draft.capcutMotionIntensity,
          transition_style: draft.capcutTransitionStyle,
        });
        updateDraft({
          capcutSegments: analyzeRes.segments || [],
          capcutBeatTimes: analyzeRes.beat_times || [],
          capcutDownbeatTimes: analyzeRes.downbeat_times || [],
        });
      } catch (e) {
        console.warn("Timeline analysis warning:", e);
      }

    } catch (err: any) {
      setCapcutError(err.message);
      setIsRenderingCapCut(false);
      toast.error(`Failed to start CapCut render: ${err.message}`);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto p-4 space-y-4 bg-bg-surface border-r border-border select-none">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-pink" />
            Production Controls
          </h2>
          <button
            type="button"
            onClick={resetDraft}
            title="Reset to defaults"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SECTION A: News Bulletin Configuration */}
        <div className="rounded-xl border border-border bg-bg-elevated/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("news")}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-brand-pink" />
              <span>1. News Category & Timing</span>
            </span>
            {openSections.news ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {openSections.news && (
            <div className="p-3.5 pt-1 space-y-3 border-t border-border/50">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">Surat News Category</label>
                <select
                  value={draft.categoryCode}
                  onChange={(e) => updateDraft({ categoryCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Hyperlocal Area */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-brand-pink" />
                  Surat Hyperlocal Area
                </label>
                <select
                  value={draft.area}
                  onChange={(e) => updateDraft({ area: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
                >
                  {areas.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Duration Segmented Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-brand-yellow" />
                    Target Duration
                  </label>
                  <span className="text-[11px] font-bold text-brand-yellow">{draft.targetDuration}s</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
                  {[15, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateDraft({ targetDuration: d })}
                      className={`py-1 rounded-lg text-xs font-bold transition-all ${
                        draft.targetDuration === d
                          ? "brand-gradient-bg text-white shadow-sm glow-pink"
                          : "text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION B: Video Source & Composition Mode */}
        <div className="rounded-xl border border-border bg-bg-elevated/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("video")}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-brand-cyan" />
              <span>2. Video Composition Mode</span>
            </span>
            {openSections.video ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {openSections.video && (
            <div className="p-3.5 pt-1 space-y-3.5 border-t border-border/50 text-xs">
              {/* 3-Way Mode Switch */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
                <button
                  type="button"
                  onClick={() => updateDraft({ videoMode: "single" })}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition-all flex flex-col items-center justify-center ${
                    draft.videoMode === "single"
                      ? "brand-gradient-bg text-white shadow-sm glow-pink"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span>Single Video</span>
                  <span className="text-[8.5px] opacity-80 font-normal">1 Full Clip</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ videoMode: "multi" })}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition-all flex flex-col items-center justify-center ${
                    draft.videoMode === "multi"
                      ? "brand-gradient-bg text-white shadow-sm glow-pink"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  <span>Auto Montage</span>
                  <span className="text-[8.5px] opacity-80 font-normal">Join 2–5 Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ videoMode: "capcut" })}
                  className={`py-1.5 px-1.5 rounded-lg font-bold text-[11px] transition-all flex flex-col items-center justify-center gap-0.5 ${
                    draft.videoMode === "capcut"
                      ? "brand-gradient-bg text-white shadow-sm glow-pink ring-1 ring-white/50"
                      : "text-brand-pink font-bold hover:bg-brand-pink/10"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    🎬 CapCut
                  </span>
                  <span className="text-[8.5px] opacity-80 font-normal">Beat-Synced Cuts</span>
                </button>
              </div>

              {/* MODE 1: Single Clip */}
              {draft.videoMode === "single" && (
                <div className="space-y-2.5">
                  {/* Source Switch: Local Upload vs Stock B-Roll */}
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-brand-pink" />
                      Video Source
                    </span>
                    <div className="flex items-center gap-1 bg-bg-surface p-0.5 rounded-lg border border-border">
                      <button
                        type="button"
                        onClick={() => setSingleVideoSource("upload")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          singleVideoSource === "upload"
                            ? "bg-brand-pink text-white shadow-sm"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Upload Local
                      </button>
                      <button
                        type="button"
                        onClick={() => setSingleVideoSource("stock")}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                          singleVideoSource === "stock"
                            ? "bg-brand-pink text-white shadow-sm"
                            : "text-text-muted hover:text-text-primary"
                        }`}
                      >
                        Stock Library
                      </button>
                    </div>
                  </div>

                  {singleVideoSource === "upload" ? (
                    <div className="space-y-2">
                      <input
                        ref={singleFileInputRef}
                        type="file"
                        accept="video/*,video/mp4,video/quicktime,video/x-matroska,video/webm"
                        className="hidden"
                        onChange={(e) => handleSingleVideoUpload(e.target.files)}
                      />

                      {draft.uploadedSingleClip ? (
                        <div className="p-3 rounded-xl bg-bg-surface border border-emerald-500/40 shadow-sm flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-text-primary truncate">
                                {draft.uploadedSingleClip}
                              </p>
                              <span className="text-[9px] font-semibold text-emerald-400 flex items-center gap-1">
                                ✓ Active Local Clip
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => singleFileInputRef.current?.click()}
                              className="px-2 py-1 rounded-md text-[10px] font-bold bg-bg-elevated hover:bg-bg-base text-text-primary transition-colors"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDraft({ uploadedSingleClip: null })}
                              className="p-1 rounded-md text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Remove clip"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => singleFileInputRef.current?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleSingleVideoUpload(e.dataTransfer.files);
                          }}
                          className="p-4 rounded-xl border-2 border-dashed border-border hover:border-brand-pink/60 bg-bg-surface hover:bg-bg-elevated text-center cursor-pointer transition-all group"
                        >
                          {isUploadingSingle ? (
                            <div className="flex flex-col items-center gap-1.5 py-1">
                              <Loader2 className="w-5 h-5 text-brand-pink animate-spin" />
                              <span className="text-[11px] font-semibold text-text-primary">Uploading video clip...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 py-1">
                              <div className="w-7 h-7 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-text-primary">
                                Drag & Drop Local Video or <span className="text-brand-pink underline">Browse</span>
                              </span>
                              <span className="text-[9px] text-text-muted">MP4, MOV, WEBM (9:16 vertical auto-fitted)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-text-muted">Select Stock B-Roll Video</label>
                      <select
                        value={draft.selectedStockBroll}
                        onChange={(e) => updateDraft({ selectedStockBroll: e.target.value, uploadedSingleClip: null })}
                        className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
                      >
                        {brollList.map((b) => (
                          <option key={b.name} value={b.name}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: Auto Montage */}
              {draft.videoMode === "multi" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-brand-cyan" />
                      Montage Clips (2–5 recommended)
                    </label>
                    <span className="text-[10px] text-brand-cyan font-bold">
                      {draft.uploadedMultiClips?.length || 0} local clip{(draft.uploadedMultiClips?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <input
                    ref={multiFileInputRef}
                    type="file"
                    multiple
                    accept="video/*,video/mp4,video/quicktime,video/x-matroska,video/webm"
                    className="hidden"
                    onChange={(e) => handleMultiVideoUpload(e.target.files)}
                  />

                  <div
                    onClick={() => multiFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleMultiVideoUpload(e.dataTransfer.files);
                    }}
                    className="p-3.5 rounded-xl border-2 border-dashed border-border hover:border-brand-cyan/60 bg-bg-surface hover:bg-bg-elevated text-center cursor-pointer transition-all group"
                  >
                    {isUploadingMulti ? (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <Loader2 className="w-5 h-5 text-brand-cyan animate-spin" />
                        <span className="text-[11px] font-semibold text-text-primary">Uploading clips...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 py-0.5">
                        <div className="w-7 h-7 rounded-full bg-brand-cyan/10 flex items-center justify-center text-brand-cyan group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-text-primary">
                          Upload 2–5 Local Clips for Montage or <span className="text-brand-cyan underline">Browse</span>
                        </span>
                        <span className="text-[9px] text-text-muted">Auto-splices 3-4s micro-cuts from each video</span>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Clips List */}
                  {draft.uploadedMultiClips && draft.uploadedMultiClips.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {draft.uploadedMultiClips.map((fn, idx) => (
                        <div
                          key={`${fn}-${idx}`}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border text-[11px]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded bg-brand-cyan/15 text-brand-cyan text-[9px] font-extrabold flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="truncate text-text-primary font-medium">{fn}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.uploadedMultiClips.filter((_, i) => i !== idx);
                              updateDraft({ uploadedMultiClips: updated });
                            }}
                            className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            title="Remove clip"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-bg-surface/50 border border-border/60 text-center">
                      <p className="text-[10px] text-text-muted">
                        ℹ️ No local clips added yet. Auto Montage will automatically use default stock clips from the B-Roll library.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 3: CapCut Style Auto Editor */}
              {draft.videoMode === "capcut" && (
                <div className="space-y-3.5 pt-1">
                  {/* Style Presets */}
                  <StylePresetCards
                    presets={capcutPresets}
                    selectedPresetId={draft.capcutPresetId || "serious"}
                    onSelectPreset={handleSelectPreset}
                  />

                  {/* Multi-Clip Uploader & Motion Controls */}
                  <CapCutUploader
                    uploadedClips={draft.capcutClips || []}
                    onClipsChange={(clips) => updateDraft({ capcutClips: clips })}
                    syncToBeats={draft.capcutSyncToBeats}
                    onSyncToBeatsChange={(val) => updateDraft({ capcutSyncToBeats: val })}
                    motionIntensity={draft.capcutMotionIntensity || "balanced"}
                    onMotionIntensityChange={(val) => updateDraft({ capcutMotionIntensity: val })}
                    transitionStyle={draft.capcutTransitionStyle || "auto"}
                    onTransitionStyleChange={(val) => updateDraft({ capcutTransitionStyle: val })}
                    targetDuration={draft.targetDuration}
                    onTargetDurationChange={(dur) => updateDraft({ targetDuration: dur })}
                    onGenerate={handleGenerateCapCutReel}
                    isGenerating={isRenderingCapCut}
                  />

                  {/* Real-time multi-stage render progress modal/box */}
                  {isRenderingCapCut && (
                    <div className="pt-2">
                      <RenderProgress
                        currentStage={capcutStage}
                        progressPercent={capcutProgress}
                        message={capcutMessage}
                        error={capcutError}
                      />
                    </div>
                  )}

                  {/* Interactive Timeline Display */}
                  {draft.capcutSegments && draft.capcutSegments.length > 0 && !isRenderingCapCut && (
                    <div className="pt-2">
                      <SegmentTimeline
                        segments={draft.capcutSegments}
                        totalDuration={draft.targetDuration}
                        beatTimes={draft.capcutBeatTimes}
                        downbeatTimes={draft.capcutDownbeatTimes}
                        selectedSegmentIndex={draft.capcutSelectedSegmentIndex}
                        onSelectSegment={(idx) => updateDraft({ capcutSelectedSegmentIndex: idx })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION C: Audio & BGM */}
        <div className="rounded-xl border border-border bg-bg-elevated/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("audio")}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-brand-yellow" />
              <span>3. Background News Beat</span>
            </span>
            {openSections.audio ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {openSections.audio && (
            <div className="p-3.5 pt-1 space-y-3 border-t border-border/50 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-text-muted">BGM Soundtrack</label>
                <select
                  value={draft.selectedBgm}
                  onChange={(e) => updateDraft({ selectedBgm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
                >
                  {bgmList.map((bg) => (
                    <option key={bg.name} value={bg.name}>{bg.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-text-muted">Ducking Multiplier</label>
                  <span className="text-[11px] font-mono text-brand-yellow">{draft.bgmDuckVolume}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.25"
                  step="0.01"
                  value={draft.bgmDuckVolume}
                  onChange={(e) => updateDraft({ bgmDuckVolume: parseFloat(e.target.value) })}
                  className="w-full accent-brand-pink"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION D: Voiceover Anchor */}
        <div className="rounded-xl border border-border bg-bg-elevated/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("voice")}
            className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-bold text-text-primary hover:bg-bg-elevated transition-colors"
          >
            <span className="flex items-center gap-2">
              <Mic className="w-3.5 h-3.5 text-brand-pink" />
              <span>4. Gujarati News Anchor</span>
            </span>
            {openSections.voice ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
          </button>

          {openSections.voice && (
            <div className="p-3.5 pt-1 space-y-3 border-t border-border/50 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-text-muted">Select Primary Voice Anchor</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => updateDraft({ selectedVoiceMode: "PRARAMBH_MALE" })}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-0.5 ${
                      draft.selectedVoiceMode === "PRARAMBH_MALE"
                        ? "brand-gradient-bg text-white shadow-sm glow-pink"
                        : "bg-bg-surface border border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span className="text-sm">🎙️</span>
                    <span className="truncate">PRARAMBH_MALE</span>
                    <span className="text-[9px] opacity-80">પુરુષ અવાજ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateDraft({ selectedVoiceMode: "PRARAMBH_FEMALE" })}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-0.5 ${
                      draft.selectedVoiceMode === "PRARAMBH_FEMALE"
                        ? "brand-gradient-bg text-white shadow-sm glow-pink"
                        : "bg-bg-surface border border-border text-text-muted hover:text-text-primary"
                    }`}
                  >
                    <span className="text-sm">🎙️</span>
                    <span className="truncate">PRARAMBH_FEMALE</span>
                    <span className="text-[9px] opacity-80">સ્ત્રી અવાજ</span>
                  </button>
                </div>
              </div>

              {customVoices.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-text-muted">Or Custom Registered Clone</label>
                  <select
                    value={draft.selectedVoiceMode.startsWith("CUSTOM_") ? draft.selectedVoiceMode : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        updateDraft({ selectedVoiceMode: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
                  >
                    <option value="">Choose custom clone...</option>
                    {customVoices.map((cv) => (
                      <option key={cv.id} value={cv.id}>{cv.display_name} ({cv.gender})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Speaking Speed Control */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-text-muted flex items-center gap-1">
                    <Zap className="w-3 h-3 text-brand-yellow" />
                    Speaking Speed (બોલવાની ઝડપ)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-brand-pink">
                    {(draft.voiceSettings?.speed || 1.0).toFixed(2)}x
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[1.0, 1.15, 1.25, 1.35].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() =>
                        updateDraft({
                          voiceSettings: {
                            ...(draft.voiceSettings || {}),
                            speed: spd,
                          },
                        })
                      }
                      className={`py-1 rounded-md text-[10.5px] font-bold transition-all ${
                        Math.abs((draft.voiceSettings?.speed || 1.0) - spd) < 0.01
                          ? "brand-gradient-bg text-white shadow-xs"
                          : "bg-bg-surface border border-border text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {spd.toFixed(2)}x
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.05"
                  value={draft.voiceSettings?.speed || 1.0}
                  onChange={(e) =>
                    updateDraft({
                      voiceSettings: {
                        ...(draft.voiceSettings || {}),
                        speed: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full accent-brand-pink"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION E: News Script Input (Raw vs Direct Mode) */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-pink" />
              <span>5. Script Input Mode</span>
            </label>
          </div>

          {/* Mode Switcher: Raw Bulletin vs Direct Script */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
            <button
              type="button"
              onClick={() => setScriptInputMode("raw")}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                scriptInputMode === "raw"
                  ? "brand-gradient-bg text-white shadow-sm glow-pink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Raw Bulletin</span>
            </button>

            <button
              type="button"
              onClick={() => setScriptInputMode("direct")}
              className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                scriptInputMode === "direct"
                  ? "brand-gradient-bg text-white shadow-sm glow-pink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Direct Script</span>
            </button>
          </div>

          {scriptInputMode === "raw" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-text-muted">
                <span>Enter raw news bullet points</span>
                <span>AI writes complete story</span>
              </div>
              <textarea
                rows={4}
                value={draft.rawDetails}
                onChange={(e) => updateDraft({ rawDetails: e.target.value })}
                placeholder="Enter raw Gujarati news bullet points..."
                className="w-full p-3 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none resize-none transition-colors"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10.5px] text-brand-pink font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>કસ્ટમ સ્ક્રિપ્ટ (શબ્દો 100% સુરક્ષિત રહેશે)</span>
                </span>
                <span className="text-[9.5px] text-text-muted">AI ફક્ત ભાવ મુજબ ટેગ ઉમેરશે</span>
              </div>
              <textarea
                rows={4}
                value={draft.voiceoverScript}
                onChange={(e) => updateDraft({ voiceoverScript: e.target.value })}
                placeholder="લખો અથવા પેસ્ટ કરો તમારી કસ્ટમ ગુજરાતી સ્ક્રિપ્ટ..."
                className="w-full p-3 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary font-gujarati focus:border-brand-yellow outline-none resize-none transition-colors leading-relaxed"
              />
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => handleDirectAutoTagScript(false)}
                  disabled={isDirectAutoTagging || isDirectAutoTaggingAndVoicing || !draft.voiceoverScript.trim()}
                  className="py-1 px-2.5 rounded-lg text-[11px] font-bold text-brand-pink bg-brand-pink/10 border border-brand-pink/30 hover:bg-brand-pink/20 transition-all flex items-center gap-1 disabled:opacity-40"
                >
                  {isDirectAutoTagging ? (
                    <Loader2 className="w-3 h-3 animate-spin text-brand-pink" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-brand-pink" />
                  )}
                  <span>{isDirectAutoTagging ? "Tagging..." : "✨ Add AI Tags Only"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2 sticky bottom-0 bg-bg-surface pb-1">
        {scriptInputMode === "raw" ? (
          <button
            type="button"
            onClick={handleGenerateScriptAndVoice}
            disabled={isGeneratingScript || !draft.rawDetails.trim()}
            className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white brand-gradient-bg glow-pink shadow-md hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating AI Script & Audio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-brand-yellow" />
                <span>Generate Script & Voiceover</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleDirectAutoTagScript(true)}
            disabled={isDirectAutoTaggingAndVoicing || isDirectAutoTagging || !draft.voiceoverScript.trim()}
            className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white brand-gradient-bg glow-pink shadow-md hover:opacity-95 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isDirectAutoTaggingAndVoicing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Auto-Tagging & Synthesizing Voice...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-brand-yellow" />
                <span>⚡ Auto-Tag & Generate Voiceover</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
