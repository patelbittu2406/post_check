"use client";

import React from "react";
import { SubtitleStylePreset } from "@/lib/api";
import { Check, Sparkles, Layers, Wand2 } from "lucide-react";

interface StylePreviewCardProps {
  preset: SubtitleStylePreset;
  isSelected: boolean;
  onSelect: () => void;
  sampleText?: string;
  compact?: boolean;
}

const DEFAULT_BILINGUAL_SAMPLE = "આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી";

export function StylePreviewCard({
  preset,
  isSelected,
  onSelect,
  sampleText,
  compact = false,
}: StylePreviewCardProps) {
  const text = sampleText || DEFAULT_BILINGUAL_SAMPLE;

  // Clean audio tags if present
  const cleanText = text.replace(/\[.*?\]|<.*?>/g, " ").replace(/\s+/g, " ").trim();
  const rawWords = cleanText ? cleanText.split(/\s+/) : DEFAULT_BILINGUAL_SAMPLE.split(/\s+/);
  
  // Show first 5-7 words in card preview
  const displayWords = rawWords.slice(0, compact ? 4 : 7);

  // Determine Latin CSS font family
  const getLatinFontClass = (fontName: string) => {
    const f = (fontName || "").toLowerCase();
    if (f.includes("anton")) return "font-anton tracking-wide";
    if (f.includes("bebas")) return "font-bebas tracking-wider";
    if (f.includes("montserrat")) return "font-montserrat font-black";
    if (f.includes("poppins")) return "font-poppins font-black";
    return "font-inter font-extrabold";
  };

  const latinFontClass = getLatinFontClass(preset.latin_font);

  // Category Color Map
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "bilingual":
        return { label: "BILINGUAL", bg: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
      case "bold":
        return { label: "VIRAL BOLD", bg: "bg-red-500/15 text-red-400 border-red-500/30" };
      case "minimal":
        return { label: "CLEAN", bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" };
      case "festive":
        return { label: "GUJARATI", bg: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
      case "cinematic":
        return { label: "CINEMATIC", bg: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
      case "creative":
        return { label: "CREATIVE", bg: "bg-pink-500/15 text-pink-400 border-pink-500/30" };
      default:
        return { label: cat.toUpperCase(), bg: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
    }
  };

  const catBadge = getCategoryBadge(preset.category || "bilingual");

  // Glow shadow generator
  const activeGlow = preset.glow || preset.latin_glow
    ? `0 0 14px ${preset.glow_color || preset.latin_color || "#FFD700"}`
    : "none";

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between select-none ${
        isSelected
          ? "border-brand-yellow/90 bg-gradient-to-b from-brand-yellow/15 via-bg-surface to-bg-elevated shadow-xl ring-2 ring-brand-yellow/50"
          : "border-border/70 bg-bg-surface/90 hover:border-brand-yellow/50 hover:bg-bg-elevated hover:shadow-lg"
      } ${compact ? "p-3" : "p-3.5"}`}
    >
      {/* Top Header: Icon, Name & Category Badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
            {preset.icon || "🎯"}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold text-text-primary truncate tracking-tight">
              {preset.name}
            </h4>
            <span
              className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-0.5 ${catBadge.bg}`}
            >
              {catBadge.label}
            </span>
          </div>
        </div>

        {/* Font & Color Badge Pill */}
        <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full border border-white/10 flex-shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
            style={{ backgroundColor: preset.base_color }}
            title={`Gujarati Color: ${preset.base_color}`}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm"
            style={{ backgroundColor: preset.latin_color }}
            title={`Latin Color: ${preset.latin_color} (${preset.latin_font})`}
          />
          {preset.glow_color && (
            <span
              className="w-2.5 h-2.5 rounded-full border border-black/40 animate-pulse"
              style={{ backgroundColor: preset.glow_color }}
              title={`Glow Color: ${preset.glow_color}`}
            />
          )}
        </div>
      </div>

      {/* Center: Live Simulated Visual Render Canvas */}
      <div
        className={`relative w-full rounded-xl overflow-hidden flex items-center justify-center border border-white/5 my-2 ${
          compact ? "h-20 p-2" : "h-24 p-3"
        } bg-gradient-to-b from-[#080911] via-[#0E1322] to-[#06070B]`}
      >
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-transparent to-transparent pointer-events-none" />
        
        {/* Subtle Backdrop Grid */}
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:10px_10px]" />

        {/* The Live Bilingual Subtitle Burst */}
        <div
          className={`relative z-10 flex flex-wrap items-center justify-center gap-1.5 text-center leading-tight transition-all duration-200 ${
            preset.pill_bg
              ? "px-3 py-1.5 rounded-full border border-white/10 shadow-lg"
              : ""
          }`}
          style={{
            backgroundColor: preset.pill_bg
              ? preset.pill_color || "rgba(0,0,0,0.75)"
              : "transparent",
          }}
        >
          {displayWords.map((word, idx) => {
            // Check if word is Latin (English) or Gujarati
            const isLatin = /[A-Za-z]/.test(word);

            if (isLatin) {
              const displayLatin = preset.latin_uppercase ? word.toUpperCase() : word;
              return (
                <span
                  key={`${word}-${idx}`}
                  className={`inline-block font-extrabold ${latinFontClass} tracking-wide transition-all`}
                  style={{
                    color: preset.latin_color,
                    fontSize: `${Math.round((compact ? 13 : 16) * (preset.latin_scale || 1.1))}px`,
                    textShadow: activeGlow !== "none" ? activeGlow : "0 2px 4px rgba(0,0,0,0.9)",
                    WebkitTextStroke: "0.5px rgba(0,0,0,0.8)",
                  }}
                >
                  {displayLatin}
                </span>
              );
            }

            // Gujarati word
            return (
              <span
                key={`${word}-${idx}`}
                className="inline-block font-gujarati font-extrabold text-white transition-all"
                style={{
                  color: preset.base_color,
                  fontSize: `${compact ? 12 : 14}px`,
                  textShadow: "0 2px 4px rgba(0,0,0,0.9)",
                  WebkitTextStroke: "0.4px rgba(0,0,0,0.7)",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Small Bottom Indicator: Fonts info */}
        <div className="absolute bottom-1 inset-x-2 flex items-center justify-between text-[8px] font-mono text-text-muted/60 pointer-events-none">
          <span>{preset.base_font} + {preset.latin_font}</span>
          <span>{preset.animation}</span>
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-[10px] text-text-muted line-clamp-2 leading-relaxed mb-2.5">
          {preset.description}
        </p>
      )}

      {/* Card Footer: Selected Pill or Meta Tags */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px]">
        <div className="flex items-center gap-1.5 text-text-muted text-[9px] font-medium">
          <span className="px-1.5 py-0.5 rounded bg-bg-elevated border border-border/60">
            {preset.chunk_size} words/burst
          </span>
          {preset.pill_bg && (
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
              Pill
            </span>
          )}
          {preset.glow && (
            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
              Glow
            </span>
          )}
        </div>

        {isSelected ? (
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-brand-yellow uppercase tracking-wider">
            <Check className="w-3.5 h-3.5 text-brand-yellow" />
            <span>Active</span>
          </div>
        ) : (
          <span className="text-[9px] font-bold text-text-muted group-hover:text-text-primary transition-colors">
            Select →
          </span>
        )}
      </div>
    </div>
  );
}
