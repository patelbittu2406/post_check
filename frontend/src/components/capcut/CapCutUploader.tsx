"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, Film, X, Music, Zap, Sliders, Clock, Play, Sparkles, Loader2 } from "lucide-react";
import { uploadMediaAPI } from "@/lib/api";
import { toast } from "sonner";

interface CapCutUploaderProps {
  uploadedClips: string[];
  onClipsChange: (clips: string[]) => void;
  syncToBeats: boolean;
  onSyncToBeatsChange: (val: boolean) => void;
  motionIntensity: "subtle" | "balanced" | "fast_cuts";
  onMotionIntensityChange: (val: "subtle" | "balanced" | "fast_cuts") => void;
  transitionStyle: "auto" | "smooth" | "punchy";
  onTransitionStyleChange: (val: "auto" | "smooth" | "punchy") => void;
  targetDuration: number;
  onTargetDurationChange: (dur: number) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function CapCutUploader({
  uploadedClips,
  onClipsChange,
  syncToBeats,
  onSyncToBeatsChange,
  motionIntensity,
  onMotionIntensityChange,
  transitionStyle,
  onTransitionStyleChange,
  targetDuration,
  onTargetDurationChange,
  onGenerate,
  isGenerating,
}: CapCutUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processFiles(Array.from(e.target.files));
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    await processFiles(Array.from(e.dataTransfer.files));
  };

  const processFiles = async (files: File[]) => {
    const videoFiles = files.filter((f) => f.type.startsWith("video/") || f.name.match(/\.(mp4|mov|mkv|webm|avi)$/i));
    if (videoFiles.length === 0) {
      toast.error("Please upload MP4, MOV, MKV or WEBM video files");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${videoFiles.length} video clips...`);
    const newClipFilenames: string[] = [];

    try {
      for (const file of videoFiles) {
        const res = await uploadMediaAPI(file, "broll");
        if (res.filename) {
          newClipFilenames.push(res.filename);
        }
      }
      onClipsChange([...uploadedClips, ...newClipFilenames].slice(0, 8));
      toast.success(`Successfully uploaded ${newClipFilenames.length} clips!`, { id: toastId });
    } catch (err: any) {
      toast.error(`Failed to upload clips: ${err.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeClip = (indexToRemove: number) => {
    onClipsChange(uploadedClips.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-3.5 text-xs">
      {/* Upload Zone */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-text-muted flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-brand-pink" />
            Upload Raw Clips (2–5 recommended)
          </label>
          <span className="text-[10px] text-brand-pink font-bold">
            {uploadedClips.length} clip{uploadedClips.length !== 1 ? "s" : ""} selected
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,video/mp4,video/quicktime,video/x-matroska,video/webm"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-4 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-brand-pink bg-brand-pink/10 shadow-lg glow-pink scale-[1.01]"
              : "border-border hover:border-brand-pink/60 bg-bg-surface hover:bg-bg-elevated"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 py-2">
              <Loader2 className="w-6 h-6 text-brand-pink animate-spin" />
              <span className="text-xs font-semibold text-text-primary">Uploading and indexing clips...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="w-8 h-8 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink mb-1">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-text-primary">
                Drag & Drop 2–5 Raw Clips or <span className="text-brand-pink underline">Browse</span>
              </span>
              <span className="text-[10px] text-text-muted">
                100% Local Optical Flow · Beat Detection · Ken Burns Zooms
              </span>
            </div>
          )}
        </div>

        {/* Uploaded Thumbnails / Chips */}
        {uploadedClips.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {uploadedClips.map((filename, idx) => (
              <div
                key={`${filename}-${idx}`}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-bg-surface border border-border/80 text-[11px] group"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-brand-pink/20 text-brand-pink font-bold text-[9px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="truncate max-w-[110px] font-medium text-text-primary">{filename}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeClip(idx);
                  }}
                  className="text-text-muted hover:text-red-400 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beat Sync Toggle */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface border border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-brand-yellow/10 flex items-center justify-center text-brand-yellow">
            <Music className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary">Sync Cuts to Music Beats</div>
            <div className="text-[10px] text-text-muted">Aligns cuts to Librosa downbeats & voice pauses</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={syncToBeats}
            onChange={(e) => onSyncToBeatsChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-pink" />
        </label>
      </div>

      {/* Motion Intensity */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
          <Zap className="w-3 h-3 text-brand-cyan" />
          Motion Intensity
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
          {(["subtle", "balanced", "fast_cuts"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onMotionIntensityChange(m)}
              className={`py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                motionIntensity === m
                  ? "brand-gradient-bg text-white shadow-sm glow-pink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {m.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Transition Style */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
          <Sliders className="w-3 h-3 text-brand-purple" />
          Transition Style
        </label>
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
          {(["auto", "smooth", "punchy"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTransitionStyleChange(t)}
              className={`py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                transitionStyle === t
                  ? "brand-gradient-bg text-white shadow-sm glow-pink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t === "auto" ? "Auto Mix" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Target Duration */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-yellow" />
            Target Duration
          </label>
          <span className="text-[11px] font-bold text-brand-yellow">{targetDuration}s</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-bg-surface border border-border">
          {[15, 30, 45, 60].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onTargetDurationChange(d)}
              className={`py-1 rounded-lg text-xs font-bold transition-all ${
                targetDuration === d
                  ? "brand-gradient-bg text-white shadow-sm glow-pink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Generate CTA Button */}
      <button
        type="button"
        disabled={isGenerating}
        onClick={onGenerate}
        className="w-full py-3 px-4 rounded-xl brand-gradient-bg text-white font-extrabold text-sm shadow-lg glow-pink flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Compiling CapCut Reel...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>🚀 Generate CapCut Reel</span>
          </>
        )}
      </button>
    </div>
  );
}
