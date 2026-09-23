"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Film, 
  Lightbulb, 
  FolderOpen, 
  BarChart3, 
  Settings, 
  User,
  Sparkles
} from "lucide-react";
import { useStore } from "@/store/useStore";

const navItems = [
  { name: "Studio", path: "/dashboard", icon: Film },
  { name: "Ideas", path: "/ideas", icon: Lightbulb },
  { name: "Media", path: "/library", icon: FolderOpen },
  { name: "Insights", path: "/analytics", icon: BarChart3 },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useStore();

  return (
    <aside className="w-[72px] h-screen bg-white border-r border-[#E5E7EB] flex flex-col items-center justify-between py-4 select-none shrink-0 z-40">
      {/* Top: Canva-style Brand Emblem */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Link 
          href="/dashboard" 
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center justify-center p-1.5 hover:border-indigo-300 hover:shadow-xs transition-all group"
          title="Prarambh Studio"
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain filter brightness-105 group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </Link>

        {/* Navigation Items (Canva Slim Style: Clean Centered Tile) */}
        <nav className="flex flex-col items-center gap-1.5 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path === "/settings" && pathname.startsWith("/settings"));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`w-[58px] h-[54px] rounded-xl flex flex-col items-center justify-center transition-all duration-150 group cursor-pointer ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-800/80 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800"
                }`}
                title={item.name}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"}`} />
                <span className={`text-[10px] tracking-tight mt-1 leading-none ${isActive ? "font-semibold text-indigo-600 dark:text-indigo-400" : "font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200"}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: User Profile with integrated online status badge */}
      <div className="flex flex-col items-center">
        <Link
          href="/settings/profile"
          className="relative w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-2xs group"
          title={profile.display_name || "Surat Anchor"}
        >
          <User className="w-4 h-4 group-hover:scale-105 transition-transform" />
          {/* Active online green dot */}
          <span 
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"
            title="Pipeline Active & Connected"
          />
        </Link>
      </div>
    </aside>
  );
}
