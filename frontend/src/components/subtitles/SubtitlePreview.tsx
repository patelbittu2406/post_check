"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";

interface SubtitlePreviewProps {
  baseColor?: string;
  highlightColor?: string;
  glowColor?: string | null;
  fontSize?: number;
  chunkSize?: number;
  animation?: string;
  enableGlow?: boolean;
  enablePill?: boolean;
  latinFont?: string;
  latinColor?: string;
  latinScale?: number;
  latinUppercase?: boolean;
  sampleText?: string;
}

const DEFAULT_BILINGUAL_SAMPLE = "આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી";

export function SubtitlePreview({
  baseColor = "#FFFFFF",
  highlightColor = "#FFD700",
  glowColor = "#FFD700",
  fontSize = 72,
  chunkSize = 3,
  animation = "bounce_soft",
  enableGlow = false,
  enablePill = false,
  latinFont = "Anton",
  latinColor = "#FFD700",
  latinScale = 1.10,
  latinUppercase = true,
  sampleText,
}: SubtitlePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Clean audio tags ([excited], [pauses], etc.) from sampleText
  const cleanSample = sampleText
    ? sampleText.replace(/\[.*?\]|<.*?>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  const words = cleanSample && cleanSample.length > 5
    ? cleanSample.split(/\s+/).slice(0, 12)
    : DEFAULT_BILINGUAL_SAMPLE.split(/\s+/);

  // Group into chunks of chunkSize
  const chunks: string[][] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize));
  }

  // Calculate which chunk the active word is in
  const currentChunkIndex = Math.floor(currentWordIndex / chunkSize) % Math.max(1, chunks.length);
  const currentChunk = chunks[currentChunkIndex] || [];
  const activeWordInChunkIndex = currentWordIndex % chunkSize;

  // Animation cycle loop
  useEffect(() => {
    if (!isPlaying || words.length === 0) return;

    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
    }, 450); // ~450ms per word pacing

    return () => clearInterval(interval);
  }, [isPlaying, words.length]);

  // Dynamic Glow Text-Shadow
  const effectiveGlowColor = glowColor || latinColor || highlightColor || "#FFD700";
  const activeGlowStyle = enableGlow
    ? `0 0 16px ${effectiveGlowColor}, 0 0 30px ${effectiveGlowColor}, 0 2px 4px rgba(0,0,0,0.9)`
    : "0 2px 6px rgba(0,0,0,0.9)";

  // Relative font size for the compact preview box (scaled ~28% of 1080p ASS size)
  const previewFontSize = Math.max(15, Math.min(26, Math.round(fontSize * 0.28)));

  // Resolve Latin Font class
  const getLatinFontClass = (fontName: string) => {
    const f = (fontName || "").toLowerCase();
    if (f.includes("anton")) return "font-anton tracking-wide";
    if (f.includes("bebas")) return "font-bebas tracking-wider";
    if (f.includes("montserrat")) return "font-montserrat font-black";
    if (f.includes("poppins")) return "font-poppins font-black";
    return "font-inter font-extrabold";
  };

  const latinFontClass = getLatinFontClass(latinFont);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-brand-pink" />
          Live Bilingual Preview
        </label>
        
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title={isPlaying ? "Pause animation preview" : "Play animation preview"}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={() => setCurrentWordIndex(0)}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            title="Restart animation cycle"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Simulated 9:16 Video Canvas Stage */}
      <div className="relative w-full h-32 rounded-2xl bg-gradient-to-b from-[#090912] via-[#0E121E] to-[#080810] border border-border/80 overflow-hidden flex flex-col items-center justify-center p-3 select-none shadow-inner">
        {/* Subtle Ambient Video Glow Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]" />

        {/* Subtitle Burst Chunk Display */}
        <div
          className={`relative z-10 flex items-center justify-center gap-2 transition-all duration-200 ${
            enablePill
              ? "px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 shadow-xl"
              : ""
          }`}
        >
          {currentChunk.map((word, idx) => {
            const isActive = idx === activeWordInChunkIndex;
            const isLatin = /[A-Za-z]/.test(word);

            // Compute CSS Animation style
            let animClass = "";
            if (isActive) {
              if (animation.includes("bounce")) {
                animClass = "scale-110 -translate-y-0.5";
              } else if (animation.includes("pop")) {
                animClass = "scale-115";
              } else if (animation.includes("slide")) {
                animClass = "translate-y-0 opacity-100";
              } else if (animation.includes("karaoke")) {
                animClass = "scale-105 brightness-125";
              }
            } else {
              if (animation.includes("slide")) {
                animClass = "opacity-80";
              }
            }

            if (isLatin) {
              const displayWord = latinUppercase ? word.toUpperCase() : word;
              const scaledSize = Math.round(previewFontSize * latinScale);

              return (
                <span
                  key={`${currentChunkIndex}-${idx}-${word}`}
                  className={`inline-block ${latinFontClass} font-extrabold transition-all duration-150 transform ${animClass}`}
                  style={{
                    fontSize: `${scaledSize}px`,
                    color: latinColor || highlightColor,
                    textShadow: isActive ? activeGlowStyle : "0 2px 4px rgba(0,0,0,0.9)",
                    WebkitTextStroke: "0.6px rgba(0,0,0,0.9)",
                  }}
                >
                  {displayWord}
                </span>
              );
            }

            return (
              <span
                key={`${currentChunkIndex}-${idx}-${word}`}
                className={`font-gujarati font-extrabold transition-all duration-150 transform inline-block ${animClass}`}
                style={{
                  fontSize: `${previewFontSize}px`,
                  color: isActive ? highlightColor : baseColor,
                  textShadow: isActive ? activeGlowStyle : "0 2px 4px rgba(0,0,0,0.8)",
                  WebkitTextStroke: isActive ? "0.6px rgba(0,0,0,0.8)" : "0.5px rgba(0,0,0,0.6)",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Info Footer within preview box */}
        <div className="absolute bottom-1.5 inset-x-3 flex items-center justify-between text-[9px] text-text-muted/70 font-mono pointer-events-none">
          <span>Gujarati ({baseColor}) + {latinFont} ({latinColor})</span>
          <span>{chunkSize} words/burst · {animation.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
