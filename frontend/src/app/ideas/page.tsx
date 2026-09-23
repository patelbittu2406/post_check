"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { fetchViralSuratNews, SuratViralNewsItem } from "@/lib/api";
import { toast } from "sonner";
import { 
  Sparkles, 
  RefreshCw, 
  MapPin, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Layers, 
  Lightbulb,
  CheckCircle2,
  Filter
} from "lucide-react";

const FILTER_PILLS = [
  { id: "ALL", label: "All Surat", icon: "📍" },
  { id: "Adajan", label: "Adajan", icon: "🏘️" },
  { id: "Vesu", label: "Vesu", icon: "🌆" },
  { id: "T01", label: "Traffic & Metro", icon: "🚦" },
  { id: "C01", label: "Crime Watch", icon: "🚨" },
  { id: "F01", label: "Food & Festival", icon: "🎉" },
  { id: "B01", label: "Diamond & Business", icon: "💎" },
  { id: "N01", label: "Weather & City", icon: "🌤️" },
];

export default function NewsIdeasPage() {
  const router = useRouter();
  const { updateDraft, profile } = useStore();

  const [newsFeed, setNewsFeed] = useState<SuratViralNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activePill, setActivePill] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadNews = async (isRefresh: boolean = false, filter = activePill) => {
    setIsLoading(true);
    try {
      // Determine category vs area from pill
      const isCat = ["T01", "C01", "F01", "B01", "N01"].includes(filter);
      const categoryParam = isCat ? filter : undefined;
      const areaParam = !isCat && filter !== "ALL" ? filter : undefined;

      const res = await fetchViralSuratNews({
        category: categoryParam,
        area: areaParam,
        count: 9,
        offset: 0,
        force_refresh: isRefresh,
        api_key: profile.gemini_api_key,
      });

      if (res && res.news_items && res.news_items.length > 0) {
        setNewsFeed(res.news_items);
      } else {
        toast.info("No ideas found for this filter.");
      }
    } catch (err: any) {
      console.error("Error loading viral news ideas:", err);
      toast.error("Failed to load news templates.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews(false);
  }, []);

  const handleRefresh = async () => {
    const tId = toast.loading("✨ Refreshing viral Surat news templates...");
    await loadNews(true, activePill);
    toast.success("✅ Trending templates updated!", { id: tId });
  };

  const handlePillClick = (pillId: string) => {
    setActivePill(pillId);
    loadNews(false, pillId);
  };

  const handleUseTemplate = (item: SuratViralNewsItem) => {
    updateDraft({
      rawDetails: item.description || item.idea_title,
      line1Headline: item.line1_headline || item.idea_title,
      line2Headline: item.line2_headline || item.gujarati_hook,
      voiceoverScript: item.voiceover_script || `${item.gujarati_hook} — ${item.description || ""}`,
      caption: item.caption || `SURAT UPDATE | ${item.category_code}\nવિસ્તાર: ${item.target_area}, સુરત\n\n${item.idea_title}\n\n#SuratNews #${item.target_area}`,
      categoryCode: item.category_code || "N01",
      area: item.target_area || "All Surat",
      targetDuration: item.ideal_length_sec || 30,
    });

    toast.success("🚀 Template loaded into Studio! Start creating your reel.", {
      duration: 3500,
    });
    router.push("/dashboard");
  };

  // Pastel Category Badge Colors (Canva Style)
  const getCategoryBadge = (code: string = "") => {
    const c = code.toUpperCase();
    switch (c) {
      case "T01":
        return { label: "Traffic", bg: "bg-amber-50 text-amber-700 border-amber-200/60" };
      case "C01":
        return { label: "Crime", bg: "bg-red-50 text-red-700 border-red-200/60" };
      case "F01":
        return { label: "Festival", bg: "bg-orange-50 text-orange-700 border-orange-200/60" };
      case "B01":
        return { label: "Business", bg: "bg-blue-50 text-blue-700 border-blue-200/60" };
      case "N01":
        return { label: "City & Weather", bg: "bg-cyan-50 text-cyan-700 border-cyan-200/60" };
      default:
        return { label: "News", bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60" };
    }
  };

  const filteredNews = newsFeed.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.idea_title?.toLowerCase().includes(q) ||
      item.gujarati_hook?.toLowerCase().includes(q) ||
      item.target_area?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full overflow-y-auto bg-[#F8F9FA] p-6 md:p-8 space-y-6 select-none">
      {/* Top Banner: Canva Template Discovery Style */}
      <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
              💡
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-inter">
              News Ideas & Templates
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Hyperlocal Surat news templates curated for viral 9:16 Instagram Reels. Click &ldquo;Use this template&rdquo; to load directly into the Studio editor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ideas..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 w-44 md:w-56"
            />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Filter Pills (Canva Tag Bar) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 scrollbar-thin scrollbar-thumb-slate-200 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter:</span>
        </div>
        {FILTER_PILLS.map((pill) => {
          const isActive = activePill === pill.id;
          return (
            <button
              key={pill.id}
              type="button"
              onClick={() => handlePillClick(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs font-semibold ring-2 ring-slate-900/10"
                  : "bg-white text-slate-600 border border-[#E5E7EB] hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 shadow-2xs"
              }`}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid (Canva Discovery Cards) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-white border border-[#E5E7EB] animate-pulse p-5 space-y-4">
              <div className="h-5 w-24 bg-slate-100 rounded-md" />
              <div className="h-8 bg-slate-100 rounded-md" />
              <div className="h-16 bg-slate-100 rounded-md" />
              <div className="h-10 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.map((item) => {
            const badge = getCategoryBadge(item.category_code);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.target_area || "Surat"}
                    </span>
                  </div>

                  {/* Headline & Hook */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 font-gujarati leading-snug group-hover:text-indigo-600 transition-colors">
                      {item.idea_title}
                    </h3>
                    <p className="text-xs text-slate-600 font-gujarati leading-relaxed line-clamp-2">
                      {item.gujarati_hook}
                    </p>
                  </div>

                  {/* 1-Line Virality Tip Box (Canva Style Soft Pastel) */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 flex items-start gap-2 text-[11px] text-amber-900 font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {item.why_it_works || "Use high-energy opening video clip with fast paced voiceover."}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>~{item.ideal_length_sec || 30}s reel</span>
                  </div>

                  <button
                    onClick={() => handleUseTemplate(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xs cursor-pointer"
                  >
                    <span>Use this template</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] space-y-2">
          <p className="text-sm font-semibold text-slate-700">No news templates matched your search.</p>
          <p className="text-xs text-slate-400">Try selecting a different filter pill or click Refresh above.</p>
        </div>
      )}
    </div>
  );
}
