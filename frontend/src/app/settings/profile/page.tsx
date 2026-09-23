"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { User, Save, Shield, Globe, Clock, Sparkles } from "lucide-react";

export default function ProfileSettingsPage() {
  const { profile, saveProfile } = useStore();
  const [formData, setFormData] = useState({
    display_name: profile.display_name || "Surat News Anchor",
    channel_handle: profile.channel_handle || "@surat.prarambh.news",
    bio: profile.bio || "Surat ના સમાચાર, હવે Reels માં.",
    timezone: profile.timezone || "Asia/Kolkata",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData({
      display_name: profile.display_name || "Surat News Anchor",
      channel_handle: profile.channel_handle || "@surat.prarambh.news",
      bio: profile.bio || "Surat ના સમાચાર, હવે Reels માં.",
      timezone: profile.timezone || "Asia/Kolkata",
    });
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile(formData);
      toast.success("✓ Profile settings saved to user_profile.json");
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-bold font-inter text-slate-900">
            Profile & Channel Identity
          </h2>
          <p className="text-xs text-slate-500">
            Configure how your identity appears across generated Reels and Instagram publications.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Avatar & Branding Header */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-16 h-16 rounded-full ring-2 ring-indigo-200 p-1 shrink-0 bg-white">
              <img 
                src="/logo.png" 
                alt="Channel Avatar" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Prarambh Channel Badge
              </h3>
              <p className="text-xs text-slate-500">
                Official Gujarati Newsroom Avatar & Watermark Asset
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Display Name / Presenter Title
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-colors"
                placeholder="e.g. Surat News Anchor"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Instagram Channel Handle
              </label>
              <input
                type="text"
                value={formData.channel_handle}
                onChange={(e) => setFormData({ ...formData, channel_handle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-colors"
                placeholder="@surat.prarambh.news"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Channel Tagline / Bio
            </label>
            <textarea
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-colors resize-none"
              placeholder="Surat ના સમાચાર, હવે Reels માં."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white outline-none transition-colors"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Primary Broadcast Language
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Gujarati (ગુજરાતી)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                  Locked
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Profile Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
