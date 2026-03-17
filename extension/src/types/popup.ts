export type PopupPage =
  | "home"
  | "profile"
  | "tracker"
  | "chat"
  | "resume"
  | "cover-letter"
  | "files"
  | "job-analysis"
  | "interview-prep";

export type FeaturePage = Exclude<PopupPage, "home">;

export interface AutoApplySession {
  jobBoard: string;
  startTime: number;
  steps: string[];
  errors: string[];
  success: boolean;
}

export interface AutoApplyStatus {
  status: string;
  message?: string;
  details?: any;
  jobBoard?: string;
  session?: AutoApplySession;
}
