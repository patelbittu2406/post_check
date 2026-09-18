"use client";

import React, { useState } from "react";
import { CapCutSegment, MotionType, TransitionType } from "@/lib/capcut/types";
import { previewSegmentAPI } from "@/lib/capcut/api";
import { 
  Sliders, 
  Play, 
  ZoomIn, 
  ZoomOut, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Layers, 
  Scissors, 
  Trash2, 
  Check, 
  Loader2,
  Film
} from "lucide-react";
import { toast } from "sonner";

interface SegmentInspectorProps {
  segment: CapCutSegment | null;
  segmentIndex: number | null;
  onUpdateSegment: (index: number, updates: Partial<CapCutSegment>) => void;
  onDeleteSegment: (index: number) => void;
}

const MOTION_OPTIONS: { id: MotionType; label: string; icon: any }[] = [
  { id: "zoom_in", label: "Zoom In", icon: ZoomIn },
  { id: "zoom_out", label: "Zoom Out", icon: ZoomOut },
  { id: "pan_left", label: "Pan Left", icon: ArrowLeft },
  { id: "pan_right", label: "Pan Right", icon: ArrowRight },
  { id: "punch_flash", label: "Punch + Flash", icon: Zap },
  { id: "static", label: "Static", icon: Layers },
];

const TRANSITION_OPTIONS: { id: TransitionType; label: string; emoji: string }[] = [
  { id: "dissolve", label: "Cross-Dissolve", emoji: "🔀" },
  { id: "whip_left", label: "Whip Pan Left", emoji: "💨" },
  { id: "whip_right", label: "Whip Pan Right", emoji: "💨" },
  { id: "flash", label: "White Flash", emoji: "⚡" },
  { id: "wipe_left", label: "Wipe Left", emoji: "◀️" },
  { id: "hard_cut", label: "Hard Cut", emoji: "✂️" },
];

export function SegmentInspector({
  segment,
  segmentIndex,
  onUpdateSegment,
  onDeleteSegment,
}: SegmentInspectorProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  if (!segment || segmentIndex === null) {
    return (
      <div className="p-4 rounded-xl border border-border bg-bg-surface text-center text-xs text-text-muted">
        <Sliders className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
        Click any segment block on the timeline to edit its motion, framing, and transitions.
      </div>
    );
  }

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const res = await previewSegmentAPI({
        clip_filename: segment.clip_name,
        start: segment.source_start,
        end: segment.source_end,
        motion_type: segment.motion_type,
      });
      setPreviewVideoUrl(res.preview_url);
      toast.success("Preview generated!");
    } catch (err: any) {
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <div className="space-y-3.5 p-3.5 rounded-xl border border-border bg-bg-surface text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-brand-pink text-white font-extrabold text-[10px] flex items-center justify-center">
            #{segmentIndex + 1}
          </span>
          <div>
            <h4 className="font-bold text-text-primary text-xs">Segment Properties</h4>
            <p className="text-[10px] text-text-muted truncate max-w-[130px]">{segment.clip_name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDeleteSegment(segmentIndex)}
          className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete Segment"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Motion Type Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
          <Zap className="w-3 h-3 text-brand-pink" />
          Motion & Zoom Style
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {MOTION_OPTIONS.map((m) => {
            const Icon = m.icon;
            const isSelected = segment.motion_type === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onUpdateSegment(segmentIndex, { motion_type: m.id })}
                className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                  isSelected
                    ? "border-brand-pink bg-brand-pink/10 text-brand-pink font-bold shadow-sm"
                    : "border-border bg-bg-elevated hover:border-brand-pink/40 text-text-primary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px]">{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Transition Out Selector */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
          <Scissors className="w-3 h-3 text-brand-cyan" />
          Transition to Next Cut
        </label>
        <select
          value={segment.transition_out || "dissolve"}
          onChange={(e) => onUpdateSegment(segmentIndex, { transition_out: e.target.value as TransitionType })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
        >
          {TRANSITION_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.emoji} {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source Timing & Duration */}
      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-bg-elevated border border-border/60">
        <div>
          <span className="text-[10px] text-text-muted block">Source Range</span>
          <span className="text-xs font-mono font-bold text-text-primary">
            {segment.source_start.toFixed(1)}s → {segment.source_end.toFixed(1)}s
          </span>
        </div>
        <div>
          <span className="text-[10px] text-text-muted block">Cut Duration</span>
          <span className="text-xs font-mono font-bold text-brand-yellow">
            {segment.duration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Smart Framing Badge */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-bg-elevated border border-border/60">
        <span className="text-[11px] text-text-muted">Smart 9:16 Framing</span>
        <span className="px-1.5 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan font-bold text-[10px] uppercase">
          {segment.framing_info?.framing_type || "Rule-of-Thirds"}
        </span>
      </div>

      {/* Instant Segment Preview */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={isPreviewing}
          onClick={handlePreview}
          className="w-full py-1.5 px-3 rounded-lg bg-bg-elevated border border-border hover:border-brand-pink text-text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          {isPreviewing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-pink" />
              <span>Rendering 3s Preview...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
              <span>Preview Segment</span>
            </>
          )}
        </button>

        {previewVideoUrl && (
          <div className="rounded-lg overflow-hidden border border-brand-pink/50 aspect-[9/16] max-h-[160px] mx-auto bg-black">
            <video
              src={previewVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );
}
