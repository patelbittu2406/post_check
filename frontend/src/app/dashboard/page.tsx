"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import { 
  fetchCategories, 
  fetchAreas, 
  fetchBgmAssets, 
  fetchBrollAssets,
  generateScriptAPI, 
  generateVoiceAPI, 
  autoTagScriptAPI,
  renderVideoAPI, 
  publishInstagramAPI,
  uploadMediaAPI,
  Category 
} from "@/lib/api";
import { toast } from "sonner";
import { 
  Sparkles, 
  Film, 
  Video, 
  UploadCloud, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Loader2, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Volume2, 
  Type, 
  Music, 
  Trash2, 
  Layers, 
  RefreshCw, 
  FileText, 
  Mic, 
  BookOpen, 
  Wand2, 
  Tag,
  ZoomIn,
  ZoomOut,
  Undo2,
  Redo2,
  Shield,
  Eye,
  Settings2,
  X,
  Share2
} from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function DashboardPage() {
  const { 
    draft, 
    updateDraft, 
    resetDraft, 
    profile, 
    isGeneratingScript, 
    setIsGeneratingScript,
    isGeneratingVoice, 
    setIsGeneratingVoice,
    isRenderingVideo, 
    setIsRenderingVideo,
    isPublishing, 
    setIsPublishing
  } = useStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [brollAssets, setBrollAssets] = useState<{ name: string; url: string; size_mb: number; type: string }[]>([]);
  const [bgmAssets, setBgmAssets] = useState<{ name: string; url: string; size_kb: number }[]>([]);

  // Canvas Top Toolbar states
  const [zoomLevel, setZoomLevel] = useState<"fit" | "75" | "100">("fit");
  const [showSafeZone, setShowSafeZone] = useState(true);

  // Modals
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showCaptionDrawer, setShowCaptionDrawer] = useState(false);

  // Canvas Video Player & Scrubber state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Uploading and tagging states
  const [isUploadingClip, setIsUploadingClip] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const scriptTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load Categories, Areas, and Assets
  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, aRes, brRes, bgRes] = await Promise.all([
          fetchCategories(),
          fetchAreas(),
          fetchBrollAssets().catch(() => ({ broll_files: [] })),
          fetchBgmAssets().catch(() => ({ bgm_files: [] })),
        ]);
        setCategories(cRes.categories || []);
        setAreas(aRes?.areas || []);
        setBrollAssets(brRes.broll_files || []);
        setBgmAssets(bgRes.bgm_files || []);
      } catch (err) {
        console.warn("Could not load studio data:", err);
      }
    }
    loadData();
  }, []);

  // Sync Video Playback
  const togglePlay = () => {
    if (videoPlayerRef.current) {
      if (videoPlayerRef.current.paused) {
        videoPlayerRef.current.play();
        setIsPlaying(true);
      } else {
        videoPlayerRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoPlayerRef.current) {
      setCurrentTime(videoPlayerRef.current.currentTime);
      if (videoPlayerRef.current.duration) {
        setDuration(videoPlayerRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // --------------------------------------------------------------------------
  // STEP 1: Generate Script & Headlines (AI Gemini / NLP)
  // --------------------------------------------------------------------------
  const handleStep1GenerateScript = async () => {
    if (!draft.rawDetails.trim()) {
      toast.warning("Please enter your news details first");
      return;
    }

    setIsGeneratingScript(true);
    const toastId = toast.loading("✨ Generating script & headlines with Gemini AI...");

    try {
      const scriptRes = await generateScriptAPI({
        raw_details: draft.rawDetails,
        category_code: draft.categoryCode || "N01",
        area: draft.area || "All Surat",
        target_duration: draft.targetDuration || 30,
        provider: profile.ai_provider || "Gemini",
      });

      const scriptText = scriptRes.voiceover_script || scriptRes.script || "";
      const l1 = scriptRes.line1_headline || "સુરત ન્યૂઝ અપડેટ";
      const l2 = scriptRes.line2_headline || "તાજા સમાચાર | અત્યારના સૌથી મોટા અહેવાલ";
      const cap = scriptRes.caption || "";

      updateDraft({
        line1Headline: l1,
        line2Headline: l2,
        voiceoverScript: scriptText,
        caption: cap,
        voiceoverAudioUrl: "",
        voiceoverFilename: "",
      });

      toast.success("✨ Script & Headlines ready! Review and generate voice below.", {
        id: toastId,
        duration: 4000,
      });
    } catch (err: any) {
      console.error("Step 1 Script Generation Error:", err);
      toast.error(`Script generation failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // --------------------------------------------------------------------------
  // Dedicated Voiceover Generation (ElevenLabs Multilingual v2)
  // --------------------------------------------------------------------------
  const handleGenerateVoice = async () => {
    const textToSpeak = draft.voiceoverScript.trim();
    if (!textToSpeak) {
      toast.warning("Please enter or generate a script first.");
      return;
    }

    setIsGeneratingVoice(true);
    const toastId = toast.loading("🎙️ ElevenLabs Multilingual v2 is generating voiceover...");

    try {
      const voiceRes = await generateVoiceAPI({
        script_text: textToSpeak,
        voice_id: draft.selectedVoiceMode || "PRARAMBH_MALE",
        voice_settings: draft.voiceSettings,
      });

      if (voiceRes && voiceRes.audio_url) {
        updateDraft({
          voiceoverAudioUrl: voiceRes.audio_url,
          voiceoverFilename: voiceRes.voiceover_filename,
        });
        toast.success("✅ Voiceover generated successfully!", { id: toastId });
      } else {
        toast.error("Audio generation failed. Please try again.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Voice Generation Error:", err);
      toast.error(`Voice generation error: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // --------------------------------------------------------------------------
  // Auto-Tag Plain Script with Gemini (Inserts [excited], [pauses], etc.)
  // --------------------------------------------------------------------------
  const handleAutoTagScript = async () => {
    const textToTag = draft.voiceoverScript.trim();
    if (!textToTag) {
      toast.warning("કૃપા કરીને પહેલા પ્લેન સ્ક્રિપ્ટ લખો અથવા પેસ્ટ કરો.");
      return;
    }

    setIsAutoTagging(true);
    const toastId = toast.loading("✨ Gemini સ્ક્રિપ્ટમાં નેચરલ [excited], [pauses] ટેગ્સ ઉમેરી રહ્યું છે...");

    try {
      const res = await autoTagScriptAPI({
        script_text: textToTag,
        category_code: draft.categoryCode || "N01",
        area: draft.area || "All Surat (સમગ્ર સુરત)",
        provider: "Gemini",
        generate_voice: false,
      });

      if (res && res.tagged_script) {
        updateDraft({
          voiceoverScript: res.tagged_script,
        });
        toast.success("✅ Gemini એ સ્ક્રિપ્ટમાં યોગ્ય ઓડિયો ટેગ્સ ઉમેરી દીધા!", {
          id: toastId,
          duration: 4000,
        });
      } else {
        toast.error("ટેગ્સ ઉમેરવામાં નિષ્ફળતા મળી.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Gemini Auto-Tag Error:", err);
      toast.error(`ટેગ્સ ઉમેરવામાં ભૂલ આવી: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsAutoTagging(false);
    }
  };

  // Remove bracketed tags
  const handleStripTags = () => {
    const current = draft.voiceoverScript;
    if (!current.trim()) return;
    const stripped = current.replace(/\[[a-zA-Z_ ]+\]|\<[a-zA-Z_ ]+\>/g, " ").replace(/\s+/g, " ").trim();
    updateDraft({ voiceoverScript: stripped });
    toast.info("ટેગ્સ હટાવીને પ્લેન સ્ક્રિપ્ટ બનાવી દીધી.");
  };

  // Insert tag at cursor position
  const handleInsertTag = (tag: string) => {
    const textarea = scriptTextareaRef.current;
    if (!textarea) {
      updateDraft({ voiceoverScript: draft.voiceoverScript ? `${draft.voiceoverScript} ${tag} ` : `${tag} ` });
      return;
    }
    const start = textarea.selectionStart ?? draft.voiceoverScript.length;
    const end = textarea.selectionEnd ?? draft.voiceoverScript.length;
    const current = draft.voiceoverScript;
    const newText = current.substring(0, start) + `${tag} ` + current.substring(end);
    updateDraft({ voiceoverScript: newText });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 1, start + tag.length + 1);
    }, 50);
  };

  // --------------------------------------------------------------------------
  // Clip Upload (Drag & Drop)
  // --------------------------------------------------------------------------
  const onDropVideo = async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setIsUploadingClip(true);
    const tId = toast.loading(`Uploading ${acceptedFiles.length} clip(s)...`);

    try {
      if (draft.videoMode === "single") {
        const file = acceptedFiles[0];
        const res = await uploadMediaAPI(file, "clip");
        updateDraft({
          uploadedSingleClip: res.filename,
          selectedStockBroll: "",
        });
        toast.success(`✓ Video '${file.name}' uploaded!`, { id: tId });
      } else {
        const uploadedNames: string[] = [];
        for (const file of acceptedFiles) {
          const res = await uploadMediaAPI(file, "clip");
          uploadedNames.push(res.filename);
        }
        updateDraft({
          uploadedMultiClips: [...(draft.uploadedMultiClips || []), ...uploadedNames],
        });
        toast.success(`✓ ${uploadedNames.length} clips added to montage!`, { id: tId });
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`, { id: tId });
    } finally {
      setIsUploadingClip(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropVideo,
    accept: { "video/*": [".mp4", ".mov", ".mkv", ".webm"] },
    multiple: draft.videoMode === "multi",
  });

  // --------------------------------------------------------------------------
  // STEP 2: Render Final Reel
  // --------------------------------------------------------------------------
  const handleStep2Render = async () => {
    if (!draft.voiceoverFilename && !draft.voiceoverAudioUrl) {
      toast.warning("Please generate voiceover audio first before rendering.");
      return;
    }

    setIsRenderingVideo(true);
    const toastId = toast.loading("🎬 Rendering 9:16 Video Reel with headlines and subtitles...");

    try {
      const renderRes = await renderVideoAPI({
        video_mode: draft.videoMode === "multi" ? "multi" : "single",
        single_video_filename: draft.uploadedSingleClip || draft.selectedStockBroll || "surat_city_loop.mp4",
        multi_clip_filenames: draft.uploadedMultiClips.length > 0 ? draft.uploadedMultiClips : undefined,
        voiceover_filename: draft.voiceoverFilename || "voiceover.wav",
        bg_music_filename: draft.selectedBgm || "surat_news_bgm.mp3",
        line1_text: draft.line1Headline || "સુરત ન્યૂઝ અપડેટ",
        line2_text: draft.line2Headline || "તાજા સમાચાર",
        line1_bg: profile.line1_bg || "#FF0033",
        line1_text_color: profile.line1_text || "#FFFFFF",
        line2_bg: profile.line2_bg || "#0080FF",
        line2_text_color: profile.line2_text || "#FFFFFF",
        sub_font_size: draft.subtitleFontSize || 28,
        sub_color: draft.subtitleHighlightColor || "#FFD700",
        category_code: draft.categoryCode || "N01",
        area: draft.area || "All Surat",
        watermark_enabled: profile.watermark_enabled ?? true,
        watermark_position: profile.watermark_position || "top-right",
      });

      if (renderRes && renderRes.video_url) {
        updateDraft({
          renderedVideoUrl: renderRes.video_url,
          renderedVideoFilename: renderRes.video_filename,
        });
        toast.success("🎉 Reel successfully rendered! Ready to publish.", { id: toastId });
      } else {
        toast.info("Render finished. Check video canvas.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Step 2 Render Error:", err);
      toast.error(`Rendering failed: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsRenderingVideo(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 3: 1-Click Instagram Publish
  // --------------------------------------------------------------------------
  const handleStep3Publish = async () => {
    if (!draft.renderedVideoFilename && !draft.renderedVideoUrl) {
      toast.warning("Please render the reel first before publishing.");
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading("🚀 Publishing 9:16 Reel to Instagram...");

    try {
      const pubRes = await publishInstagramAPI({
        video_filename: draft.renderedVideoFilename || "final_rendered_reel.mp4",
        caption: draft.caption || "Surat Latest News #Surat #News",
        dry_run: false,
      });

      if (pubRes && (pubRes.media_id || pubRes.status === "success")) {
        toast.success("🎉 Reel successfully published to Instagram!", { id: toastId, duration: 6000 });
        setShowPublishModal(false);
      } else {
        toast.info(pubRes.message || "Publish request sent to Instagram.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Step 3 Publish Error:", err);
      toast.error(`Publish failed: ${err.message || "Check Instagram connection in Settings."}`, { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const isReelReadyToPublish = Boolean(draft.renderedVideoUrl || draft.renderedVideoFilename);

  return (
    <div className="flex h-full w-full bg-[#F8F9FA] overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* ZONE B: Contextual Left Drawer (Canva Studio Controls Panel, ~360px)  */}
      {/* ===================================================================== */}
      <aside className="w-[360px] h-full bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 z-20 overflow-hidden shadow-xs">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Studio Controls
            </h2>
            <p className="text-[11px] text-slate-500">Create Surat 9:16 Instagram Reel</p>
          </div>
          <button
            onClick={() => setShowAdvancedModal(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Advanced Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Controls Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* 1. Category & Area (Compact Dropdowns) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Category</label>
              <select
                value={draft.categoryCode}
                onChange={(e) => updateDraft({ categoryCode: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {categories.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.emoji || "📰"} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Area</label>
              <select
                value={draft.area}
                onChange={(e) => updateDraft({ area: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              >
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. News Input (Minimal Textarea) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-slate-700">News Details</label>
              <span className="text-[10px] text-slate-400">Gujarati input supported</span>
            </div>
            <textarea
              value={draft.rawDetails}
              onChange={(e) => updateDraft({ rawDetails: e.target.value })}
              rows={3}
              placeholder="સમાચારની વિગતો અહીં લખો (જેમ કે: અડાજણમાં નવો ફ્લાયઓવર શરૂ થયો...)"
              className="w-full p-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-gujarati leading-relaxed resize-none shadow-2xs"
            />
          </div>

          {/* 3. Voice & Video Mode */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Voice Persona</label>
              <select
                value={draft.selectedVoiceMode}
                onChange={(e) => updateDraft({ selectedVoiceMode: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E7EB] text-slate-800 text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
              >
                <option value="PRARAMBH_MALE">🎙️ Prarambh Male (Natural Gujarati)</option>
                <option value="PRARAMBH_FEMALE">🎙️ Prarambh Female (Expressive Gujarati)</option>
              </select>
            </div>

            {/* Segmented Pill Toggle: Single Video vs Auto Montage */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Video Layout</label>
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => updateDraft({ videoMode: "single" })}
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all ${
                    draft.videoMode === "single"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Single Video
                </button>
                <button
                  type="button"
                  onClick={() => updateDraft({ videoMode: "multi" })}
                  className={`py-1 rounded-md text-[11px] font-semibold transition-all ${
                    draft.videoMode === "multi"
                      ? "bg-white text-indigo-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Auto Montage
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Soft Canva Purple */}
          <button
            onClick={handleStep1GenerateScript}
            disabled={isGeneratingScript || !draft.rawDetails.trim()}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGeneratingScript ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Generating Script...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>✨ Generate Script & Audio</span>
              </>
            )}
          </button>

          {/* Headline Preview Card (Dual Stripes) */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-[#E5E7EB] space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Headline Stripes (Live Preview)
            </span>
            <div className="space-y-1.5">
              <input
                type="text"
                value={draft.line1Headline}
                onChange={(e) => updateDraft({ line1Headline: e.target.value })}
                placeholder="Line 1: સુરત ન્યૂઝ અપડેટ"
                className="w-full px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold font-gujarati text-slate-800 focus:outline-none focus:border-red-400"
              />
              <input
                type="text"
                value={draft.line2Headline}
                onChange={(e) => updateDraft({ line2Headline: e.target.value })}
                placeholder="Line 2: મુખ્ય સમાચાર"
                className="w-full px-2.5 py-1 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-bold font-gujarati text-slate-800 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          {/* Gujarati Voiceover Script Card */}
          <div className="p-3 rounded-xl bg-slate-50/80 border border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3 h-3 text-indigo-600" />
                Gujarati Script
              </span>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <span>{draft.voiceoverScript ? draft.voiceoverScript.split(/\s+/).filter(Boolean).length : 0} w</span>
                <span>•</span>
                <span>~{Math.max(5, Math.round((draft.voiceoverScript ? draft.voiceoverScript.split(/\s+/).filter(Boolean).length : 0) / 2.5))}s</span>
              </div>
            </div>

            <textarea
              ref={scriptTextareaRef}
              value={draft.voiceoverScript}
              onChange={(e) => updateDraft({ voiceoverScript: e.target.value })}
              rows={3}
              placeholder="Script with tags [excited], [pauses]..."
              className="w-full p-2.5 rounded-lg bg-white border border-[#E5E7EB] text-[11px] font-gujarati text-slate-800 focus:outline-none focus:border-indigo-500 resize-none shadow-2xs leading-relaxed"
            />

            {/* Gemini Auto-Tag Action & Clear Button */}
            <div className="flex items-center justify-between gap-1.5">
              <button
                type="button"
                onClick={handleAutoTagScript}
                disabled={isAutoTagging || !draft.voiceoverScript.trim()}
                className="flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60 transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                title="Gemini will intelligently insert [excited], [pauses], etc."
              >
                {isAutoTagging ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Tagging...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3" />
                    <span>✨ Gemini Auto-Tag</span>
                  </>
                )}
              </button>

              {draft.voiceoverScript && draft.voiceoverScript.match(/\[[a-zA-Z_ ]+\]/) && (
                <button
                  type="button"
                  onClick={handleStripTags}
                  className="py-1.5 px-2 rounded-lg text-[10px] text-slate-500 hover:text-slate-800 bg-white border border-[#E5E7EB] transition-colors"
                  title="Remove tags back to plain script"
                >
                  Clear Tags
                </button>
              )}
            </div>

            {/* Audio Synthesis / Status Card */}
            {!draft.voiceoverAudioUrl ? (
              <button
                onClick={handleGenerateVoice}
                disabled={isGeneratingVoice || !draft.voiceoverScript.trim()}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingVoice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Voice...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>🎙️ Generate Voiceover</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800">
                <span className="flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Voiceover Audio Ready
                </span>
                <button
                  onClick={handleGenerateVoice}
                  disabled={isGeneratingVoice}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Re-voice
                </button>
              </div>
            )}
          </div>

          {/* Video Media Upload Dropzone */}
          <div
            {...getRootProps()}
            className={`p-3 rounded-xl border border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragActive
                ? "border-indigo-500 bg-indigo-50/50"
                : "border-[#E5E7EB] hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-[11px] font-semibold text-slate-700">
              {draft.uploadedSingleClip || draft.uploadedMultiClips.length > 0
                ? "Click or drop to replace video clip"
                : "Drop 9:16 Video Clip here"}
            </span>
            <span className="text-[10px] text-slate-400">MP4, MOV supported</span>
          </div>

          {/* Secondary Action: Render Final Reel */}
          <button
            onClick={handleStep2Render}
            disabled={isRenderingVideo || (!draft.voiceoverAudioUrl && !draft.voiceoverFilename)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isRenderingVideo ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering 9:16 Reel...</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>🎬 Render Video</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ===================================================================== */}
      {/* ZONE C: Center Stage (The Canvas)                                     */}
      {/* ===================================================================== */}
      <main className="flex-1 flex flex-col h-full bg-[#F3F4F6] relative overflow-hidden">
        {/* Floating Top Toolbar */}
        <div className="h-12 px-6 bg-white border-b border-[#E5E7EB] flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            {/* Zoom Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {(["fit", "75", "100"] as const).map((z) => (
                <button
                  key={z}
                  onClick={() => setZoomLevel(z)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${
                    zoomLevel === z ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {z === "fit" ? "Fit" : `${z}%`}
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Safe Zone Toggle */}
            <button
              onClick={() => setShowSafeZone(!showSafeZone)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                showSafeZone
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Instagram 9:16 safe zone overlays"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Safe Zones: {showSafeZone ? "ON" : "OFF"}</span>
            </button>
          </div>

          {/* Top Right: Publish to Instagram Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPublishModal(true)}
              disabled={!isReelReadyToPublish}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>🚀 Publish to Instagram</span>
            </button>
          </div>
        </div>

        {/* The Canvas Work Area */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
          {/* Vertical 9:16 Mobile Canvas Mockup (Clean Canva Bezel) */}
          <div 
            className={`relative rounded-[28px] bg-white p-2.5 shadow-xl shadow-slate-200/80 border border-slate-200 flex flex-col transition-all duration-200 ${
              zoomLevel === "100" 
                ? "w-[340px] h-[604px]" 
                : zoomLevel === "75" 
                ? "w-[270px] h-[480px]" 
                : "w-[300px] h-[533px]"
            }`}
          >
            {/* Viewport Screen */}
            <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-slate-950 flex flex-col justify-between select-none">
              {/* Video Element */}
              {draft.renderedVideoUrl ? (
                <video
                  ref={videoPlayerRef}
                  src={draft.renderedVideoUrl}
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-black flex items-center justify-center">
                  <div className="text-center p-4">
                    <Film className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                    <span className="text-[11px] text-slate-400 font-medium">9:16 Canvas Preview</span>
                  </div>
                </div>
              )}

              {/* Overlays (Rendered live if no final video yet) */}
              {!draft.renderedVideoUrl && (
                <>
                  {/* Top Live Headline Stripe Overlays */}
                  <div className="relative z-10 mt-6 px-3 flex flex-col items-center gap-1.5">
                    <div 
                      className="px-3 py-1 rounded-lg text-white font-extrabold font-gujarati text-[11px] text-center shadow-md max-w-[95%]"
                      style={{ backgroundColor: profile.line1_bg || "#FF0033" }}
                    >
                      {draft.line1Headline || "સુરત ન્યૂઝ અપડેટ"}
                    </div>
                    <div 
                      className="px-3 py-1 rounded-lg text-white font-extrabold font-gujarati text-[11px] text-center shadow-md max-w-[95%]"
                      style={{ backgroundColor: profile.line2_bg || "#0080FF" }}
                    >
                      {draft.line2Headline || "મુખ્ય સમાચાર"}
                    </div>
                  </div>

                  {/* Subtitle Pill Overlay */}
                  <div className="relative z-10 pb-5 px-3 mt-auto text-center">
                    <div className="inline-block px-2.5 py-1 rounded-md bg-black/75 border border-white/10 text-[10px] font-gujarati font-bold text-yellow-300 shadow-sm max-w-[90%]">
                      {draft.voiceoverScript 
                        ? draft.voiceoverScript.replace(/\[[a-zA-Z_ ]+\]/g, "").slice(0, 45) + "..." 
                        : "સુરતના તાજા સમાચાર..."}
                    </div>
                  </div>
                </>
              )}

              {/* Safe Zone Overlays (Instagram Reel UI bounds) */}
              {showSafeZone && (
                <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2">
                  <div className="h-10 border-b border-dashed border-red-400/40 flex items-end justify-center">
                    <span className="text-[8px] font-semibold text-red-300 uppercase tracking-widest bg-black/40 px-1 rounded">Top UI Zone</span>
                  </div>
                  <div className="h-14 border-t border-dashed border-red-400/40 flex items-start justify-center pt-1">
                    <span className="text-[8px] font-semibold text-red-300 uppercase tracking-widest bg-black/40 px-1 rounded">Caption Zone</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Track: Minimal Timeline Scrubber */}
        <div className="h-14 px-6 bg-white border-t border-[#E5E7EB] flex items-center justify-between gap-4 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-xs"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <span className="text-xs font-mono text-slate-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Audio Waveform Visualization Simulation & Range Scrubber */}
          <div className="flex-1 flex items-center gap-2 max-w-md">
            <div className="flex items-center gap-0.5 h-4 opacity-50">
              {[40, 70, 90, 60, 30, 80, 100, 50, 75, 45, 95, 65, 35, 85, 55].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-indigo-500 rounded-full"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={duration || 30}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium">
              1080 × 1920 (9:16)
            </span>
          </div>
        </div>
      </main>

      {/* ===================================================================== */}
      {/* MODAL: Advanced Settings & Tuning                                     */}
      {/* ===================================================================== */}
      {showAdvancedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-600" />
                Advanced Settings
              </h3>
              <button 
                onClick={() => setShowAdvancedModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Subtitle Font Size ({draft.subtitleFontSize || 28}px)</label>
                <input
                  type="range"
                  min={20}
                  max={44}
                  value={draft.subtitleFontSize || 28}
                  onChange={(e) => updateDraft({ subtitleFontSize: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Voice Speed ({draft.voiceSettings?.speed || 1.0}x)</label>
                <input
                  type="range"
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={draft.voiceSettings?.speed || 1.0}
                  onChange={(e) => updateDraft({ voiceSettings: { ...draft.voiceSettings, speed: Number(e.target.value) } })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Background Music Track</label>
                <select
                  value={draft.selectedBgm || ""}
                  onChange={(e) => updateDraft({ selectedBgm: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs"
                >
                  <option value="">Default Breaking News Theme</option>
                  {bgmAssets.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAdvancedModal(false)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Publish to Instagram                                           */}
      {/* ===================================================================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Publish to Instagram
              </h3>
              <button 
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Instagram Caption & Hashtags</label>
                <textarea
                  value={draft.caption}
                  onChange={(e) => updateDraft({ caption: e.target.value })}
                  rows={5}
                  className="w-full p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-gujarati resize-none"
                  placeholder="Caption..."
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Connected Account: <strong className="text-slate-900">{profile.instagram_business_account_id ? "Active Connected" : "Local Test Mode"}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStep3Publish}
                disabled={isPublishing}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Publish Reel Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
