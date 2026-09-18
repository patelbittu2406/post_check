"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Bot, 
  Instagram, 
  Mic2, 
  Palette, 
  FolderArchive, 
  Sliders,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

const settingsNav = [
  { name: "Profile & Account", href: "/settings/profile", icon: User },
  { name: "AI Models & Keys", href: "/settings/ai-models", icon: Bot, highlight: true },
  { name: "Instagram / Meta", href: "/settings/instagram", icon: Instagram },
  { name: "Voice Engine", href: "/settings/voice", icon: Mic2 },
  { name: "Branding & Watermark", href: "/settings/branding", icon: Palette },
  { name: "Assets & Media", href: "/settings/assets", icon: FolderArchive },
  { name: "Advanced Tuning", href: "/settings/advanced", icon: Sliders },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-bg-base">
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Header Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold font-outfit tracking-tight text-text-primary">
              Studio Settings
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-brand-pink/15 text-brand-pink border border-brand-pink/20">
              Prarambh Config
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Manage your AI provider credentials, Meta Graph API tokens, branding rules, and voice models.
          </p>
        </div>

        {/* Sub-Nav + Content Split */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Sub-Navigation */}
          <nav className="space-y-1 bg-bg-surface p-2 rounded-2xl border border-border sticky top-6 shadow-sm">
            {settingsNav.map((item) => {
              const isActive = pathname === item.href || (item.href === "/settings/profile" && pathname === "/settings");
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeSettingsPill"
                      className="absolute inset-0 rounded-xl brand-gradient-bg glow-pink -z-10"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : item.highlight ? "text-brand-pink" : "text-text-muted"}`} />
                  <span className="truncate flex-1 font-outfit">{item.name}</span>

                  {item.highlight && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Content Area */}
          <main className="md:col-span-3 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
