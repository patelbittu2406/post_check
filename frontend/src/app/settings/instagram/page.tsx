"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { testInstagramConnection } from "@/lib/api";
import { toast } from "sonner";
import { 
  Instagram, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Shield,
  CloudUpload,
  Play
} from "lucide-react";

export default function InstagramSettingsPage() {
  const { profile, saveProfile } = useStore();

  const [accountId, setAccountId] = useState(profile.instagram_business_account_id || "");
  const [token, setToken] = useState(profile.facebook_page_access_token || "");
  const [cloudinaryUrl, setCloudinaryUrl] = useState(profile.cloudinary_url || "");
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"live" | "dry_run">(
    profile.instagram_business_account_id && profile.facebook_page_access_token ? "live" : "dry_run"
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAccountId(profile.instagram_business_account_id || "");
    setToken(profile.facebook_page_access_token || "");
    setCloudinaryUrl(profile.cloudinary_url || "");
    setStatus(
      profile.instagram_business_account_id && profile.facebook_page_access_token ? "live" : "dry_run"
    );
  }, [profile]);

  const handleTestConnection = async () => {
    if (!accountId || !token) {
      toast.warning("Please provide both Instagram Business Account ID & Access Token");
      return;
    }
    setTesting(true);
    try {
      const res = await testInstagramConnection({ account_id: accountId, access_token: token });
      toast.success(`🟢 Connected: ${res.username} (${res.name})`);
      setStatus("live");
    } catch (err: any) {
      toast.error(`Meta Graph API test failed: ${err.message}`);
      setStatus("dry_run");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveProfile({
        instagram_business_account_id: accountId,
        facebook_page_access_token: token,
        cloudinary_url: cloudinaryUrl,
      });
      toast.success("✓ Instagram credentials saved to user_profile.json");
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
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
              <Instagram className="w-5 h-5 text-brand-pink" />
              Meta Graph API & Instagram Publishing
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              1-Click official Meta Graph API v19.0+ Reel publisher with container polling and dry-run testing.
            </p>
          </div>

          {/* Status Indicator Pill */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              status === "live"
                ? "bg-accent-success/15 text-accent-success border-accent-success/30"
                : "bg-brand-yellow/15 text-brand-yellow border-brand-yellow/30"
            }`}>
              {status === "live" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live Publishing Enabled</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Dry-Run Mode Active</span>
                </>
              )}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary">
              Instagram Business Account ID
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
              placeholder="e.g. 17841400000000000"
            />
            <p className="text-[11px] text-text-muted">
              Found in Meta Business Suite under Instagram Account ID.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-primary">
                Facebook Page Long-Lived User Access Token
              </label>
              <a
                href="https://developers.facebook.com/tools/explorer/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-pink hover:underline flex items-center gap-1"
              >
                <span>Meta Graph API Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
                placeholder="EAA..."
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-3 text-text-muted hover:text-text-primary"
              >
                {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-text-muted">
              Required permissions: <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>pages_show_list</code>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
              <CloudUpload className="w-3.5 h-3.5 text-brand-cyan" />
              Cloudinary Media Host URL (Optional CDN)
            </label>
            <input
              type="text"
              value={cloudinaryUrl}
              onChange={(e) => setCloudinaryUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
              placeholder="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
            />
            <p className="text-[11px] text-text-muted">
              Optional. If empty, the engine uses secure direct temporary HTTPS video hosting for Meta Graph ingestion.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-border">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !accountId || !token}
              className="px-4 py-2.5 rounded-xl bg-bg-elevated border border-border text-xs font-semibold text-text-primary hover:border-brand-pink hover:text-brand-pink transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 text-brand-yellow" />
              <span>{testing ? "Testing Token..." : "Test Connection (Dry-Run)"}</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Meta Credentials"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
