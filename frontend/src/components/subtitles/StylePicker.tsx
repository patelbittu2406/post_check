"use client";

import React, { useState, useEffect } from "react";
import { SubtitleStylePreset, fetchSubtitleStyles } from "@/lib/api";
import { StylePreviewCard } from "./StylePreviewCard";
import { Sparkles, Grid, ArrowRight, Layers, Globe, Flame } from "lucide-react";

interface StylePickerProps {
  selectedPresetId: string;
  onSelectPreset: (preset: SubtitleStylePreset) => void;
  onOpenBrowser: () => void;
  presets?: SubtitleStylePreset[];
  sampleText?: string;
}

// Fallback featured presets if API not yet resolved
const DEFAULT_FEATURED: SubtitleStylePreset[] = [
  {
    id: "mixed_highlight",
    name: "Mixed Highlight",
    category: "bilingual",
    icon: "🎯",
    description: "Gujarati white + English yellow Anton. Viral bilingual style.",
    base_font: "Noto Sans Gujarati",
    base_size: 72,
    base_color: "#FFFFFF",
    base_outline: "#000000",
    base_outline_width: 5,
    base_shadow: 3,
    latin_font: "Anton",
    latin_color: "#FFD700",
    latin_scale: 1.10,
    latin_uppercase: true,
    latin_bold: true,
    chunk_size: 3,
    animation: "bounce_soft",
    glow: false,
    glow_color: null,
    pill_bg: false,
  },
  {
    id: "hormozi_classic",
    name: "Hormozi Classic",
    category: "bold",
    icon: "💥",
    description: "Bold white text, yellow highlight with glow. Alex Hormozi style.",
    base_font: "Noto Sans Gujarati",
    base_size: 76,
    base_color: "#FFFFFF",
    base_outline: "#000000",
    base_outline_width: 6,
    base_shadow: 4,
    latin_font: "Anton",
    latin_color: "#FFCC00",
    latin_scale: 1.15,
    latin_uppercase: true,
    latin_bold: true,
    chunk_size: 2,
    animation: "bounce_hard",
    glow: true,
    glow_color: "#FFD700",
    pill_bg: false,
  },
  {
    id: "capcut_default",
    name: "CapCut Default",
    category: "minimal",
    icon: "✨",
    description: "Clean white text on dark pill, cyan highlight, 3-word chunks.",
    base_font: "Noto Sans Gujarati",
    base_size: 64,
    base_color: "#FFFFFF",
    base_outline: "#000000",
    base_outline_width: 3,
    base_shadow: 2,
    latin_font: "Montserrat",
    latin_color: "#00E5FF",
    latin_scale: 1.05,
    latin_uppercase: false,
    latin_bold: true,
    chunk_size: 3,
    animation: "pop",
    glow: false,
    glow_color: null,
    pill_bg: true,
    pill_color: "#000000",
    pill_opacity: 0.65,
  },
  {
    id: "neon_cyber",
    name: "Neon Cyber",
    category: "cyber",
    icon: "💜",
    description: "Magenta neon glow with cyan outlines. High-energy cyberpunk aesthetic.",
    base_font: "Noto Sans Gujarati",
    base_size: 70,
    base_color: "#FFFFFF",
    base_outline: "#FF00FF",
    base_outline_width: 4,
    base_shadow: 0,
    latin_font: "Bebas Neue",
    latin_color: "#00FFFF",
    latin_scale: 1.12,
    latin_uppercase: true,
    latin_bold: true,
    chunk_size: 2,
    animation: "glitch",
    glow: true,
    glow_color: "#FF00FF",
    pill_bg: false,
  },
];

export function StylePicker({
  selectedPresetId,
  onSelectPreset,
  onOpenBrowser,
  presets,
  sampleText,
}: StylePickerProps) {
  const [allStyles, setAllStyles] = useState<SubtitleStylePreset[]>(
    presets && presets.length > 0 ? presets : DEFAULT_FEATURED
  );

  useEffect(() => {
    if (presets && presets.length > 0) {
      setAllStyles(presets);
      return;
    }

    fetchSubtitleStyles()
      .then((res) => {
        if (res.styles && res.styles.length > 0) {
          setAllStyles(res.styles);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch full subtitle styles:", err);
      });
  }, [presets]);

  // Featured styles to display in the quick picker:
  // Show 4 top favorites: mixed_highlight, hormozi_classic, capcut_default, neon_cyber
  const featuredIds = ["mixed_highlight", "hormozi_classic", "capcut_default", "neon_cyber"];

  const featuredStyles = featuredIds
    .map((id) => allStyles.find((s) => s.id === id))
    .filter((s): s is SubtitleStylePreset => Boolean(s));

  const displayFeatured =
    featuredStyles.length === 4 ? featuredStyles : allStyles.slice(0, 4);

  // Active style metadata
  const activeStyle =
    allStyles.find((s) => s.id === selectedPresetId) ||
    DEFAULT_FEATURED[0];

  return (
    <div className="space-y-3">
      {/* Top Header & 20-Styles Modal Button */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
          <span>Subtitle Style Presets</span>
        </label>

        <button
          type="button"
          onClick={onOpenBrowser}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-brand-yellow/15 hover:bg-brand-yellow/25 border border-brand-yellow/40 text-brand-yellow text-[10px] font-extrabold transition-all group shadow-sm hover:scale-[1.02]"
        >
          <Grid className="w-3 h-3" />
          <span>Browse All 20 Styles</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Featured Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {displayFeatured.map((preset) => (
          <StylePreviewCard
            key={preset.id}
            preset={preset}
            isSelected={selectedPresetId === preset.id}
            onSelect={() => onSelectPreset(preset)}
            sampleText={sampleText}
            compact={true}
          />
        ))}
      </div>

      {/* Active Preset Font Summary Bar */}
      <div className="p-2.5 rounded-xl bg-bg-surface/90 border border-border/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
          <span className="text-[11px] text-text-muted font-medium">Active Configuration:</span>
          <span className="text-[11px] font-bold text-text-primary font-mono">
            {activeStyle.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted">
          <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border">
            GU: {activeStyle.base_font}
          </span>
          <span>+</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/30 font-bold">
            EN: {activeStyle.latin_font} ({activeStyle.latin_color})
          </span>
        </div>
      </div>
    </div>
  );
}
