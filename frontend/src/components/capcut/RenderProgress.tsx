"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface RenderProgressProps {
  currentStage: string;
  progressPercent: number;
  message?: string;
  error?: string;
  onCancel?: () => void;
}

const STAGES = [
  { id: "1", name: "1. Analyzing Motion", minPct: 10 },
  { id: "2", name: "2. Detecting Beats", minPct: 25 },
  { id: "3", name: "3. Snapping Cuts to Beats", minPct: 40 },
  { id: "4", name: "4. Smart Framing", minPct: 55 },
  { id: "5", name: "5. Rendering Motion & Transitions", minPct: 75 },
  { id: "6", name: "6. Ducking Audio & Burning Subtitles", minPct: 90 },
];

export function RenderProgress({
  currentStage,
  progressPercent,
  message,
  error,
}: RenderProgressProps) {
  const [estTimeLeft, setEstTimeLeft] = useState<number>(35);

  useEffect(() => {
    // Dynamic countdown estimator
    if (progressPercent >= 100) {
      setEstTimeLeft(0);
      return;
    }
    const remaining = Math.max(2, Math.round(((100 - progressPercent) / 100) * 45));
    setEstTimeLeft(remaining);
  }, [progressPercent]);

  return (
    <div className="p-4 rounded-2xl border border-brand-pink/50 bg-bg-surface/95 backdrop-blur-md shadow-2xl space-y-4 glow-pink text-xs max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg brand-gradient-bg flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-text-primary">Building Your CapCut Reel...</h3>
            <p className="text-[10px] text-text-muted">100% Local AI Newsroom Pipeline</p>
          </div>
        </div>
        <span className="font-mono font-extrabold text-brand-pink text-sm">{progressPercent}%</span>
      </div>

      {/* Stages List */}
      <div className="space-y-1.5 py-1">
        {STAGES.map((s, idx) => {
          const isDone = progressPercent > s.minPct;
          const isCurrent = progressPercent >= s.minPct - 15 && progressPercent <= s.minPct + 5;
          const isPending = progressPercent < s.minPct - 15;

          return (
            <div
              key={s.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                isCurrent
                  ? "bg-brand-pink/10 border border-brand-pink/40 text-text-primary font-bold"
                  : isDone
                  ? "text-emerald-400 font-semibold"
                  : "text-text-muted/60"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-brand-pink animate-spin shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-text-muted/40 shrink-0" />
              )}
              <span className="text-[11px] truncate">{s.name}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-bg-elevated overflow-hidden p-0.5 border border-border">
          <div
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
            className="h-full rounded-full brand-gradient-bg transition-all duration-300 shadow-sm glow-pink"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted pt-0.5">
          <span>{message || currentStage || "Processing..."}</span>
          {estTimeLeft > 0 && <span>Est. ~{estTimeLeft}s remaining</span>}
        </div>
      </div>

      {/* Error display if any */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="line-clamp-2">{error}</span>
        </div>
      )}
    </div>
  );
}
