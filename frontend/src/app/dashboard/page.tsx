"use client";

import React, { useState } from "react";
import { useStore } from "@/store/useStore";
import { MediaAssetsBin } from "@/components/studio/MediaAssetsBin";
import { CanvasStage } from "@/components/studio/CanvasStage";
import { TimelineEditor } from "@/components/studio/TimelineEditor";
import { 
  renderTimelineVideoAPI, 
  publishInstagramAPI, 
  TimelineRenderPayload 
} from "@/lib/api";
import { toast } from "sonner";
import { 
  Send, 
  X, 
  Loader2, 
  Instagram, 
  Settings2,
  CheckCircle2
} from "lucide-react";

export default function DashboardPage() {
  const { 
    draft, 
    updateDraft, 
    profile, 
    isRenderingVideo, 
    setIsRenderingVideo,
    renderProgress,
    setRenderStatus,
    isPublishing,
    setIsPublishing,
    addTimelineClip
  } = useStore();

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Add clip from Media Assets Bin to Track 2
  const handleAddClipToTimeline = (clipData: {
    name: string;
    filename: string;
    url: string;
    duration: number;
  }) => {
    addTimelineClip({
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: clipData.name,
      filename: clipData.filename,
      url: clipData.url,
      sourceDuration: clipData.duration,
      trimStart: 0,
      trimEnd: Math.min(clipData.duration, 5.0),
      duration: Math.min(clipData.duration, 5.0),
      transitionOut: "dissolve",
      transitionDuration: 0.4,
    });
  };

  // Render Full 1080x1920 Reel from Timeline
  const handleRenderTimeline = async () => {
    if (draft.timelineClips.length === 0) {
      toast.error("કૃપા કરીને પહેલા Track 2 માં વિડિયો ક્લિપ્સ ઉમેરો");
      return;
    }

    setIsRenderingVideo(true);
    setRenderStatus(15, "FFmpeg timeline filtergraph બનાવી રહ્યા છીએ...");
    const toastId = toast.loading("🎬 1080x1920 Reel રેન્ડર થઈ રહી છે (Transitions & Subtitles)...");

    try {
      const payload: TimelineRenderPayload = {
        clips: draft.timelineClips.map((c) => ({
          id: c.id,
          filename: c.filename,
          name: c.name,
          trim_start: c.trimStart,
          trim_end: c.trimEnd,
          duration: c.duration,
          transition_out: c.transitionOut,
          transition_duration: c.transitionDuration,
        })),
        subtitles: draft.timelineSubtitles.map((s) => ({
          id: s.id,
          text: s.text,
          start: s.start,
          end: s.end,
          color: s.color,
        })),
        voiceover_filename: draft.voiceoverFilename,
        bg_music_filename: draft.selectedBgm,
        bgm_duck_volume: draft.bgmDuckVolume,
        line1_text: draft.line1Headline,
        line2_text: draft.line2Headline,
        line1_bg: profile.line1_bg || "#FF0033",
        line1_text_color: profile.line1_text || "#FFFFFF",
        line2_bg: profile.line2_bg || "#0080FF",
        line2_text_color: profile.line2_text || "#FFFFFF",
        category_code: draft.categoryCode,
        area: draft.area,
      };

      setRenderStatus(50, "FFmpeg xfade transitions અને ASS subtitles બર્ન થઈ રહ્યા છે...");
      const res = await renderTimelineVideoAPI(payload);

      updateDraft({
        renderedVideoUrl: res.video_url,
        renderedVideoFilename: res.video_filename,
      });

      setRenderStatus(100, "રેન્ડર પૂર્ણ!");
      toast.success("🎉 Reel સફળતાપૂર્વક 1080x1920 ફોર્મેટમાં તૈયાર થઈ ગઈ!", { id: toastId });
    } catch (err: any) {
      toast.error(`રેન્ડરિંગ ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsRenderingVideo(false);
    }
  };

  // Publish to Instagram
  const handlePublishInstagram = async () => {
    if (!draft.renderedVideoFilename) {
      toast.error("પહેલા Reel રેન્ડર કરો");
      return;
    }
    setIsPublishing(true);
    const toastId = toast.loading("🚀 Instagram પર રીલ અપલોડ થઈ રહી છે...");
    try {
      const res = await publishInstagramAPI({
        video_filename: draft.renderedVideoFilename,
        caption: draft.caption || `${draft.line1Headline}\n\n${draft.line2Headline}`,
        dry_run: !profile.instagram_business_account_id,
      });
      toast.success(
        res.status === "simulated"
          ? "✅ ટેસ્ટ મોડમાં સફળતાપૂર્વક પબ્લિશ થયું!"
          : "🎉 Instagram Reel લાઇવ થઈ ગઈ!",
        { id: toastId }
      );
      setShowPublishModal(false);
    } catch (err: any) {
      toast.error(`Instagram ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 h-screen flex flex-col overflow-hidden bg-[#F8F9FA] select-none">
      {/* Main Workspace (Split into Zone B Media Bin + Center Stage Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Zone 1: Media Assets Bin (Beside 72px left sidebar) */}
        <MediaAssetsBin onAddClipToTimeline={handleAddClipToTimeline} />

        {/* Zone 2: Center Stage (9:16 Canvas View) */}
        <CanvasStage
          onOpenPublishModal={() => setShowPublishModal(true)}
          onRenderTimeline={handleRenderTimeline}
          isRendering={isRenderingVideo}
          renderProgress={renderProgress}
        />
      </div>

      {/* Zone 3: Bottom Workspace (Interactive Multi-Track Timeline Editor) */}
      <TimelineEditor />

      {/* Publish to Instagram Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-600" />
                Publish to Instagram Reel
              </h3>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">ઇન્સ્ટાગ્રામ કેપ્શન & હેશટેગ્સ:</label>
                <textarea
                  value={draft.caption}
                  onChange={(e) => updateDraft({ caption: e.target.value })}
                  rows={5}
                  className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-sans focus:outline-none focus:border-indigo-500"
                  placeholder="અહીં કેપ્શન લખો..."
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                Connected Account:{" "}
                <strong className="text-slate-900 font-mono">
                  {profile.instagram_business_account_id ? "Active Connected" : "Local Test Mode"}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishInstagram}
                disabled={isPublishing}
                className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
              >
                {isPublishing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
