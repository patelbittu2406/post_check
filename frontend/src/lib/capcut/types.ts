export type MotionType = 
  | "zoom_in" 
  | "zoom_out" 
  | "pan_left" 
  | "pan_right" 
  | "punch_flash" 
  | "static";

export type TransitionType = 
  | "dissolve" 
  | "whip_left" 
  | "whip_right" 
  | "flash" 
  | "wipe_left" 
  | "wipe_right" 
  | "hard_cut" 
  | "none";

export interface CapCutSegment {
  index: number;
  clip_path: string;
  clip_name: string;
  source_start: number;
  source_end: number;
  timeline_start: number;
  timeline_end: number;
  duration: number;
  motion_type: MotionType;
  transition_in: TransitionType;
  transition_out: TransitionType;
  is_downbeat?: boolean;
  score?: number;
  motion_score?: number;
  framing_info?: {
    framing_type: "face" | "saliency" | "center";
    crop_x_percent: number;
    crop_y_percent: number;
    subject_center_x?: number;
    subject_center_y?: number;
  };
}

export interface CapCutPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  motion_intensity: "subtle" | "balanced" | "fast_cuts";
  transition_style: "auto" | "smooth" | "punchy";
  avg_segment_duration: number;
  zoom_range: [number, number];
  bgm_duck_level: number;
  flash_boost?: boolean;
}

export interface CapCutAnalyzeResponse {
  status: string;
  tempo_bpm: number;
  beat_times: number[];
  downbeat_times: number[];
  pause_times: number[];
  total_duration: number;
  segments: CapCutSegment[];
  total_found: number;
  recommended_count: number;
}

export interface CapCutRenderJob {
  job_id: string;
  status: "processing" | "completed" | "failed";
  stage: string;
  progress: number;
  message?: string;
  video_filename?: string;
  video_url?: string;
  duration?: number;
  file_size_mb?: number;
  error?: string;
}
