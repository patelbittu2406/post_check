"use client";

import React, { useState, useEffect } from "react";
import { SubtitleStylePreset } from "@/lib/api";
import { LanguageOverridePopover } from "./LanguageOverridePopover";

interface LiveSubtitlePreviewProps {
  scriptText?: string;
  preset?: SubtitleStylePreset | null;
  baseColor?: string;
  highlightColor?: string;
  glowColor?: string;
  fontSize?: number;
  enablePill?: boolean;
  pillColor?: string;
  enableGlow?: boolean;
  wordOverrides?: Record<number, string>;
  onWordOverrideChange?: (index: number, language: "auto" | "gu" | "en") => void;
  scale?: number;
}

const DEFAULT_REFERENCE_SAMPLE = "આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી";

export function LiveSubtitlePreview({
  scriptText,
  preset,
  baseColor = "#FFFFFF",
  highlightColor = "#FFD700",
  glowColor = "#FFD700",
  fontSize = 72,
  enablePill = false,
  pillColor = "#000000",
  enableGlow = false,
  wordOverrides = {},
  onWordOverrideChange,
  scale = 1.0,
}: LiveSubtitlePreviewProps) {
  const [activeWordPopover, setActiveWordPopover] = useState<{
    index: number;
    word: string;
    detected: string;
    current: string;
  } | null>(null);

  const rawText = scriptText || DEFAULT_REFERENCE_SAMPLE;
  const clean = rawText.replace(/\[.*?\]|<.*?>/g, " ").replace(/\s+/g, " ").trim();
  const words = clean ? clean.split(/\s+/) : DEFAULT_REFERENCE_SAMPLE.split(/\s+/);

  // Determine Latin Font Family Class
  const getLatinFontClass = (fontName?: string) => {
    const f = (fontName || preset?.latin_font || "Anton").toLowerCase();
    if (f.includes("anton")) return "font-anton tracking-wide";
    if (f.includes("bebas")) return "font-bebas tracking-wider";
    if (f.includes("montserrat")) return "font-montserrat font-black";
    if (f.includes("poppins")) return "font-poppins font-black";
    return "font-inter font-extrabold";
  };

  const latinFontClass = getLatinFontClass(preset?.latin_font);
  const latinScale = preset?.latin_scale || 1.10;
  const latinUppercase = preset?.latin_uppercase ?? true;
  const isPill = enablePill || preset?.pill_bg || false;
  const hasGlow = enableGlow || preset?.glow || preset?.latin_glow || false;
  const activeGlowColor = glowColor || preset?.glow_color || highlightColor;

  const handleWordClick = (idx: number, word: string, detected: string) => {
    if (!onWordOverrideChange) return;
    const current = wordOverrides[idx] || "auto";
    setActiveWordPopover({
      index: idx,
      word,
      detected,
      current,
    });
  };

  return (
    <div className="relative inline-flex flex-wrap items-center justify-center gap-1.5 transition-all text-center select-none">
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-1.5 transition-all ${
          isPill ? "px-3 py-1.5 rounded-full border border-white/10 shadow-lg" : ""
        }`}
        style={{
          backgroundColor: isPill
            ? preset?.pill_color || pillColor || "rgba(0,0,0,0.75)"
            : "transparent",
        }}
      >
        {words.map((word, idx) => {
          const autoDetectedLatin = /[A-Za-z]/.test(word);
          const override = wordOverrides[idx];

          let isLatin = autoDetectedLatin;
          if (override === "en") isLatin = true;
          if (override === "gu") isLatin = false;

          const basePx = Math.round(fontSize * 0.20 * scale);
          const latinPx = Math.round(basePx * latinScale);

          if (isLatin) {
            const displayLatin = latinUppercase ? word.toUpperCase() : word;
            return (
              <span
                key={`${word}-${idx}`}
                onClick={() => handleWordClick(idx, word, autoDetectedLatin ? "en" : "gu")}
                className={`inline-block font-extrabold ${latinFontClass} cursor-pointer hover:opacity-80 transition-transform active:scale-95`}
                style={{
                  fontSize: `${latinPx}px`,
                  color: highlightColor || preset?.latin_color || "#FFD700",
                  textShadow: hasGlow
                    ? `0 0 10px ${activeGlowColor}, 0 2px 5px rgba(0,0,0,0.9)`
                    : "0 2px 6px rgba(0,0,0,0.9)",
                  WebkitTextStroke: "0.5px rgba(0,0,0,0.85)",
                }}
                title="Click to override language style"
              >
                {displayLatin}
              </span>
            );
          }

          // Gujarati Script
          return (
            <span
              key={`${word}-${idx}`}
              onClick={() => handleWordClick(idx, word, autoDetectedLatin ? "en" : "gu")}
              className="inline-block font-gujarati font-extrabold cursor-pointer hover:opacity-80 transition-transform active:scale-95"
              style={{
                fontSize: `${basePx}px`,
                color: baseColor || preset?.base_color || "#FFFFFF",
                textShadow: "0 2px 6px rgba(0,0,0,0.9)",
                WebkitTextStroke: "0.4px rgba(0,0,0,0.75)",
              }}
              title="Click to override language style"
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Language Override Popover */}
      {activeWordPopover && onWordOverrideChange && (
        <LanguageOverridePopover
          wordIndex={activeWordPopover.index}
          wordText={activeWordPopover.word}
          currentLanguage={activeWordPopover.current}
          detectedLanguage={activeWordPopover.detected}
          onSelectLanguage={(lang) => {
            onWordOverrideChange(activeWordPopover.index, lang);
            setActiveWordPopover(null);
          }}
          onClose={() => setActiveWordPopover(null)}
        />
      )}
    </div>
  );
}
