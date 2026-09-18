"use client";

import React from "react";
import { CapCutPreset } from "@/lib/capcut/types";
import { Sparkles, Zap, Flame, Mic } from "lucide-react";

interface StylePresetCardsProps {
  presets: CapCutPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: CapCutPreset) => void;
}

export function StylePresetCards({
  presets,
  selectedPresetId,
  onSelectPreset,
}: StylePresetCardsProps) {
  const defaultPresets: CapCutPreset[] = [
    {
      id: "serious",
      name: "Serious Anchor",
      icon: "🎙️",
      description: "Slow zoom · Smooth cross-dissolves",
      motion_intensity: "subtle",
      transition_style: "smooth",
      avg_segment_duration: 3.5,
      zoom_range: [1.00, 1.06],
      bgm_duck_level: 0.10,
    },
    {
      id: "fast",
      name: "Fast News",
      icon: "⚡",
      description: "Fast cuts · Dynamic whip-pans",
      motion_intensity: "fast_cuts",
      transition_style: "punchy",
      avg_segment_duration: 2.0,
      zoom_range: [1.00, 1.15],
      bgm_duck_level: 0.14,
    },
    {
      id: "festive",
      name: "Festive & Vibrant",
      icon: "🎉",
      description: "White flashes · Punchy energetic zooms",
      motion_intensity: "balanced",
      transition_style: "punchy",
      avg_segment_duration: 2.5,
      zoom_range: [1.00, 1.12],
      bgm_duck_level: 0.12,
      flash_boost: true,
    },
  ];

  const displayPresets = presets && presets.length > 0 ? presets : defaultPresets;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-brand-pink" />
          CapCut Style Presets
        </label>
        <span className="text-[10px] text-text-muted/80">1-Click Auto Config</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {displayPresets.map((p) => {
          const isSelected = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelectPreset(p)}
              className={`p-2.5 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "border-brand-pink/80 bg-brand-pink/10 shadow-md glow-pink text-text-primary"
                  : "border-border bg-bg-surface hover:border-brand-pink/40 hover:bg-bg-elevated text-text-muted hover:text-text-primary"
              }`}
            >
              <div>
                <div className="text-xl mb-1">{p.icon}</div>
                <div className="text-xs font-bold leading-tight line-clamp-1">{p.name}</div>
                <div className="text-[9px] text-text-muted mt-1 leading-snug line-clamp-2">
                  {p.description}
                </div>
              </div>

              {isSelected && (
                <div className="mt-2 text-[9px] font-extrabold uppercase tracking-wider text-brand-pink flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
