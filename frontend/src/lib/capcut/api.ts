import { 
  CapCutPreset, 
  CapCutAnalyzeResponse, 
  CapCutRenderJob, 
  CapCutSegment 
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchCapCutPresets(): Promise<{ presets: CapCutPreset[] }> {
  const res = await fetch(`${API_BASE}/api/capcut/presets`);
  if (!res.ok) throw new Error("Failed to fetch CapCut presets");
  return res.json();
}

export async function analyzeCapCutClipsAPI(payload: {
  raw_clip_filenames: string[];
  bgm_filename?: string;
  voiceover_filename?: string;
  target_duration?: number;
  motion_intensity?: string;
  transition_style?: string;
}): Promise<CapCutAnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/capcut/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to analyze video clips");
  return res.json();
}

export async function renderCapCutReelAPI(payload: {
  raw_clip_filenames: string[];
  bgm_filename?: string;
  voiceover_filename?: string;
  voiceover_script?: string;
  target_duration?: number;
  sync_to_beats?: boolean;
  motion_intensity?: string;
  transition_style?: string;
  preset_id?: string;
  line1_text?: string;
  line2_text?: string;
  category_code?: string;
  area?: string;
  sub_font_size?: number;
  sub_color?: string;
  sub_outline_color?: string;
}): Promise<{ status: string; job_id: string }> {
  const res = await fetch(`${API_BASE}/api/capcut/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to initiate CapCut render");
  return res.json();
}

export async function getCapCutJobStatus(jobId: string): Promise<CapCutRenderJob> {
  const res = await fetch(`${API_BASE}/api/capcut/status/${jobId}`);
  if (!res.ok) throw new Error("Failed to fetch CapCut job status");
  return res.json();
}

export async function previewSegmentAPI(payload: {
  clip_filename: string;
  start: number;
  end: number;
  motion_type?: string;
}): Promise<{ status: string; preview_url: string; duration: number }> {
  const res = await fetch(`${API_BASE}/api/capcut/preview-segment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to render segment preview");
  return res.json();
}

export function createCapCutWebSocket(
  jobId: string, 
  onMessage: (data: CapCutRenderJob) => void,
  onError?: (err: any) => void
): WebSocket {
  const wsBase = API_BASE.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/api/capcut/ws/${jobId}`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.warn("Failed to parse WebSocket message:", e);
    }
  };

  if (onError) {
    ws.onerror = onError;
  }

  return ws;
}
