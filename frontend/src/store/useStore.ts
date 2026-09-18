import { create } from "zustand";
import { UserProfile, VoiceFlowSettings, fetchUserProfile, updateUserProfile } from "@/lib/api";
import { CapCutSegment } from "@/lib/capcut/types";

export interface ReelDraft {
  rawDetails: string;
  categoryCode: string;
  area: string;
  targetDuration: number;
  videoMode: "single" | "multi" | "capcut";
  selectedStockBroll: string;
  uploadedSingleClip: string | null;
  uploadedMultiClips: string[];
  selectedBgm: string;
  bgmDuckVolume: number;
  selectedVoiceMode: string;
  selectedVoiceProfileId: string | null;
  voiceSettings: VoiceFlowSettings;
  line1Headline: string;
  line2Headline: string;
  voiceoverScript: string;
  caption: string;
  hookSummary: string;
  voiceoverAudioUrl: string | null;
  voiceoverFilename: string | null;
  renderedVideoUrl: string | null;
  renderedVideoFilename: string | null;
  badge1Top: number;
  badge1Left: number;
  badge2Top: number;
  badge2Left: number;
  subTop: number;
  subLeft: number;

  // CapCut Editor Fields
  capcutClips: string[];
  capcutPresetId: string;
  capcutMotionIntensity: "subtle" | "balanced" | "fast_cuts";
  capcutTransitionStyle: "auto" | "smooth" | "punchy";
  capcutSyncToBeats: boolean;
  capcutSegments: CapCutSegment[];
  capcutSelectedSegmentIndex: number | null;
  capcutBeatTimes: number[];
  capcutDownbeatTimes: number[];

  // Subtitle Engine Settings
  subtitlePreset: string;
  subtitleBaseColor: string;
  subtitleHighlightColor: string;
  subtitleGlowColor: string;
  subtitleFontSize: number;
  subtitleChunkSize: number;
  subtitleAnimation: string;
  subtitleEnableGlow: boolean;
  subtitleEnablePill: boolean;
  wordLanguageOverrides: Record<number, string>;
  subtitlesAssUrl?: string | null;
  subtitlesPath?: string | null;
}


interface AppState {
  theme: "dark" | "light";
  toggleTheme: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  
  // Profile
  profile: UserProfile;
  isProfileLoading: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Current Reel Draft
  draft: ReelDraft;
  updateDraft: (updates: Partial<ReelDraft>) => void;
  resetDraft: () => void;

  // Processing & Stages
  isGeneratingScript: boolean;
  setIsGeneratingScript: (val: boolean) => void;
  isGeneratingVoice: boolean;
  setIsGeneratingVoice: (val: boolean) => void;
  isRenderingVideo: boolean;
  setIsRenderingVideo: (val: boolean) => void;
  renderProgress: number;
  renderStepMessage: string;
  setRenderStatus: (progress: number, msg: string) => void;
  isPublishing: boolean;
  setIsPublishing: (val: boolean) => void;
  publishResult: any;
  setPublishResult: (res: any) => void;
}

const DEFAULT_SETTINGS: VoiceFlowSettings = {
  speed: 1.0,
  pitch: 0.0,
  stability: 0.35,
  similarity_boost: 0.80,
  style: 0.45,
  pause_duration: 0.5,
  emphasis_strength: 0.5,
};

