"use client";

import React, { useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shield, 
  Share2, 
  Sparkles, 
  Loader2, 
  Sliders, 
  Film,
  Instagram,
  CheckCircle2,
  Maximize2
} from "lucide-react";
import { toast } from "sonner";

interface CanvasStageProps {
  onOpenPublishModal: () => void;
  onRenderTimeline: () => void;
  isRendering: boolean;
  renderProgress: number;
}

export function CanvasStage({
  onOpenPublishModal,
  onRenderTimeline,
  isRendering,
  renderProgress,
}: CanvasStageProps) {
  const { 
    draft, 
    updateDraft, 
    profile,
    timelineCurrentTime, 
    timelineIsPlaying, 
    setTimelineIsPlaying,
    setTimelineCurrentTime 
  } = useStore();

  const [zoomLevel, setZoomLevel] = React.useState<"fit" | "75" | "100">("fit");
  const [showSafeZone, setShowSafeZone] = React.useState(true);
  const [activeClipIndex, setActiveClipIndex] = React.useState<number>(0);
  const [currentSubtitleText, setCurrentSubtitleText] = React.useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Compute which clip is active at `timelineCurrentTime`
  useEffect(() => {
    let accumulatedTime = 0;
    let foundIndex = 0;

    for (let i = 0; i < draft.timelineClips.length; i++) {
      const clip = draft.timelineClips[i];
      const clipDur = clip.duration || (clip.trimEnd - clip.trimStart);
      if (timelineCurrentTime >= accumulatedTime && timelineCurrentTime <= accumulatedTime + clipDur) {
        foundIndex = i;
        break;
      }
      accumulatedTime += clipDur;
      if (i === draft.timelineClips.length - 1) {
        foundIndex = i;
      }
    }

    setActiveClipIndex(foundIndex);

    // Compute active subtitle at `timelineCurrentTime`
    const activeSub = draft.timelineSubtitles.find(
      (s) => timelineCurrentTime >= s.start && timelineCurrentTime <= s.end
    );
    setCurrentSubtitleText(activeSub ? activeSub.text : "");
  }, [timelineCurrentTime, draft.timelineClips, draft.timelineSubtitles]);

  // Video play / pause sync
  useEffect(() => {
    if (videoRef.current) {
      if (timelineIsPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [timelineIsPlaying]);

  const activeClip = draft.timelineClips[activeClipIndex] || draft.timelineClips[0];

  // Scale styles based on zoom level
  const getScaleStyle = () => {
    switch (zoomLevel) {
      case "75":
        return "scale-[0.75]";
      case "100":
        return "scale-100";
      default: // fit
        return "scale-[0.88] xl:scale-[0.92] 2xl:scale-100";
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F8F9FA]/40 overflow-hidden relative">
      {/* Top Floating Controls Toolbar */}
      <div className="h-12 border-b border-[#E5E7EB] bg-white px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel("fit")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                zoomLevel === "fit" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Fit
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("75")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                zoomLevel === "75" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              75%
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel("100")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                zoomLevel === "100" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              100%
            </button>
          </div>

          {/* Safe Zones Toggle */}
          <button
            type="button"
            onClick={() => setShowSafeZone(!showSafeZone)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              showSafeZone
                ? "bg-amber-50 text-amber-800 border-amber-200/80"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Safe Zones {showSafeZone ? "[ON]" : "[OFF]"}</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Render Timeline Reel */}
          <button
            type="button"
            onClick={onRenderTimeline}
            disabled={isRendering}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Rendering {renderProgress}%</span>
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5" />
                <span>Export 1080x1920 Reel</span>
              </>
            )}
          </button>

          {/* Publish to Instagram */}
          <button
            type="button"
            onClick={onOpenPublishModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>Publish</span>
          </button>
        </div>
      </div>

      {/* Center 9:16 Canvas Stage Viewport */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Phone Frame Container */}
        <div
          className={`w-[320px] sm:w-[340px] aspect-[9/16] bg-black rounded-[36px] p-2.5 shadow-2xl border-[6px] border-slate-800 relative transition-transform duration-200 origin-center flex flex-col justify-center overflow-hidden ${getScaleStyle()}`}
        >
          {/* Top Speaker / Camera Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
            <div className="w-8 h-1.5 rounded-full bg-slate-800" />
          </div>

          {/* Screen Display */}
          <div className="w-full h-full bg-slate-950 rounded-[28px] relative overflow-hidden flex items-center justify-center">
            {/* Background Video / Rendered Reel */}
            {draft.renderedVideoUrl ? (
              <video
                src={draft.renderedVideoUrl}
                className="w-full h-full object-cover"
                controls={false}
                autoPlay={timelineIsPlaying}
                loop
                muted
              />
            ) : activeClip ? (
              <video
                ref={videoRef}
                src={activeClip.url}
                className="w-full h-full object-cover"
                controls={false}
                loop
                muted
                preload="auto"
              />
            ) : (
              <div className="text-center p-4 text-slate-500 text-xs">
                <Film className="w-8 h-8 mx-auto mb-2 opacity-30 text-white" />
                <p>No clip selected</p>
              </div>
            )}

            {/* Top Category Badge */}
            <div className="absolute top-12 left-4 z-20">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-blue-600/90 text-white shadow-xs tracking-wider uppercase backdrop-blur-xs">
                {draft.categoryCode || "SURAT NEWS"}
              </span>
            </div>

            {/* Direct Canvas Overlaid Headlines (Line 1 Red, Line 2 Blue) */}
            <div className="absolute top-[28%] left-0 right-0 px-3 z-20 flex flex-col items-center gap-1.5 pointer-events-auto">
              {/* Line 1: Red Stripe Badge */}
              <div
                className="px-3.5 py-1.5 rounded-lg text-white font-black text-xs sm:text-sm text-center shadow-lg tracking-wide uppercase transition-all"
                style={{ backgroundColor: profile?.line1_bg || "#FF0033" }}
              >
                {draft.line1Headline || "સુરત ન્યૂઝ લાઈવ"}
              </div>

              {/* Line 2: Blue Stripe Badge */}
              <div
                className="px-4 py-1.5 rounded-lg text-white font-black text-xs sm:text-sm text-center shadow-lg tracking-wide uppercase transition-all"
                style={{ backgroundColor: profile?.line2_bg || "#0080FF" }}
              >
                {draft.line2Headline || "બ્રેકિંગ અપડેટ્સ ⚡"}
              </div>
            </div>

            {/* Track 1 Live Subtitles Overlay */}
            {currentSubtitleText && (
              <div className="absolute bottom-[26%] left-0 right-0 px-4 text-center z-20 pointer-events-none">
                <span className="inline-block px-3 py-1.5 rounded-lg bg-black/80 text-yellow-300 font-bold text-xs sm:text-sm shadow-md font-sans">
                  {currentSubtitleText}
                </span>
              </div>
            )}

            {/* Instagram Right Sidebar Action Mockups */}
            <div className="absolute right-2 bottom-20 z-20 flex flex-col items-center gap-3.5 text-white/90 text-[10px] pointer-events-none">
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  ♥
                </div>
                <span>4.8k</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  💬
                </div>
                <span>320</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  ↗
                </div>
                <span>Share</span>
              </div>
            </div>

            {/* Bottom Location & Caption Preview Mockup */}
            <div className="absolute bottom-6 left-3 right-12 z-20 text-white pointer-events-none">
              <p className="text-[11px] font-bold drop-shadow-md">
                @{profile?.channel_handle || "surat.news"}
              </p>
              <p className="text-[10px] text-white/80 truncate drop-shadow-md">
                {draft.area || "Surat"} • {draft.caption?.slice(0, 35) || "Viral News Reel"}...
              </p>
            </div>

            {/* Instagram Safe Zone Guidelines (Dotted Overlay) */}
            {showSafeZone && (
              <div className="absolute inset-0 pointer-events-none z-30 border-2 border-dashed border-amber-400/60 rounded-[28px]">
                {/* Top Notch Danger Zone */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-red-500/10 border-b border-red-500/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-300 tracking-wider">
                    HEADER & PROFILE SAFE MARGIN (220px)
                  </span>
                </div>

                {/* Bottom UI Danger Zone */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-red-500/10 border-t border-red-500/30 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-300 tracking-wider">
                    CAPTION & SOUND SAFE MARGIN (420px)
                  </span>
                </div>

                {/* Right Action Icons Zone */}
                <div className="absolute right-0 top-16 bottom-24 w-12 bg-amber-500/10 border-l border-amber-500/30 flex items-center justify-center [writing-mode:vertical-lr]">
                  <span className="text-[8px] font-bold text-amber-300">
                    ACTIONS SAFE (120px)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
