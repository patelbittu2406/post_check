"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchLibrary, publishInstagramAPI } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { 
  Layers, 
  Search, 
  Filter, 
  Play, 
  Download, 
  Instagram, 
  Plus, 
  Film, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  X
} from "lucide-react";

export default function LibraryPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedReel, setSelectedReel] = useState<any | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
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

  const handleQuickPublish = async (reel: any) => {
    setPublishingId(reel.id);
    const isConfigured = Boolean(
      profile.instagram_business_account_id && profile.facebook_page_access_token
    );

    const toastId = toast.loading(
      isConfigured ? "Publishing reel to Instagram..." : "Running dry-run publication..."
    );

    try {
      const res = await publishInstagramAPI({
        video_filename: reel.filename,
        caption: `SURAT UPDATE | ${reel.category_code}\n${reel.headline_line1}\n${reel.headline_line2}\n\n#Surat #SuratNews`,
        dry_run: !isConfigured,
      });

      toast.success(
        res.mode === "live" ? "🎉 Published live to Instagram!" : "✅ Dry-run completed!",
        { id: toastId }
      );
      loadData();
    } catch (err: any) {
      toast.error(`Publish failed: ${err.message}`, { id: toastId });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-bg-base p-6 md:p-8 space-y-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-text-primary flex items-center gap-2">
              <Layers className="w-6 h-6 text-brand-cyan" />
              Reels & Drafts Library
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Browse all rendered 1080x1920 Gujarati reels, download MP4 media, and publish to Instagram.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Reel</span>
          </Link>
        </div>

        {/* Search and Filters Bar */}
        <div className="p-3.5 rounded-2xl bg-bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by headline or keyword..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {["all", "N01", "C01", "T01", "F01", "B01"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "brand-gradient-bg text-white shadow-sm glow-pink"
                    : "bg-bg-elevated border border-border text-text-muted hover:text-text-primary"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
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
                className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-sm hover:border-brand-pink/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="relative aspect-[9/12] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <video
                    src={reel.video_url}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

                  {/* Play preview overlay button */}
                  <button
                    onClick={() => setSelectedReel(reel)}
                    className="absolute w-12 h-12 rounded-full brand-gradient-bg text-white flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all glow-pink"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>

                  {/* Badges on video */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 uppercase font-outfit">
                      {reel.category_code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30 font-mono">
                      {Math.round(reel.duration || 30)}s
                    </span>
                  </div>

                  {reel.published && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-success/30 backdrop-blur-md text-accent-success border border-accent-success/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Published
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold font-gujarati text-text-primary line-clamp-1">
                      {reel.headline_line1}
                    </h3>
                    <p className="text-[11px] font-semibold font-gujarati text-brand-pink line-clamp-1">
                      {reel.headline_line2}
                    </p>
                    <p className="text-[10px] text-text-muted flex items-center gap-1 mt-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {reel.created_at ? new Date(reel.created_at).toLocaleDateString() : "Recent"} • {reel.file_size_mb || "4.2"} MB
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <a
                      href={reel.video_url}
                      download={reel.filename}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-bg-elevated border border-border text-[11px] font-bold text-text-primary hover:border-brand-pink flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-pink" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={() => handleQuickPublish(reel)}
                      disabled={publishingId === reel.id}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-bg-elevated border border-border text-[11px] font-bold text-text-primary hover:border-brand-cyan hover:text-brand-cyan flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                    >
                      <Instagram className="w-3.5 h-3.5 text-brand-cyan" />
                      <span>{publishingId === reel.id ? "Publishing..." : "Publish"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-bg-surface border border-border text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-brand-pink/15 text-brand-pink flex items-center justify-center mx-auto ring-4 ring-brand-pink/10">
              <Film className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold font-outfit text-text-primary">
                No Reels Rendered Yet
              </h3>
              <p className="text-xs text-text-muted">
                Create your first AI-generated Gujarati news reel using the 3-column studio canvas.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95"
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-bg-surface border border-border rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="truncate">
                <h3 className="text-sm font-bold font-gujarati text-text-primary truncate">
                  {selectedReel.headline_line1}
                </h3>
                <p className="text-xs font-gujarati text-brand-pink truncate">{selectedReel.headline_line2}</p>
              </div>
              <button
                onClick={() => setSelectedReel(null)}
                className="w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-border shadow-inner">
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
                className="flex-1 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary hover:border-brand-pink flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-brand-pink" />
                <span>Download MP4</span>
              </a>

              <button
                onClick={() => handleQuickPublish(selectedReel)}
                className="flex-1 py-2 rounded-xl brand-gradient-bg text-white text-xs font-bold flex items-center justify-center gap-2 glow-pink"
              >
                <Instagram className="w-4 h-4" />
                <span>Publish Reel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
