"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { fetchViralSuratNews, SuratViralNewsItem } from "@/lib/api";
import { toast } from "sonner";
import { 
  Flame, 
  RefreshCw, 
  MapPin, 
  Filter, 
  Sparkles, 
  Zap, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ChevronRight, 
  Copy, 
  Check, 
  AlertCircle,
  Loader2,
  TrendingUp,
  Tag
} from "lucide-react";

const CATEGORIES = [
  { id: "ALL", label: "બધા (All Topics)", icon: "🌐" },
  { id: "T01", label: "ટ્રાફિક & મેટ્રો (T01)", icon: "🚦" },
  { id: "C01", label: "ક્રાઈમ વોચ (C01)", icon: "🚨" },
  { id: "A01", label: "મનપા & નાગરિક (A01)", icon: "🏛️" },
  { id: "F01", label: "ફૂડ & ઉત્સવ (F01)", icon: "🍲" },
  { id: "B01", label: "ડાયમંડ & વેપાર (B01)", icon: "💎" },
  { id: "N01", label: "શહેર & વાતાવરણ (N01)", icon: "🌦️" },
];

const AREAS = [
  { id: "ALL", label: "સમગ્ર સુરત (All Surat)" },
  { id: "Adajan", label: "અડાજણ (Adajan)" },
  { id: "Vesu", label: "વેસુ (Vesu)" },
  { id: "Varachha", label: "વરાછા (Varachha)" },
  { id: "Katargam", label: "કતારગામ (Katargam)" },
  { id: "Athwalines", label: "અઠવાલાઇન્સ (Athwalines)" },
  { id: "Khajod", label: "ખજોદ / ડાયમંડ બુર્સ (Khajod)" },
  { id: "Pal", label: "પાલ (Pal)" },
  { id: "Dumas", label: "ડુમસ રોડ (Dumas)" },
  { id: "Althan", label: "અલ્થાણ (Althan)" },
];

