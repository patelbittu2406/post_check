"use client";

import React, { useState } from "react";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Eye, Shield, ZoomIn, ZoomOut, RotateCcw, Sparkles } from "lucide-react";
import { LiveSubtitlePreview } from "@/components/subtitles/LiveSubtitlePreview";



export function PhonePreview() {
  const { draft, profile, updateDraft } = useStore();
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [zoom, setZoom] = useState(1);

  const l1Bg = profile.line1_bg || "#FF0033";
  const l1Tx = profile.line1_text || "#FFFFFF";
  const l2Bg = profile.line2_bg || "#0080FF";
  const l2Tx = profile.line2_text || "#FFFFFF";
  const watermarkEnabled = profile.watermark_enabled ?? true;
  const watermarkPos = profile.watermark_position || "top-right";
  const watermarkOpacity = profile.watermark_opacity ?? 0.85;

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-hidden bg-bg-base relative">
      {/* Top Floating Controls Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-surface/90 border border-border shadow-md backdrop-blur-md z-20 text-xs text-text-muted">
        <button
          onClick={() => setShowSafeZones(!showSafeZones)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 ${
            showSafeZones
              ? "bg-brand-pink/15 text-brand-pink border border-brand-pink/30"
              : "hover:text-text-primary"
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Safe Zones: {showSafeZones ? "ON" : "OFF"}</span>
        </button>

        <div className="h-3 w-px bg-border mx-1" />

        <button
          onClick={() => setZoom(Math.max(0.75, zoom - 0.1))}
          className="p-1 hover:text-text-primary transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-mono w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(1.25, zoom + 0.1))}
          className="p-1 hover:text-text-primary transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Phone Canvas Frame */}
      <div className="flex-1 flex items-center justify-center w-full min-h-0 py-2">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          className="transition-transform duration-150"
        >
          {/* Phone Outer Shell */}
          <div className="relative w-[280px] h-[560px] rounded-[44px] bg-[#0A0A10] p-3 shadow-[0_0_0_8px_#1A1A24,0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 overflow-hidden flex flex-col">
            
            {/* Screen Inner Viewport (9:16 aspect) */}
            <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-slate-950 flex flex-col justify-between select-none">
              
              {/* Simulated Video Layer */}
              <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 via-blue-950/80 to-slate-950 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-transparent to-black/80" />
                
                {/* Visual Video Simulation Grid & Lights */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]" />
                
                {/* City skyline glow */}
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent" />
              </div>

              {/* Dynamic Island / iPhone Notch */}
              <div className="absolute top-2.5 inset-x-0 z-30 flex justify-center pointer-events-none">
                <div className="w-20 h-4 bg-black rounded-full shadow-inner flex items-center justify-end px-2">
                  <div className="w-2 h-2 rounded-full bg-[#0d233a]/80" />
                </div>
              </div>

              {/* Safe Zone Guides Overlay (Dashed Guides) */}
              {showSafeZones && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Top Notch Safe Zone */}
                  <div className="absolute top-[50px] inset-x-0 border-b border-dashed border-sky-400/40 flex items-center justify-between px-2">
                    <span className="text-[8px] font-mono text-sky-400/70">TOP NOTCH SAFE ZONE</span>
                    <span className="text-[8px] font-mono text-sky-400/70">220px</span>
                  </div>

                  {/* Center Cross Guide */}
                  <div className="absolute top-1/2 inset-x-0 border-b border-dotted border-white/20" />
                  <div className="absolute left-1/2 inset-y-0 border-r border-dotted border-white/20" />

                  {/* Bottom UI Safe Zone */}
                  <div className="absolute bottom-[100px] inset-x-0 border-t border-dashed border-sky-400/40 flex items-center justify-between px-2">
                    <span className="text-[8px] font-mono text-sky-400/70">BOTTOM UI SAFE ZONE</span>
                    <span className="text-[8px] font-mono text-sky-400/70">420px</span>
                  </div>
                </div>
              )}

              {/* Watermark Overlay */}
              {watermarkEnabled && (
                <div className={`absolute z-30 p-3 pointer-events-none ${
                  watermarkPos === "top-left" ? "top-5 left-2" :
                  watermarkPos === "top-right" ? "top-5 right-2" :
                  watermarkPos === "bottom-left" ? "bottom-24 left-2" :
                  "bottom-24 right-2"
                }`}>
                  <img
                    src="/logo.png"
                    alt="Prarambh Watermark"
                    style={{ opacity: watermarkOpacity }}
                    className="w-9 h-9 object-contain drop-shadow-md"
                  />
                </div>
              )}

              {/* Top News Ticker Bar */}
              <div className="relative z-10 mt-7 px-3 py-1 bg-gradient-to-r from-brand-pink via-red-600 to-brand-pink text-white flex items-center justify-between shadow-md">
                <span className="text-[8px] font-extrabold tracking-wider font-outfit uppercase">
                  SURAT UPDATE | {draft.categoryCode}
                </span>
                <span className="text-[7px] font-bold opacity-80">{draft.area}</span>
              </div>

              {/* DUAL-STRIPE HEADLINE PILLS (Focal Center) */}
              <div 
                className="relative z-20 flex flex-col items-center gap-1.5 px-3 transition-all cursor-move group"
                style={{ marginTop: `${draft.badge1Top - 18}%` }}
              >
                {/* Line 1 Pill */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="px-3.5 py-1.5 rounded-xl font-extrabold font-gujarati text-[13px] shadow-xl text-center leading-tight max-w-[94%] border border-white/10"
                  style={{ backgroundColor: l1Bg, color: l1Tx }}
                >
                  {draft.line1Headline || "સુરત ઉત્સવ | F01"}
                </motion.div>

                {/* Line 2 Pill */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="px-3.5 py-1.5 rounded-xl font-extrabold font-gujarati text-[13px] shadow-xl text-center leading-tight max-w-[94%] border border-white/10"
                  style={{ backgroundColor: l2Bg, color: l2Tx }}
                >
                  {draft.line2Headline || "ગણેશ ઉત્સવ ધામધૂમથી ઉજવાયો 🎉"}
                </motion.div>
              </div>

              {/* Lower Section: Timed Subtitle & Simulated Instagram Reel UI */}
              <div className="relative z-10 pb-4 px-3 space-y-2">
                {/* Word-Level Subtitle Banner (Bilingual Render) */}
                <div className="text-center px-2 py-1 min-h-[42px] flex items-center justify-center">
                  <LiveSubtitlePreview
                    scriptText={draft.voiceoverScript}
                    baseColor={draft.subtitleBaseColor}
                    highlightColor={draft.subtitleHighlightColor}
                    glowColor={draft.subtitleGlowColor}
                    fontSize={draft.subtitleFontSize}
                    enablePill={draft.subtitleEnablePill}
                    enableGlow={draft.subtitleEnableGlow}
                    wordOverrides={draft.wordLanguageOverrides || {}}
                    onWordOverrideChange={(idx, lang) => {
                      const newOverrides = { ...(draft.wordLanguageOverrides || {}) };
                      if (lang === "auto") {
                        delete newOverrides[idx];
                      } else {
                        newOverrides[idx] = lang;
                      }
                      updateDraft({ wordLanguageOverrides: newOverrides });
                    }}
                  />
                </div>


                {/* Simulated Instagram Reel Bottom Chrome */}
                <div className="space-y-1.5 pt-1 text-white/90">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-brand-pink to-brand-yellow flex items-center justify-center text-[8px] font-bold">
                      P
                    </div>
                    <span className="text-[10px] font-bold font-outfit">surat.prarambh.news</span>
                  </div>
                  <p className="text-[8px] text-white/80 line-clamp-1">
                    {draft.caption.split("\n")[0] || "સુરતના તાજા સમાચારો માટે ફોલો કરો."}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
