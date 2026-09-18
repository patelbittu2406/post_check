const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface Category {
  code: string;
  name: string;
  badge: string;
  hashtag: string;
  cta: string;
  emoji: string;
}

export interface VoiceFlowSettings {
  speed: number;
  pitch: number;
  stability: number;
  similarity_boost: number;
  style: number;
  pause_duration: number;
  emphasis_strength: number;
}

export interface VoiceOption {
  id: string;
  display_name: string;
  name: string;
  gender: string;
  tone?: string;
  ref_audio?: string;
  ref_text?: string;
  is_default?: boolean;
  type: "anchor" | "custom_clone";
  sample_url?: string;
  file_path?: string;
  tone_style?: string;
  created_at?: string;
}

export type VoiceProfile = VoiceOption;

export interface VoicePreset {
  id: string;
  name: string;
  settings: VoiceFlowSettings;
}

export interface AudioTagInfo {
  tag: string;
  clean_name: string;
  category: string;
  description: string;
  gujarati_use_case: string;
  speed_factor: number;
  pitch_semitones: number;
  pause_ms: number;
}

export interface UserProfile {
  display_name?: string;
  channel_handle?: string;
  bio?: string;
  timezone?: string;
  ai_provider?: string;
  gemini_api_key?: string;
  gemini_model?: string;
  openai_api_key?: string;
  openai_model?: string;
  anthropic_api_key?: string;
  anthropic_model?: string;
  offline_fallback?: boolean;
  instagram_business_account_id?: string;
  facebook_page_access_token?: string;
  cloudinary_url?: string;
  default_voice?: string;
  default_tone?: string;
  active_voice_preset?: string;
  voice_settings?: VoiceFlowSettings;
  watermark_enabled?: boolean;
  watermark_position?: string;
  watermark_opacity?: number;
  line1_bg?: string;
  line1_text?: string;
  line2_bg?: string;
  line2_text?: string;
  sub_font_size?: number;
  sub_color?: string;
  sub_outline_color?: string;
  target_duration?: number;
  safe_zone_top?: number;
  safe_zone_bottom?: number;
  target_lufs?: number;
  bgm_duck_volume?: number;
  script_pacing_wps?: number;
  badge1_top?: number;
  badge1_left?: number;
  badge2_top?: number;
  badge2_left?: number;
  sub_top?: number;
  sub_left?: number;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/user-profile`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export async function updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/api/user-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to update profile" }));
    throw new Error(err.detail || "Failed to update profile");
  }
  const data = await res.json();
  return data.profile;
}

export async function fetchCategories(): Promise<{ categories: Category[] }> {
  const res = await fetch(`${API_BASE}/api/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function fetchAreas(): Promise<{ areas: string[] }> {
  const res = await fetch(`${API_BASE}/api/areas`);
  if (!res.ok) throw new Error("Failed to fetch areas");
  return res.json();
}

export async function fetchVoices(): Promise<{
  voices: VoiceOption[];
  anchors: VoiceOption[];
  custom_clones: VoiceOption[];
  presets: VoicePreset[];
  default_voice: string;
}> {
  const res = await fetch(`${API_BASE}/api/voice/list`);
  if (!res.ok) throw new Error("Failed to fetch voices");
  return res.json();
}

export async function fetchAudioTags(): Promise<{ tags: AudioTagInfo[] }> {
  const res = await fetch(`${API_BASE}/api/voice/tags`);
  if (!res.ok) throw new Error("Failed to fetch audio tags");
  return res.json();
}

export async function generateVoiceAPI(payload: {
  script_text: string;
  voice_mode?: string;
  tone_style?: string;
  voice_profile_id?: string | null;
  allow_adaptive_fallback?: boolean;
  voice_settings?: Partial<VoiceFlowSettings>;
  text?: string;
  voice_id?: string;
}): Promise<any> {
  // Use dedicated /api/voice/generate with fallback
  const text = payload.text || payload.script_text;
  const voiceId = payload.voice_id || payload.voice_profile_id || payload.voice_mode || "PRARAMBH_MALE";
  
  const res = await fetch(`${API_BASE}/api/voice/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: text,
      voice_id: voiceId,
      voice_settings: payload.voice_settings,
      model_id: "indicf5"
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Voice generation failed" }));
    throw new Error(err.detail || "Voice generation failed");
  }
  return res.json();
}

export async function previewVoiceAPI(payload: {
  text: string;
  voice_id: string;
  settings?: Partial<VoiceFlowSettings>;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/voice/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Voice preview failed" }));
    throw new Error(err.detail || "Voice preview failed");
  }
  return res.json();
}

export async function uploadVoiceCloneAPI(formData: FormData): Promise<any> {
  const res = await fetch(`${API_BASE}/api/voice/clone/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Voice clone upload failed" }));
    throw new Error(err.detail || "Voice clone upload failed");
  }
  return res.json();
}

export async function deleteVoiceCloneAPI(voiceId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/api/voice/clone/${voiceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete voice profile");
  return res.json();
}

export async function generateScriptAPI(payload: {
  raw_details: string;
  category_code: string;
  area: string;
  target_duration: number;
  provider?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/generate-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Script generation failed" }));
    throw new Error(err.detail || "Script generation failed");
  }
  return res.json();
}

export async function autoTagScriptAPI(payload: {
  script_text: string;
  category_code?: string;
  area?: string;
  provider?: string;
  generate_voice?: boolean;
  voice_id?: string;
  voice_settings?: any;
}): Promise<{
  status: string;
  provider_used: string;
  tagged_script: string;
  original_script: string;
  audio_url?: string;
  voiceover_filename?: string;
  duration?: number;
  sample_rate?: number;
  tags_used?: string[];
}> {
  const res = await fetch(`${API_BASE}/api/script/auto-tag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Auto-tagging script failed" }));
    throw new Error(err.detail || "Auto-tagging script failed");
  }
  return res.json();
}

export async function renderVideoAPI(payload: {
  video_mode: string;
  single_video_filename?: string;
  multi_clip_filenames?: string[];
  voiceover_filename: string;
  bg_music_filename?: string;
  line1_text: string;
  line2_text: string;
  line1_bg?: string;
  line1_text_color?: string;
  line2_bg?: string;
  line2_text_color?: string;
  sub_font_size?: number;
  sub_color?: string;
  sub_outline_color?: string;
  category_code: string;
  area: string;
  watermark_enabled?: boolean;
  watermark_position?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/render-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Video render failed" }));
    throw new Error(err.detail || "Video render failed");
  }
  return res.json();
}

export async function publishInstagramAPI(payload: {
  video_filename: string;
  caption: string;
  dry_run: boolean;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/publish-instagram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Publishing failed" }));
    throw new Error(err.detail || "Publishing failed");
  }
  return res.json();
}

export async function fetchBgmAssets(): Promise<{ bgm_files: { name: string; url: string; size_kb: number }[] }> {
  const res = await fetch(`${API_BASE}/api/assets/bgm`);
  if (!res.ok) throw new Error("Failed to fetch BGM assets");
  return res.json();
}

export async function fetchBrollAssets(): Promise<{ broll_files: { name: string; url: string; size_mb: number; type: string }[] }> {
  const res = await fetch(`${API_BASE}/api/assets/broll`);
  if (!res.ok) throw new Error("Failed to fetch B-roll assets");
  return res.json();
}

export async function uploadMediaAPI(
  fileOrFormData: File | FormData,
  mediaType: string = "broll"
): Promise<{
  status: string;
  filename: string;
  url: string;
  size_bytes?: number;
}> {
  let body: FormData;
  if (fileOrFormData instanceof FormData) {
    body = fileOrFormData;
  } else {
    body = new FormData();
    body.append("file", fileOrFormData);
    body.append("media_type", mediaType);
  }

  const res = await fetch(`${API_BASE}/api/upload-media`, {
    method: "POST",
    body: body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to upload media" }));
    throw new Error(err.detail || "Failed to upload media");
  }
  return res.json();
}

export async function fetchLibrary(): Promise<{ reels: any[] }> {
  const res = await fetch(`${API_BASE}/api/library`);
  if (!res.ok) throw new Error("Failed to fetch library");
  return res.json();
}

export async function fetchAnalytics(): Promise<any> {
  const res = await fetch(`${API_BASE}/api/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export async function testLLMConnection(payload: {
  provider: string;
  api_key: string;
  model?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/test-llm-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Connection test failed" }));
    throw new Error(err.detail || "Connection test failed");
  }
  return res.json();
}

export async function testInstagramConnection(payload: {
  account_id: string;
  access_token: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/test-instagram-connection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Instagram connection test failed" }));
    throw new Error(err.detail || "Instagram connection test failed");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Subtitle Engine API (20 Viral Styles + Bilingual Logic)
// ---------------------------------------------------------------------------
export interface SubtitleStylePreset {
  id: string;
  name: string;
  category: "bilingual" | "bold" | "minimal" | "festive" | "cinematic" | "creative" | string;
  icon: string;
  description: string;
  base_font: string;
  base_size: number;
  base_color: string;
  base_outline: string;
  base_outline_width: number;
  base_shadow: number;
  latin_font: string;
  latin_color: string;
  latin_scale: number;
  latin_uppercase: boolean;
  latin_bold: boolean;
  latin_glow?: boolean;
  chunk_size: number;
  animation: string;
  glow: boolean;
  glow_color: string | null;
  pill_bg: boolean;
  pill_color?: string;
  pill_opacity?: number;
  margin_v?: number;
  // Compatibility fields
  highlight_color?: string;
  font_size?: number;
  enable_glow?: boolean;
  enable_pill_bg?: boolean;
  outline_width?: number;
  shadow?: number;
}

export interface SubtitleCategoryInfo {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface SubtitleStylesResponse {
  styles: SubtitleStylePreset[];
  categories: SubtitleCategoryInfo[];
  total: number;
  default_style: string;
}

export type SubtitlePreset = SubtitleStylePreset;

export async function fetchSubtitleStyles(category?: string): Promise<SubtitleStylesResponse> {
  const url = category
    ? `${API_BASE}/api/subtitles/styles?category=${encodeURIComponent(category)}`
    : `${API_BASE}/api/subtitles/styles`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch subtitle styles");
  return res.json();
}

export async function fetchSubtitlePresets(): Promise<SubtitleStylePreset[]> {
  const res = await fetch(`${API_BASE}/api/subtitles/presets`);
  if (!res.ok) throw new Error("Failed to fetch subtitle presets");
  const data = await res.json();
  return data.presets;
}

export async function previewSubtitleStyle(payload: {
  style_id: string;
  sample_text?: string;
  voiceover_duration?: number;
}): Promise<{ style_id: string; ass_path: string; ass_url: string }> {
  const res = await fetch(`${API_BASE}/api/subtitles/preview-style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Subtitle style preview failed");
  return res.json();
}

export async function setWordLanguageOverride(payload: {
  word_index: number;
  forced_language: "gu" | "en" | "auto" | string;
  job_id?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/subtitles/word-language`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to set word language override");
  return res.json();
}

export async function generateSubtitles(payload: {
  audio_path?: string;
  script_text?: string;
  preset?: string;
  custom?: Record<string, any>;
  word_language_overrides?: Record<number, string>;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/subtitles/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errMsg = "Subtitle generation failed";
    try {
      const err = await res.json();
      errMsg = err.detail || err.message || errMsg;
    } catch {
      const txt = await res.text();
      if (txt) errMsg = txt;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function burnSubtitles(payload: {
  video_path: string;
  ass_path: string;
  output_path?: string;
}): Promise<{ output_path: string; output_url: string }> {
  const res = await fetch(`${API_BASE}/api/subtitles/burn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errMsg = "Subtitle burn failed";
    try {
      const err = await res.json();
      errMsg = err.detail || err.message || errMsg;
    } catch {
      const txt = await res.text();
      if (txt) errMsg = txt;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

export async function regenerateSubtitlesFromScript(payload: {
  script_text: string;
  voiceover_duration?: number;
  preset?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/subtitles/regenerate-from-script`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let errMsg = "Script-based subtitle generation failed";
    try {
      const err = await res.json();
      errMsg = err.detail || err.message || errMsg;
    } catch {
      const txt = await res.text();
      if (txt) errMsg = txt;
    }
    throw new Error(errMsg);
  }
  return res.json();
}