export default function NewsIdeasPage() {
  const router = useRouter();
  const { updateDraft, profile } = useStore();

  const [newsFeed, setNewsFeed] = useState<SuratViralNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadNews = async (isRefresh: boolean = false, cat = selectedCategory, ar = selectedArea) => {
    setIsLoading(true);
    try {
      const res = await fetchViralSuratNews({
        category: cat === "ALL" ? undefined : cat,
        area: ar === "ALL" ? undefined : ar,
        count: 6,
        offset: 0,
        force_refresh: isRefresh,
        api_key: profile.gemini_api_key,
      });

      if (res && res.news_items && res.news_items.length > 0) {
        setNewsFeed(res.news_items);
      } else {
        toast.info("આ ફિલ્ટર માટે વધુ વિષયો ઉપલબ્ધ નથી.");
      }
    } catch (err: any) {
      console.error("Error loading viral news ideas:", err);
      toast.error("સુરત વાયરલ ન્યૂઝ લોડ કરવામાં ભૂલ આવી.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNews(false);
  }, []);

  const handleRefresh = async () => {
    const tId = toast.loading("⚡ સુરત સંબંધિત તાજા 5 વાયરલ વિષયો જનરેટ થઈ રહ્યા છે...");
    await loadNews(true, selectedCategory, selectedArea);
    toast.success("✅ તાજા વાયરલ આઇડિયાઝ અપડેટ થયા!", { id: tId });
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategory(catId);
    loadNews(false, catId, selectedArea);
  };

  const handleAreaChange = (areaId: string) => {
    setSelectedArea(areaId);
    loadNews(false, selectedCategory, areaId);
  };

  const handleUseInStudio = (item: SuratViralNewsItem) => {
    updateDraft({
      rawDetails: item.description || item.idea_title,
      line1Headline: item.line1_headline || item.idea_title,
      line2Headline: item.line2_headline || item.gujarati_hook,
      voiceoverScript: item.voiceover_script || `${item.gujarati_hook} — ${item.description || ""}`,
      caption: item.caption || `SURAT UPDATE | ${item.category_code}\nવિસ્તાર: ${item.target_area}, સુરત\n\nશું થયું?\n${item.idea_title}\n\n#SuratNews #${item.target_area}`,
      categoryCode: item.category_code || "N01",
      area: item.target_area || "All Surat",
      targetDuration: item.ideal_length_sec || 30,
    });

    toast.success("🚀 વિગત Studio માં લોડ થઈ ગઈ છે! Reel બનાવવાનું શરૂ કરો.", {
      duration: 3500,
    });
    router.push("/dashboard");
  };

  const copyScript = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("📋 સ્ક્રિપ્ટ કોપી થઈ ગઈ!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-bg-base p-6 md:p-8 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-bg-surface via-bg-elevated/40 to-bg-surface border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-pink via-amber-500 to-brand-cyan text-white flex items-center justify-center shadow-lg shadow-brand-pink/20 shrink-0">
            <Flame className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight font-outfit">
                💡 દૈનિક સુરત વાયરલ ન્યૂઝ આઇડિયાઝ
              </h1>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-accent-success/15 text-accent-success border border-accent-success/30 items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% પ્રમાણિત વિષયો
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              હાઈ-શેર અને હાઈ-એન્ગેજમેન્ટ ધરાવતા સુરતના લોકલ વિષયો. 1-ક્લિકમાં Studio માં મોકલો અને 60 સેકન્ડમાં Reel બનાવો.
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-brand-pink to-pink-600 hover:from-brand-pink/90 hover:to-pink-700 text-white flex items-center justify-center gap-2 shadow-md shadow-brand-pink/25 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "તાજા વિષયો આવી રહ્યા છે..." : "🔄 Refresh Trending News Ideas"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-bg-surface border border-border shadow-sm">
        {/* Category Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 text-xs">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-brand-pink" /> કેટેગરી:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-brand-pink text-white shadow-sm shadow-brand-pink/30 font-bold"
                  : "bg-bg-elevated text-text-muted hover:text-text-primary border border-border/80 hover:border-brand-pink/40"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Area Dropdown */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto">
          <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-cyan" /> વિસ્તાર:
          </span>
          <select
            value={selectedArea}
            onChange={(e) => handleAreaChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary font-semibold focus:outline-none focus:border-brand-cyan"
          >
            {AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading Skeleton or Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-bg-surface border border-border animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-24 h-6 bg-bg-elevated rounded-lg" />
                <div className="w-16 h-6 bg-bg-elevated rounded-lg" />
              </div>
              <div className="w-full h-8 bg-bg-elevated rounded-xl" />
              <div className="w-3/4 h-5 bg-bg-elevated rounded-lg" />
              <div className="w-full h-16 bg-bg-elevated rounded-2xl" />
              <div className="w-full h-11 bg-bg-elevated rounded-xl" />
            </div>
          ))}
        </div>
      ) : newsFeed.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-bg-surface border border-dashed border-border space-y-4">
          <AlertCircle className="w-12 h-12 text-text-muted opacity-60" />
          <h3 className="text-lg font-bold text-text-primary">કોઈ વિષય મળ્યો નથી</h3>
          <p className="text-xs text-text-muted max-w-sm">
            ફિલ્ટર્સ બદલો અથવા તાજા AI ટ્રેન્ડિંગ વિષયો મેળવવા માટે ઉપરના બટન પર ક્લિક કરો.
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-pink text-white shadow-sm"
          >
            🔄 Refresh Topics Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsFeed.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col justify-between p-6 rounded-3xl bg-bg-surface hover:bg-bg-surface/90 border border-border/80 hover:border-brand-pink/50 shadow-sm hover:shadow-xl hover:shadow-brand-pink/5 transition-all group duration-200 relative overflow-hidden"
            >
              {/* Decorative subtle ambient corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-pink/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

              <div className="space-y-4">
                {/* Card Header: Category & Area Badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-brand-pink/15 text-brand-pink border border-brand-pink/25 flex items-center gap-1.5 uppercase tracking-wide">
                    <Tag className="w-3 h-3" />
                    {item.category_code}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {item.target_area}
                  </span>
                </div>

                {/* Big Punchy Headline (Gujarati Dual-Stripe Hook) */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-text-primary font-gujarati leading-snug group-hover:text-brand-pink transition-colors line-clamp-2">
                    {item.line1_headline || item.idea_title}
                  </h3>
                  {item.line2_headline && (
                    <div className="inline-block px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-extrabold font-gujarati">
                      {item.line2_headline}
                    </div>
                  )}
                </div>

                {/* Why it will work (Virality Reason) */}
                <div className="p-3 rounded-2xl bg-bg-elevated/60 border border-border/60 text-xs text-text-muted space-y-1">
                  <div className="flex items-center gap-1.5 text-accent-warning font-bold text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>શા માટે વાયરલ થશે? (Virality Factor):</span>
                  </div>
                  <p className="text-text-primary font-medium text-[11px] leading-relaxed">
                    {item.why_it_works || "લોકલ સુરતીઓ માટે અત્યંત ઉપયોગી અને હાઈ-શેર માહિતી."}
                  </p>
                </div>

                {/* Description summary */}
                <p className="text-xs text-text-muted font-gujarati line-clamp-3 leading-relaxed">
                  {item.description || item.voiceover_script}
                </p>
              </div>

              {/* Card Footer: Action Button */}
              <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => copyScript(item.voiceover_script || item.description, item.id)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-bg-elevated hover:bg-border text-text-muted hover:text-text-primary border border-border transition-colors flex items-center gap-1.5"
                  title="સ્ક્રિપ્ટ કોપી કરો"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">કોપી</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUseInStudio(item)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-brand-pink to-brand-cyan hover:from-brand-pink/90 hover:to-brand-cyan/90 text-white shadow-md shadow-brand-pink/20 hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>⚡ Use This Idea in Studio</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
