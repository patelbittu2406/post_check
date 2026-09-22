"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { 
  Palette, 
  Sparkles, 
  Save, 
  Sliders, 
  Layers, 
  Eye, 
  Check
} from "lucide-react";

export default function BrandingSettingsPage() {
  const { profile, saveProfile } = useStore();

  const [watermarkEnabled, setWatermarkEnabled] = useState(profile.watermark_enabled ?? true);
  const [watermarkPosition, setWatermarkPosition] = useState(profile.watermark_position || "top-right");
  const [watermarkOpacity, setWatermarkOpacity] = useState(profile.watermark_opacity ?? 0.85);

  const [line1Bg, setLine1Bg] = useState(profile.line1_bg || "#FF0033");
  const [line1Text, setLine1Text] = useState(profile.line1_text || "#FFFFFF");
  const [line2Bg, setLine2Bg] = useState(profile.line2_bg || "#0080FF");
  const [line2Text, setLine2Text] = useState(profile.line2_text || "#FFFFFF");

  const [subFontSize, setSubFontSize] = useState(profile.sub_font_size || 58);
  const [subColor, setSubColor] = useState(profile.sub_color || "#FFFFFF");
  const [subOutline, setSubOutline] = useState(profile.sub_outline_color || "#000000");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWatermarkEnabled(profile.watermark_enabled ?? true);
    setWatermarkPosition(profile.watermark_position || "top-right");
    setWatermarkOpacity(profile.watermark_opacity ?? 0.85);
    setLine1Bg(profile.line1_bg || "#FF0033");
    setLine1Text(profile.line1_text || "#FFFFFF");
    setLine2Bg(profile.line2_bg || "#0080FF");
    setLine2Text(profile.line2_text || "#FFFFFF");
    setSubFontSize(profile.sub_font_size || 58);
    setSubColor(profile.sub_color || "#FFFFFF");
    setSubOutline(profile.sub_outline_color || "#000000");
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({
        watermark_enabled: watermarkEnabled,
        watermark_position: watermarkPosition,
        watermark_opacity: watermarkOpacity,
        line1_bg: line1Bg,
        line1_text: line1Text,
        line2_bg: line2Bg,
        line2_text: line2Text,
        sub_font_size: subFontSize,
        sub_color: subColor,
        sub_outline_color: subOutline,
      });
      toast.success("✓ Branding & visual styles saved to user_profile.json");
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-pink" />
              Brand Identity & Visual Styler
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Customize Prarambh watermark overlays, dual-stripe headline colors, and ASS subtitle typography.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Branding Styles"}</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Watermark Section */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Prarambh Watermark" className="w-8 h-8 object-contain" />
                <div>
                  <h3 className="text-xs font-bold text-text-primary">
                    Prarambh Circular Watermark
                  </h3>
                  <p className="text-[11px] text-text-muted">
                    Render official circular branding on final 1080x1920 video output.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                  watermarkEnabled ? "bg-brand-pink" : "bg-bg-surface border border-border"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    watermarkEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {watermarkEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-primary">Watermark Placement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "top-left", label: "Top Left" },
                      { id: "top-right", label: "Top Right" },
                      { id: "bottom-left", label: "Bottom Left" },
                      { id: "bottom-right", label: "Bottom Right" },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setWatermarkPosition(pos.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                          watermarkPosition === pos.id
                            ? "brand-gradient-bg text-white shadow-sm glow-pink"
                            : "bg-bg-surface border border-border text-text-muted hover:text-text-primary"
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-primary">Opacity</label>
                    <span className="text-xs font-mono text-brand-pink">{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-brand-pink"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Dual-Stripe Headline Badges Section */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-yellow" />
              Dual-Stripe Headline Pill Styler
            </h3>

            {/* Live Interactive Pill Preview */}
            <div className="flex flex-col items-center gap-2.5 p-6 rounded-xl bg-bg-base/80 border border-border shadow-inner">
              <div 
                className="px-6 py-2.5 rounded-2xl font-extrabold font-gujarati text-base shadow-lg transition-colors text-center"
                style={{ backgroundColor: line1Bg, color: line1Text }}
              >
                સુરત ઉત્સવ | તૈયારીઓ પૂર્ણ હતી...
              </div>
              <div 
                className="px-6 py-2.5 rounded-2xl font-extrabold font-gujarati text-base shadow-lg transition-colors text-center"
                style={{ backgroundColor: line2Bg, color: line2Text }}
              >
                પણ બાપ્પાની મરજી કંઈક અલગ હતી! 🚩
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Line 1 Colors */}
              <div className="p-3.5 rounded-xl bg-bg-surface border border-border space-y-3">
                <span className="text-xs font-bold text-text-primary">Line 1 Pill (Top Strip)</span>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-text-muted">Background:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={line1Bg}
                      onChange={(e) => setLine1Bg(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-text-primary">{line1Bg}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-text-muted">Text Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={line1Text}
                      onChange={(e) => setLine1Text(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-text-primary">{line1Text}</span>
                  </div>
                </div>
              </div>

              {/* Line 2 Colors */}
              <div className="p-3.5 rounded-xl bg-bg-surface border border-border space-y-3">
                <span className="text-xs font-bold text-text-primary">Line 2 Pill (Bottom Strip)</span>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-text-muted">Background:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={line2Bg}
                      onChange={(e) => setLine2Bg(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-text-primary">{line2Bg}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs text-text-muted">Text Color:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={line2Text}
                      onChange={(e) => setLine2Text(e.target.value)}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono text-text-primary">{line2Text}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Subtitle Styler Section */}
          <div className="p-5 rounded-2xl bg-bg-elevated/50 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-cyan" />
              Dynamic ASS Word-Level Subtitles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-primary">Font Size</label>
                  <span className="text-xs font-mono text-brand-cyan">{subFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="80"
                  step="2"
                  value={subFontSize}
                  onChange={(e) => setSubFontSize(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={subColor}
                    onChange={(e) => setSubColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-text-primary">{subColor}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-primary">Outline / Shadow Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={subOutline}
                    onChange={(e) => setSubOutline(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono text-text-primary">{subOutline}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
