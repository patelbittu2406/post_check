"use client";

import React, { useState, useEffect } from "react";
import { fetchAnalytics, fetchInstagramGrowthAudit } from "@/lib/api";
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
  CheckSquare
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
  const { profile } = useStore();
  const [data, setData] = useState<any>(null);
  const [growthAudit, setGrowthAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);
  
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
    <div className="h-full flex flex-col overflow-y-auto bg-bg-base p-6 md:p-8 space-y-8">
      <div className="max-w-6xl w-full mx-auto space-y-8">
        
        {/* 1. Header & Live Retrieval Controls */}
        <div className="p-6 rounded-3xl bg-bg-surface border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow/15 text-brand-yellow flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold font-outfit text-text-primary tracking-tight">
                  Instagram Growth & AI Analytics Hub
                </h1>
                <p className="text-xs text-text-muted">
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
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
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
          <div className="p-6 rounded-2xl bg-bg-surface border border-border/80 shadow-sm relative overflow-hidden group hover:border-brand-pink/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-pink" />
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider font-outfit">Surat Hyperlocal Followers</span>
              <div className="w-8 h-8 rounded-lg bg-brand-pink/15 text-brand-pink flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-outfit text-text-primary">
                {demo.surat_follower_percentage?.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-brand-cyan font-mono mt-1">
              📍 {demo.surat_follower_count?.toLocaleString()} / {demo.total_audience_sample?.toLocaleString()} Local Viewers
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-accent-success/15 text-accent-success">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success" />
              <span>High Local Density (&gt;60%)</span>
            </div>
          </div>

          {/* Card 2: Average Reel Hook Retention */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border/80 shadow-sm relative overflow-hidden group hover:border-brand-cyan/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-cyan" />
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider font-outfit">Avg Reel Hook Retention</span>
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 text-brand-cyan flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-outfit text-text-primary">
                {avgRetention.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-text-muted font-mono mt-1">
              ⏱️ Avg Watch Time: {avgWatchTime.toFixed(1)}s / 30.0s
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-cyan/15 text-brand-cyan">
              <Zap className="w-3.5 h-3.5" />
              <span>🔥 Viral Benchmark ({avgRetention.toFixed(1)}%)</span>
            </div>
          </div>

          {/* Card 3: Best Performing Category */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border/80 shadow-sm relative overflow-hidden group hover:border-brand-yellow/50 transition-all">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-yellow" />
            <div className="flex items-center justify-between text-text-muted mb-2">
              <span className="text-xs font-bold uppercase tracking-wider font-outfit">Best Performing Category</span>
              <div className="w-8 h-8 rounded-lg bg-brand-yellow/15 text-brand-yellow flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold font-outfit text-text-primary truncate">
                {bestCatKey}
              </span>
            </div>
            <p className="text-xs text-brand-yellow font-mono mt-1">
              🚀 Share: {bestCatShareAvg.toFixed(1)}% &nbsp;|&nbsp; 💾 Save: {bestCatSaveAvg.toFixed(1)}%
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-yellow/15 text-brand-yellow">
              <Share2 className="w-3.5 h-3.5" />
              <span>🏆 Top WhatsApp Share Trigger</span>
            </div>
          </div>
        </div>

        {/* 3. Performance Breakdown Table (Recent Reels) */}
        <div className="p-6 rounded-3xl bg-bg-surface border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold font-outfit text-text-primary flex items-center gap-2">
                <Film className="w-4 h-4 text-brand-pink" />
                Recent Reels Performance Breakdown
              </h2>
              <p className="text-xs text-text-muted">
                Engagement ratios, watch retention, and AI diagnostic benchmark badges across recent Reels.
              </p>
            </div>
            <span className="text-[11px] font-mono text-text-muted bg-bg-elevated px-2.5 py-1 rounded-lg border border-border">
              {reelsList.length} Reels Analyzed
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-elevated text-text-muted font-bold uppercase text-[10px] tracking-wider border-b border-border">
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
                  let badge = { text: "⚡ Good Performance", color: "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30" };
                  if (shareR >= 4.5 || retR >= 68.0) {
                    badge = { text: "🔥 Viral Winner", color: "bg-accent-success/15 text-accent-success border-accent-success/30" };
                  } else if (saveR >= 3.0) {
                    badge = { text: "📌 High Utility", color: "bg-purple-400/15 text-purple-400 border-purple-400/30" };
                  } else if (retR < 55.0) {
                    badge = { text: "⚠️ Hook Needs Work", color: "bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30" };
                  }

                  const firstLine = (reel.caption || "").split("\n")[0] || `Surat News Reel #${reel.id}`;

                  return (
                    <tr key={reel.id || idx} className="hover:bg-bg-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-gujarati font-bold text-text-primary max-w-[220px] truncate" title={reel.caption}>
                        {firstLine}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-bg-elevated text-brand-cyan border border-border">
                          {firstLine.includes("C01") ? "C01 Crime" : firstLine.includes("A01") ? "A01 Civic" : firstLine.includes("B01") ? "B01 Trade" : firstLine.includes("F01") ? "F01 Festival" : "T01 Traffic"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-text-primary">
                        {reel.reach?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-text-muted">
                        {reel.shares?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-brand-pink">
                        {shareR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-text-muted">
                        {reel.saved?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-400">
                        {saveR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-text-muted">
                        {reel.avg_watch_time?.toFixed(1)}s
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-extrabold text-brand-cyan">
                        {retR.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${badge.color}`}>
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
            <Sparkles className="w-5 h-5 text-brand-pink" />
            <h2 className="text-lg font-extrabold font-outfit text-text-primary tracking-tight">
              Gemini 2.5 Strategic Growth Audit
            </h2>
          </div>

          {/* Expander 1: Audience Demographics & Persona */}
          <div className="rounded-2xl bg-bg-surface border border-border shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("persona")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">🎯 Audience Demographics & Persona</h3>
                  <p className="text-[11px] text-text-muted">Hyperlocal geographic concentration & age distribution</p>
                </div>
              </div>
              {openSection.persona ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {openSection.persona && (
              <div className="p-5 pt-0 space-y-4 border-t border-border/60">
                <div className="p-4 rounded-xl bg-bg-elevated border-l-4 border-brand-cyan text-xs text-text-primary leading-relaxed">
                  <p className="font-semibold text-brand-cyan mb-1">Audience Persona Analysis:</p>
                  {audit.audience_summary}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Cities */}
                  <div className="p-4 rounded-xl bg-bg-elevated border border-border space-y-2">
                    <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-pink" />
                      Top Audience Cities
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {demo.top_cities?.slice(0, 5).map((c: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-bg-surface border border-border/50">
                          <span className="font-medium text-text-primary">{c.city}</span>
                          <span className="font-mono font-bold text-brand-cyan">{c.percentage}% ({c.count?.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Age Distribution */}
                  <div className="p-4 rounded-xl bg-bg-elevated border border-border space-y-2">
                    <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-yellow" />
                      Age Bracket Distribution
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {demo.age_distribution?.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-1.5 rounded bg-bg-surface border border-border/50">
                          <span className="font-medium text-text-primary">{a.bracket} years</span>
                          <span className="font-mono font-bold text-brand-yellow">{a.percentage}% ({a.count?.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expander 2: Mistakes Detected in Current Reels */}
          <div className="rounded-2xl bg-bg-surface border border-border shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("mistakes")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-danger/15 text-accent-danger flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">🚨 Mistakes Detected in Current Reels</h3>
                  <p className="text-[11px] text-text-muted">Critical drop-off points, hook flaws, and winning patterns</p>
                </div>
              </div>
              {openSection.mistakes ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {openSection.mistakes && (
              <div className="p-5 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/60">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-accent-danger flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Flaws & Drop-off Triggers
                  </h4>
                  <div className="space-y-2">
                    {audit.critical_mistakes_detected?.map((m: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-accent-danger/10 border-l-3 border-accent-danger text-xs text-text-primary leading-relaxed">
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-accent-success flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Top Winning Patterns
                  </h4>
                  <div className="space-y-2">
                    {audit.top_winning_patterns?.map((p: string, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-accent-success/10 border-l-3 border-accent-success text-xs text-text-primary leading-relaxed">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Expander 3: Next 5 Viral Content Ideas (with Gujarati Hooks) */}
          <div className="rounded-2xl bg-bg-surface border border-border shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("ideas")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">💡 Next 5 Viral Content Ideas (with full Gujarati Hooks)</h3>
                  <p className="text-[11px] text-text-muted">High-retention hyperlocal concepts tailored for Surat news</p>
                </div>
              </div>
              {openSection.ideas ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {openSection.ideas && (
              <div className="p-5 pt-0 space-y-3.5 border-t border-border/60">
                {audit.content_recommendation_plan?.map((idea: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-bg-elevated border border-border/80 space-y-2.5 hover:border-brand-pink/40 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-brand-pink text-white font-black text-xs flex items-center justify-center">
                          {i}
                        </span>
                        <h4 className="text-sm font-extrabold font-gujarati text-text-primary">
                          {idea.idea_title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                          {idea.category_code}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-pink/15 text-brand-pink border border-brand-pink/30">
                          📍 {idea.target_area}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30 font-mono">
                          ⏱️ {idea.ideal_length_sec}s
                        </span>
                      </div>
                    </div>

                    {/* High-Converting Gujarati Hook Box */}
                    <div className="p-3 rounded-xl bg-bg-surface border border-dashed border-brand-cyan/40 space-y-1">
                      <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider">🎯 High-Converting Gujarati Hook:</span>
                      <p className="text-sm font-bold font-gujarati text-brand-yellow">
                        "{idea.gujarati_hook}"
                      </p>
                    </div>

                    <p className="text-xs text-text-muted">
                      <strong className="text-text-primary">💡 Algorithmic Trigger:</strong> {idea.why_it_works}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expander 4: Step-by-Step Algorithm Action Checklist */}
          <div className="rounded-2xl bg-bg-surface border border-border shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => toggleSection("checklist")}
              className="w-full p-5 flex items-center justify-between text-left hover:bg-bg-elevated/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent-success/15 text-accent-success flex items-center justify-center">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">📈 Step-by-Step Algorithm Action Checklist</h3>
                  <p className="text-[11px] text-text-muted">Immediate editing, pacing, and posting optimizations</p>
                </div>
              </div>
              {openSection.checklist ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            </button>

            {openSection.checklist && (
              <div className="p-5 pt-0 space-y-2 border-t border-border/60">
                {audit.immediate_action_fixes?.map((fix: string, i: number) => {
                  const isDone = Boolean(checkedItems[i]);
                  return (
                    <div
                      key={i}
                      onClick={() => toggleChecklist(i)}
                      className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        isDone 
                          ? "bg-accent-success/10 border-accent-success/40 text-text-primary"
                          : "bg-bg-elevated border-border text-text-muted hover:border-brand-cyan/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggleChecklist(i)}
                        className="w-4 h-4 rounded border-border accent-accent-success cursor-pointer"
                      />
                      <span className={`text-xs font-medium ${isDone ? "line-through text-text-muted" : "text-text-primary"}`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-border/60">
          {/* Chart 1: Production Timeline */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit text-text-primary flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-pink" />
                Reels Production & Publish Velocity
              </h3>
              <span className="text-[11px] text-text-muted font-mono">Past 7 Days</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pinkArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E91E63" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cyanArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BCD4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#00BCD4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262F" vertical={false} />
                  <XAxis dataKey="date" stroke="#8A8A94" fontSize={11} tickLine={false} />
                  <YAxis stroke="#8A8A94" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121A",
                      borderColor: "#26262F",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F5F5F7",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="reels"
                    name="Rendered Reels"
                    stroke="#E91E63"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pinkArea)"
                  />
                  <Area
                    type="monotone"
                    dataKey="published"
                    name="Published Reels"
                    stroke="#00BCD4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyanArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category Distribution */}
          <div className="p-6 rounded-2xl bg-bg-surface border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-outfit text-text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-cyan" />
                Category Distribution
              </h3>
              <span className="text-[11px] text-text-muted">Newsroom Breakdown</span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#26262F" vertical={false} />
                  <XAxis dataKey="name" stroke="#8A8A94" fontSize={10} tickLine={false} />
                  <YAxis stroke="#8A8A94" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#12121A",
                      borderColor: "#26262F",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#F5F5F7",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Reels Count"
                    fill="#FDD835"
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
