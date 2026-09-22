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
  VolumeX, 
  Type, 
  Music, 
  Trash2, 
  Layers, 
  RefreshCw, 
  FileText, 
  Zap, 
  ArrowRight,
  Shield,
  Eye,
  Mic,
  BookOpen
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

  // Advanced Accordion State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCaptionCard, setShowCaptionCard] = useState(false);

  // Phone player video state
  const [isPlayingPhoneVideo, setIsPlayingPhoneVideo] = useState(true);
  const [isMutedPhoneVideo, setIsMutedPhoneVideo] = useState(false);
  const phoneVideoRef = useRef<HTMLVideoElement | null>(null);

  // Uploading states
  const [isUploadingClip, setIsUploadingClip] = useState(false);

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
        console.warn("Could not load initial studio data:", err);
      }
    }
    loadData();
  }, []);

  // Sync Video Playback
  const togglePlayPhoneVideo = () => {
    if (phoneVideoRef.current) {
      if (phoneVideoRef.current.paused) {
        phoneVideoRef.current.play();
        setIsPlayingPhoneVideo(true);
      } else {
        phoneVideoRef.current.pause();
        setIsPlayingPhoneVideo(false);
      }
    }
  };

  // --------------------------------------------------------------------------
  // STEP 1: Generate Script & Headlines (AI Gemini / NLP)
  // --------------------------------------------------------------------------
  const handleStep1GenerateScript = async () => {
    if (!draft.rawDetails.trim()) {
      toast.warning("કૃપા કરીને સમાચારની વિગત અથવા નોંધ દાખલ કરો.");
      return;
    }

    setIsGeneratingScript(true);
    const toastId = toast.loading("🤖 AI સમાચાર સ્ક્રિપ્ટ અને હેડલાઇન્સ બનાવી રહ્યું છે...");

    try {
      // 1. Script & Headline Generation
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
        // Reset audio so user reads/reviews the script before generating voice
        voiceoverAudioUrl: "",
        voiceoverFilename: "",
      });

      toast.success("✨ સ્ક્રિપ્ટ તૈયાર થઈ ગઈ છે! કૃપા કરીને તેને વાંચી લો, પછી નીચે '🎙️ અવાજ જનરેટ કરો' બટન દબાવો.", {
        id: toastId,
        duration: 4500,
      });
    } catch (err: any) {
      console.error("Step 1 Script Generation Error:", err);
      toast.error(`સ્ક્રિપ્ટ બનાવવામાં ભૂલ આવી: ${err.message || "Unknown error"}`, { id: toastId });
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
      toast.warning("કૃપા કરીને પહેલા સ્ક્રિપ્ટ લખો અથવા ઉપરથી AI સ્ક્રિપ્ટ જનરેટ કરો.");
      return;
    }

    setIsGeneratingVoice(true);
    const toastId = toast.loading("🎙️ ElevenLabs Multilingual v2 દ્વારા અવાજ જનરેટ થઈ રહ્યો છે...");

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
        toast.success("✅ અવાજ સફળતાપૂર્વક તૈયાર થઈ ગયો!", { id: toastId });
      } else {
        toast.error("અવાજ ફાઇલ મળી નથી. ફરી પ્રયાસ કરો.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Voice Generation Error:", err);
      toast.error(`અવાજ જનરેશનમાં ભૂલ આવી: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // --------------------------------------------------------------------------
  // Clip Upload (Drag & Drop)
  // --------------------------------------------------------------------------
  const onDropVideo = async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    setIsUploadingClip(true);
    const tId = toast.loading(`Uploading ${acceptedFiles.length} video clip(s)...`);

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
      toast.warning("પહેલા સ્ક્રિપ્ટ વાંચીને '🎙️ અવાજ જનરેટ કરો' બટન દબાવીને અવાજ તૈયાર કરો.");
      return;
    }

    setIsRenderingVideo(true);
    const toastId = toast.loading("🎬 [Step 2] રીલનું રેન્ડરિંગ થઈ રહ્યું છે... (Dynamic 9:16 + Headlines + Subtitles)");

    try {
      const renderRes = await renderVideoAPI({
        video_mode: draft.videoMode,
        single_video_filename: draft.uploadedSingleClip || draft.selectedStockBroll || "traffic_stock_1.mp4",
        multi_clip_filenames: draft.uploadedMultiClips.length > 0 ? draft.uploadedMultiClips : undefined,
        voiceover_filename: draft.voiceoverFilename || "voiceover.wav",
        bg_music_filename: draft.selectedBgm || "breaking_news_theme.mp3",
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
        toast.success("🎉 રીલ તૈયાર થઈ ગઈ છે! હવે તેને Instagram પર પબ્લિશ કરી શકો છો.", { id: toastId });
      } else {
        toast.info("રેન્ડર પૂરું થયું, વિડિયો તપાસો.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Step 2 Render Error:", err);
      toast.error(`રેન્ડરિંગમાં ભૂલ: ${err.message || "Unknown error"}`, { id: toastId });
    } finally {
      setIsRenderingVideo(false);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 3: 1-Click Instagram Publish
  // --------------------------------------------------------------------------
  const handleStep3Publish = async () => {
    if (!draft.renderedVideoFilename && !draft.renderedVideoUrl) {
      toast.warning("પહેલાં '🎬 2. Render Final Reel' પર ક્લિક કરીને રીલ તૈયાર કરો.");
      return;
    }

    setIsPublishing(true);
    const toastId = toast.loading("🚀 [Step 3] Meta Graph API દ્વારા Instagram પર Reel અપલોડ થઈ રહી છે...");

    try {
      const pubRes = await publishInstagramAPI({
        video_filename: draft.renderedVideoFilename || "rendered_reel.mp4",
        caption: draft.caption || `${draft.line1Headline}\n${draft.line2Headline}\n\n#SuratNews #Surat`,
        dry_run: false,
      });

      if (pubRes && (pubRes.status === "success" || pubRes.post_id)) {
        toast.success("🌟 અભિનંદન! Reel Instagram પર સફળતાપૂર્વક પબ્લિશ થઈ ગઈ છે!", {
          id: toastId,
          duration: 5000,
        });
      } else {
        toast.success("✅ Reel તૈયાર છે અને Instagram ક્યૂમાં ઉમેરાઈ ગઈ છે!", { id: toastId });
      }
    } catch (err: any) {
      console.error("Step 3 Publish Error:", err);
      toast.error(`પબ્લિશિંગમાં ભૂલ આવી: ${err.message || "Instagram API error"}`, { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  const isReelReadyToPublish = Boolean(draft.renderedVideoUrl);

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      {/* --------------------------------------------------------------------- */}
      {/* HEADER BAR: Category + Area + Single/Multi Toggle                     */}
      {/* --------------------------------------------------------------------- */}
      <div className="h-16 px-6 border-b border-border bg-bg-surface flex flex-wrap items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-text-muted uppercase tracking-wider">કેટેગરી:</span>
            <select
              value={draft.categoryCode || "N01"}
              onChange={(e) => updateDraft({ categoryCode: e.target.value })}
              className="px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary font-bold focus:outline-none focus:border-brand-pink"
            >
              {categories.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.emoji ? `${c.emoji} ` : ""}{c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Area Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-text-muted uppercase tracking-wider">વિસ્તાર:</span>
            <select
              value={draft.area || "All Surat"}
              onChange={(e) => updateDraft({ area: e.target.value })}
              className="px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary font-bold focus:outline-none focus:border-brand-cyan"
            >
              <option value="All Surat">સમગ્ર સુરત (All Surat)</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Video Mode Toggle & Actions */}
        <div className="flex items-center gap-3">
          {/* Clean Toggle: Single vs Multi */}
          <div className="p-1 rounded-xl bg-bg-elevated border border-border flex items-center gap-1 text-xs">
            <button
              onClick={() => updateDraft({ videoMode: "single" })}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                draft.videoMode === "single"
                  ? "bg-brand-pink text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Single Video
            </button>
            <button
              onClick={() => updateDraft({ videoMode: "multi" })}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                draft.videoMode === "multi"
                  ? "bg-brand-pink text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Multi-Clip Montage
            </button>
          </div>

          {/* Inspiration Link to News Ideas */}
          <Link
            href="/ideas"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">💡 News Ideas</span>
          </Link>

          {/* Reset button */}
          <button
            onClick={() => {
              resetDraft();
              toast.info("Draft reset to fresh state.");
            }}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent hover:border-border transition-colors"
            title="Reset Draft"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2-COLUMN LAYOUT: 60% Left (Input/Content) / 40% Right (Phone Preview) */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* =================================================================== */}
        {/* LEFT COLUMN (60%): Wizard Step 1 & Step 2                           */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[60%] flex-1 flex flex-col overflow-y-auto p-6 space-y-6 border-r border-border">
          {/* STEP 1: Enter Raw News */}
          <div className="p-6 rounded-3xl bg-bg-surface border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-brand-pink/15 text-brand-pink border border-brand-pink/30 flex items-center justify-center font-black text-xs">
                  1
                </span>
                <h2 className="text-base font-extrabold text-text-primary font-outfit">
                  Enter Raw News / Details
                </h2>
              </div>
              <span className="text-[11px] font-bold text-text-muted">
                AI ગુજરાતી સ્ક્રિપ્ટ અને હેડલાઇન્સ બનાવશે
              </span>
            </div>

            <textarea
              value={draft.rawDetails}
              onChange={(e) => updateDraft({ rawDetails: e.target.value })}
              rows={3}
              placeholder="અહીં સમાચારની વિગત લખો અથવા પેસ્ટ કરો (જેમ કે: સુરત મેટ્રો ફેઝ-૨ અડાજણથી સરથાણા લાઇન પર કામ પૂર્ણ થયું છે, 10 નવા સ્ટેશનો શરૂ થશે...)..."
              className="w-full p-4 rounded-2xl bg-bg-elevated border border-border text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-brand-pink leading-relaxed resize-none"
            />

            {/* Step 1 Gradient Action Button */}
            <button
              onClick={handleStep1GenerateScript}
              disabled={isGeneratingScript || !draft.rawDetails.trim()}
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-brand-pink via-pink-600 to-rose-600 hover:from-brand-pink/90 hover:to-rose-600/90 shadow-lg shadow-brand-pink/20 hover:shadow-brand-pink/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI સ્ક્રિપ્ટ અને હેડલાઇન્સ બનાવી રહ્યું છે...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>✨ 1. Generate Script & Headlines (સ્ક્રિપ્ટ બનાવો)</span>
                </>
              )}
            </button>
          </div>

          {/* PREVIEW CARDS (Editable): Headlines, Script, Audio, Caption */}
          {(draft.line1Headline || draft.voiceoverScript) && (
            <div className="space-y-4">
              {/* Headline Badges Card */}
              <div className="p-5 rounded-3xl bg-bg-surface border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-3.5 h-3.5 text-brand-pink" />
                    <span>ડ્યુઅલ-સ્ટ્રાઈપ હેડલાઇન બેજ (Line 1 & 2)</span>
                  </h3>
                  <span className="text-[10px] text-text-muted">Editable preview</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Line 1 (Red Badge) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-400">Line 1 (લાલ પટ્ટી / Red Stripe):</label>
                    <input
                      type="text"
                      value={draft.line1Headline}
                      onChange={(e) => updateDraft({ line1Headline: e.target.value })}
                      placeholder="સુરત ન્યૂઝ અપડેટ"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary font-gujarati focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {/* Line 2 (Blue Badge) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-400">Line 2 (વાદળી પટ્ટી / Blue Stripe):</label>
                    <input
                      type="text"
                      value={draft.line2Headline}
                      onChange={(e) => updateDraft({ line2Headline: e.target.value })}
                      placeholder="મુખ્ય સમાચાર અને હૂક"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary font-gujarati focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gujarati Voiceover Script Card with User Review & Dedicated Voice Button */}
              <div className="p-5 rounded-3xl bg-bg-surface border border-border space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-brand-cyan" />
                    <h3 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                      ગુજરાતી વોઇસઓવર સ્ક્રિપ્ટ (Voiceover Script)
                    </h3>
                  </div>

                  {/* Word count & Reading time indicator */}
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-bg-elevated border border-border">
                      {draft.voiceoverScript.trim() ? draft.voiceoverScript.trim().split(/\s+/).length : 0} શબ્દો
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 font-bold">
                      ~{Math.max(5, Math.round((draft.voiceoverScript.trim() ? draft.voiceoverScript.trim().split(/\s+/).length : 0) / 2.5))} સેકન્ડ
                    </span>
                  </div>
                </div>

                {/* Review Prompt Banner */}
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-amber-200/90">
                    <span className="font-bold text-amber-300">સ્ક્રિપ્ટ એકવાર વાંચી લો: </span>
                    જો કોઈ શબ્દ કે સંખ્યા સુધારવી હોય તો નીચે સીધો ફેરફાર કરી શકો છો. સ્ક્રિપ્ટ ઓકે લાગે પછી નીચે આપેલા 
                    <span className="font-bold text-white"> &apos;🎙️ અવાજ જનરેટ કરો&apos;</span> બટન પર ક્લિક કરો.
                  </div>
                </div>

                {/* Script Editable Textarea */}
                <textarea
                  value={draft.voiceoverScript}
                  onChange={(e) => updateDraft({ voiceoverScript: e.target.value })}
                  rows={4}
                  placeholder="AI દ્વારા જનરેટ થયેલી સ્ક્રિપ્ટ અહીં દેખાશે, અથવા તમારી પોતાની સ્ક્રિપ્ટ લખો..."
                  className="w-full p-4 rounded-2xl bg-bg-elevated border border-border text-sm font-gujarati text-text-primary leading-relaxed resize-none focus:outline-none focus:border-brand-cyan shadow-inner"
                />

                {/* DEDICATED VOICE GENERATION SECTION */}
                {!draft.voiceoverAudioUrl ? (
                  <div className="pt-1">
                    <button
                      onClick={handleGenerateVoice}
                      disabled={isGeneratingVoice || !draft.voiceoverScript.trim()}
                      className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-teal-500 via-brand-cyan to-blue-600 hover:from-teal-400 hover:to-blue-500 shadow-lg shadow-brand-cyan/25 hover:shadow-brand-cyan/35 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isGeneratingVoice ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>ElevenLabs Multilingual v2 દ્વારા અવાજ જનરેટ થઈ રહ્યો છે...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-white fill-current" />
                          <span>🎙️ અવાજ જનરેટ કરો (Generate Voiceover)</span>
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-text-muted mt-2">
                      👆 સ્ક્રિપ્ટ ચકાસ્યા પછી આ બટન દબાવો — ElevenLabs ની હાઈ-ક્વોલિટી નેચરલ ગુજરાતી અવાજમાં ઓડિયો તૈયાર થશે.
                    </p>
                  </div>
                ) : (
                  /* Audio Ready Player Card */
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-bg-elevated to-brand-cyan/10 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>ElevenLabs અવાજ તૈયાર છે (Audio Ready)</span>
                      </div>
                      <button
                        onClick={handleGenerateVoice}
                        disabled={isGeneratingVoice || !draft.voiceoverScript.trim()}
                        className="text-[11px] font-bold text-brand-cyan hover:underline flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-surface border border-border hover:border-brand-cyan/50 transition-colors"
                        title="સ્ક્રિપ્ટમાં ફેરફાર કર્યો હોય તો ફરી અવાજ રેકોર્ડ કરો"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingVoice ? "animate-spin" : ""}`} />
                        <span>{isGeneratingVoice ? "બની રહ્યો છે..." : "ફરી અવાજ બનાવો (Re-generate)"}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <audio
                        src={draft.voiceoverAudioUrl}
                        controls
                        className="w-full h-9 rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Instagram Caption & Hashtags (Collapsible) */}
              <div className="rounded-3xl bg-bg-surface border border-border overflow-hidden">
                <button
                  onClick={() => setShowCaptionCard(!showCaptionCard)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
                >
                  <span className="text-xs font-extrabold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-brand-pink" />
                    <span>Instagram Caption & Hashtags</span>
                  </span>
                  {showCaptionCard ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                </button>

                {showCaptionCard && (
                  <div className="p-4 pt-0 border-t border-border/60">
                    <textarea
                      value={draft.caption}
                      onChange={(e) => updateDraft({ caption: e.target.value })}
                      rows={4}
                      className="w-full p-3 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary leading-relaxed resize-none focus:outline-none focus:border-brand-pink mt-3"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Video Media Ingest */}
          <div className="p-6 rounded-3xl bg-bg-surface border border-border space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 flex items-center justify-center font-black text-xs">
                  2
                </span>
                <h2 className="text-base font-extrabold text-text-primary font-outfit">
                  Video Media Ingest
                </h2>
              </div>
              <span className="text-[11px] font-bold text-text-muted">
                {draft.videoMode === "single" ? "સિંગલ વિડિયો ક્લિપ" : "મલ્ટીપલ ક્લિપ્સ મોન્ટાજ"}
              </span>
            </div>

            {/* Drag & Drop Area */}
            <div
              {...getRootProps()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragActive
                  ? "border-brand-pink bg-brand-pink/10"
                  : "border-border hover:border-brand-pink/50 bg-bg-elevated/50 hover:bg-bg-elevated"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-8 h-8 text-brand-pink mb-2 opacity-80" />
              <p className="text-xs font-bold text-text-primary">
                {isUploadingClip ? "Uploading video..." : "Drag & Drop video clip here, or click to browse"}
              </p>
              <p className="text-[10px] text-text-muted mt-1">
                9:16 Vertical Video Recommended (MP4, MOV, WebM)
              </p>
            </div>

            {/* Clip Status */}
            {(draft.uploadedSingleClip || draft.uploadedMultiClips.length > 0) && (
              <div className="p-3 rounded-2xl bg-accent-success/10 border border-accent-success/30 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-accent-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {draft.videoMode === "single"
                      ? `Selected: ${draft.uploadedSingleClip}`
                      : `${draft.uploadedMultiClips.length} clips uploaded for montage`}
                  </span>
                </div>
                <button
                  onClick={() => updateDraft({ uploadedSingleClip: null, uploadedMultiClips: [] })}
                  className="p-1 text-text-muted hover:text-red-400 transition-colors"
                  title="Remove Clip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Stock B-roll Fallback Selector */}
            {brollAssets.length > 0 && !draft.uploadedSingleClip && draft.uploadedMultiClips.length === 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-muted">અથવા સ્ટોક B-Roll પસંદ કરો (Or use Stock B-Roll):</label>
                <select
                  value={draft.selectedStockBroll || ""}
                  onChange={(e) => updateDraft({ selectedStockBroll: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary font-medium focus:outline-none focus:border-brand-pink"
                >
                  <option value="">સિલેક્ટ કરો (Default Stock Clips)...</option>
                  {brollAssets.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.size_mb} MB)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 2 Gradient Action Button */}
            <button
              onClick={handleStep2Render}
              disabled={isRenderingVideo || (!draft.voiceoverAudioUrl && !draft.voiceoverFilename)}
              className="w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-cyan hover:from-blue-500 hover:to-brand-cyan shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isRenderingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>🎬 9:16 રીલ રેન્ડર થઈ રહી છે... (Timeline + Headlines)</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4" />
                  <span>🎬 2. Render Final Reel</span>
                </>
              )}
            </button>
          </div>

          {/* COLLAPSIBLE DRAWER: Advanced Tuning */}
          <div className="rounded-3xl bg-bg-surface border border-border overflow-hidden">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-pink" />
                <span className="text-xs font-extrabold text-text-primary">
                  🛠️ Advanced Tuning (Optional)
                </span>
                <span className="text-[10px] text-text-muted">
                  Subtitle Styling, Audio Pacing & Music
                </span>
              </div>
              {showAdvanced ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {showAdvanced && (
              <div className="p-5 pt-0 border-t border-border/60 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  {/* Subtitle Font Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-text-muted">
                      <span>Subtitle Font Size:</span>
                      <span>{draft.subtitleFontSize || 28}px</span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={44}
                      value={draft.subtitleFontSize || 28}
                      onChange={(e) => updateDraft({ subtitleFontSize: Number(e.target.value) })}
                      className="w-full accent-brand-pink"
                    />
                  </div>

                  {/* Audio Pacing (Speed) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-text-muted">
                      <span>Voice Speed (Pacing):</span>
                      <span>{draft.voiceSettings?.speed || 1.0}x</span>
                    </div>
                    <input
                      type="range"
                      min={0.8}
                      max={1.3}
                      step={0.05}
                      value={draft.voiceSettings?.speed || 1.0}
                      onChange={(e) =>
                        updateDraft({
                          voiceSettings: {
                            ...draft.voiceSettings,
                            speed: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full accent-brand-cyan"
                    />
                  </div>

                  {/* Background Music */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted">Background Music:</label>
                    <select
                      value={draft.selectedBgm || ""}
                      onChange={(e) => updateDraft({ selectedBgm: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary"
                    >
                      <option value="">Default Breaking News Theme</option>
                      {bgmAssets.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subtitle Highlight Color */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted">Subtitle Highlight Color:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.subtitleHighlightColor || "#FFD700"}
                        onChange={(e) => updateDraft({ subtitleHighlightColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-text-primary">
                        {draft.subtitleHighlightColor || "#FFD700"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN (40%): Phone Mockup & Step 3 Publish                   */}
        {/* =================================================================== */}
        <div className="w-full lg:w-[40%] flex flex-col items-center justify-between p-6 bg-bg-elevated/30 overflow-y-auto space-y-6">
          {/* Centered Realistic 9:16 Phone Mockup */}
          <div className="flex-1 flex items-center justify-center w-full min-h-[500px]">
            <div className="relative w-[280px] h-[560px] rounded-[44px] bg-[#0A0A10] p-3 shadow-[0_0_0_8px_#1A1A24,0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden flex flex-col">
              {/* Screen Inner Viewport (9:16 aspect) */}
              <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-slate-950 flex flex-col justify-between select-none">
                {/* Simulated or Rendered Video */}
                {draft.renderedVideoUrl ? (
                  <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
                    <video
                      ref={phoneVideoRef}
                      src={draft.renderedVideoUrl}
                      autoPlay
                      loop
                      muted={isMutedPhoneVideo}
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Play/Pause Center Overlay */}
                    <button
                      onClick={togglePlayPhoneVideo}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
                    >
                      <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPlayingPhoneVideo ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </div>
                    </button>
                  </div>
                ) : (
                  /* Live Pre-Render Simulated Visual Layer */
                  <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 via-blue-950/80 to-slate-950 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-transparent to-black/80" />
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  </div>
                )}

                {/* iPhone Notch / Dynamic Island */}
                <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none">
                  <div className="w-20 h-4 bg-black rounded-full shadow-inner flex items-center justify-end px-2">
                    <div className="w-2 h-2 rounded-full bg-[#0d233a]/80" />
                  </div>
                </div>

                {/* Overlays (Only active in pre-render simulation mode) */}
                {!draft.renderedVideoUrl && (
                  <>
                    {/* Top Ticker Bar */}
                    <div className="relative z-10 mt-7 px-3 py-1 bg-gradient-to-r from-brand-pink via-red-600 to-brand-pink text-white flex items-center justify-between shadow-md">
                      <span className="text-[8px] font-extrabold tracking-wider font-outfit uppercase">
                        SURAT UPDATE | {draft.categoryCode || "N01"}
                      </span>
                      <span className="text-[7px] font-bold opacity-80">{draft.area || "All Surat"}</span>
                    </div>

                    {/* Dual-Stripe Headline Badges Preview */}
                    <div className="relative z-20 flex flex-col items-center gap-1.5 px-3 mt-12">
                      <div
                        className="px-3.5 py-1.5 rounded-xl font-extrabold font-gujarati text-[12px] shadow-xl text-center leading-tight max-w-[94%] border border-white/10"
                        style={{
                          backgroundColor: profile.line1_bg || "#FF0033",
                          color: profile.line1_text || "#FFFFFF",
                        }}
                      >
                        {draft.line1Headline || "સુરત ન્યૂઝ અપડેટ"}
                      </div>
                      <div
                        className="px-3.5 py-1.5 rounded-xl font-extrabold font-gujarati text-[12px] shadow-xl text-center leading-tight max-w-[94%] border border-white/10"
                        style={{
                          backgroundColor: profile.line2_bg || "#0080FF",
                          color: profile.line2_text || "#FFFFFF",
                        }}
                      >
                        {draft.line2Headline || "તાજા સમાચાર અને વિગતો"}
                      </div>
                    </div>

                    {/* Subtitle preview banner */}
                    <div className="relative z-10 pb-4 px-3 space-y-2 mt-auto">
                      <div className="text-center px-2 py-1 rounded-lg bg-black/60 border border-white/10 text-[11px] font-gujarati font-bold text-yellow-300">
                        {draft.voiceoverScript ? draft.voiceoverScript.slice(0, 50) + "..." : "સુરતના તાજા સમાચાર..."}
                      </div>

                      {/* Instagram Simulated Bottom Chrome */}
                      <div className="space-y-1 text-white/90">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-brand-pink flex items-center justify-center text-[7px] font-bold">
                            P
                          </div>
                          <span className="text-[9px] font-bold font-outfit">surat.prarambh.news</span>
                        </div>
                        <p className="text-[8px] text-white/80 line-clamp-1">
                          {draft.caption ? draft.caption.split("\n")[0] : "સુરતના સમાચારો માટે ફોલો કરો"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Publishing Controls Area */}
          <div className="w-full max-w-[340px] space-y-3">
            {/* Status Pill Badge */}
            <div className="flex justify-center">
              {isReelReadyToPublish ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-black bg-accent-success/20 text-accent-success border border-accent-success/40 flex items-center gap-2 shadow-sm animate-pulse">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ready to Publish</span>
                </span>
              ) : !draft.voiceoverScript.trim() ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-bg-surface text-text-muted border border-border flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Awaiting Script (Step 1)</span>
                </span>
              ) : !draft.voiceoverAudioUrl ? (
                <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>સ્ક્રિપ્ટ તૈયાર — અવાજ જનરેટ કરો</span>
                </span>
              ) : (
                <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-brand-cyan" />
                  <span>Awaiting Video Render (Step 2)</span>
                </span>
              )}
            </div>

            {/* Big Vibrant Button: 🚀 3. Publish Reel to Instagram */}
            <button
              onClick={handleStep3Publish}
              disabled={isPublishing || !isReelReadyToPublish}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                isReelReadyToPublish
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-emerald-500/25 cursor-pointer animate-pulse"
                  : "bg-bg-elevated text-text-muted border border-border cursor-not-allowed opacity-60"
              }`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Instagram પર અપલોડ થઈ રહી છે...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>🚀 3. Publish Reel to Instagram</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
