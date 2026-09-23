"use client";

import React, { useState, useRef, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { TimelineClipData, TimelineSubtitleData, transcribeTimelineAudioAPI, uploadMediaAPI } from "@/lib/api";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Scissors, 
  ZoomIn, 
  ZoomOut, 
  Plus, 
  Trash2, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Film, 
  Type, 
  Mic, 
  Check, 
  X,
  Edit2,
  Layers,
  ArrowRight,
  GripVertical
} from "lucide-react";
import { toast } from "sonner";

export function TimelineEditor() {
  const { 
    draft, 
    updateDraft,
    timelineCurrentTime, 
    timelineIsPlaying, 
    timelineZoom, 
    selectedTimelineClipId,
    selectedTimelineSubId,
    setTimelineCurrentTime, 
    setTimelineIsPlaying, 
    setTimelineZoom,
    setSelectedTimelineClipId,
    setSelectedTimelineSubId,
    updateTimelineClip,
    adjustTimelineClipDuration,
    removeTimelineClip,
    splitTimelineClip,
    reorderTimelineClips,
    addTimelineClip,
    setTimelineSubtitles,
    updateTimelineSubtitle,
    removeTimelineSubtitle,
    addTimelineSubtitle
  } = useStore();

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [editingSub, setEditingSub] = useState<TimelineSubtitleData | null>(null);
  const [editingSubText, setEditingSubText] = useState("");
  const [isDragOverTrack2, setIsDragOverTrack2] = useState(false);
  const [isDragOverTrack3, setIsDragOverTrack3] = useState(false);

  const timelineTrackRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Compute total timeline duration
  const totalClipsDuration = draft.timelineClips.reduce(
    (acc, c) => acc + (c.duration || c.trimEnd - c.trimStart),
    0
  );
  const totalDuration = Math.max(10, Math.ceil(totalClipsDuration));

  // Pixels per second based on zoom factor
  const pps = 48 * timelineZoom;

  // Spacebar toggle playback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setTimelineIsPlaying(!timelineIsPlaying);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timelineIsPlaying, setTimelineIsPlaying]);

  // Audio Playback Synchronization
  useEffect(() => {
    if (!audioRef.current || !draft.voiceoverAudioUrl) return;

    if (timelineIsPlaying) {
      audioRef.current.currentTime = Math.min(timelineCurrentTime, audioRef.current.duration || 999);
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [timelineIsPlaying, draft.voiceoverAudioUrl]);

  // Sync audio seek when scrubbing while paused
  useEffect(() => {
    if (!audioRef.current || timelineIsPlaying || !draft.voiceoverAudioUrl) return;
    if (Math.abs(audioRef.current.currentTime - timelineCurrentTime) > 0.3) {
      audioRef.current.currentTime = timelineCurrentTime;
    }
  }, [timelineCurrentTime, timelineIsPlaying, draft.voiceoverAudioUrl]);

  // Handle Playhead auto-tick when playing
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (timelineIsPlaying) {
        const nextTime = timelineCurrentTime + delta;
        if (nextTime >= totalDuration) {
          setTimelineCurrentTime(0);
          setTimelineIsPlaying(false);
        } else {
          setTimelineCurrentTime(nextTime);
        }
      }
      if (timelineIsPlaying) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (timelineIsPlaying) {
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [timelineIsPlaying, timelineCurrentTime, totalDuration, setTimelineCurrentTime, setTimelineIsPlaying]);

  // Format seconds to mm:ss.s
  const formatTimecode = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${cs}`;
  };

  // Click on ruler to seek playhead
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineTrackRef.current) return;
    const rect = timelineTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + timelineTrackRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / pps));
    setTimelineCurrentTime(newTime);
  };

  // Split selected clip at playhead
  const handleSplitAtPlayhead = () => {
    if (!selectedTimelineClipId) {
      toast.info("કૃપા કરીને સ્પ્લિટ કરવા માટે પહેલા કોઈ ક્લિપ પસંદ કરો");
      return;
    }

    let accum = 0;
    for (const c of draft.timelineClips) {
      const dur = c.duration || (c.trimEnd - c.trimStart);
      if (c.id === selectedTimelineClipId) {
        const offsetInClip = timelineCurrentTime - accum;
        if (offsetInClip <= 0.4 || offsetInClip >= dur - 0.4) {
          toast.warning("ક્લિપના છેડે સ્પ્લિટ કરી શકાતું નથી. પ્લેહેડને ક્લિપની વચ્ચે ખસેડો.");
          return;
        }
        splitTimelineClip(c.id, offsetInClip);
        toast.success("✂️ ક્લિપ સફળતાપૂર્વક 2 ભાગમાં વહેંચાઈ ગઈ!");
        return;
      }
      accum += dur;
    }
  };

  // Auto-transcribe using Faster-Whisper
  const handleAutoTranscribe = async () => {
    setIsTranscribing(true);
    const toastId = toast.loading("✨ Faster-Whisper વૉઇસઓવરમાંથી સબટાઈટલ બનાવી રહ્યું છે...");
    try {
      const res = await transcribeTimelineAudioAPI({
        audio_filename: draft.voiceoverFilename,
        script_text: draft.voiceoverScript,
        chunk_size: 3,
      });

      if (res && res.subtitles && res.subtitles.length > 0) {
        setTimelineSubtitles(res.subtitles);
        toast.success(`🎉 ${res.subtitles.length} સબટાઈટલ બ્લોક્સ Track 1 માં લોડ થયા!`, { id: toastId });
      } else {
        toast.info("સબટાઈટલ મળ્યા નથી. કૃપા કરીને વૉઇસઓવર ફરી જનરેટ કરો.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`ટ્રાન્સક્રિપ્શન ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle Audio file upload from Track 3
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const toastId = toast.loading(`Uploading audio '${file.name}'...`);
      try {
        const res = await uploadMediaAPI(file, "audio");
        updateDraft({
          voiceoverFilename: res.filename,
          voiceoverAudioUrl: res.url,
        });
        toast.success(`🎙️ Audio '${file.name}' Track 3 માં ઉમેરાઈ ગયું!`, { id: toastId });

        // Auto transcribe to Track 1
        try {
          const transRes = await transcribeTimelineAudioAPI({
            audio_filename: res.filename,
            chunk_size: 3,
          });
          if (transRes?.subtitles?.length) {
            setTimelineSubtitles(transRes.subtitles);
          }
        } catch (tErr) {}
      } catch (err: any) {
        toast.error(`Upload error: ${err.message}`, { id: toastId });
      }
    }
  };

  // Open subtitle editor modal
  const handleEditSubtitle = (sub: TimelineSubtitleData) => {
    setEditingSub(sub);
    setEditingSubText(sub.text);
    setSelectedTimelineSubId(sub.id);
  };

  // Save subtitle text
  const handleSaveSubtitle = () => {
    if (editingSub) {
      updateTimelineSubtitle(editingSub.id, { text: editingSubText });
      toast.success("સબટાઈટલ અપડેટ થયું!");
      setEditingSub(null);
    }
  };

  // Selected clip helper
  const selectedClip = draft.timelineClips.find((c) => c.id === selectedTimelineClipId);

  return (
    <div className="h-[295px] min-h-[295px] bg-white border-t border-[#E5E7EB] flex flex-col shrink-0 select-none shadow-lg z-20">
      {/* Hidden Audio Player for Real Playback */}
      <audio ref={audioRef} src={draft.voiceoverAudioUrl || undefined} preload="auto" />
      {/* Hidden File Input for Track 3 Audio Upload */}
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleAudioFileChange}
        accept="audio/*"
        className="hidden"
      />

      {/* 1. Header Toolbar / Transport Controls */}
      <div className="h-12 border-b border-[#E5E7EB] bg-[#F8F9FA]/80 px-4 flex items-center justify-between shrink-0 overflow-x-auto">
        {/* Playhead Timecode & Playback Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Timecode Badge */}
          <div className="px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] font-mono font-bold text-xs text-slate-800 shadow-2xs flex items-center gap-1.5">
            <span className="text-indigo-600">{formatTimecode(timelineCurrentTime)}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">{formatTimecode(totalDuration)}</span>
          </div>

          {/* Transport buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimelineCurrentTime(0)}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-[#E5E7EB] transition-colors"
              title="Return to start (00:00)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTimelineIsPlaying(!timelineIsPlaying)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              title="Spacebar to Play/Pause"
            >
              {timelineIsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{timelineIsPlaying ? "Pause" : "Play"}</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Split Tool */}
          <button
            type="button"
            onClick={handleSplitAtPlayhead}
            className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-[#E5E7EB] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
            title="Split selected clip at current playhead position"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-600" />
            <span>Split (✂️)</span>
          </button>

          {/* Selected Clip Length Controller (+ / -) */}
          {selectedClip && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50/80 rounded-lg border border-indigo-200 text-xs shadow-2xs">
              <span className="font-bold text-indigo-900 truncate max-w-[100px]" title={selectedClip.name}>
                {selectedClip.name}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Length:</span>
              <button
                type="button"
                onClick={() => adjustTimelineClipDuration(selectedClip.id, -1.0)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 active:scale-95"
                title="Reduce 1 second"
              >
                -1s
              </button>
              <button
                type="button"
                onClick={() => adjustTimelineClipDuration(selectedClip.id, -0.5)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 active:scale-95"
                title="Reduce 0.5 second"
              >
                -0.5s
              </button>
              <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-[11px]">
                {(selectedClip.duration || selectedClip.trimEnd - selectedClip.trimStart).toFixed(1)}s
              </span>
              <button
                type="button"
                onClick={() => adjustTimelineClipDuration(selectedClip.id, 0.5)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 active:scale-95"
                title="Increase 0.5 second"
              >
                +0.5s
              </button>
              <button
                type="button"
                onClick={() => adjustTimelineClipDuration(selectedClip.id, 1.0)}
                className="px-1.5 py-0.5 rounded bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 active:scale-95"
                title="Increase 1 second"
              >
                +1s
              </button>
            </div>
          )}
        </div>

        {/* Right Tools: Faster-Whisper Transcribe & Zoom Slider */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleAutoTranscribe}
            disabled={isTranscribing}
            className="px-3 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 disabled:opacity-50"
            title="Faster-Whisper Auto Transcribe to Track 1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{isTranscribing ? "Transcribing..." : "Auto-Transcribe (Whisper)"}</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Timeline Zoom (+ / -) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTimelineZoom(timelineZoom - 0.25)}
              disabled={timelineZoom <= 0.5}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-[#E5E7EB] text-slate-600 disabled:opacity-40"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-500 w-10 text-center">
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setTimelineZoom(timelineZoom + 0.25)}
              disabled={timelineZoom >= 3.0}
              className="p-1 rounded bg-white hover:bg-slate-100 border border-[#E5E7EB] text-slate-600 disabled:opacity-40"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Multi-Track Timeline Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Track Headers (Fixed Labels) */}
        <div className="w-44 border-r border-[#E5E7EB] bg-[#F8F9FA]/80 flex flex-col shrink-0 text-xs font-semibold text-slate-700 select-none">
          {/* Ruler spacer */}
          <div className="h-6 border-b border-[#E5E7EB] px-3 flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Tracks
          </div>

          {/* Track 1 Label: Subtitles */}
          <div className="h-14 border-b border-[#E5E7EB] px-3 flex items-center justify-between bg-white/50">
            <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <Type className="w-3.5 h-3.5 text-amber-500" /> Track 1: Subs
            </span>
            <button
              type="button"
              onClick={() =>
                addTimelineSubtitle({
                  id: `sub_${Date.now()}`,
                  text: "નવો સબટાઈટલ",
                  start: timelineCurrentTime,
                  end: Math.min(totalDuration, timelineCurrentTime + 2.0),
                  color: "#FFD700",
                })
              }
              className="p-1 rounded hover:bg-slate-200 text-slate-500"
              title="Add Subtitle Block at Playhead"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Track 2 Label: Video Clips */}
          <div className="h-20 border-b border-[#E5E7EB] px-3 flex items-center justify-between bg-white/50">
            <div>
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                <Film className="w-3.5 h-3.5 text-indigo-600" /> Track 2: Video
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">Drag clips here ⬇</p>
            </div>
            <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
              {draft.timelineClips.length} clips
            </span>
          </div>

          {/* Track 3 Label: Voiceover / Audio */}
          <div className="h-14 border-b border-[#E5E7EB] px-3 flex items-center justify-between bg-white/50">
            <div>
              <span className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                <Mic className="w-3.5 h-3.5 text-emerald-600" /> Track 3: Audio
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">
                {draft.voiceoverFilename ? "Synced" : "No Audio"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              className="p-1 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 border border-transparent hover:border-emerald-200 transition-colors"
              title="Upload audio / voiceover"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Scrollable Timeline Canvas Tracks */}
        <div
          ref={timelineTrackRef}
          className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#F8F9FA]/30"
          onClick={handleRulerClick}
        >
          <div
            className="h-full relative"
            style={{ width: `${Math.max(900, totalDuration * pps + 120)}px` }}
          >
            {/* Top Ruler Bar */}
            <div className="h-6 border-b border-[#E5E7EB] bg-slate-50 relative pointer-events-auto cursor-pointer">
              {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 border-l border-slate-300 text-[9px] font-mono text-slate-400 pl-1"
                  style={{ left: `${sec * pps}px` }}
                >
                  {sec % (timelineZoom < 1 ? 5 : 2) === 0 && `${sec}s`}
                </div>
              ))}
            </div>

            {/* Vertical Red Playhead Indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{ left: `${timelineCurrentTime * pps}px` }}
            >
              <div className="w-3.5 h-3.5 bg-red-500 rounded-full -ml-[6px] -mt-1 shadow-md border border-white" />
            </div>

            {/* TRACK 1: Subtitles Blocks */}
            <div className="h-14 border-b border-[#E5E7EB] relative bg-amber-50/10 py-1.5 px-1 flex items-center">
              {draft.timelineSubtitles.map((sub) => {
                const left = sub.start * pps;
                const width = Math.max(36, (sub.end - sub.start) * pps);
                const isSelected = selectedTimelineSubId === sub.id;

                return (
                  <div
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditSubtitle(sub);
                    }}
                    className={`absolute h-10 rounded-lg px-2 flex items-center justify-between cursor-pointer text-xs font-semibold transition-all border shadow-2xs group ${
                      isSelected
                        ? "bg-amber-100 border-amber-500 text-amber-900 ring-2 ring-amber-300"
                        : "bg-white border-amber-300 text-slate-800 hover:bg-amber-50"
                    }`}
                    style={{ left: `${left}px`, width: `${width}px` }}
                  >
                    <span className="truncate text-[11px] font-sans pr-1" title={sub.text}>
                      {sub.text}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTimelineSubtitle(sub.id);
                        toast.success("સબટાઈટલ બ્લોક દૂર થયો");
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* TRACK 2: Sequentially Arranged Video Clips with Drag & Drop */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setIsDragOverTrack2(true);
              }}
              onDragLeave={() => setIsDragOverTrack2(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverTrack2(false);
                const raw = e.dataTransfer.getData("application/json");
                if (raw) {
                  try {
                    const data = JSON.parse(raw);
                    addTimelineClip({
                      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                      name: data.name,
                      filename: data.filename,
                      url: data.url,
                      sourceDuration: data.duration,
                      trimStart: 0,
                      trimEnd: Math.min(data.duration, 5.0),
                      duration: Math.min(data.duration, 5.0),
                      transitionOut: "dissolve",
                      transitionDuration: 0.4,
                    });
                    toast.success(`🎬 Clip '${data.name}' Track 2 માં ઉમેરાઈ!`);
                  } catch (err) {}
                }
              }}
              className={`h-20 border-b border-[#E5E7EB] relative py-2 px-1 flex items-center transition-all ${
                isDragOverTrack2
                  ? "bg-indigo-100/60 ring-2 ring-indigo-400 ring-inset"
                  : "bg-indigo-50/10"
              }`}
            >
              {draft.timelineClips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-indigo-400 font-semibold border-2 border-dashed border-indigo-200 rounded-xl m-1">
                  + Drag clips from Media Assets Bin or click 'Add'
                </div>
              )}

              {(() => {
                let accumulatedLeft = 0;
                return draft.timelineClips.map((clip, index) => {
                  const clipDur = clip.duration || (clip.trimEnd - clip.trimStart);
                  const clipWidth = Math.max(75, clipDur * pps);
                  const currentLeft = accumulatedLeft;
                  accumulatedLeft += clipWidth;
                  const isSelected = selectedTimelineClipId === clip.id;

                  return (
                    <React.Fragment key={clip.id}>
                      {/* Clip Segment Card (Draggable for Reordering) */}
                      <div
                        draggable={true}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          e.dataTransfer.setData("text/timeline-index", index.toString());
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const rawIdx = e.dataTransfer.getData("text/timeline-index");
                          if (rawIdx !== "") {
                            const src = parseInt(rawIdx, 10);
                            if (!isNaN(src) && src !== index) {
                              reorderTimelineClips(src, index);
                              toast.success(`🔄 Clips ક્રમ બદલાયો (#${src + 1} ➔ #${index + 1})`);
                            }
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTimelineClipId(clip.id);
                        }}
                        className={`absolute h-16 rounded-xl border flex flex-col justify-between p-2 cursor-pointer transition-all shadow-2xs group select-none ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300"
                            : "bg-white text-slate-800 border-[#E5E7EB] hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                        style={{ left: `${currentLeft}px`, width: `${clipWidth}px` }}
                      >
                        {/* Clip Top Bar */}
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <div className="flex items-center gap-1 min-w-0 pr-1">
                            <GripVertical className={`w-3 h-3 shrink-0 ${isSelected ? "text-indigo-200" : "text-slate-300"}`} />
                            <span className="truncate" title={clip.name}>
                              #{index + 1} {clip.name}
                            </span>
                          </div>

                          {/* Quick Duration +/- Adjustment Buttons */}
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustTimelineClipDuration(clip.id, -0.5);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] active:scale-90 transition-all ${
                                isSelected ? "bg-indigo-700 hover:bg-indigo-800 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                              title="Decrease length by 0.5s"
                            >
                              -
                            </button>
                            <span
                              className={`px-1 py-0.2 rounded text-[9px] font-mono ${
                                isSelected ? "bg-indigo-700 text-indigo-100" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {clipDur.toFixed(1)}s
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                adjustTimelineClipDuration(clip.id, 0.5);
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center font-bold text-[10px] active:scale-90 transition-all ${
                                isSelected ? "bg-indigo-700 hover:bg-indigo-800 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                              title="Increase length by 0.5s"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Clip Actions / Controls */}
                        <div className="flex items-center justify-between pt-1">
                          {/* Reorder Left/Right buttons */}
                          <div className="flex items-center gap-0.5">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTimelineClips(index, index - 1);
                                }}
                                className="p-0.5 rounded hover:bg-black/10 text-xs"
                                title="Move Clip Left"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {index < draft.timelineClips.length - 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderTimelineClips(index, index + 1);
                                }}
                                className="p-0.5 rounded hover:bg-black/10 text-xs"
                                title="Move Clip Right"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Delete Clip */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTimelineClip(clip.id);
                              toast.success("ક્લિપ ટાઇમલાઇનમાંથી હટાવાઈ");
                            }}
                            className={`p-1 rounded transition-colors ${
                              isSelected ? "hover:bg-indigo-700 text-indigo-200" : "hover:bg-red-50 text-slate-400 hover:text-red-600"
                            }`}
                            title="Delete Clip"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Between-Clip Transition Selector Icon */}
                      {index < draft.timelineClips.length - 1 && (
                        <div
                          className="absolute z-20 top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{ left: `${currentLeft + clipWidth}px` }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={clip.transitionOut || "dissolve"}
                            onChange={(e) =>
                              updateTimelineClip(clip.id, {
                                transitionOut: e.target.value as any,
                              })
                            }
                            className="bg-white border border-slate-300 rounded-md text-[9px] font-bold text-slate-700 px-1 py-0.5 shadow-2xs hover:border-indigo-500 focus:outline-none cursor-pointer"
                            title="Between-clip transition"
                          >
                            <option value="dissolve">🔀 Dissolve</option>
                            <option value="fadeblack">⬛ Black</option>
                            <option value="push">➡️ Push</option>
                            <option value="none">Cut (None)</option>
                          </select>
                        </div>
                      )}
                    </React.Fragment>
                  );
                });
              })()}
            </div>

            {/* TRACK 3: Voiceover & Audio Track */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setIsDragOverTrack3(true);
              }}
              onDragLeave={() => setIsDragOverTrack3(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOverTrack3(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  const file = e.dataTransfer.files[0];
                  uploadMediaAPI(file, "audio").then((res) => {
                    updateDraft({
                      voiceoverFilename: res.filename,
                      voiceoverAudioUrl: res.url,
                    });
                    toast.success(`🎙️ Audio '${file.name}' Track 3 માં ઉમેરાઈ ગયું!`);
                  });
                }
              }}
              className={`h-14 border-b border-[#E5E7EB] relative py-1.5 px-1 flex items-center transition-all ${
                isDragOverTrack3
                  ? "bg-emerald-100/60 ring-2 ring-emerald-400 ring-inset"
                  : "bg-emerald-50/15"
              }`}
            >
              {draft.voiceoverAudioUrl || draft.voiceoverFilename ? (
                <div
                  className="h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between px-3 shadow-2xs select-none"
                  style={{ width: `${Math.max(160, totalDuration * pps * 0.95)}px` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Volume2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate">
                        {draft.voiceoverFilename || "Voiceover Audio"}
                      </p>
                      <p className="text-[9px] text-emerald-100 font-mono">
                        Voiceover & Ducked BGM Synced
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Animated wave bars */}
                    <div className="flex items-center gap-0.5 h-4">
                      {Array.from({ length: 16 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-0.5 bg-white/80 rounded-full transition-all duration-150 ${
                            timelineIsPlaying ? "animate-pulse" : ""
                          }`}
                          style={{
                            height: `${Math.max(20, (Math.sin(i * 0.8) * 0.5 + 0.5) * 100)}%`,
                          }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft({ voiceoverAudioUrl: null, voiceoverFilename: null });
                        toast.info("Audio track removed");
                      }}
                      className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white"
                      title="Remove audio"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => audioInputRef.current?.click()}
                  className="h-10 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-700 flex items-center justify-center gap-2 px-4 cursor-pointer text-xs font-semibold shadow-2xs transition-all w-full max-w-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Click to add voiceover/audio, or drop MP3/WAV here</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Subtitle Inline Editor Modal */}
      {editingSub && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                <span>સબટાઈટલ એડિટ કરો (Edit Subtitle Phrase)</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">શબ્દો / લખાણ (Text):</label>
              <textarea
                value={editingSubText}
                onChange={(e) => setEditingSubText(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 font-sans focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600">Start Time (sec):</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingSub.start}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, start: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600">End Time (sec):</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingSub.end}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, end: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubtitle}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs"
              >
                Save Subtitle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
