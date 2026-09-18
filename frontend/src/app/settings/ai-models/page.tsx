"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { testLLMConnection } from "@/lib/api";
import { toast } from "sonner";
import { 
  Bot, 
  Key, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Save, 
  Zap,
  ShieldCheck,
  Cpu
} from "lucide-react";

export default function AIModelsSettingsPage() {
  const { profile, saveProfile } = useStore();

  const [aiProvider, setAiProvider] = useState(profile.ai_provider || "Gemini");
  const [offlineFallback, setOfflineFallback] = useState(profile.offline_fallback ?? true);

  // Gemini state
  const [geminiKey, setGeminiKey] = useState(profile.gemini_api_key || "");
  const [geminiModel, setGeminiModel] = useState(profile.gemini_model || "gemini-3.6-flash");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<"connected" | "nokey" | "error">(
    profile.gemini_api_key ? "connected" : "nokey"
  );
  const [geminiLatency, setGeminiLatency] = useState<number | null>(null);

  // OpenAI state
  const [openaiKey, setOpenaiKey] = useState(profile.openai_api_key || "");
  const [openaiModel, setOpenaiModel] = useState(profile.openai_model || "gpt-4o");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [openaiStatus, setOpenaiStatus] = useState<"connected" | "nokey" | "error">(
    profile.openai_api_key ? "connected" : "nokey"
  );
  const [openaiLatency, setOpenaiLatency] = useState<number | null>(null);

  // Claude state
  const [claudeKey, setClaudeKey] = useState(profile.anthropic_api_key || "");
  const [claudeModel, setClaudeModel] = useState(profile.anthropic_model || "claude-3-5-sonnet");
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [testingClaude, setTestingClaude] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState<"connected" | "nokey" | "error">(
    profile.anthropic_api_key ? "connected" : "nokey"
  );
  const [claudeLatency, setClaudeLatency] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAiProvider(profile.ai_provider || "Gemini");
    setGeminiKey(profile.gemini_api_key || "");
    setOpenaiKey(profile.openai_api_key || "");
    setClaudeKey(profile.anthropic_api_key || "");
    setOfflineFallback(profile.offline_fallback ?? true);
  }, [profile]);

  const handleTestConnection = async (providerName: "Gemini" | "OpenAI" | "Claude") => {
    let key = "";
    let model = "";
    if (providerName === "Gemini") {
      key = geminiKey;
      model = geminiModel;
      setTestingGemini(true);
    } else if (providerName === "OpenAI") {
      key = openaiKey;
      model = openaiModel;
      setTestingOpenai(true);
    } else {
      key = claudeKey;
      model = claudeModel;
      setTestingClaude(true);
    }

    if (!key) {
      toast.warning(`Please enter an API key for ${providerName} first`);
      if (providerName === "Gemini") setTestingGemini(false);
      else if (providerName === "OpenAI") setTestingOpenai(false);
      else setTestingClaude(false);
      return;
    }

    try {
      const res = await testLLMConnection({ provider: providerName, api_key: key, model });
      toast.success(`⚡ ${providerName} Connected! Latency: ${res.latency_ms}ms`);
      if (providerName === "Gemini") {
        setGeminiStatus("connected");
        setGeminiLatency(res.latency_ms);
      } else if (providerName === "OpenAI") {
        setOpenaiStatus("connected");
        setOpenaiLatency(res.latency_ms);
      } else {
        setClaudeStatus("connected");
        setClaudeLatency(res.latency_ms);
      }
    } catch (err: any) {
      toast.error(`${providerName} connection failed: ${err.message}`);
      if (providerName === "Gemini") setGeminiStatus("error");
      else if (providerName === "OpenAI") setOpenaiStatus("error");
      else setClaudeStatus("error");
    } finally {
      if (providerName === "Gemini") setTestingGemini(false);
      else if (providerName === "OpenAI") setTestingOpenai(false);
      else setTestingClaude(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await saveProfile({
        ai_provider: aiProvider,
        gemini_api_key: geminiKey,
        gemini_model: geminiModel,
        openai_api_key: openaiKey,
        openai_model: openaiModel,
        anthropic_api_key: claudeKey,
        anthropic_model: claudeModel,
        offline_fallback: offlineFallback,
      });
      toast.success("✓ AI Model settings and API Keys saved to user_profile.json");
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold font-outfit text-text-primary flex items-center gap-2">
              <Bot className="w-5 h-5 text-brand-pink" />
              Multi-LLM Provider Engine
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Configure and test credentials for Gemini, OpenAI, and Anthropic Claude.
            </p>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white brand-gradient-bg glow-pink hover:opacity-95 active:scale-95 transition-all duration-150 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save AI Credentials"}</span>
          </button>
        </div>

        {/* Default Provider Selector & Fallback Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Active Provider Radio */}
          <div className="p-4 rounded-xl bg-bg-elevated/60 border border-border space-y-2">
            <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-yellow" />
              Active Primary AI Generation Provider
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["Gemini", "OpenAI", "Claude"] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setAiProvider(prov)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    aiProvider === prov
                      ? "brand-gradient-bg text-white shadow-sm glow-pink"
                      : "bg-bg-surface border border-border text-text-muted hover:text-text-primary"
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          {/* Offline Fallback Toggle */}
          <div className="p-4 rounded-xl bg-bg-elevated/60 border border-border flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                Rule-Based Offline Fallback
              </span>
              <p className="text-[11px] text-text-muted">
                Synthesizes headline pills via offline news templates if API quotas exceed or fail.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOfflineFallback(!offlineFallback)}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                offlineFallback ? "bg-brand-pink" : "bg-bg-surface border border-border"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  offlineFallback ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 3 Provider Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Google Gemini Card */}
        <div className={`bg-bg-surface border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
          aiProvider === "Gemini" ? "border-brand-pink ring-1 ring-brand-pink/30" : "border-border"
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                  G
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Google Gemini</h3>
                  <span className="text-[10px] text-text-muted">Official SDK v1.0+</span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                geminiStatus === "connected"
                  ? "bg-accent-success/15 text-accent-success border border-accent-success/30"
                  : geminiStatus === "error"
                  ? "bg-accent-danger/15 text-accent-danger border border-accent-danger/30"
                  : "bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {geminiStatus === "connected" ? "Connected" : geminiStatus === "error" ? "Error" : "No Key"}
              </span>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">Model Engine</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              </select>
            </div>

            {/* Masked API Key */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted flex items-center justify-between">
                <span>Gemini API Key</span>
                <span className="text-[10px] text-brand-pink font-mono">AQ.Ab...</span>
              </label>
              <div className="relative">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={geminiKey}
                  onChange={(e) => {
                    setGeminiKey(e.target.value);
                    setGeminiStatus(e.target.value ? "connected" : "nokey");
                  }}
                  placeholder="Paste Gemini API Key"
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-primary"
                >
                  {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTestConnection("Gemini")}
              disabled={testingGemini || !geminiKey}
              className="w-full py-2 px-3 rounded-xl bg-bg-elevated border border-border text-xs font-semibold text-text-primary hover:border-brand-pink hover:text-brand-pink transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {testingGemini ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-brand-yellow" />
              )}
              <span>{geminiLatency ? `Test (${geminiLatency}ms)` : "Test Connection"}</span>
            </button>
          </div>
        </div>

        {/* 2. OpenAI Card */}
        <div className={`bg-bg-surface border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
          aiProvider === "OpenAI" ? "border-brand-pink ring-1 ring-brand-pink/30" : "border-border"
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs">
                  OA
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">OpenAI</h3>
                  <span className="text-[10px] text-text-muted">GPT-4o Vision & Audio</span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                openaiStatus === "connected"
                  ? "bg-accent-success/15 text-accent-success border border-accent-success/30"
                  : openaiStatus === "error"
                  ? "bg-accent-danger/15 text-accent-danger border border-accent-danger/30"
                  : "bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {openaiStatus === "connected" ? "Connected" : openaiStatus === "error" ? "Error" : "No Key"}
              </span>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">Model Engine</label>
              <select
                value={openaiModel}
                onChange={(e) => setOpenaiModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              >
                <option value="gpt-4o">gpt-4o (High Fidelity)</option>
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Light)</option>
                <option value="gpt-4-turbo">gpt-4-turbo</option>
              </select>
            </div>

            {/* Masked API Key */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenaiKey ? "text" : "password"}
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value);
                    setOpenaiStatus(e.target.value ? "connected" : "nokey");
                  }}
                  placeholder="sk-..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                  className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-primary"
                >
                  {showOpenaiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTestConnection("OpenAI")}
              disabled={testingOpenai || !openaiKey}
              className="w-full py-2 px-3 rounded-xl bg-bg-elevated border border-border text-xs font-semibold text-text-primary hover:border-brand-pink hover:text-brand-pink transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {testingOpenai ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-brand-yellow" />
              )}
              <span>{openaiLatency ? `Test (${openaiLatency}ms)` : "Test Connection"}</span>
            </button>
          </div>
        </div>

        {/* 3. Anthropic Claude Card */}
        <div className={`bg-bg-surface border rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between transition-all ${
          aiProvider === "Claude" ? "border-brand-pink ring-1 ring-brand-pink/30" : "border-border"
        }`}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-xs">
                  CL
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Anthropic Claude</h3>
                  <span className="text-[10px] text-text-muted">Claude 3.5 Sonnet / Haiku</span>
                </div>
              </div>

              {/* Status Badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                claudeStatus === "connected"
                  ? "bg-accent-success/15 text-accent-success border border-accent-success/30"
                  : claudeStatus === "error"
                  ? "bg-accent-danger/15 text-accent-danger border border-accent-danger/30"
                  : "bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/30"
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {claudeStatus === "connected" ? "Connected" : claudeStatus === "error" ? "Error" : "No Key"}
              </span>
            </div>

            {/* Model Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">Model Engine</label>
              <select
                value={claudeModel}
                onChange={(e) => setClaudeModel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg-elevated border border-border text-xs text-text-primary focus:border-brand-pink outline-none"
              >
                <option value="claude-3-5-sonnet">claude-3-5-sonnet (Superb Gujarati)</option>
                <option value="claude-3-5-haiku">claude-3-5-haiku (Lightning Fast)</option>
              </select>
            </div>

            {/* Masked API Key */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">Anthropic API Key</label>
              <div className="relative">
                <input
                  type={showClaudeKey ? "text" : "password"}
                  value={claudeKey}
                  onChange={(e) => {
                    setClaudeKey(e.target.value);
                    setClaudeStatus(e.target.value ? "connected" : "nokey");
                  }}
                  placeholder="sk-ant-..."
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-bg-elevated border border-border text-xs font-mono text-text-primary focus:border-brand-pink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  className="absolute right-2.5 top-2.5 text-text-muted hover:text-text-primary"
                >
                  {showClaudeKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTestConnection("Claude")}
              disabled={testingClaude || !claudeKey}
              className="w-full py-2 px-3 rounded-xl bg-bg-elevated border border-border text-xs font-semibold text-text-primary hover:border-brand-pink hover:text-brand-pink transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              {testingClaude ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-brand-yellow" />
              )}
              <span>{claudeLatency ? `Test (${claudeLatency}ms)` : "Test Connection"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
