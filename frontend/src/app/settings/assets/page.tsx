"use client";

import React, { useState, useEffect } from "react";
import { fetchBgmAssets, fetchBrollAssets, uploadMediaAPI } from "@/lib/api";
import { toast } from "sonner";
import { 
  FolderArchive, 
  Music, 
  Film, 
  UploadCloud, 
  Play, 
  Pause, 
  Type, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function AssetsSettingsPage() {
  const [bgmFiles, setBgmFiles] = useState<{ name: string; url: string; size_kb: number }[]>([]);
  const [brollFiles, setBrollFiles] = useState<{ name: string; url: string; size_mb: number; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Playing BGM
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAssets = async () => {
    try {
      const [bData, brData] = await Promise.all([
        fetchBgmAssets(),
        fetchBrollAssets(),
      ]);
      setBgmFiles(bData.bgm_files);
      setBrollFiles(brData.broll_files);
    } catch (err) {
      console.warn("Failed to load assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const togglePlay = (url: string) => {
    if (audioElem) {
      audioElem.pause();
    }
    if (playingUrl === url) {
      setPlayingUrl(null);
      return;
    }
    const a = new Audio(url);
    a.play();
    a.onended = () => setPlayingUrl(null);
    setAudioElem(a);
    setPlayingUrl(url);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    const isAudio = file.type.startsWith("audio");
    const isVideo = file.type.startsWith("video");

    if (!isAudio && !isVideo) {
      toast.warning("Please upload an audio (.mp3) or video (.mp4) file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("media_type", isAudio ? "audio" : "broll");

    try {
      await uploadMediaAPI(formData);
      toast.success(`✓ Uploaded ${file.name} to ${isAudio ? "Audio" : "B-Roll"} library`);
      loadAssets();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3"],
      "video/*": [".mp4", ".mov"],
    },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold font-inter text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            Media & Asset Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage background music soundtracks, stock B-roll city footage, and Gujarati typography fonts.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-200 hover:border-indigo-300 bg-slate-50/70"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-8 h-8 text-indigo-500" />
            {uploading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Uploading & indexing media file...</span>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  Drag & drop BGM (.mp3) or B-Roll (.mp4) here, or <span className="text-indigo-600 underline">browse</span>
                </p>
                <p className="text-[11px] text-slate-500">Directly integrated into the 1080x1920 video composition pipeline</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BGM Soundtracks Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-inter text-slate-900 flex items-center gap-2">
            <Music className="w-4 h-4 text-amber-500" />
            Background News Beat Soundtracks ({bgmFiles.length})
          </h3>
          <span className="text-[11px] text-slate-500">Auto-ducked to 0.12 (-28 LUFS)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {bgmFiles.map((b) => (
            <div
              key={b.name}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 group hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <button
                  type="button"
                  onClick={() => togglePlay(b.url)}
                  className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-all shadow-2xs"
                >
                  {playingUrl === b.url ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{b.name}</p>
                  <p className="text-[10px] text-slate-500">{b.size_kb} KB • Stereo MP3</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                Ready
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* B-Roll Footage Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-inter text-slate-900 flex items-center gap-2">
            <Film className="w-4 h-4 text-indigo-600" />
            B-Roll & City Loops ({brollFiles.length})
          </h3>
          <span className="text-[11px] text-slate-500">1080x1920 Auto Crop & Montage Splicer</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {brollFiles.map((br) => (
            <div
              key={br.name}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 group hover:border-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-800 truncate">{br.name}</p>
                  <p className="text-[10px] text-slate-500">{br.size_mb} MB • {br.type === "stock" ? "Stock Loop" : "User Clip"}</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                {br.type === "stock" ? "Stock" : "Custom"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bundled Fonts Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Type className="w-4 h-4 text-indigo-600" />
          Bundled Typography Engine
        </h3>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <p className="text-xs font-bold text-slate-800 font-gujarati">Noto Sans Gujarati (Bold 700 / 800)</p>
            <p className="text-[10px] text-slate-500">NotoSansGujarati-Bold.ttf • Preloaded for FFmpeg ASS burned-in subtitles</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Loaded
          </span>
        </div>
      </div>
    </div>
  );
}
