"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  Moon, 
  Sun, 
  Plus, 
  Sparkles,
  Layers,
  ChevronRight,
  Bell
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, setCommandPaletteOpen, resetDraft } = useStore();

  const getBreadcrumbs = () => {
    if (pathname === "/dashboard" || pathname === "/") {
      return ["Studio", "Surat 9:16 Editor"];
    }
    if (pathname.startsWith("/settings")) {
      const sub = pathname.split("/")[2] || "profile";
      const subName = {
        profile: "Profile & Identity",
        "ai-models": "AI Models & Keys",
        instagram: "Instagram & Meta",
        voice: "Voice Engine & Cloning",
        branding: "Brand Watermark & Badges",
        assets: "Audio & B-Roll Library",
        advanced: "Advanced Calibration",
      }[sub] || sub;
      return ["Settings", subName];
    }
    if (pathname === "/ideas") return ["News Ideas", "Daily Viral Topics"];
    if (pathname === "/live-stream") return ["Live Stream", "24/7 TV News Broadcast"];
    if (pathname === "/analytics") return ["Analytics", "Publishing Insights"];
    if (pathname === "/library") return ["Media", "Reels Library"];
    return ["Studio", "3-Step Workflow"];
  };

  const crumbs = getBreadcrumbs();

  const handleNewReel = () => {
    resetDraft();
    router.push("/dashboard");
    toast.success("✨ New Reel draft initialized!");
  };

  return (
    <header className="h-16 border-b border-border bg-bg-surface flex items-center justify-between px-6 z-30 shrink-0 select-none">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
        <span className="text-brand-pink font-semibold tracking-wide uppercase">
          {crumbs[0]}
        </span>
        <ChevronRight className="w-3.5 h-3.5 opacity-40" />
        <span className="text-text-primary font-semibold text-sm">
          {crumbs[1]}
        </span>
      </div>

      {/* Center Search / ⌘K Command Palette Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-bg-elevated border border-border text-text-muted text-xs hover:border-brand-pink/40 hover:text-text-primary transition-all duration-150 w-72 justify-between group shadow-inner"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-text-muted group-hover:text-brand-pink transition-colors" />
          <span className="truncate">Search studio or actions...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-bg-base border border-border text-[10px] font-mono text-text-muted">
          ⌘K
        </kbd>
      </button>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-elevated border border-border text-text-muted hover:text-text-primary hover:border-brand-yellow/50 transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-brand-yellow animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-brand-cyan" />
          )}
        </button>

        {/* Notifications */}
        <button 
          onClick={() => toast.info("🔔 All pipeline services operating at 100% health.")}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-elevated border border-border text-text-muted hover:text-text-primary transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
        </button>

        {/* Primary CTA - New Reel */}
        <button
          onClick={handleNewReel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white brand-gradient-bg shadow-sm hover:opacity-95 active:scale-95 transition-all duration-150 glow-pink"
        >
          <Plus className="w-4 h-4" />
          <span>New Reel</span>
        </button>
      </div>
    </header>
  );
}
