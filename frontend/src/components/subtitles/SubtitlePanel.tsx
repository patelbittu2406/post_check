"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { StylePicker } from "./StylePicker";
import { StyleBrowserModal } from "./StyleBrowserModal";
import { SubtitlePreview } from "./SubtitlePreview";
import { 
  SubtitleStylePreset, 
  fetchSubtitleStyles,
  generateSubtitles, 
  regenerateSubtitlesFromScript 
} from "@/lib/api";
import { toast } from "sonner";
import { 
  Type, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Grid,
  Palette
} from "lucide-react";

export function SubtitlePanel() {
  const { draft, updateDraft } = useStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [presets, setPresets] = useState<SubtitleStylePreset[]>([]);

  // Load presets on mount
  useEffect(() => {
    fetchSubtitleStyles()
      .then((res) => {
        if (res.styles && res.styles.length > 0) {
          setPresets(res.styles);
        }
      })
      .catch((err) => {
        console.warn("Error fetching subtitle styles:", err);
      });
  }, []);

  // Find active preset object for fine details
  const activePreset = presets.find((p) => p.id === (draft.subtitlePreset || "mixed_highlight"));

  // Handle Preset selection: auto-populate draft subtitle settings
  const handleSelectPreset = (preset: SubtitleStylePreset) => {
    updateDraft({
      subtitlePreset: preset.id,
      subtitleBaseColor: preset.base_color,
      subtitleHighlightColor: preset.latin_color || preset.highlight_color || "#FFD700",
      subtitleGlowColor: preset.glow_color || preset.latin_color || "#FFD700",
      subtitleFontSize: preset.base_size || preset.font_size || 72,
      subtitleChunkSize: preset.chunk_size || 3,
      subtitleAnimation: preset.animation || "bounce_soft",
      subtitleEnableGlow: preset.glow ?? preset.enable_glow ?? false,
      subtitleEnablePill: preset.pill_bg ?? preset.enable_pill_bg ?? false,
    });
  };

  // Trigger manual generation / refresh of ASS subtitles
  const handleRegenerateSubtitles = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("✨ Generating bilingual ASS subtitles...");

    try {
      if (draft.voiceoverFilename || draft.voiceoverScript) {
        const res = await generateSubtitles({
          audio_path: draft.voiceoverFilename || undefined,
          script_text: draft.voiceoverScript || undefined,
          preset: draft.subtitlePreset || "mixed_highlight",
          custom: {
            base_color: draft.subtitleBaseColor,
            highlight_color: draft.subtitleHighlightColor,
            glow_color: draft.subtitleGlowColor,
            font_size: draft.subtitleFontSize,
            chunk_size: draft.subtitleChunkSize,
            animation: draft.subtitleAnimation,
            enable_glow: draft.subtitleEnableGlow,
            enable_pill_bg: draft.subtitleEnablePill,
          },
        });
        updateDraft({
          subtitlesAssUrl: res.ass_url,
          subtitlesPath: res.ass_path,
        });
        toast.success("🎉 Advanced bilingual ASS subtitles generated!", { id: toastId });
      } else {
        toast.warning("Please enter narration script or generate voiceover first", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Subtitle generation failed: ${err.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-bg-elevated/50 border border-border space-y-3 shadow-sm">
      {/* Header Accordion Bar */}
      <div 
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-brand-yellow" />
          <div>
            <div className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <span>Viral Bilingual Subtitles</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30 uppercase tracking-wider">
                20 Styles
              </span>
            </div>
            <p className="text-[10px] text-text-muted">
              White Gujarati + Yellow Anton English word highlighting
            </p>
          </div>
        </div>

        <button
          type="button"
          className="p-1 text-text-muted hover:text-text-primary transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3.5 pt-1 border-t border-border/40">
          {/* 1. Featured Style Picker (Quick Selection + Browser Launcher) */}
          <StylePicker
            selectedPresetId={draft.subtitlePreset || "mixed_highlight"}
            onSelectPreset={handleSelectPreset}
            onOpenBrowser={() => setIsModalOpen(true)}
            presets={presets}
            sampleText={draft.voiceoverScript}
          />

          {/* 2. Live Bilingual Animated Preview */}
          <SubtitlePreview
            baseColor={draft.subtitleBaseColor || "#FFFFFF"}
            highlightColor={draft.subtitleHighlightColor || "#FFD700"}
            glowColor={draft.subtitleGlowColor || "#FFD700"}
            fontSize={draft.subtitleFontSize || 72}
            chunkSize={draft.subtitleChunkSize || 3}
            animation={draft.subtitleAnimation || "bounce_soft"}
            enableGlow={draft.subtitleEnableGlow ?? false}
            enablePill={draft.subtitleEnablePill ?? false}
            latinFont={activePreset?.latin_font || "Anton"}
            latinColor={activePreset?.latin_color || draft.subtitleHighlightColor || "#FFD700"}
            latinScale={activePreset?.latin_scale || 1.10}
            latinUppercase={activePreset?.latin_uppercase ?? true}
            sampleText={draft.voiceoverScript}
          />

          {/* 3. Fine-Tuning Controls */}
          <div className="p-3 rounded-xl bg-bg-surface/80 border border-border/60 space-y-3 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-primary">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-brand-cyan" />
                Custom Style Adjustments
              </span>
              <span className="text-[10px] text-text-muted font-mono">1080x1920 ASS</span>
            </div>

            {/* Font Size Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted">Font Size:</span>
                <span className="font-mono font-bold text-text-primary">{draft.subtitleFontSize || 72} px</span>
              </div>
              <input
                type="range"
                min={48}
                max={96}
                step={2}
                value={draft.subtitleFontSize || 72}
                onChange={(e) => updateDraft({ subtitleFontSize: Number(e.target.value) })}
                className="w-full accent-brand-yellow cursor-pointer h-1.5 bg-bg-elevated rounded-lg"
              />
            </div>

            {/* Words Per Burst (Chunk Size: 1-4) */}
            <div className="space-y-1">
              <span className="text-[11px] text-text-muted">Words Per Burst (Chunk Size):</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { size: 1, label: "1 Word", desc: "Fast" },
                  { size: 2, label: "2 Words", desc: "Hormozi" },
                  { size: 3, label: "3 Words", desc: "Flagship" },
                  { size: 4, label: "4 Words", desc: "Full Line" },
                ].map((c) => {
                  const active = (draft.subtitleChunkSize || 3) === c.size;
                  return (
                    <button
                      key={c.size}
                      type="button"
                      onClick={() => updateDraft({ subtitleChunkSize: c.size })}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all ${
                        active
                          ? "border-brand-yellow bg-brand-yellow/15 text-text-primary font-bold shadow-sm"
                          : "border-border bg-bg-surface text-text-muted hover:border-brand-yellow/40 hover:text-text-primary"
                      }`}
                    >
                      <div className="text-[10px] font-bold">{c.label}</div>
                      <div className="text-[8px] opacity-70">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Animation Style Selector */}
            <div className="space-y-1">
              <span className="text-[11px] text-text-muted">Word Entrance Animation:</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: "bounce_soft", label: "Bounce 🏀" },
                  { id: "pop", label: "Pop 💥" },
                  { id: "slide", label: "Slide ➡️" },
                  { id: "karaoke", label: "Karaoke 🎤" },
                ].map((a) => {
                  const active = (draft.subtitleAnimation || "bounce_soft") === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => updateDraft({ subtitleAnimation: a.id })}
                      className={`py-1.5 px-1.5 rounded-lg border text-center text-[10px] font-semibold transition-all ${
                        active
                          ? "border-brand-pink bg-brand-pink/15 text-brand-pink font-bold"
                          : "border-border bg-bg-surface text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Swatches Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Base Gujarati Color */}
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted">Gujarati Text:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={draft.subtitleBaseColor || "#FFFFFF"}
                    onChange={(e) => updateDraft({ subtitleBaseColor: e.target.value })}
                    className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-text-primary uppercase">
                    {draft.subtitleBaseColor || "#FFFFFF"}
                  </span>
                </div>
              </div>

              {/* Latin English Highlight Color */}
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted">English Word:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={draft.subtitleHighlightColor || "#FFD700"}
                    onChange={(e) => updateDraft({ subtitleHighlightColor: e.target.value })}
                    className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-text-primary uppercase">
                    {draft.subtitleHighlightColor || "#FFD700"}
                  </span>
                </div>
              </div>

              {/* Glow Color */}
              <div className="space-y-1">
                <span className="text-[10px] text-text-muted">Glow Accent:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={draft.subtitleGlowColor || "#FFD700"}
                    onChange={(e) => updateDraft({ subtitleGlowColor: e.target.value })}
                    className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-text-primary uppercase">
                    {draft.subtitleGlowColor || "#FFD700"}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggles: Glow & Pill */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.subtitleEnableGlow ?? false}
                  onChange={(e) => updateDraft({ subtitleEnableGlow: e.target.checked })}
                  className="rounded border-border text-brand-yellow focus:ring-0"
                />
                <span className="text-[11px] text-text-primary flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-yellow" />
                  Active Word Glow
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.subtitleEnablePill ?? false}
                  onChange={(e) => updateDraft({ subtitleEnablePill: e.target.checked })}
                  className="rounded border-border text-brand-cyan focus:ring-0"
                />
                <span className="text-[11px] text-text-primary flex items-center gap-1">
                  💊 Pill Background
                </span>
              </label>
            </div>
          </div>

          {/* Action: Subtitle Generation Button */}
          <button
            type="button"
            onClick={handleRegenerateSubtitles}
            disabled={isGenerating || (!draft.voiceoverFilename && !draft.voiceoverScript)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-pink/15 via-brand-yellow/15 to-brand-cyan/15 border border-brand-yellow/30 hover:border-brand-yellow/70 hover:text-brand-yellow text-xs font-bold text-text-primary flex items-center justify-center gap-2 transition-all disabled:opacity-40 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-brand-yellow ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Generating Bilingual ASS Subtitles..." : "Generate / Refresh Subtitles"}</span>
          </button>
        </div>
      )}

      {/* 20-Style Library Full-Screen Modal */}
      <StyleBrowserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedStyleId={draft.subtitlePreset || "mixed_highlight"}
        onSelectStyle={handleSelectPreset}
        currentScriptText={draft.voiceoverScript}
      />
    </div>
  );
}
