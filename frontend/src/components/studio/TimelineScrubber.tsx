"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Layers, 
  Type, 
  Music, 
  Mic2,
  Sparkles
} from "lucide-react";

export function TimelineScrubber() {
  const { draft } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = draft.targetDuration || 30;

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(duration, prev + 0.1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (draft.voiceoverAudioUrl) {
      // If voiceover audio exists, play audio element
      const audioEl = document.getElementById("studio-voiceover-audio") as HTMLAudioElement;
      if (audioEl) {
        if (isPlaying) {
          audioEl.pause();
        } else {
          audioEl.currentTime = currentTime;
          audioEl.play().catch(() => {});
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (draft.voiceoverAudioUrl) {
      const audioEl = document.getElementById("studio-voiceover-audio") as HTMLAudioElement;
      if (audioEl) audioEl.currentTime = newTime;
    }
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  return (
    <div className="w-full bg-bg-surface border-t border-border p-3 space-y-2 select-none shrink-0">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full brand-gradient-bg text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-transform glow-pink"
            title={isPlaying ? "Pause" : "Play Timeline"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTime(0);
              const audioEl = document.getElementById("studio-voiceover-audio") as HTMLAudioElement;
              if (audioEl) audioEl.currentTime = 0;
            }}
            className="text-text-muted hover:text-text-primary p-1 transition-colors"
            title="Reset Playhead"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="font-mono text-xs text-text-primary font-bold">
            <span className="text-brand-pink">{formatTime(currentTime)}</span>
            <span className="text-text-muted mx-1">/</span>
            <span className="text-text-muted">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-text-muted font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-pink" /> Headline
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-cyan" /> Subtitles
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-yellow" /> Voice
          </span>
        </div>
      </div>

      {/* Multi-Track Timeline Canvas */}
      <div 
        onClick={handleSeek}
        className="relative h-20 bg-bg-elevated/80 rounded-xl border border-border overflow-hidden cursor-pointer flex flex-col justify-between p-1.5 space-y-1"
      >
        {/* Playhead Red Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-brand-pink z-30 pointer-events-none transition-all shadow-[0_0_8px_#E91E63]"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          <div className="w-2.5 h-2 -ml-1 bg-brand-pink rounded-b-sm shadow-md" />
        </div>

        {/* Track 1: Dual-Stripe Headline Track */}
        <div className="relative h-4.5 rounded-lg bg-bg-surface/80 border border-border flex items-center px-2 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full bg-brand-pink/20 rounded border-l-2 border-brand-pink flex items-center px-2 text-[9px] font-bold text-brand-pink truncate">
            <Layers className="w-2.5 h-2.5 mr-1 shrink-0" />
            <span className="truncate">{draft.line1Headline || "Dual-Stripe Headlines"}</span>
          </div>
        </div>

        {/* Track 2: Subtitles Track */}
        <div className="relative h-4.5 rounded-lg bg-bg-surface/80 border border-border flex items-center px-2 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full bg-brand-cyan/20 rounded border-l-2 border-brand-cyan flex items-center px-2 text-[9px] font-bold text-brand-cyan truncate">
            <Type className="w-2.5 h-2.5 mr-1 shrink-0" />
            <span className="truncate">ASS Subtitles (Dynamic 2-3 Word Chunks)</span>
          </div>
        </div>

        {/* Track 3: Voiceover Audio Waveform Simulation */}
        <div className="relative h-6 rounded-lg bg-bg-surface/80 border border-border flex items-center px-2 overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full bg-brand-yellow/15 rounded border-l-2 border-brand-yellow flex items-center justify-between px-2 text-[9px] font-bold text-brand-yellow">
            <span className="flex items-center gap-1">
              <Mic2 className="w-2.5 h-2.5" />
              <span>Voiceover ({draft.selectedVoiceMode})</span>
            </span>

            {/* Visual Waveform Bars */}
            <div className="flex items-center gap-0.5 h-3 opacity-60">
              {[40, 70, 90, 60, 80, 100, 50, 75, 95, 60, 85, 45, 90, 65, 80, 55, 95, 70, 85, 50, 60, 80].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-brand-yellow rounded-full transition-all"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
