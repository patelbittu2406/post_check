"use client";

import React, { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import { renderVideoAPI, generateVoiceAPI, autoTagScriptAPI } from "@/lib/api";
import { toast } from "sonner";
import { 
  Sliders, 
  Layers, 
  Type, 
  FileText, 
  Volume2, 
  Play, 
  Download, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  Film,
  RotateCcw,
  Tag,
  Wand2,
  Zap
} from "lucide-react";

import { SegmentInspector } from "@/components/capcut/SegmentInspector";
import { CapCutSegment } from "@/lib/capcut/types";
import { SubtitlePanel } from "@/components/subtitles/SubtitlePanel";

const QUICK_TAGS = [
  { tag: "[excited]", label: "Excited", color: "text-brand-pink border-brand-pink/30 hover:bg-brand-pink/10" },
  { tag: "[serious]", label: "Serious", color: "text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan/10" },
  { tag: "[sad]", label: "Sad", color: "text-purple-400 border-purple-400/30 hover:bg-purple-400/10" },
  { tag: "[pauses]", label: "Pause", color: "text-brand-yellow border-brand-yellow/30 hover:bg-brand-yellow/10" },
  { tag: "[laughs]", label: "Laughs", color: "text-amber-400 border-amber-400/30 hover:bg-amber-400/10" },
  { tag: "[sighs]", label: "Sighs", color: "text-blue-400 border-blue-400/30 hover:bg-blue-400/10" },
  { tag: "[whispers]", label: "Whispers", color: "text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/10" },
  { tag: "[shouts]", label: "Shouts", color: "text-rose-400 border-rose-400/30 hover:bg-rose-400/10" },
];

export function InspectorPanel() {
  const { 
    draft, 
    updateDraft, 
    profile, 
    isRenderingVideo, 
    setIsRenderingVideo,
    renderProgress,
    renderStepMessage,
    setRenderStatus,
    isGeneratingVoice,
    setIsGeneratingVoice
  } = useStore();

  const [regeneratingVoice, setRegeneratingVoice] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);
  const [isAutoTaggingAndVoicing, setIsAutoTaggingAndVoicing] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleAutoTagScript = async (generateVoiceAfter: boolean) => {
    if (!draft.voiceoverScript.trim()) {
      toast.warning("Please enter or paste your Gujarati narration script first");
      return;
    }

    if (generateVoiceAfter) {
      setIsAutoTaggingAndVoicing(true);
      setIsGeneratingVoice(true);
    } else {
      setIsAutoTagging(true);
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
        toast.success("🎉 Script auto-tagged & voiceover generated successfully!", { id: toastId });
      } else {
        toast.success("✨ Audio tags added! (Your exact script words were preserved)", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Auto-tagging failed: ${err.message}`, { id: toastId });
    } finally {
      setIsAutoTagging(false);
      setIsAutoTaggingAndVoicing(false);
      if (generateVoiceAfter) {
        setIsGeneratingVoice(false);
      }
    }
  };

  const handleUpdateCapcutSegment = (idx: number, updates: Partial<CapCutSegment>) => {
    if (!draft.capcutSegments) return;
    const updated = [...draft.capcutSegments];
    updated[idx] = { ...updated[idx], ...updates };
    updateDraft({ capcutSegments: updated });
    toast.success(`Updated cut #${idx + 1}`);
  };

  const handleDeleteCapcutSegment = (idx: number) => {
    if (!draft.capcutSegments) return;
    const updated = draft.capcutSegments.filter((_, i) => i !== idx);
    updateDraft({ 
      capcutSegments: updated,
      capcutSelectedSegmentIndex: updated.length > 0 ? Math.min(idx, updated.length - 1) : null
    });
    toast.info(`Deleted cut #${idx + 1}`);
  };


  const insertTagAtCursor = (tagStr: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateDraft({ voiceoverScript: draft.voiceoverScript + " " + tagStr + " " });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draft.voiceoverScript;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + (before.endsWith(" ") || before.length === 0 ? "" : " ") + tagStr + " " + after;
    updateDraft({ voiceoverScript: newText });

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + tagStr.length + (before.endsWith(" ") || before.length === 0 ? 1 : 2);
      textarea.setSelectionRange(nextPos, nextPos);
    }, 50);

    toast.info(`Inserted audio tag: ${tagStr}`);
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    updateDraft({ voiceoverScript: val });
    
    // Check if user just typed '[' to offer autocomplete suggestions
    if (val.endsWith("[")) {
      setShowTagMenu(true);
    } else if (!val.includes("[")) {
      setShowTagMenu(false);
    }
  };

  const handleRegenerateVoice = async () => {
    if (!draft.voiceoverScript.trim()) {
      toast.warning("Please enter narration script text");
      return;
    }

    setRegeneratingVoice(true);
    setIsGeneratingVoice(true);
    const toastId = toast.loading("🎙️ Synthesizing ultra-natural Gujarati voiceover...");

    try {
      const res = await generateVoiceAPI({
        script_text: draft.voiceoverScript,
        text: draft.voiceoverScript,
        voice_id: draft.selectedVoiceMode || "PRARAMBH_MALE",
        voice_settings: draft.voiceSettings,
      });

      updateDraft({
        voiceoverAudioUrl: res.audio_url,
        voiceoverFilename: res.voiceover_filename,
      });

      toast.success("🎉 Voiceover regenerated with Audio Tags applied!", { id: toastId });
    } catch (err: any) {
      toast.error(`Voice synthesis failed: ${err.message}`, { id: toastId });
    } finally {
      setRegeneratingVoice(false);
      setIsGeneratingVoice(false);
    }
  };

  const handleRenderVideo = async () => {
    if (!draft.voiceoverFilename) {
      toast.warning("Please generate AI script & voiceover audio first");
      return;
    }

    setIsRenderingVideo(true);
    setRenderStatus(10, "Generating dual-stripe headline overlay PNG...");

    try {
      setTimeout(() => setRenderStatus(35, "Generating styled ASS subtitles with Faster-Whisper..."), 800);
      setTimeout(() => setRenderStatus(65, "Compositing 1080x1920 background & ducking BGM..."), 1600);

      const res = await renderVideoAPI({
        video_mode: draft.videoMode,
        single_video_filename: draft.uploadedSingleClip || draft.selectedStockBroll,
        multi_clip_filenames: (draft.uploadedMultiClips && draft.uploadedMultiClips.length > 0) ? draft.uploadedMultiClips : undefined,
        voiceover_filename: draft.voiceoverFilename,
        bg_music_filename: draft.selectedBgm,
        line1_text: draft.line1Headline,
        line2_text: draft.line2Headline,
        line1_bg: profile.line1_bg,
        line1_text_color: profile.line1_text,
        line2_bg: profile.line2_bg,
        line2_text_color: profile.line2_text,
        sub_font_size: draft.subtitleFontSize || profile.sub_font_size,
        sub_color: draft.subtitleBaseColor || profile.sub_color,
        sub_outline_color: profile.sub_outline_color,
        category_code: draft.categoryCode,
        area: draft.area,
        watermark_enabled: profile.watermark_enabled ?? true,
        watermark_position: profile.watermark_position || "top-right",
      });

      setRenderStatus(100, "Rendering complete!");
      updateDraft({
        renderedVideoUrl: res.video_url,
        renderedVideoFilename: res.video_filename,
      });

      toast.success("🎉 Video Reel successfully rendered (1080x1920 9:16)!");
    } catch (err: any) {
      toast.error(`Render failed: ${err.message}`);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-y-auto p-4 space-y-4 bg-bg-surface border-l border-border select-none">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold font-outfit uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand-cyan" />
            Inspector & Render Hub
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/20">
            1080x1920 (9:16)
          </span>
        </div>

        {/* CapCut Segment Inspector (Active when editing cuts) */}
        {draft.videoMode === "capcut" && (
          <SegmentInspector
            segment={
              draft.capcutSelectedSegmentIndex !== null && draft.capcutSegments
                ? draft.capcutSegments[draft.capcutSelectedSegmentIndex] || null
                : null
            }
            segmentIndex={draft.capcutSelectedSegmentIndex}
            onUpdateSegment={handleUpdateCapcutSegment}
            onDeleteSegment={handleDeleteCapcutSegment}
          />
        )}

        {/* 1. Editable Dual-Stripe Headlines */}
        <div className="p-3.5 rounded-xl bg-bg-elevated/50 border border-border space-y-3">

          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-pink" />
            Dual-Stripe Headlines
          </label>

          <div className="space-y-2">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-text-muted">Line 1 (Top Opening Pill):</span>
              <input
                type="text"
                value={draft.line1Headline}
                onChange={(e) => updateDraft({ line1Headline: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-gujarati text-text-primary focus:border-brand-pink outline-none"
                placeholder="સુરત ઉત્સવ | F01"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-text-muted">Line 2 (Twist & Contextual Emoji):</span>
              <input
                type="text"
                value={draft.line2Headline}
                onChange={(e) => updateDraft({ line2Headline: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs font-gujarati text-text-primary focus:border-brand-cyan outline-none"
                placeholder="ગણેશ ઉત્સવ ધામધૂમથી ઉજવાયો 🎉"
              />
            </div>
          </div>
        </div>

        {/* 2. Voiceover Narration Script with Audio Tags */}
        <div className="p-3.5 rounded-xl bg-bg-elevated/50 border border-border space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-brand-yellow" />
              Narration Script (with Audio Tags)
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              ~{Math.round(draft.targetDuration * 2.5)} words
            </span>
          </div>

          {/* Quick Tag Insert Toolbar */}
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-text-muted flex items-center gap-1">
              <Tag className="w-3 h-3 text-brand-pink" />
              Quick Audio Tags:
            </span>
            <div className="flex flex-wrap gap-1">
              {QUICK_TAGS.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => insertTagAtCursor(t.tag)}
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold transition-all ${t.color} bg-bg-surface`}
                  title={`Insert ${t.tag}`}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            rows={4}
            value={draft.voiceoverScript}
            onChange={handleScriptChange}
            placeholder="[excited] સુરત સમાચાર... [pauses] વિગતવાર માહિતી... (અથવા પોતાની કસ્ટમ સ્ક્રિપ્ટ લખો/પેસ્ટ કરો)"
            className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-xs font-gujarati text-text-primary focus:border-brand-yellow outline-none resize-none leading-relaxed"
          />

          {/* AI Auto-Tag Info Helper */}
          <div className="flex items-center justify-between text-[10.5px] px-1 py-0.5 rounded bg-brand-pink/5 border border-brand-pink/15 text-text-muted">
            <span className="flex items-center gap-1.5 text-brand-pink font-medium">
              <Sparkles className="w-3 h-3" />
              <span>AI કસ્ટમ સ્ક્રિપ્ટના શબ્દો બદલ્યા વગર આપમેળે ભાવ મુજબ ટેગ્સ ઉમેરશે</span>
            </span>
          </div>

          {/* Script Action Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-2 gap-1.5">
              {/* Button 1: Auto Add Tags Only */}
              <button
                type="button"
                onClick={() => handleAutoTagScript(false)}
                disabled={isAutoTagging || isAutoTaggingAndVoicing || regeneratingVoice || !draft.voiceoverScript.trim()}
                className="py-1.5 px-2.5 rounded-lg text-xs font-bold text-brand-pink bg-brand-pink/10 border border-brand-pink/30 hover:bg-brand-pink/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                title="AI analyzes emotional shifts and adds audio tags without altering your words"
              >
                {isAutoTagging ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-pink" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
                )}
                <span>{isAutoTagging ? "Tagging..." : "✨ Auto Add Tags"}</span>
              </button>

              {/* Button 2: Auto Tag & Generate Voiceover */}
              <button
                type="button"
                onClick={() => handleAutoTagScript(true)}
                disabled={isAutoTagging || isAutoTaggingAndVoicing || regeneratingVoice || !draft.voiceoverScript.trim()}
                className="py-1.5 px-2.5 rounded-lg text-xs font-bold text-white brand-gradient-bg glow-pink shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                title="AI auto-tags your script and synthesizes voiceover immediately"
              >
                {isAutoTaggingAndVoicing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-brand-yellow" />
                )}
                <span>{isAutoTaggingAndVoicing ? "Synthesizing..." : "⚡ Auto Tag & Voice"}</span>
              </button>
            </div>

            {/* Button 3: Plain Regenerate Voiceover */}
            <button
              type="button"
              onClick={handleRegenerateVoice}
              disabled={regeneratingVoice || isAutoTagging || isAutoTaggingAndVoicing || !draft.voiceoverScript.trim()}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-text-primary bg-bg-surface border border-border hover:border-brand-cyan hover:text-brand-cyan transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
              title="Generate voiceover using the current script text and tags as is"
            >
              {regeneratingVoice ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-cyan" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-brand-cyan" />
              )}
              <span>{regeneratingVoice ? "Synthesizing..." : "🎙️ Regenerate Voiceover (Current)"}</span>
            </button>
          </div>

          {/* Voiceover Audio Player Preview */}
          {draft.voiceoverAudioUrl && (
            <div className="pt-1.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span className="font-semibold text-text-primary flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-accent-success" />
                  Voiceover Preview
                </span>
                <span className="text-[10px] text-accent-success font-medium">Broadcast Normalized (-14 LUFS)</span>
              </div>
              <audio
                id="studio-voiceover-audio"
                controls
                src={draft.voiceoverAudioUrl}
                className="w-full h-8 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* 3. Advanced Subtitles (Hormozi / CapCut) */}
        <SubtitlePanel />

        {/* 4. Instagram SOP Caption */}
        <div className="p-3.5 rounded-xl bg-bg-elevated/50 border border-border space-y-2">
          <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-pink" />
            Instagram SOP Caption
          </label>
          <textarea
            rows={3}
            value={draft.caption}
            onChange={(e) => updateDraft({ caption: e.target.value })}
            className="w-full p-2.5 rounded-lg bg-bg-surface border border-border text-[11px] text-text-primary focus:border-brand-pink outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 4. Rendered Output Preview */}
        {draft.renderedVideoUrl && (
          <div className="p-3.5 rounded-xl bg-bg-elevated/80 border border-brand-pink/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-accent-success" />
                Rendered Reel Output
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-success/15 text-accent-success">
                1080x1920 MP4
              </span>
            </div>

            <video
              controls
              src={draft.renderedVideoUrl}
              className="w-full max-h-48 rounded-lg border border-border bg-black object-contain"
            />

            <a
              href={draft.renderedVideoUrl}
              download={draft.renderedVideoFilename || "prarambh_reel.mp4"}
              className="w-full py-2 px-3 rounded-xl bg-bg-surface border border-border text-xs font-bold text-text-primary hover:border-brand-pink flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-brand-pink" />
              <span>Download MP4 Reel</span>
            </a>
          </div>
        )}
      </div>

      {/* Render Action */}
      <div className="space-y-2 pt-2 sticky bottom-0 bg-bg-surface pb-1 border-t border-border/50">
        <button
          type="button"
          onClick={handleRenderVideo}
          disabled={isRenderingVideo || !draft.voiceoverFilename}
          className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {isRenderingVideo ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{renderStepMessage || `Rendering Reel (${renderProgress}%)...`}</span>
            </>
          ) : (
            <>
              <Film className="w-4 h-4 text-brand-yellow" />
              <span>Render 1080x1920 Reel</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
