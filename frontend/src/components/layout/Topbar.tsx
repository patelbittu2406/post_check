"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  Moon, 
  Sun, 
  Plus, 
  Check,
  ChevronRight
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, setCommandPaletteOpen, resetDraft } = useStore();

  const getBreadcrumbs = () => {
    if (pathname === "/dashboard" || pathname === "/") {
      return ["Studio", "Surat 9:16 Video Editor"];
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
    if (pathname === "/ideas") return ["News Ideas", "Canva Viral Discovery"];
    if (pathname === "/live-stream") return ["Live Stream", "24/7 TV Broadcast"];
    if (pathname === "/analytics") return ["Analytics", "Publishing Insights"];
    if (pathname === "/library") return ["Media", "Uploads & B-roll Library"];
    return ["Studio", "Workflow"];
  };

  const crumbs = getBreadcrumbs();

  const handleNewReel = () => {
    resetDraft();
    router.push("/dashboard");
    toast.success("✨ New Reel draft initialized!");
  };

  return (
    <header className="h-14 border-b border-[#E5E7EB] bg-white flex items-center justify-between px-6 z-30 shrink-0 select-none">
      {/* Left: Project title & Saved status indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-900 tracking-tight">
            {crumbs[0]}
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 font-medium">
            {crumbs[1]}
          </span>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Auto-saved
        </span>
      </div>

      {/* Center: ⌘K Command Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-xs hover:border-slate-300 hover:text-slate-800 transition-all w-72 justify-between group"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <span className="truncate">Search tools, templates or actions...</span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
          ⌘K
        </kbd>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        {/* New Reel Draft Button */}
        <button
          onClick={handleNewReel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Reel</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
}
