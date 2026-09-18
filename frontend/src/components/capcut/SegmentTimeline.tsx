"use client";

import React from "react";
import { CapCutSegment } from "@/lib/capcut/types";
import { 
  ZoomIn, 
  ZoomOut, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  Music, 
  Layers 
} from "lucide-react";

interface SegmentTimelineProps {
  segments: CapCutSegment[];
  totalDuration: number;
  beatTimes?: number[];
  downbeatTimes?: number[];
  selectedSegmentIndex: number | null;
  onSelectSegment: (index: number) => void;
  currentTime?: number;
  onSeek?: (time: number) => void;
}

const MOTION_ICONS: Record<string, React.ReactNode> = {
  zoom_in: <ZoomIn className="w-3 h-3" />,
  zoom_out: <ZoomOut className="w-3 h-3" />,
  pan_left: <ArrowLeft className="w-3 h-3" />,
  pan_right: <ArrowRight className="w-3 h-3" />,
  punch_flash: <Zap className="w-3 h-3 text-yellow-300" />,
  static: <Layers className="w-3 h-3" />,
};

const MOTION_COLORS = [
  "from-pink-500/80 to-rose-600/80 border-pink-400",
  "from-purple-500/80 to-indigo-600/80 border-purple-400",
  "from-cyan-500/80 to-blue-600/80 border-cyan-400",
  "from-emerald-500/80 to-teal-600/80 border-emerald-400",
  "from-amber-500/80 to-orange-600/80 border-amber-400",
];

export function SegmentTimeline({
  segments,
  totalDuration = 30.0,
  beatTimes = [],
  downbeatTimes = [],
  selectedSegmentIndex,
  onSelectSegment,
  currentTime = 0,
  onSeek,
}: SegmentTimelineProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border bg-bg-surface text-center">
        <p className="text-xs text-text-muted">No timeline segments generated yet. Upload clips and click "Generate".</p>
      </div>
    );
  }

  const effectiveTotal = Math.max(1, totalDuration || 30.0);

  return (
    <div className="space-y-2 p-3 rounded-xl border border-border bg-bg-surface/80 backdrop-blur-sm">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-text-primary flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink" />
            CapCut Beat-Synced Timeline
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-pink/20 text-brand-pink font-bold">
            {segments.length} Cuts
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Beats
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Downbeats
          </span>
          <span className="font-bold text-brand-yellow">{totalDuration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Timeline Ruler & Beat Grid Container */}
      <div className="relative pt-3 pb-1 select-none">
        {/* Beat Marker Lines */}
        <div className="absolute inset-x-0 top-0 h-full pointer-events-none z-10">
          {beatTimes.map((bt, i) => {
            const isDownbeat = downbeatTimes.includes(bt) || i % 4 === 0;
            const leftPct = (bt / effectiveTotal) * 100;
            if (leftPct > 100) return null;
            return (
              <div
                key={`beat-${i}`}
                style={{ left: `${leftPct}%` }}
                className={`absolute top-0 bottom-0 w-[1px] ${
                  isDownbeat ? "bg-yellow-400/70 z-10" : "bg-cyan-400/30"
                }`}
              >
                {isDownbeat && (
                  <span className="absolute -top-3 -translate-x-1/2 text-[8px] font-bold text-yellow-400">
                    ♩
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Segment Blocks Strip */}
        <div className="relative flex items-center h-16 rounded-xl overflow-hidden bg-bg-elevated border border-border">
          {segments.map((seg, idx) => {
            const widthPct = (seg.duration / effectiveTotal) * 100;
            const isSelected = selectedSegmentIndex === idx;
            const colorClass = MOTION_COLORS[idx % MOTION_COLORS.length];

            return (
              <div
                key={`seg-${idx}`}
                style={{ width: `${widthPct}%` }}
                onClick={() => onSelectSegment(idx)}
                className={`h-full relative cursor-pointer border-r border-black/40 flex flex-col justify-between p-1.5 transition-all bg-gradient-to-br ${colorClass} ${
                  isSelected ? "ring-2 ring-white shadow-lg z-20 scale-[1.02]" : "opacity-90 hover:opacity-100"
                }`}
              >
                {/* Top: Segment Index & Motion Icon */}
                <div className="flex items-center justify-between text-white font-bold text-[10px] drop-shadow">
                  <span className="flex items-center gap-1">
                    {MOTION_ICONS[seg.motion_type] || <Sparkles className="w-3 h-3" />}
                    <span className="capitalize text-[9px] truncate max-w-[50px]">
                      {seg.motion_type.replace("_", " ")}
                    </span>
                  </span>
                  <span className="text-[9px] opacity-80">#{idx + 1}</span>
                </div>

                {/* Bottom: Clip Duration & Transition Tag */}
                <div className="flex items-center justify-between text-white/90 text-[9px] font-semibold drop-shadow">
                  <span className="truncate max-w-[45px]">{seg.clip_name}</span>
                  <span className="px-1 rounded bg-black/40 text-[8px] font-mono">
                    {seg.duration.toFixed(1)}s
                  </span>
                </div>

                {/* Transition Pill Connector */}
                {seg.transition_out && seg.transition_out !== "none" && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 px-1 py-0.5 rounded-full bg-bg-surface border border-brand-pink text-[8px] font-extrabold text-brand-pink shadow-md pointer-events-none">
                    {seg.transition_out === "whip_left"
                      ? "💨"
                      : seg.transition_out === "flash"
                      ? "⚡"
                      : "🔀"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
