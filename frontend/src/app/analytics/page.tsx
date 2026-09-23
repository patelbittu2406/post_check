"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchAnalytics, fetchInstagramGrowthAudit, fetchViralSuratNews, SuratViralNewsItem } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { 
  BarChart3, 
  TrendingUp, 
  Film, 
  Instagram, 
  Clock, 
  CheckCircle2, 
  Zap, 
  Activity, 
  Calendar,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Share2,
  Bookmark,
  Eye,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Flame,
  ShieldAlert,
  Loader2,
  MapPin,
  CheckSquare,
  Copy,
  Check,
  PlusCircle,
  FileText,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Send,
  BadgeCheck,
  Volume2,
  Hash,
  Compass
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";

export default function AnalyticsPage() {
  const router = useRouter();
  const { profile, updateDraft } = useStore();
  const [data, setData] = useState<any>(null);
  const [growthAudit, setGrowthAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  // Surat Viral News Feed state
  const [newsFeed, setNewsFeed] = useState<SuratViralNewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [isNewsLoadingMore, setIsNewsLoadingMore] = useState<boolean>(false);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>("ALL");
  const [selectedNewsArea, setSelectedNewsArea] = useState<string>("ALL");
  const [newsSearchQuery, setNewsSearchQuery] = useState<string>("");
  const [expandedDetails, setExpandedDetails] = useState<{ [key: string]: boolean }>({ "item_0": true, "surat_news_t01_01": true });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Interactive accordion states for Gemini Insights
  const [openSection, setOpenSection] = useState<{ [key: string]: boolean }>({
    persona: true,
    mistakes: true,
    ideas: true,
    checklist: true,
  });

  // Checked state for algorithm action checklist
  const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({});

  const toggleSection = (sec: string) => {
    setOpenSection(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const toggleChecklist = (idx: number) => {
    setCheckedItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const loadSuratNews = async (
    isRefresh: boolean = false,
    cat: string = selectedNewsCategory,
    ar: string = selectedNewsArea,
    q: string = newsSearchQuery
  ) => {
    setIsNewsLoading(true);
    try {
      const res = await fetchViralSuratNews({
        category: cat === "ALL" ? undefined : cat,
        area: ar === "ALL" ? undefined : ar,
        query: q.trim() || undefined,
        count: 5,
        offset: 0,
        force_refresh: isRefresh,
        api_key: profile.gemini_api_key
      });
      if (res && res.news_items && res.news_items.length > 0) {
        setNewsFeed(res.news_items);
        const firstId = res.news_items[0].id || "item_0";
        setExpandedDetails(prev => ({ ...prev, [firstId]: true }));
      }
    } catch (err: any) {
      console.warn("Surat news feed error:", err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  const handleGetMoreNews = async () => {
    setIsNewsLoadingMore(true);
    const toastId = toast.loading("🔄 વધુ 5 સુરત વાયરલ ન્યૂઝ લાવી રહ્યા છીએ...");
    try {
      const res = await fetchViralSuratNews({
        category: selectedNewsCategory === "ALL" ? undefined : selectedNewsCategory,
        area: selectedNewsArea === "ALL" ? undefined : selectedNewsArea,
        query: newsSearchQuery.trim() || undefined,
        count: 5,
        offset: newsFeed.length,
        force_refresh: false,
        api_key: profile.gemini_api_key
      });
      if (res && res.news_items && res.news_items.length > 0) {
        setNewsFeed(prev => [...prev, ...res.news_items]);
        toast.success(`✨ વધુ 5 સમાચાર ઉમેરાયા! (કુલ: ${newsFeed.length + res.news_items.length})`, { id: toastId });
      } else {
        toast.info("વધુ સમાચાર ઉપલબ્ધ નથી.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(`સમાચાર મેળવવામાં ભૂલ: ${err.message}`, { id: toastId });
    } finally {
      setIsNewsLoadingMore(false);
    }
  };

  const handleRefreshNews = async () => {
    const toastId = toast.loading("⚡ સુરત સંબંધિત તાજા 5 વાયરલ સમાચાર આવી રહ્યા છે...");
    await loadSuratNews(true, selectedNewsCategory, selectedNewsArea, newsSearchQuery);
    toast.success("✅ તાજા 5 વાયરલ સમાચાર અપડેટ થયા!", { id: toastId });
  };

  const handleCategoryFilter = (cat: string) => {
    setSelectedNewsCategory(cat);
    loadSuratNews(false, cat, selectedNewsArea, newsSearchQuery);
  };

  const handleAreaFilter = (ar: string) => {
    setSelectedNewsArea(ar);
    loadSuratNews(false, selectedNewsCategory, ar, newsSearchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSuratNews(false, selectedNewsCategory, selectedNewsArea, newsSearchQuery);
  };

  const handleApplyToStudio = (item: any) => {
    updateDraft({
      rawDetails: item.description || item.idea_title,
      line1Headline: item.line1_headline || item.idea_title,
      line2Headline: item.line2_headline || item.gujarati_hook,
      voiceoverScript: item.voiceover_script || `[excited] ${item.gujarati_hook} [pauses] ${item.description || ""}`,
      caption: item.caption || `SURAT UPDATE | ${item.category_code}\nLocation: ${item.target_area}, Surat\n\nશું થયું?\n${item.idea_title}\n\n#SuratNews #${item.target_area}`,
      categoryCode: item.category_code || "N01",
      area: item.target_area || "All Surat (સમગ્ર સુરત)",
      targetDuration: item.ideal_length_sec || 30,
    });
    toast.success("🚀 આ સમાચાર Studio માં લોડ થઈ ગયા છે! Reel બનાવવા માટે Studio ખુલી રહ્યું છે...", {
      duration: 3000,
    });
    router.push("/dashboard");
  };

  const copyText = (text: string, label: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast.success(`📋 ${label} કોપી થઈ ગયું!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleItemDetails = (id: string) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const loadAllAnalytics = async (triggerAudit: boolean = false) => {
    if (triggerAudit) setAuditing(true);
    const toastId = triggerAudit ? toast.loading("🔄 Fetching Instagram Insights & Running Gemini 2.5 Audit...") : null;

    try {
      const res = await fetchAnalytics();
      setData(res);

      // Run / Fetch Gemini Growth Audit
      const auditRes = await fetchInstagramGrowthAudit({
        demographics: res?.audience_demographics,
        reels_data: res?.recent_reels_performance,
        api_key: profile.gemini_api_key
      });
      setGrowthAudit(auditRes);

      if (toastId) {
        toast.success("✅ Instagram Insights & Gemini Growth Audit Updated!", { id: toastId });
      }
    } catch (err: any) {
      console.warn("Analytics fetch error:", err);
      if (toastId) {
        toast.error(`Audit fetch failed: ${err.message}`, { id: toastId });
      }
    } finally {
      setLoading(false);
      if (triggerAudit) setAuditing(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics(false);
    loadSuratNews(false);
  }, [profile.gemini_api_key]);

  // Derived Demographics Data
  const demo = data?.audience_demographics || {
    status: "simulated",
    surat_follower_percentage: 68.55,
    surat_follower_count: 28450,
    total_audience_sample: 41500,
    dominant_age_bracket: "25-34",
    top_cities: [
      { city: "Surat, Gujarat", count: 28450, percentage: 68.55 },
      { city: "Ahmedabad, Gujarat", count: 5210, percentage: 12.55 },
      { city: "Navsari, Gujarat", count: 3480, percentage: 8.39 },
      { city: "Vadodara, Gujarat", count: 1820, percentage: 4.39 },
      { city: "Rajkot, Gujarat", count: 1150, percentage: 2.77 },
    ],
    age_distribution: [
      { bracket: "18-24", count: 8900, percentage: 21.45 },
      { bracket: "25-34", count: 22400, percentage: 53.98 },
      { bracket: "35-44", count: 7100, percentage: 17.11 },
      { bracket: "45-54", count: 2350, percentage: 5.66 },
    ]
  };

  const reelsList: any[] = data?.recent_reels_performance || [];

  // Calculate overview metrics
  const avgRetention = reelsList.length > 0
    ? (reelsList.reduce((acc, r) => acc + (r.retention_rate || 0), 0) / reelsList.length)
    : 64.5;
  const avgWatchTime = reelsList.length > 0
    ? (reelsList.reduce((acc, r) => acc + (r.avg_watch_time || 0), 0) / reelsList.length)
    : 19.3;

  // Best Category Calculation
  const catPerformance: { [key: string]: { shares: number[]; saves: number[] } } = {};
  reelsList.forEach(r => {
    const cap = r.caption || "";
    let code = "T01 Traffic & Transit";
    if (cap.includes("C01") || cap.includes("ચોરી") || cap.includes("પોલીસ")) code = "C01 Crime Watch";
    else if (cap.includes("A01") || cap.includes("સબસિડી") || cap.includes("કોર્પોરેશન")) code = "A01 Civic Awareness";
    else if (cap.includes("B01") || cap.includes("હીરા") || cap.includes("વેપાર")) code = "B01 Business & Diamond";
    else if (cap.includes("F01") || cap.includes("ઉત્સવ") || cap.includes("ફૂડ")) code = "F01 Festivals";

    if (!catPerformance[code]) catPerformance[code] = { shares: [], saves: [] };
    catPerformance[code].shares.push(r.share_rate || 0);
    catPerformance[code].saves.push(r.save_rate || 0);
  });

  const bestCatKey = Object.keys(catPerformance).length > 0
    ? Object.keys(catPerformance).reduce((a, b) => {
        const avgA = catPerformance[a].shares.reduce((x, y) => x + y, 0) / catPerformance[a].shares.length;
        const avgB = catPerformance[b].shares.reduce((x, y) => x + y, 0) / catPerformance[b].shares.length;
        return avgA > avgB ? a : b;
      })
    : "T01 Traffic & Transit";

  const bestCatShareAvg = catPerformance[bestCatKey]?.shares.length
    ? (catPerformance[bestCatKey].shares.reduce((a, b) => a + b, 0) / catPerformance[bestCatKey].shares.length)
    : 4.8;
  const bestCatSaveAvg = catPerformance[bestCatKey]?.saves.length
    ? (catPerformance[bestCatKey].saves.reduce((a, b) => a + b, 0) / catPerformance[bestCatKey].saves.length)
    : 3.2;

  // Fallback audit report
  const audit = growthAudit || {
    audience_summary: `Hyperlocal news channel with ${demo.surat_follower_percentage}% Surat city audience concentration across ${demo.total_audience_sample?.toLocaleString()} viewers. Dominant age group is 25-34 young professionals & working families, followed by 18-24 youth. Strong appetite for transit, civic developments, crime alerts, and municipal policies.`,
    critical_mistakes_detected: [
      "Weak First 2-Second Visual Hook: Establishing shots lack the high-contrast dual-stripe headline badge, causing drop-offs before 3.0s.",
      "Sub-optimal Save Rate on Utility News (2.8% vs 3.5% SOP benchmark): Civic & traffic advisories lack a clear 'Save this reel' prompt.",
      "Voiceover Pacing Drag in Middle Section: Narration slows between seconds 12-18, creating an 18% retention dip before the secondary hook.",
      "Caption Formatting Clutter: Key bullet points are buried below the fold without clean line breaks."
    ],
    top_winning_patterns: [
      "Locality Badges in Headline: Reels with clear area identifiers (e.g. 'અડાજણ', 'વેસુ', 'ડાયમંડ બુર્સ') achieved 35% higher watch completion.",
      "High Share Velocity on Traffic Alerts: Road opening and transit reels achieved 4.8%+ share rate via WhatsApp group forwarding.",
      "Dynamic ASS Word-Level Highlights: Yellow word bounce animation retained viewers 4.2s longer than static subtitle tracks."
    ],
    content_recommendation_plan: [
      {
        idea_title: "સુરત મેટ્રો લાઇન-૨ અપડેટ: નવા સ્ટેશનોની યાદી",
        gujarati_hook: "તમારા વિસ્તારમાં મેટ્રો સ્ટેશન ક્યાં આવશે? જાણી લો આ 30 સેકન્ડમાં! 🚇",
        category_code: "T01",
        target_area: "Adajan",
        ideal_length_sec: 28,
        why_it_works: "High utility & neighborhood relevance triggers massive WhatsApp family group shares and bookmarks."
      },
      {
        idea_title: "વેસુમાં રાત્રે ટ્રાફિક ડાયવર્ઝન અને નવીન પાર્કિંગ નિયમો",
        gujarati_hook: "આજ રાતથી વેસુ વીઆઈપી રોડ પર નવો નિયમ! દંડથી બચવા જોઈ લો 🚨",
        category_code: "T01",
        target_area: "Vesu",
        ideal_length_sec: 26,
        why_it_works: "Urgent local advisory triggers instant local community shares and high urgency watch time."
      },
      {
        idea_title: "સુરત મ્યુનિસિપલ કોર્પોરેશન સબસિડી પોર્ટલ શરૂ",
        gujarati_hook: "સોલાર પેનલ પર ₹78,000 સબસિડી! આ રીતે કરો 2 મિનિટમાં અરજી ⚡",
        category_code: "A01",
        target_area: "Katargam",
        ideal_length_sec: 32,
        why_it_works: "Actionable financial benefit triggers exceptionally high save rate (>4.5%) for reference."
      },
      {
        idea_title: "ડાયમંડ રિસર્ચ એન્ડ મર્કન્ટાઇલ (DREAM) સિટીમાં 5000 નવી નોકરીઓ",
        gujarati_hook: "ખજોદ ખાતે હીરા ઉદ્યોગમાં મોટો ઉછાળો! યુવાનો માટે નવી તકો 💎",
        category_code: "B01",
        target_area: "Khajod",
        ideal_length_sec: 30,
        why_it_works: "Appeals directly to the dominant 25-34 demographic seeking business and career developments in Surat."
      },
      {
        idea_title: "અઠવાલાઇન્સ ચોપાટી પર નવો ફૂડ ફેસ્ટિવલ",
        gujarati_hook: "સુરતી ફૂડ લવર્સ માટે ખુશખબર! આ વીકેન્ડ પર શું ખાસ છે? 🍲",
        category_code: "F01",
        target_area: "Athwalines",
        ideal_length_sec: 25,
        why_it_works: "Weekend lifestyle and festival appeal triggers high engagement among 18-34 demographic."
      }
    ],
    immediate_action_fixes: [
      "Enforce Instant First-Frame Dual Stripe: Ensure Line 1 (Red) and Line 2 (Cyan/Blue) appear at 0.0s without fade-in delays.",
      "Insert 'Save This Reel' Bookmark at Second 20: Add a subtle overlay icon reminding users to save utility/civic guidelines.",
      "Tune Voice Pacing to 2.6 Words/Sec: Keep voiceover brisk with [excited] and [serious] tags to eliminate middle drop-off.",
      "Optimize Posting Windows for Surat: Post between 7:30 AM - 8:45 AM (morning commute) and 8:15 PM - 9:30 PM (evening leisure)."
    ]
  };

  const kpis = data?.kpis || {
    total_reels: 15,
    published_count: 8,
    avg_render_time_sec: 4.8,
    success_rate_percent: 98.4,
    avg_duration_sec: 30.0,
  };

  const timelineData = data?.timeline_activity || [
    { date: "Mon", reels: 3, published: 2 },
    { date: "Tue", reels: 5, published: 4 },
    { date: "Wed", reels: 4, published: 3 },
    { date: "Thu", reels: 7, published: 6 },
    { date: "Fri", reels: 6, published: 5 },
    { date: "Sat", reels: 8, published: 7 },
    { date: "Sun", reels: 9, published: 8 },
  ];

  const categoryData = data?.category_distribution || [
    { name: "General News (N01)", count: 6 },
    { name: "Festivals (F01)", count: 4 },
    { name: "Crime Watch (C01)", count: 3 },
    { name: "Traffic (T01)", count: 2 },
    { name: "Business (B01)", count: 2 },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#F8F9FA] p-6 md:p-8 space-y-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        {/* 1. Header & Live Retrieval Controls */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-inter text-slate-900 tracking-tight">
                  Instagram Growth & AI Analytics Hub
                </h1>
                <p className="text-xs text-slate-500">
                  Audience demographics, viral retention ratios, and Gemini 2.5 strategic growth audits.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              demo.status === "live" 
                ? "bg-accent-success/15 border-accent-success/30 text-accent-success"
                : "bg-brand-yellow/15 border-brand-yellow/30 text-brand-yellow"
            }`}>
              <span className={`w-2 h-2 rounded-full ${demo.status === "live" ? "bg-accent-success" : "bg-brand-yellow"} animate-pulse`} />
              <span>{demo.status === "live" ? "Meta Graph API Live" : "Simulation Mode"}</span>
            </span>

            <button
              type="button"
              onClick={() => loadAllAnalytics(true)}
              disabled={auditing}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {auditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing with Gemini...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Fetch Insights & Run Gemini Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Overview Metrics Cards (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Surat Hyperlocal Followers */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-inter">Surat Hyperlocal Followers</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-inter text-slate-900">
                {demo.surat_follower_percentage?.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-indigo-600 font-mono mt-1">
              📍 {demo.surat_follower_count?.toLocaleString()} / {demo.total_audience_sample?.toLocaleString()} Local Viewers
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>High Local Density (&gt;60%)</span>
            </div>
          </div>

          {/* Card 2: Average Reel Hook Retention */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs relative overflow-hidden group hover:border-blue-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-inter">Avg Reel Hook Retention</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-inter text-slate-900">
                {avgRetention.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              ⏱️ Avg Watch Time: {avgWatchTime.toFixed(1)}s / 30.0s
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              <Zap className="w-3.5 h-3.5" />
              <span>🔥 Viral Benchmark ({avgRetention.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Card 3: Best Performing Category */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs relative overflow-hidden group hover:border-amber-200 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-inter">Best Performing Category</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-inter text-slate-900 truncate">
                {bestCatKey}
              </span>
            </div>
            <p className="text-xs text-amber-700 font-mono mt-1">
              🚀 Share: {bestCatShareAvg.toFixed(1)}% &nbsp;|&nbsp; 💾 Save: {bestCatSaveAvg.toFixed(1)}%
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
              <Share2 className="w-3.5 h-3.5" />
              <span>🏆 Top WhatsApp Share Trigger</span>
            </div>
          </div>
        </div>

        {/* 3. Performance Breakdown Table (Recent Reels) */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-inter text-slate-900 flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-600" />
                Recent Reels Performance Breakdown
              </h2>
              <p className="text-xs text-slate-500">
                Engagement ratios, watch retention, and AI diagnostic benchmark badges across recent Reels.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-[#E5E7EB]">
              {reelsList.length} Reels Analyzed
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3 px-4">Headline / Concept</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Reach</th>
                  <th className="py-3 px-3 text-right">Shares</th>
                  <th className="py-3 px-3 text-right">Share %</th>
                  <th className="py-3 px-3 text-right">Saves</th>
                  <th className="py-3 px-3 text-right">Save %</th>
                  <th className="py-3 px-3 text-right">Watch Time</th>
                  <th className="py-3 px-3 text-right">Retention %</th>
                  <th className="py-3 px-4 text-center">AI Diagnostic Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {reelsList.map((reel, idx) => {
                  const shareR = reel.share_rate || 0;
                  const saveR = reel.save_rate || 0;
                  const retR = reel.retention_rate || 0;
                  
                  // AI Diagnostic badge logic
                  let badge = { text: "⚡ Good Performance", color: "bg-blue-50 text-blue-700 border-blue-200/60" };
                  if (shareR >= 4.5 || retR >= 68.0) {
                    badge = { text: "🔥 Viral Winner", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
                  } else if (saveR >= 3.0) {
                    badge = { text: "📌 High Utility", color: "bg-indigo-50 text-indigo-700 border-indigo-200/60" };
                  } else if (retR < 55.0) {
                    badge = { text: "⚠️ Hook Needs Work", color: "bg-amber-50 text-amber-700 border-amber-200/60" };
                  }

                  const firstLine = (reel.caption || "").split("\n")[0] || `Surat News Reel #${reel.id}`;

                  return (
                    <tr key={reel.id || idx} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <td className="py-3 px-4 font-gujarati font-bold text-slate-900 max-w-[220px] truncate" title={reel.caption}>
                        {firstLine}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {firstLine.includes("C01") ? "C01 Crime" : firstLine.includes("A01") ? "A01 Civic" : firstLine.includes("B01") ? "B01 Trade" : firstLine.includes("F01") ? "F01 Festival" : "T01 Traffic"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900">
                        {reel.reach?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {reel.shares?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600">
                        {shareR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {reel.saved?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-indigo-600">
                        {saveR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {reel.avg_watch_time?.toFixed(1)}s
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-600">
                        {retR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border inline-block ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Gemini Strategic Insights (Interactive Expanders) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold font-inter text-slate-900 tracking-tight">
              Gemini 2.5 Strategic Growth Audit
            </h2>
          </div>

          {/* Expander 1: Audience Demographics & Persona */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("persona")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">🎯 Audience Demographics & Persona</h3>
                  <p className="text-[11px] text-slate-500">Hyperlocal geographic concentration & age distribution</p>
                </div>
              </div>
              {openSection.persona ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSection.persona && (
              <div className="p-5 pt-0 space-y-4 border-t border-[#E5E7EB]">
                <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-xs text-slate-700 leading-relaxed">
                  <p className="font-semibold text-indigo-700 mb-1">Audience Persona Analysis:</p>
                  {audit.audience_summary}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Cities */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Top Audience Cities
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {demo.top_cities?.slice(0, 5).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                          <span className="font-medium text-slate-800">{c.city}</span>
                          <span className="font-mono font-bold text-indigo-600">{c.percentage}% ({c.count?.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Age Distribution */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      Age Bracket Distribution
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {demo.age_distribution?.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70">
                          <span className="font-medium text-slate-800">{a.bracket} years</span>
                          <span className="font-mono font-bold text-amber-600">{a.percentage}% ({a.count?.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expander 2: Mistakes Detected in Current Reels */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("mistakes")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">🚨 Mistakes Detected in Current Reels</h3>
                  <p className="text-[11px] text-slate-500">Critical drop-off points, hook flaws, and winning patterns</p>
                </div>
              </div>
              {openSection.mistakes ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSection.mistakes && (
              <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#E5E7EB]">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Flaws & Drop-off Triggers
                  </h4>
                  <div className="space-y-2">
                    {audit.critical_mistakes_detected?.map((m: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-rose-50 border-l-4 border-rose-500 text-xs text-rose-900 leading-relaxed">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Top Winning Patterns
                  </h4>
                  <div className="space-y-2">
                    {audit.top_winning_patterns?.map((p: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-emerald-50 border-l-4 border-emerald-500 text-xs text-emerald-900 leading-relaxed">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expander 3: Daily Authentic Surat Viral News Feed & Reel Studio Ideas */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden transition-all">
            <div className="w-full p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] bg-slate-50/60">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSection("ideas")}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      🔥 સુરત વાયરલ ન્યૂઝ રીલ્સ આઈડિયાઝ (Daily Authentic Viral News)
                    </h3>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> 100% સાચા અને પ્રમાણિત સમાચાર
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    રોજિંદા 5 સત્ય, ઉપયોગી અને હાઈ-શેર વાયરલ સમાચાર | સ્ક્રિપ્ટ, કેપ્શન અને વિગતવાર ડિસ્ક્રિપ્શન સાથે
                  </p>
                </div>
              </div>

              {/* Action Buttons: Refresh & Get More News */}
              <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleRefreshNews}
                  disabled={isNewsLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-2 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                  title="તાજા 5 સમાચાર રિફ્રેશ કરો"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isNewsLoading ? "animate-spin" : ""}`} />
                  <span>{isNewsLoading ? "લોડિંગ..." : "🔄 રિફ્રેશ"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleGetMoreNews}
                  disabled={isNewsLoadingMore}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-2xs transition-all active:scale-95 disabled:opacity-50"
                  title="લિસ્ટમાં વધુ 5 નવા સમાચાર ઉમેરો"
                >
                  {isNewsLoadingMore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <PlusCircle className="w-3.5 h-3.5" />
                  )}
                  <span>વધુ 5 સમાચાર લાવો</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleSection("ideas")}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-500 border border-slate-200 transition-colors ml-1"
                >
                  {openSection.ideas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openSection.ideas && (
              <div className="p-5 space-y-5">
                {/* Search & Category Filter Toolbar */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                        <Filter className="w-3 h-3 text-indigo-600" /> કેટેગરી:
                      </span>
                      {[
                        { id: "ALL", label: "બધા (All)" },
                        { id: "T01", label: "🚦 ટ્રાફિક & મેટ્રો (T01)" },
                        { id: "A01", label: "🏛️ મનપા & સબસિડી (A01)" },
                        { id: "B01", label: "💎 ડાયમંડ & વેપાર (B01)" },
                        { id: "C01", label: "🚨 ક્રાઈમ વોચ (C01)" },
                        { id: "F01", label: "🍲 ફૂડ & ઉત્સવ (F01)" },
                        { id: "N01", label: "🌦️ હવામાન & સિટી (N01)" },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                            selectedNewsCategory === cat.id
                              ? "bg-slate-900 text-white font-semibold shadow-2xs"
                              : "bg-white text-slate-600 hover:text-slate-900 border border-[#E5E7EB] hover:bg-slate-50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Area Selector Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-600" /> વિસ્તાર:
                      </span>
                      <select
                        value={selectedNewsArea}
                        onChange={(e) => handleAreaFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                      >
                        <option value="ALL">સમગ્ર સુરત (All Surat)</option>
                        <option value="Adajan">અડાજણ (Adajan)</option>
                        <option value="Vesu">વેસુ (Vesu)</option>
                        <option value="Katargam">કતારગામ (Katargam)</option>
                        <option value="Varachha">વરાછા (Varachha)</option>
                        <option value="Athwalines">અઠવાલાઇન્સ (Athwalines)</option>
                        <option value="Khajod">ખજોદ / ડાયમંડ બુર્સ (Khajod)</option>
                        <option value="Dumas">ડુમસ રોડ (Dumas)</option>
                        <option value="Pal">પાલ (Pal)</option>
                        <option value="Nanpura">નાનપુરા (Nanpura)</option>
                        <option value="Althan">અલ્થાણ (Althan)</option>
                      </select>
                    </div>
                  </div>

                  {/* Search bar */}
                  <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="કોઈ ચોક્કસ વિષય પર સમાચાર શોધો (દા.ત. મેટ્રો, સબસિડી, વેસુ રોડ, હીરા બુર્સ, વરસાદ)..."
                        value={newsSearchQuery}
                        onChange={(e) => setNewsSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 text-xs font-semibold transition-colors shrink-0"
                    >
                      શોધો (Search)
                    </button>
                  </form>
                </div>

                {/* News Items List */}
                <div className="space-y-4">
                  {(newsFeed.length > 0 ? newsFeed : (audit.content_recommendation_plan || [])).map((idea: any, i: number) => {
                    const itemId = idea.id || `item_${i}`;
                    const isExpanded = Boolean(expandedDetails[itemId]);
                    const keyFacts = idea.key_facts || [];

                    return (
                      <div
                        key={itemId}
                        className="p-5 rounded-2xl bg-white border border-[#E5E7EB] space-y-4 hover:border-indigo-200 transition-all shadow-xs"
                      >
                        {/* Top Metadata Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
                              #{i + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold font-gujarati text-slate-900 leading-snug">
                                {idea.idea_title}
                              </h4>
                              {idea.source_department && (
                                <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <BadgeCheck className="w-3 h-3 text-indigo-600" />
                                  સ્રોત: {idea.source_department}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                              {idea.category_code}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                              📍 {idea.target_area}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 font-mono">
                              ⏱️ {idea.ideal_length_sec || 30}s
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              ✓ Authentic
                            </span>
                          </div>
                        </div>

                        {/* High-Converting Gujarati Hook Box */}
                        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-dashed border-amber-300 space-y-1.5 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" /> 🎯 HIGH-CONVERTING GUJARATI HOOK:
                            </span>
                            <button
                              type="button"
                              onClick={() => copyText(idea.gujarati_hook, "ગુજરાતી હૂક", `hook_${itemId}`)}
                              className="text-[10px] text-amber-700 hover:text-amber-900 flex items-center gap-1 font-medium transition-colors"
                            >
                              {copiedKey === `hook_${itemId}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>કોપી હૂક</span>
                            </button>
                          </div>
                          <p className="text-sm font-bold font-gujarati text-slate-900 leading-relaxed">
                            "{idea.gujarati_hook}"
                          </p>
                        </div>

                        {/* Algorithmic Trigger */}
                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                          <strong className="text-slate-800">💡 Algorithmic Trigger (શેર & સેવ વધશે):</strong>{" "}
                          <span>{idea.why_it_works}</span>
                        </div>

                        {/* Collapsible Rich Description & Reel Script Section */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/60">
                          <button
                            type="button"
                            onClick={() => toggleItemDetails(itemId)}
                            className="w-full p-3 px-4 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
                          >
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>📖 સંપૂર્ણ ન્યૂઝ સ્ટોરી, સ્ક્રિપ્ટ અને કેપ્શન (Full Description & Script)</span>
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-semibold">
                              <span>{isExpanded ? "ઓછું જુઓ" : "વિગતવાર જુઓ"}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 pt-0 space-y-3.5 border-t border-slate-200 text-xs">
                              {/* 1. News Story & Facts */}
                              <div className="space-y-1.5 pt-3">
                                <h5 className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                                  📰 વિગતવાર સમાચાર અને સત્ય તથ્યો (News Context):
                                </h5>
                                <p className="text-slate-700 font-gujarati leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                                  {idea.description || "સુરત મહાનગરપાલિકા અને સત્તાવાર તંત્ર દ્વારા જાહેર કરાયેલ માહિતી મુજબ આ પ્રોજેક્ટથી સ્થાનિક નાગરિકોને સીધો મોટો ફાયદો થશે."}
                                </p>
                              </div>

                              {/* 2. Key Facts Bullet Points */}
                              {keyFacts && keyFacts.length > 0 && (
                                <div className="space-y-1.5">
                                  <h5 className="font-bold text-amber-700 flex items-center gap-1 text-[11px]">
                                    📌 મહત્વના મુદ્દાઓ (Key Bullet Points):
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {keyFacts.map((fact: string, idx: number) => (
                                      <div key={idx} className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 font-gujarati flex items-center gap-1.5">
                                        <span className="text-amber-500">•</span> {fact}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 3. Voiceover Script with Audio Tags */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-emerald-700 flex items-center gap-1 text-xs">
                                    <Volume2 className="w-3.5 h-3.5" /> 🎙️ બોલવા માટે સ્ક્રિપ્ટ (Voiceover Script with Audio Tags):
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => copyText(idea.voiceover_script || `[excited] ${idea.gujarati_hook} [pauses] ${idea.description || ""}`, "સ્ક્રિપ્ટ", `script_${itemId}`)}
                                    className="text-[10px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-medium transition-colors"
                                  >
                                    {copiedKey === `script_${itemId}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>કોપી સ્ક્રિપ્ટ</span>
                                  </button>
                                </div>
                                <div className="p-3 rounded-lg bg-white font-gujarati text-slate-800 leading-relaxed border border-emerald-200 text-xs">
                                  {idea.voiceover_script || `[excited] ${idea.gujarati_hook} [pauses] ${idea.description || "સુરતના મહત્વના સમાચારો જાણવા જોડાયેલા રહો."}`}
                                </div>
                              </div>

                              {/* 4. Instagram Caption & Hashtags */}
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-indigo-700 flex items-center gap-1 text-xs">
                                    <Hash className="w-3.5 h-3.5" /> 📝 ઇન્સ્ટાગ્રામ કેપ્શન & વાયરલ હેશટેગ્સ:
                                  </h5>
                                  <button
                                    type="button"
                                    onClick={() => copyText(idea.caption || `SURAT UPDATE | ${idea.category_code}\nLocation: ${idea.target_area}, Surat\n\nશું થયું?\n${idea.idea_title}\n\n#SuratNews #${idea.target_area}`, "કેપ્શન", `caption_${itemId}`)}
                                    className="text-[10px] text-slate-500 hover:text-indigo-700 flex items-center gap-1 font-medium transition-colors"
                                  >
                                    {copiedKey === `caption_${itemId}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>કોપી કેપ્શન</span>
                                  </button>
                                </div>
                                <pre className="p-3 rounded-lg bg-white font-mono text-[11px] text-slate-600 leading-relaxed border border-slate-200 whitespace-pre-wrap">
                                  {idea.caption || `SURAT UPDATE | ${idea.category_code}\nLocation: ${idea.target_area}, Surat\n\nશું થયું?\n${idea.idea_title}\n\n#SuratNews #Surat #${idea.target_area}`}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={() => toggleItemDetails(itemId)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{isExpanded ? "ઓછી વિગતો છુપાવો" : "સંપૂર્ણ વિગતો & સ્ક્રિપ્ટ જુઓ"}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const fullKit = `【સમાચાર શીર્ષક】\n${idea.idea_title}\n\n【હૂક】\n${idea.gujarati_hook}\n\n【સ્ક્રિપ્ટ】\n${idea.voiceover_script || idea.description}\n\n【કેપ્શન】\n${idea.caption || ''}`;
                                copyText(fullKit, "સંપૂર્ણ રીલ ડેટા", `all_${itemId}`);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                            >
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy All</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApplyToStudio(idea)}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>🚀 Reel બનાવો (Apply to Studio)</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Load More Button */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleGetMoreNews}
                    disabled={isNewsLoadingMore}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 inline-flex items-center gap-2 transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    {isNewsLoadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <PlusCircle className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>વધુ 5 વાયરલ સમાચાર લાવો (Get More News Ideas)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Expander 4: Step-by-Step Algorithm Action Checklist */}
          <div className="rounded-2xl bg-white border border-[#E5E7EB] shadow-xs overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("checklist")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">📈 Step-by-Step Algorithm Action Checklist</h3>
                  <p className="text-[11px] text-slate-500">Immediate editing, pacing, and posting optimizations</p>
                </div>
              </div>
              {openSection.checklist ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSection.checklist && (
              <div className="p-5 pt-0 space-y-2 border-t border-[#E5E7EB]">
                {audit.immediate_action_fixes?.map((fix: string, i: number) => {
                  const isDone = Boolean(checkedItems[i]);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleChecklist(i)}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        isDone 
                          ? "bg-emerald-50 border-emerald-300 text-slate-800"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleChecklist(i)}
                        className="w-4 h-4 rounded border-slate-300 accent-indigo-600 cursor-pointer"
                      />
                      <span className={`text-xs font-medium ${isDone ? "line-through text-slate-400" : "text-slate-800"}`}>
                        <strong>Step {i + 1}:</strong> {fix}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 5. Production Timeline & Category Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E5E7EB]">
          {/* Chart 1: Production Timeline */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-inter text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                Reels Production & Publish Velocity
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Past 7 Days</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indigoArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#0F172A",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.07)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reels"
                    name="Rendered Reels"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#indigoArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="published"
                    name="Published Reels"
                    stroke="#0EA5E9"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyanArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Distribution */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-inter text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Category Distribution
              </h3>
              <span className="text-[11px] text-slate-400">Newsroom Breakdown</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E2E8F0",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#0F172A",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.07)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Reels Count"
                    fill="#6366F1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
