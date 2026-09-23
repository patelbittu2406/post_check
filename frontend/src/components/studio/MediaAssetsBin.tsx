"use client";

import React, { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import { 
  UploadCloud, 
  Film, 
  Mic, 
  Sparkles, 
  Plus, 
  Clock, 
  Check, 
  Play, 
  Pause, 
  Layers, 
  RefreshCw,
  Loader2,
  Trash2,
  Wand2,
  Music,
  GripVertical,
  Tag,
  Eraser,
  Zap
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { 
  uploadMediaAPI, 
  generateScriptAPI, 
  generateVoiceAPI, 
  autoTagScriptAPI, 
  transcribeTimelineAudioAPI 
} from "@/lib/api";

interface MediaItem {
  id: string;
  name: string;
  filename: string;
  url: string;
  duration: number;
  type: "user_clip" | "stock_broll" | "voiceover";
}

interface MediaAssetsBinProps {
  onAddClipToTimeline: (clip: {
    name: string;
    filename: string;
    url: string;
    duration: number;
  }) => void;
}

export function MediaAssetsBin({ onAddClipToTimeline }: MediaAssetsBinProps) {
  const { draft, updateDraft, profile, addTimelineClip, setTimelineSubtitles } = useStore();
  const [activeTab, setActiveTab] = useState<"clips" | "stock" | "voice">("clips");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  // Available stock brolls with realistic durations
  const stockClips: MediaItem[] = [
    {
      id: "stock_1",
      name: "Surat City Drone Loop",
      filename: "surat_city_loop.mp4",
      url: "/assets/broll/surat_city_loop.mp4",
      duration: 15.0,
      type: "stock_broll",
    },
    {
      id: "stock_2",
      name: "Vesu Traffic & Roads",
      filename: "vesu_traffic_clip.mp4",
      url: "/assets/user_clips/vesu_traffic_clip.mp4",
      duration: 12.0,
      type: "stock_broll",
    },
    {
      id: "stock_3",
      name: "Adajan Monsoon Rain",
      filename: "adajan_rain_clip.mp4",
      url: "/assets/user_clips/adajan_rain_clip.mp4",
      duration: 14.0,
      type: "stock_broll",
    },
    {
      id: "stock_4",
      name: "Surat Diamond Bourse",
      filename: "diamond_bourse_clip.mp4",
      url: "/assets/user_clips/diamond_bourse_clip.mp4",
      duration: 10.0,
      type: "stock_broll",
    },
    {
      id: "stock_5",
      name: "Ganesh Utsav Celebration",
      filename: "ganesh_utsav_clip.mp4",
      url: "/assets/user_clips/ganesh_utsav_clip.mp4",
      duration: 11.5,
      type: "stock_broll",
    },
  ];

  // Uploaded user clips
  const [userClips, setUserClips] = useState<MediaItem[]>([
    {
      id: "user_c1",
      name: "Adajan Flyover View",
      filename: "adajan_rain_clip.mp4",
      url: "/assets/user_clips/adajan_rain_clip.mp4",
      duration: 14.0,
      type: "user_clip",
    },
    {
      id: "user_c2",
      name: "Vesu Crossroad 4K",
      filename: "vesu_traffic_clip.mp4",
      url: "/assets/user_clips/vesu_traffic_clip.mp4",
      duration: 12.0,
      type: "user_clip",
    },
  ]);

  // Dropzone for multiple raw clips and voiceovers
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${acceptedFiles.length} media file(s)...`);

    try {
      for (const file of acceptedFiles) {
        const res = await uploadMediaAPI(file, file.type.startsWith("audio") ? "audio" : "clip");
        if (file.type.startsWith("audio")) {
          updateDraft({
            voiceoverFilename: res.filename,
            voiceoverAudioUrl: res.url,
          });
          toast.success(`🎙️ Voiceover '${file.name}' loaded!`, { id: toastId });
        } else {
          const newClip: MediaItem = {
            id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            filename: res.filename,
            url: res.url,
            duration: 8.0,
            type: "user_clip",
          };
          setUserClips(prev => [newClip, ...prev]);
          toast.success(`🎬 Clip '${file.name}' added to Media Bin!`, { id: toastId });
        }
      }
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".webm"],
      "audio/*": [".wav", ".mp3", ".m4a"],
    },
    multiple: true,
  });

  const handleAddClip = (item: MediaItem) => {
    onAddClipToTimeline({
      name: item.name,
      filename: item.filename,
      url: item.url,
      duration: item.duration,
    });
    toast.success(`➕ Added '${item.name}' to Track 2!`);
  };

  // Quick Script Generator
  const handleGenerateScript = async () => {
    if (!draft.rawDetails) {
      toast.error("કૃપા કરીને પહેલા સમાચાર વિગત લખો");
      return;
    }
    setIsGeneratingScript(true);
    const toastId = toast.loading("✨ AI ગુજરાતી સ્ક્રિપ્ટ બનાવી રહ્યું છે...");
    try {
      const res = await generateScriptAPI({
        raw_details: draft.rawDetails,
        category_code: draft.categoryCode,
        area: draft.area,
        target_duration: draft.targetDuration,
        provider: "Gemini",
      });

      updateDraft({
        line1Headline: res.headline_line1 || draft.line1Headline,
        line2Headline: res.headline_line2 || draft.line2Headline,
        voiceoverScript: res.voiceover_script || draft.voiceoverScript,
        caption: res.caption || draft.caption,
      });
      toast.success("✅ સ્ક્રિપ્ટ તૈયાર થઈ ગઈ!", { id: toastId });
    } catch (err: any) {
      toast.error(`ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Auto-Tag script with emotional markers
  const handleAutoTagScript = async () => {
    if (!draft.voiceoverScript?.trim()) {
      toast.error("કૃપા કરીને પહેલા બોલવા માટે સ્ક્રિપ્ટ લખો");
      return;
    }
    setIsAutoTagging(true);
    const toastId = toast.loading("✨ Gemini AI સ્ક્રિપ્ટમાં વાણીના ભાવ મુજબ ટેગ ઉમેરી રહ્યું છે...");
    try {
      const res = await autoTagScriptAPI({
        script_text: draft.voiceoverScript,
        category_code: draft.categoryCode,
        area: draft.area,
        provider: "Gemini",
        generate_voice: false,
      });
      if (res.tagged_script) {
        updateDraft({ voiceoverScript: res.tagged_script });
        toast.success("✨ AI Audio Tags ઉમેરાઈ ગયા! (શબ્દો 100% સુરક્ષિત રહ્યા)", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Auto-tagging ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsAutoTagging(false);
    }
  };

  // Remove bracket tags to revert to plain script
  const handleRemoveTags = () => {
    if (!draft.voiceoverScript?.trim()) return;
    const plain = draft.voiceoverScript.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
    updateDraft({ voiceoverScript: plain });
    toast.success("🏷️ બધા ટેગ્સ હટાવી સાદી સ્ક્રિપ્ટ કરી!");
  };

  // Insert a quick emotion tag
  const handleInsertTag = (tag: string) => {
    const current = draft.voiceoverScript || "";
    const updated = current ? `${current} ${tag} ` : `${tag} `;
    updateDraft({ voiceoverScript: updated });
    toast.success(`'${tag}' ટેગ ઉમેરાયો`);
  };

  // Quick Voiceover Synthesizer with auto Track 3 and Track 1 sync
  const handleGenerateVoice = async () => {
    if (!draft.voiceoverScript) {
      toast.error("કૃપા કરીને બોલવા માટે સ્ક્રિપ્ટ લખો");
      return;
    }
    setIsGeneratingVoice(true);
    const toastId = toast.loading("🎙️ ગુજરાતી વૉઇસ સિન્થેસાઇઝ થઈ રહ્યો છે...");
    try {
      const res = await generateVoiceAPI({
        script_text: draft.voiceoverScript,
        voice_mode: draft.selectedVoiceMode,
        voice_settings: draft.voiceSettings,
      });

      updateDraft({
        voiceoverAudioUrl: res.audio_url,
        voiceoverFilename: res.filename,
      });
      toast.success("✨ વૉઇસઓવર તૈયાર થઈ ગયો અને Track 3 માં ઉમેરાયો!", { id: toastId });

      // Automatically auto-transcribe so Track 1 Subtitles get synchronized right away!
      try {
        const transRes = await transcribeTimelineAudioAPI({
          audio_filename: res.filename,
          script_text: draft.voiceoverScript,
          chunk_size: 3,
        });
        if (transRes?.subtitles?.length) {
          setTimelineSubtitles(transRes.subtitles);
        }
      } catch (tErr) {
        console.warn("Background auto-transcribe warning:", tErr);
      }
    } catch (err: any) {
      toast.error(`વૉઇસ સિન્થેસિસ ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className="w-80 h-full bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 overflow-hidden select-none">
      {/* Bin Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F8F9FA]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Media Assets Bin</h3>
            <p className="text-[10px] text-slate-500">Clips, Voiceover & Stock</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-2 border-b border-[#E5E7EB] grid grid-cols-3 gap-1 bg-[#F8F9FA]/40 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("clips")}
          className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "clips"
              ? "bg-white text-indigo-600 shadow-2xs border border-indigo-100"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Clips</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "stock"
              ? "bg-white text-indigo-600 shadow-2xs border border-indigo-100"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Stock</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("voice")}
          className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "voice"
              ? "bg-white text-indigo-600 shadow-2xs border border-indigo-100"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Script</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === "clips" && (
          <>
            {/* Drag & Drop Upload Zone */}
            <div
              {...getRootProps()}
              className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-slate-200 hover:border-indigo-300 bg-slate-50/60"
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center mx-auto mb-2 text-indigo-600">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              </div>
              <p className="text-xs font-semibold text-slate-800">
                {isUploading ? "Uploading..." : "Drop clips or audio here"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">MP4, MOV, WAV, MP3</p>
            </div>

            {/* Clips Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  My Clips ({userClips.length})
                </span>
                <span className="text-[10px] text-slate-400">Drag to Timeline ⬇</span>
              </div>
              <div className="space-y-2">
                {userClips.map((c) => (
                  <div
                    key={c.id}
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({
                          name: c.name,
                          filename: c.filename,
                          url: c.url,
                          duration: c.duration,
                        })
                      );
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    className="p-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-indigo-300 transition-all shadow-2xs flex items-center justify-between group cursor-grab active:cursor-grabbing hover:shadow-xs"
                    title="Drag and drop onto Track 2 or click Add"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                      <div className="w-12 h-10 rounded-lg bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center shrink-0">
                        <video src={c.url} className="w-full h-full object-cover" muted preload="metadata" />
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/70 text-[9px] text-white font-mono">
                          {c.duration.toFixed(1)}s
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate" title={c.name}>
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{c.filename}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddClip(c)}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                      title="Add to Track 2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "stock" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Surat Stock B-Roll ({stockClips.length})
              </span>
              <span className="text-[10px] text-slate-400">Drag to Timeline ⬇</span>
            </div>
            <div className="space-y-2">
              {stockClips.map((c) => (
                <div
                  key={c.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({
                        name: c.name,
                        filename: c.filename,
                        url: c.url,
                        duration: c.duration,
                      })
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="p-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-indigo-300 transition-all shadow-2xs flex items-center justify-between group cursor-grab active:cursor-grabbing hover:shadow-xs"
                  title="Drag and drop onto Track 2 or click Add"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                    <div className="w-12 h-10 rounded-lg bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center shrink-0">
                      <video src={c.url} className="w-full h-full object-cover" muted preload="metadata" />
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/70 text-[9px] text-white font-mono">
                        {c.duration.toFixed(1)}s
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate" title={c.name}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">9:16 Optimized</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddClip(c)}
                    className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shrink-0"
                    title="Add to Track 2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "voice" && (
          <div className="space-y-3">
            {/* Quick Script Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">સમાચાર વિગત (News Text):</label>
                <button
                  type="button"
                  onClick={handleGenerateScript}
                  disabled={isGeneratingScript}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 disabled:opacity-50"
                >
                  {isGeneratingScript ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  <span>Generate AI Script</span>
                </button>
              </div>
              <textarea
                value={draft.rawDetails}
                onChange={(e) => updateDraft({ rawDetails: e.target.value })}
                rows={3}
                placeholder="અહીં સમાચારની પ્રાથમિક વિગતો લખો..."
                className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            {/* Gujarati Script Input with AI Auto-Tagging & Tag Stripper */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">બોલવા માટે સ્ક્રિપ્ટ (Voiceover Script):</label>
              </div>

              {/* Tag Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAutoTagScript}
                  disabled={isAutoTagging || !draft.voiceoverScript?.trim()}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  title="Gemini analyzes emotions and inserts speech tags while preserving words"
                >
                  {isAutoTagging ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>✨ AI Tags ઉમેરો</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveTags}
                  disabled={!draft.voiceoverScript?.trim()}
                  className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                  title="Remove all [tag] markers to revert to plain script"
                >
                  <Eraser className="w-3 h-3 text-slate-500" />
                  <span>ટેગ્સ હટાવો (Plain)</span>
                </button>
              </div>

              {/* Quick Tag Badges */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">Quick Emotion Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {["[excited]", "[pauses]", "[happy]", "[urgent]", "[serious]", "[whispering]"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleInsertTag(t)}
                      className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 text-[10px] font-mono transition-colors"
                      title={`Click to insert ${t}`}
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={draft.voiceoverScript}
                onChange={(e) => updateDraft({ voiceoverScript: e.target.value })}
                rows={4}
                placeholder="સ્પીકર જે બોલશે તે અહીં લખાશે (દા.ત. [excited] સુરતમાં ભારે ઉત્સાહ...)"
                className="w-full p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/20 text-xs text-slate-800 font-sans focus:outline-none focus:border-indigo-500 leading-relaxed"
              />

              {/* Tag indicator info */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                <span>
                  {draft.voiceoverScript?.match(/\[.*?\]/g)
                    ? `🏷️ ${draft.voiceoverScript.match(/\[.*?\]/g)?.length} Emotion tags active`
                    : "Plain script (No tags)"}
                </span>
                <span>{draft.voiceoverScript ? draft.voiceoverScript.split(/\s+/).filter(Boolean).length : 0} words</span>
              </div>
            </div>

            {/* Synthesize Voice CTA */}
            <button
              type="button"
              onClick={handleGenerateVoice}
              disabled={isGeneratingVoice || !draft.voiceoverScript?.trim()}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
            >
              {isGeneratingVoice ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              <span>🎙️ Generate Voice & Sync Track 3</span>
            </button>

            {draft.voiceoverFilename && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-800 shadow-2xs">
                <span className="font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Track 3 (Audio) Synced</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 truncate max-w-[120px]">
                  {draft.voiceoverFilename}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
