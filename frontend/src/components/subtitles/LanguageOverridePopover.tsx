"use client";

import React from "react";
import { Globe, Check, Sparkles, X } from "lucide-react";

interface LanguageOverridePopoverProps {
  wordIndex: number;
  wordText: string;
  currentLanguage: "auto" | "gu" | "en" | string;
  detectedLanguage?: string;
  onSelectLanguage: (language: "auto" | "gu" | "en") => void;
  onClose: () => void;
}

export function LanguageOverridePopover({
  wordIndex,
  wordText,
  currentLanguage,
  detectedLanguage,
  onSelectLanguage,
  onClose,
}: LanguageOverridePopoverProps) {
  const options: { id: "auto" | "gu" | "en"; label: string; desc: string; icon: string; badge: string }[] = [
    {
      id: "auto",
      label: "Auto Detect",
      desc: `Detected: ${detectedLanguage === "gu" ? "Gujarati" : detectedLanguage === "en" ? "English" : "Script"}`,
      icon: "⚡",
      badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    {
      id: "gu",
      label: "Gujarati Script",
      desc: "White Noto Sans Gujarati font",
      icon: "🇮🇳",
      badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    },
    {
      id: "en",
      label: "English Display",
      desc: "Bold Yellow Anton Latin font",
      icon: "🔤",
      badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    },
  ];

  return (
    <div className="absolute z-50 mt-1 w-64 rounded-2xl bg-bg-surface border border-border shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 text-text-primary select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-brand-yellow" />
          <span className="text-[11px] font-bold text-text-primary">Word Language Override</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Target Word Display */}
      <div className="p-2 rounded-xl bg-bg-elevated/70 border border-border/70 flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-text-muted">Word #{wordIndex + 1}:</span>
        <span className="text-xs font-extrabold text-brand-yellow font-mono truncate max-w-[120px]">
          &quot;{wordText}&quot;
        </span>
      </div>

      {/* Options List */}
      <div className="space-y-1.5">
        {options.map((opt) => {
          const isSelected = currentLanguage === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelectLanguage(opt.id);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all border ${
                isSelected
                  ? "bg-brand-yellow/15 border-brand-yellow/60 text-text-primary shadow-sm"
                  : "bg-bg-surface hover:bg-bg-elevated border-transparent hover:border-border text-text-muted hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{opt.icon}</span>
                <div>
                  <div className="text-xs font-bold leading-none">{opt.label}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">{opt.desc}</div>
                </div>
              </div>

              {isSelected && <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
