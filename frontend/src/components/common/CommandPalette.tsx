"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { 
  Film, 
  Settings, 
  Layers, 
  BarChart3, 
  Key, 
  Instagram, 
  Mic, 
  Palette, 
  Sparkles, 
  Play,
  RotateCcw
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";

export function CommandPalette() {
  const router = useRouter();
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    resetDraft,
    saveProfile,
    profile
  } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && (e.target as HTMLElement).tagName !== "INPUT" && (e.target as HTMLElement).tagName !== "TEXTAREA")) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const runAction = (action: () => void) => {
    action();
    setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-xl bg-bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="w-full">
          <div className="flex items-center px-4 border-b border-border">
            <Command.Input 
              placeholder="Type a command or search studio..." 
              className="w-full py-4 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
              autoFocus
            />
            <kbd className="text-[11px] font-mono px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 text-xs space-y-1">
            <Command.Empty className="p-4 text-center text-text-muted">
              No matching actions found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-text-muted font-semibold px-2 py-1 uppercase text-[10px] tracking-wider">
              <Command.Item 
                onSelect={() => runAction(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary hover:text-brand-pink transition-colors"
              >
                <Film className="w-4 h-4 text-brand-pink" />
                <span>Open Reel Studio Canvas</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runAction(() => router.push("/library"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Layers className="w-4 h-4 text-brand-cyan" />
                <span>Open Reels & Drafts Library</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runAction(() => router.push("/analytics"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-brand-yellow" />
                <span>Open Publishing Analytics</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings & Keys" className="text-text-muted font-semibold px-2 py-1 uppercase text-[10px] tracking-wider">
              <Command.Item 
                onSelect={() => runAction(() => router.push("/settings/ai-models"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Key className="w-4 h-4 text-brand-pink" />
                <span>Configure AI Models (Gemini / OpenAI / Claude)</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runAction(() => router.push("/settings/instagram"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Instagram className="w-4 h-4 text-brand-cyan" />
                <span>Instagram / Meta Graph API Credentials</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runAction(() => router.push("/settings/voice"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Mic className="w-4 h-4 text-brand-yellow" />
                <span>Voice Engine & Voice Cloner Profiles</span>
              </Command.Item>
              <Command.Item 
                onSelect={() => runAction(() => router.push("/settings/branding"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Palette className="w-4 h-4 text-brand-pink" />
                <span>Prarambh Brand Logo & Pill Customizer</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Actions" className="text-text-muted font-semibold px-2 py-1 uppercase text-[10px] tracking-wider">
              <Command.Item 
                onSelect={() => runAction(() => {
                  resetDraft();
                  router.push("/dashboard");
                  toast.success("✨ New Reel draft created");
                })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4 text-brand-yellow" />
                <span>Create New Reel Draft</span>
              </Command.Item>

              <Command.Item 
                onSelect={() => runAction(async () => {
                  const nextProv = profile.ai_provider === "Gemini" ? "OpenAI" : (profile.ai_provider === "OpenAI" ? "Claude" : "Gemini");
                  await saveProfile({ ai_provider: nextProv });
                  toast.success(`🤖 Active AI provider switched to ${nextProv}`);
                })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-bg-elevated text-text-primary transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-brand-cyan" />
                <span>Quick-Switch Active AI Provider ({profile.ai_provider || "Gemini"})</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
