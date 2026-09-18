"use client";

import React, { useState, useMemo, useEffect } from "react";
import { SubtitleStylePreset, fetchSubtitleStyles } from "@/lib/api";
import { StylePreviewCard } from "./StylePreviewCard";
import { 
  X, 
  Search, 
  Sparkles, 
  Layers, 
  Check, 
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Globe,
  Camera,
  Paintbrush
} from "lucide-react";
import { toast } from "sonner";

interface StyleBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStyleId: string;
  onSelectStyle: (preset: SubtitleStylePreset) => void;
  currentScriptText?: string;
}

const QUICK_TEST_SENTENCES = [
  {
    label: "Flagship Bilingual",
    text: "આનો મતલબ છે તમારો VIDEO ના CONTENT માં VALUE નથી",
  },
  {
    label: "Surat News & Numbers",
    text: "SURAT UPDATE: 100+ NEW PROJECTS જાહેર થયા!",
  },
  {
    label: "Festival Special",
    text: "FESTIVAL SPECIAL: સુરતમાં ગણેશ ઉત્સવ ભવ્ય ધામધૂમથી ઉજવાયો 🎉",
  },
  {
    label: "Crime / Alert",
    text: "BREAKING NEWS: સુરત ક્રાઈમ બ્રાન્ચે મોટો પર્દાફાશ કર્યો 🚨",
  },
];

export function StyleBrowserModal({
  isOpen,
  onClose,
  selectedStyleId,
  onSelectStyle,
  currentScriptText,
}: StyleBrowserModalProps) {
  const [styles, setStyles] = useState<SubtitleStylePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [testText, setTestText] = useState(
    currentScriptText || QUICK_TEST_SENTENCES[0].text
  );

  // Fetch all 20 presets on open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    fetchSubtitleStyles()
      .then((res) => {
        if (isMounted && res.styles) {
          setStyles(res.styles);
        }
      })
      .catch((err) => {
        console.error("Failed to load subtitle styles:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync testText when currentScriptText updates if user hasn't customized
  useEffect(() => {
    if (currentScriptText && currentScriptText.trim()) {
      const clean = currentScriptText.replace(/\[.*?\]|<.*?>/g, " ").replace(/\s+/g, " ").trim();
      if (clean) setTestText(clean);
    }
  }, [currentScriptText]);

  // Categories list with icons and counts
  const categories = useMemo(() => {
    const list = [
      { id: "all", label: "All 20 Styles", icon: Sparkles, count: styles.length },
      { id: "bilingual", label: "Bilingual (Viral)", icon: Globe, count: styles.filter(s => s.category === "bilingual").length },
      { id: "bold", label: "Viral Bold", icon: Flame, count: styles.filter(s => s.category === "bold").length },
      { id: "minimal", label: "Clean / Minimal", icon: Layers, count: styles.filter(s => s.category === "minimal").length },
      { id: "festive", label: "Gujarati Festive", icon: Sparkles, count: styles.filter(s => s.category === "festive").length },
      { id: "cinematic", label: "Cinematic", icon: Camera, count: styles.filter(s => s.category === "cinematic").length },
      { id: "creative", label: "Creative & Neon", icon: Paintbrush, count: styles.filter(s => s.category === "creative").length },
    ];
    return list;
  }, [styles]);

  // Filtered Styles
  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      // Category filter
      if (selectedCategory !== "all" && style.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = style.name.toLowerCase().includes(q);
        const matchDesc = style.description.toLowerCase().includes(q);
        const matchFont = (style.latin_font || "").toLowerCase().includes(q);
        const matchId = style.id.toLowerCase().includes(q);
        return matchName || matchDesc || matchFont || matchId;
      }
      return true;
    });
  }, [styles, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (preset: SubtitleStylePreset) => {
    onSelectStyle(preset);
    toast.success(`Applied "${preset.name}" viral subtitle style!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-bg-surface border border-border/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-text-primary">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border/70 flex items-center justify-between gap-4 bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                  Viral Subtitle Style Library
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40">
                  20 Presets
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Bilingual Gujarati + English font switching with zero API cost
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent hover:border-border transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Category Tabs, Test Text Bar */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-bg-elevated/40 space-y-3">
          
          {/* Row 1: Search and Sentence Tester */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets, fonts, animations..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-surface border border-border text-xs focus:outline-none focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Custom Sample Text Input */}
            <div className="relative flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Type test sentence with Gujarati and English..."
                  className="w-full px-3 py-2 rounded-xl bg-bg-surface border border-border text-xs font-medium focus:outline-none focus:border-brand-yellow"
                />
              </div>
              <button
                type="button"
                onClick={() => setTestText(QUICK_TEST_SENTENCES[0].text)}
                className="p-2 rounded-xl bg-bg-surface border border-border text-text-muted hover:text-text-primary hover:border-brand-yellow/40 transition-colors"
                title="Reset to default reference sentence"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Row 2: Quick Sample Sentence Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
              Test Presets:
            </span>
            {QUICK_TEST_SENTENCES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTestText(s.text)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium whitespace-nowrap transition-all ${
                  testText === s.text
                    ? "bg-brand-yellow/15 border-brand-yellow text-brand-yellow font-bold shadow-sm"
                    : "bg-bg-surface border-border text-text-muted hover:text-text-primary hover:border-border/80"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Row 3: Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-brand-yellow text-black border-brand-yellow shadow-md"
                      : "bg-bg-surface text-text-muted border-border hover:text-text-primary hover:border-brand-yellow/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-black/20 text-black font-black"
                        : "bg-bg-elevated text-text-muted"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: 4-Column Responsive Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-text-muted">
              <div className="w-8 h-8 border-2 border-brand-yellow border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Loading 20 viral subtitle presets...</p>
            </div>
          ) : filteredStyles.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-text-muted">
              <Search className="w-8 h-8 opacity-40" />
              <p className="text-sm font-bold">No styles found</p>
              <p className="text-xs">Try searching for different keywords or reset category filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary hover:border-brand-yellow"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStyles.map((preset) => (
                <StylePreviewCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedStyleId === preset.id}
                  onSelect={() => handleSelect(preset)}
                  sampleText={testText}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-border/70 bg-bg-surface flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-text-muted">
            <span className="font-mono text-[11px] font-bold text-text-primary">
              Showing {filteredStyles.length} of {styles.length} styles
            </span>
            <span>•</span>
            <span className="text-[11px]">All fonts bundled locally</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-bold text-text-primary hover:bg-bg-surface hover:border-brand-yellow transition-all"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
}