const DEFAULT_DRAFT: ReelDraft = {
  rawDetails: "સુરતના વેસુ વિસ્તારમાં આજે ગણેશ ઉત્સવ દરમિયાન ભારે વરસાદ વચ્ચે પણ ભક્તોનો ઉત્સાહ ચરમસીમાએ જોવા મળ્યો હતો. મંદિરમાં વિશેષ મહાઆરતીનું આયોજન કરવામાં આવ્યું હતું અને મોટી સંખ્યામાં સ્થાનિક લોકો ઉપસ્થિત રહ્યા હતા.",
  categoryCode: "N01",
  area: "All Surat (સમગ્ર સુરત)",
  targetDuration: 30,
  videoMode: "capcut",
  selectedStockBroll: "surat_city_loop.mp4",
  uploadedSingleClip: null,
  uploadedMultiClips: [],
  selectedBgm: "surat_news_bgm.mp3",
  bgmDuckVolume: 0.12,
  selectedVoiceMode: "PRARAMBH_MALE",
  selectedVoiceProfileId: null,
  voiceSettings: DEFAULT_SETTINGS,
  line1Headline: "સુરત ઉત્સવ | F01",
  line2Headline: "ગણેશ ઉત્સવ ધામધૂમથી ઉજવાયો 🎉",
  voiceoverScript: "[excited] સુરતના વેસુ વિસ્તારમાં ગણેશ ઉત્સવનો ભવ્ય ઉત્સાહ જોવા મળ્યો! [pauses] વરસાદ વચ્ચે પણ ભક્તો મોટી સંખ્યામાં ઉમટી પડ્યા અને મહાઆરતીમાં જોડાયા.",
  caption: "SURAT UPDATE | N01\nLocation: Vesu, Surat\n\nશું થયું?\nવેસુમાં ગણેશ ઉત્સવની ભવ્ય ઉજવણી.\n\n#SuratNews #Surat #Vesu",
  hookSummary: "વેસુમાં વરસાદ વચ્ચે ભક્તોનો અદભુત ઉત્સાહ!",
  voiceoverAudioUrl: null,
  voiceoverFilename: null,
  renderedVideoUrl: null,
  renderedVideoFilename: null,
  badge1Top: 28,
  badge1Left: 50,
  badge2Top: 35,
  badge2Left: 50,
  subTop: 78,
  subLeft: 50,
  capcutClips: ["vesu_traffic_clip.mp4", "adajan_rain_clip.mp4", "diamond_bourse_clip.mp4", "ganesh_utsav_clip.mp4"],
  capcutPresetId: "serious",
  capcutMotionIntensity: "balanced",
  capcutTransitionStyle: "auto",
  capcutSyncToBeats: true,
  capcutSegments: [],
  capcutSelectedSegmentIndex: null,
  capcutBeatTimes: [],
  capcutDownbeatTimes: [],

  // Subtitle Engine Defaults
  subtitlePreset: "mixed_highlight",
  subtitleBaseColor: "#FFFFFF",
  subtitleHighlightColor: "#FFD700",
  subtitleGlowColor: "#FFD700",
  subtitleFontSize: 72,
  subtitleChunkSize: 3,
  subtitleAnimation: "bounce_soft",
  subtitleEnableGlow: false,
  subtitleEnablePill: false,
  wordLanguageOverrides: {},
};



export const useStore = create<AppState>((set, get) => ({
  theme: "dark",
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      document.documentElement.classList.toggle("light", next === "light");
      localStorage.setItem("theme", next);
    }
    set({ theme: next });
  },
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  profile: {
    display_name: "Surat News Anchor",
    channel_handle: "@surat.prarambh.news",
    ai_provider: "Gemini",
    gemini_api_key: "",
    gemini_model: "gemini-3.6-flash",
    default_voice: "PRARAMBH_MALE",
    default_tone: "Serious News",
    voice_settings: DEFAULT_SETTINGS,
    line1_bg: "#FF0033",
    line1_text: "#FFFFFF",
    line2_bg: "#0080FF",
    line2_text: "#FFFFFF",
    sub_font_size: 58,
    sub_color: "#FFFFFF",
    sub_outline_color: "#000000",
    watermark_enabled: true,
    watermark_position: "top-right",
    watermark_opacity: 0.85,
    safe_zone_top: 220,
    safe_zone_bottom: 420,
    target_lufs: -14,
    bgm_duck_volume: 0.12,
  },
  isProfileLoading: false,
  loadProfile: async () => {
    set({ isProfileLoading: true });
    try {
      const data = await fetchUserProfile();
      set((state) => ({
        profile: data,
        isProfileLoading: false,
        draft: {
          ...state.draft,
          selectedVoiceMode: data.default_voice || state.draft.selectedVoiceMode,
          voiceSettings: data.voice_settings || state.draft.voiceSettings,
        }
      }));
    } catch (e) {
      console.warn("Could not load user profile from API, using defaults:", e);
      set({ isProfileLoading: false });
    }
  },
  saveProfile: async (updates) => {
    try {
      const updated = await updateUserProfile(updates);
      set((state) => ({
        profile: updated,
        draft: {
          ...state.draft,
          ...(updated.default_voice ? { selectedVoiceMode: updated.default_voice } : {}),
          ...(updated.voice_settings ? { voiceSettings: updated.voice_settings } : {}),
        }
      }));
    } catch (e) {
      console.error("Failed to save profile:", e);
      throw e;
    }
  },

  draft: DEFAULT_DRAFT,
  updateDraft: (updates) =>
    set((state) => ({ draft: { ...state.draft, ...updates } })),
  resetDraft: () => set({ draft: DEFAULT_DRAFT, publishResult: null }),

  isGeneratingScript: false,
  setIsGeneratingScript: (val) => set({ isGeneratingScript: val }),
  isGeneratingVoice: false,
  setIsGeneratingVoice: (val) => set({ isGeneratingVoice: val }),
  isRenderingVideo: false,
  setIsRenderingVideo: (val) => set({ isRenderingVideo: val }),
  renderProgress: 0,
  renderStepMessage: "",
  setRenderStatus: (progress, msg) =>
    set({ renderProgress: progress, renderStepMessage: msg }),
  isPublishing: false,
  setIsPublishing: (val) => set({ isPublishing: val }),
  publishResult: null,
  setPublishResult: (res) => set({ publishResult: res }),
}));
