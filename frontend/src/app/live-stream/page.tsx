"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { 
  Radio, 
  Tv, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Signal, 
  Users, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  Flame, 
  ShieldCheck, 
  Layers,
  ChevronRight,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function LiveStreamPage() {
  const { profile } = useStore();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(1482);
  const [tickerIndex, setTickerIndex] = useState(0);

  const tickerHeadlines = [
    "સુરત મેટ્રો ફેઝ-૨ અડાજણ-સરથાણા લાઇન: 10 નવા સ્ટેશનોની યાદી જાહેર 🚇",
    "વેસુ VIP રોડ પર આજ રાતથી સ્માર્ટ કેમેરા દ્વારા ઈ-મેમો સિસ્ટમ શરૂ 🚨",
    "સુરત ડાયમંડ બુર્સ: આગામી સપ્તાહથી 50 નવી આંતરરાષ્ટ્રીય ઓફિસોનું ઉદ્ઘાટન 💎",
    "ડુમસ સી-ફેસ પ્રોજેક્ટ: ફેઝ-૧ નું 80% કામકાજ પૂર્ણ, ટૂંક સમયમાં લોકાર્પણ 🌊",
    "સુરત મહાનગરપાલિકા દ્વારા પ્રોપર્ટી ટેક્સમાં 10% વળતરની છેલ્લી તારીખ લંબાવાઈ 🏛️"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerHeadlines.length);
      setViewerCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-bg-base p-6 md:p-8 space-y-6">
      {/* Top On-Air Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-bg-surface to-bg-surface border border-red-500/20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-600 via-brand-pink to-amber-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
              <Radio className="w-7 h-7 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-bg-base animate-ping" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-bg-base" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-text-primary tracking-tight font-outfit">
                📡 24/7 TV News Live Broadcast
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-500/20 text-red-500 border border-red-500/30 flex items-center gap-1.5 uppercase">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> ON AIR
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              સુરત શહેરનો અવિરત 24x7 AI ન્યૂઝ બ્રોડકાસ્ટ રૂમ — ઓટોમેટેડ સ્ટોરી ક્યૂ, લાઈવ ટીકર અને ઓન-એર મોનિટરિંગ.
            </p>
          </div>
        </div>

        {/* Telemetry quick badges */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-bg-elevated border border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-pink" />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">લાઈવ દર્શકો</span>
              <span className="text-xs font-black text-text-primary font-mono">{viewerCount.toLocaleString()}</span>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-bg-elevated border border-border flex items-center gap-2">
            <Signal className="w-4 h-4 text-accent-success" />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-bold uppercase">સ્ટ્રીમ હેલ્થ</span>
              <span className="text-xs font-black text-accent-success font-mono">1080p 60fps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Broadcast Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Master Control Monitor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden bg-black border border-border shadow-2xl flex flex-col justify-between p-6 select-none group">
            {/* TV Screen Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 opacity-90" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-black" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Top Bar inside Monitor */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-extrabold text-white font-outfit uppercase tracking-widest">
                  PRARAMBH 24/7 LIVE
                </span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-xs text-white/80 font-mono">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                <span>24:00:00 LIVE SCRIPT AUTOMATION</span>
              </div>
            </div>

            {/* Center TV Graphic */}
            <div className="relative z-10 flex flex-col items-center text-center space-y-3 my-auto">
              <div className="w-16 h-16 rounded-full bg-brand-pink/20 border border-brand-pink/40 flex items-center justify-center text-brand-pink shadow-2xl">
                <Tv className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <div className="inline-block px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold font-gujarati tracking-wide shadow-md">
                  બ્રેકિંગ ન્યૂઝ • સુરત લાઈવ બુલેટિન
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white font-gujarati max-w-xl leading-relaxed">
                  {tickerHeadlines[tickerIndex]}
                </h2>
              </div>
            </div>

            {/* Bottom Live Ticker inside Monitor */}
            <div className="relative z-10 rounded-xl bg-black/80 border border-white/15 overflow-hidden flex items-center p-2 gap-3 backdrop-blur-lg">
              <div className="px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
                LIVE TICKER
              </div>
              <p className="text-xs text-white font-gujarati font-semibold truncate animate-marquee">
                {tickerHeadlines[tickerIndex]}
              </p>
            </div>

            {/* Hover Monitor Controls Bar */}
            <div className="absolute inset-x-6 bottom-16 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between p-3 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3 text-white">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs text-white/70 font-mono">Stream: Surat-Feed-A1</span>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Broadcast Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-bg-surface border border-border">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-accent-success animate-pulse" />
              <span className="text-xs font-bold text-text-primary">Automated Ingestion: Active</span>
              <span className="text-xs text-text-muted">• Next reel auto-transitions in 14s</span>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-pink text-white hover:bg-brand-pink/90 transition-colors flex items-center gap-1.5"
              >
                <span>➕ Create Reel for Stream</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Col: Segment Queue & Automation Settings */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-bg-surface border border-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-pink" />
                <span>ટેલિવિઝન ક્યૂ (Upcoming Queue)</span>
              </h3>
              <span className="text-[11px] font-bold text-text-muted">4 Reels Ready</span>
            </div>

            <div className="space-y-2.5">
              {[
                { time: "હમણાં (Now)", title: "સુરત મેટ્રો સ્ટેશન યાદી", area: "Adajan", tag: "T01" },
                { time: "14 સેકન્ડ", title: "વેસુ VIP રોડ ટ્રાફિક ગાઈડલાઈન", area: "Vesu", tag: "T01" },
                { time: "42 સેકન્ડ", title: "ડાયમંડ બુર્સ નવી ઓફિસો", area: "Khajod", tag: "B01" },
                { time: "1:15 મિનિટ", title: "ડુમસ સી-ફેસ વોકવે ઓપનિંગ", area: "Dumas", tag: "N01" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    idx === 0
                      ? "bg-brand-pink/10 border-brand-pink/30 text-text-primary"
                      : "bg-bg-elevated/50 border-border/80 text-text-muted"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-brand-pink">{item.time}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-border text-text-primary">{item.tag}</span>
                    </div>
                    <p className="text-xs font-bold text-text-primary font-gujarati truncate max-w-[180px]">
                      {item.title}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-text-muted">{item.area}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Broadcast Configuration Summary */}
          <div className="p-5 rounded-3xl bg-bg-surface border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-text-primary flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-cyan" />
              <span>ઓટોમેશન પેરામીટર્સ</span>
            </h3>

            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Auto Bumper Ingest:</span>
                <span className="font-bold text-text-primary">Active (2.5s Audio Logo)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Default Anchor Voice:</span>
                <span className="font-bold text-text-primary">Prarambh Male (ElevenLabs)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span>Output Resolution:</span>
                <span className="font-bold text-text-primary">1080 x 1920 (9:16 Vertical)</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Loop Mode:</span>
                <span className="font-bold text-accent-success">Infinite Continuous Feed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
