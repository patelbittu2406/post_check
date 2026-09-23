"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchLibrary } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { 
  Layers, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Plus, 
  Film, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  X
} from "lucide-react";

export default function LibraryPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const { profile } = useStore();

  const loadData = async () => {
    try {
      const res = await fetchLibrary();
      setReels(res.reels);
    } catch (e) {
      console.warn("Failed to load library:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReels = reels.filter((r) => {
    const matchesSearch =
      (r.headline_line1 || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.headline_line2 || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.filename || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || r.category_code === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="h-full overflow-y-auto bg-[#F8F9FA] p-6 md:p-8 space-y-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Reels & Media Library
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse all rendered 1080x1920 Gujarati reels, download MP4 media, and publish to Instagram.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Reel</span>
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by headline or keyword..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-colors placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "all", label: "All Categories" },
              { id: "N01", label: "News & City" },
              { id: "C01", label: "Crime" },
              { id: "T01", label: "Traffic" },
              { id: "F01", label: "Festival" },
              { id: "B01", label: "Business" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-slate-900 text-white shadow-xs font-semibold ring-2 ring-slate-900/10"
                    : "bg-white text-slate-600 border border-[#E5E7EB] hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reels Grid */}
        {filteredReels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs hover:border-indigo-200 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="relative aspect-[9/12] bg-slate-900 flex items-center justify-center overflow-hidden">
                  <video
                    src={reel.video_url}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Play preview overlay button */}
                  <button
                    onClick={() => setSelectedReel(reel)}
                    className="absolute w-12 h-12 rounded-full bg-white/95 text-indigo-600 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  {/* Badges on video */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase font-sans">
                      {reel.category_code}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {Math.round(reel.duration || 30)}s
                    </span>
                  </div>

                  {reel.published && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 backdrop-blur-md text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold font-gujarati text-slate-900 line-clamp-1">
                      {reel.headline_line1}
                    </h3>
                    <p className="text-[11px] font-semibold font-gujarati text-indigo-600 line-clamp-1">
                      {reel.headline_line2}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {reel.created_at ? new Date(reel.created_at).toLocaleDateString() : "Recent"} • {reel.file_size_mb || "4.2"} MB
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                    <a
                      href={reel.video_url}
                      download={reel.filename}
                      className="w-full py-1.5 px-2 rounded-xl bg-slate-50 border border-[#E5E7EB] text-[11px] font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Download MP4</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-white border border-[#E5E7EB] text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto ring-4 ring-indigo-50/50">
              <Film className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-slate-900">
                No Reels Rendered Yet
              </h3>
              <p className="text-xs text-slate-500">
                Create your first AI-generated Gujarati news reel using the Canva-style Studio canvas.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Reel Studio</span>
            </Link>
          </div>
        )}
      </div>

      {/* Video Modal Preview */}
      {selectedReel && (
        <div 
          onClick={() => setSelectedReel(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="truncate">
                <h3 className="text-sm font-bold font-gujarati text-slate-900 truncate">
                  {selectedReel.headline_line1}
                </h3>
                <p className="text-xs font-gujarati text-indigo-600 truncate">{selectedReel.headline_line2}</p>
              </div>
              <button
                onClick={() => setSelectedReel(null)}
                className="w-8 h-8 rounded-full bg-slate-100 border border-[#E5E7EB] flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[9/16] bg-slate-950 rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-inner">
              <video
                controls
                autoPlay
                src={selectedReel.video_url}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <a
                href={selectedReel.video_url}
                download={selectedReel.filename}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
