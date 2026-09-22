"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Film, 
  Lightbulb, 
  BarChart3, 
  Radio, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  User
} from "lucide-react";
import { useStore } from "@/store/useStore";

const navItems = [
  { name: "Studio", path: "/dashboard", icon: Film, badge: "3-Step" },
  { name: "News Ideas", path: "/ideas", icon: Lightbulb, badge: "Viral" },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Live Stream", path: "/live-stream", icon: Radio, badge: "24/7" },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { profile } = useStore();

  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex flex-col h-screen border-r border-border bg-bg-surface z-40 select-none shrink-0"
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md ring-2 ring-brand-pink/30 group-hover:scale-105 transition-transform duration-200">
            {/* Logo display */}
            <img 
              src="/logo.png" 
              alt="Prarambh Logo" 
              className="w-10 h-10 object-contain drop-shadow"
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap overflow-hidden"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight font-outfit text-text-primary">
                    પ્રારંભ
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-brand-pink/15 text-brand-pink border border-brand-pink/20">
                    STUDIO
                  </span>
                </div>
                <span className="text-[11px] text-text-muted font-medium truncate">
                  Surat Reel Engine
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path === "/settings" && pathname.startsWith("/settings"));
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-elevated"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavPill"
                  className="absolute inset-0 rounded-xl brand-gradient-bg glow-pink -z-10"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-white" : "group-hover:text-brand-pink transition-colors"}`} />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate flex-1 font-outfit"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>

              {!collapsed && item.badge && (
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-brand-pink/15 text-brand-pink"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-bg-surface border border-border shadow-md flex items-center justify-center text-text-muted hover:text-text-primary hover:border-brand-pink transition-colors z-50"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* User / Workspace Footer */}
      <div className="p-3 border-t border-border">
        <Link 
          href="/settings/profile"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-bg-elevated transition-colors overflow-hidden group"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-pink to-brand-cyan flex items-center justify-center text-white shrink-0 font-bold text-xs ring-2 ring-white/10 shadow-sm">
            <User className="w-4 h-4" />
          </div>

          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col whitespace-nowrap overflow-hidden flex-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {profile.display_name || "Surat Anchor"}
                  </span>
                  <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30">
                    PRO
                  </span>
                </div>
                <span className="text-[10px] text-text-muted truncate">
                  {profile.channel_handle || "@surat.prarambh"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  );
}
