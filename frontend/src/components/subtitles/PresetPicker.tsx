"use client";

import React from "react";
import { SubtitlePreset } from "@/lib/api";
import { Sparkles, Check } from "lucide-react";

export const BUILTIN_SUBTITLE_PRESETS: SubtitlePreset[] = [
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
    highlight_color: "#FFD700",
    font_size: 72,
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
    highlight_color: "#FFCC00",
    font_size: 76,
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
    highlight_color: "#00E5FF",
    font_size: 64,
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
    highlight_color: "#00FFFF",
    font_size: 70,
  },
];


interface PresetPickerProps {
  selectedPresetId: string;
  onSelectPreset: (preset: SubtitlePreset) => void;
  presets?: SubtitlePreset[];
}

export function PresetPicker({
  selectedPresetId,
  onSelectPreset,
  presets,
}: PresetPickerProps) {
  const displayPresets = presets && presets.length > 0 ? presets : BUILTIN_SUBTITLE_PRESETS;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-brand-yellow" />
          Style Presets (4 Styles)
        </label>
        <span className="text-[10px] text-text-muted/80">1-Click Viral Presets</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {displayPresets.map((p) => {
          const isSelected = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p)}
              className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? "border-brand-yellow/80 bg-brand-yellow/10 shadow-md text-text-primary ring-1 ring-brand-yellow/40"
                  : "border-border bg-bg-surface hover:border-brand-yellow/40 hover:bg-bg-elevated text-text-muted hover:text-text-primary"
              }`}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{p.icon}</span>
                  {/* Visual Color Palette Pill */}
                  <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded-full border border-white/10">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/40"
                      style={{ backgroundColor: p.base_color }}
                      title="Base text color"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/40"
                      style={{ backgroundColor: p.highlight_color }}
                      title="Highlight color"
                    />
                    {p.glow_color && (
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/40 animate-pulse"
                        style={{ backgroundColor: p.glow_color }}
                        title="Glow color"
                      />
                    )}
                  </div>
                </div>

                <div className="text-xs font-bold leading-tight line-clamp-1">{p.name}</div>
                <div className="text-[9px] text-text-muted mt-1 leading-snug line-clamp-2">
                  {p.description}
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 text-[9px] font-extrabold uppercase tracking-wider text-brand-yellow flex items-center justify-between w-full pt-1 border-t border-brand-yellow/20">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
                    Selected
                  </span>
                  <Check className="w-3 h-3 text-brand-yellow" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
