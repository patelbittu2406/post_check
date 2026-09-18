"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { 
  Sliders, 
  Save, 
  AlertTriangle, 
  RotateCcw, 
  ShieldAlert, 
  Volume2, 
  Gauge, 
  Crop 
} from "lucide-react";

export default function AdvancedSettingsPage() {
  const { profile, saveProfile } = useStore();

  const [safeZoneTop, setSafeZoneTop] = useState(profile.safe_zone_top || 220);
  const [safeZoneBottom, setSafeZoneBottom] = useState(profile.safe_zone_bottom || 420);
  const [targetLufs, setTargetLufs] = useState(profile.target_lufs || -14);
  const [bgmDuckVolume, setBgmDuckVolume] = useState(profile.bgm_duck_volume || 0.12);
  const [scriptPacing, setScriptPacing] = useState(profile.script_pacing_wps || 2.5);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSafeZoneTop(profile.safe_zone_top || 220);
    setSafeZoneBottom(profile.safe_zone_bottom || 420);
    setTargetLufs(profile.target_lufs || -14);
    setBgmDuckVolume(profile.bgm_duck_volume || 0.12);
    setScriptPacing(profile.script_pacing_wps || 2.5);
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({
        safe_zone_top: safeZoneTop,
        safe_zone_bottom: safeZoneBottom,
        target_lufs: targetLufs,
        bgm_duck_volume: bgmDuckVolume,
        script_pacing_wps: scriptPacing,
      });
      toast.success("✓ Advanced calibration settings saved to user_profile.json");
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset advanced settings to factory defaults?")) return;
    setSafeZoneTop(220);
    setSafeZoneBottom(420);
    setTargetLufs(-14);
    setBgmDuckVolume(0.12);
    setScriptPacing(2.5);
    try {
      await saveProfile({
        safe_zone_top: 220,
        safe_zone_bottom: 420,
        target_lufs: -14,
        bgm_duck_volume: 0.12,
        script_pacing_wps: 2.5,
      });
      toast.success("Reset to factory defaults");
    } catch (err: any) {
      toast.error(`Reset failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-pink" />
              Advanced Pipeline & Safe-Zone Calibration
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Fine-tune vertical 1080x1920 layout constraints, audio ducking thresholds, and spoken pacing.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Calibration"}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Safe Zones */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Crop className="w-4 h-4 text-brand-cyan" />
              Instagram UI Safe Zone Boundaries (9:16)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Top Notch Margin</label>
                  <span className="text-xs font-mono text-brand-cyan">{safeZoneTop}px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="300"
                  step="10"
                  value={safeZoneTop}
                  onChange={(e) => setSafeZoneTop(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
                <p className="text-[10px] text-text-muted">Keeps headlines clear of top system and IG search header.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Bottom Caption Safe Margin</label>
                  <span className="text-xs font-mono text-brand-cyan">{safeZoneBottom}px</span>
                </div>
                <input
                  type="range"
                  min="350"
                  max="550"
                  step="10"
                  value={safeZoneBottom}
                  onChange={(e) => setSafeZoneBottom(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
                <p className="text-[10px] text-text-muted">Prevents subtitles from colliding with IG author & audio title bar.</p>
              </div>
            </div>
          </div>

          {/* Audio & Ducking */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-brand-yellow" />
              Audio Ducking & Normalization Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Target Voiceover Loudness</label>
                  <span className="text-xs font-mono text-brand-yellow">{targetLufs} LUFS</span>
                </div>
                <input
                  type="range"
                  min="-20"
                  max="-10"
                  step="1"
                  value={targetLufs}
                  onChange={(e) => setTargetLufs(parseInt(e.target.value))}
                  className="w-full accent-brand-yellow"
                />
                <p className="text-[10px] text-text-muted">Standard broadcast loudness is -14 LUFS integrated.</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Background Music Duck Level</label>
                  <span className="text-xs font-mono text-brand-yellow">{bgmDuckVolume}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.01"
                  value={bgmDuckVolume}
                  onChange={(e) => setBgmDuckVolume(parseFloat(e.target.value))}
                  className="w-full accent-brand-yellow"
                />
                <p className="text-[10px] text-text-muted">Volume multiplier for BGM track when voiceover is active.</p>
              </div>
            </div>
          </div>

          {/* Script Pacing */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Gauge className="w-4 h-4 text-brand-pink" />
              Gujarati Script Word Pacing
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-primary">Spoken Speed Target</label>
                <span className="text-xs font-mono text-brand-pink">{scriptPacing} words/sec</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="3.2"
                step="0.1"
                value={scriptPacing}
                onChange={(e) => setScriptPacing(parseFloat(e.target.value))}
                className="w-full accent-brand-pink"
              />
              <p className="text-[10px] text-text-muted">Calculates word budget for 15s (38w), 30s (75w), 45s (112w), and 60s (150w) reels.</p>
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="p-5 rounded-2xl border border-accent-danger/30 bg-accent-danger/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent-danger font-bold text-xs">
              <ShieldAlert className="w-4 h-4" />
              <span>Danger Zone: Reset Calibration</span>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg border border-accent-danger/40 bg-accent-danger/10 text-accent-danger text-xs font-bold hover:bg-accent-danger/20 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            Restores all layout margins, audio volumes, and word rates to default factory values.
          </p>
        </div>
      </div>
    </div>
  );
}
