export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  supabase_uid: string;
  auth_provider: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  total_sessions?: number;
  total_study_hours?: number;
}

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type SourceType = 'google_meet' | 'youtube' | 'coursera' | 'zoom' | 'lms' | 'other';

export interface StudySession {
  id: string;
  user_id: string;
  status: SessionStatus;
  title?: string | null;
  source_url?: string | null;
  source_type?: SourceType | null;
  started_at: string;
  paused_at?: string | null;
  ended_at?: string | null;
  total_duration_seconds?: number | null;
  active_duration_seconds?: number | null;
  pause_count: number;
  avg_focus_score?: number | null;
  min_focus_score?: number | null;
  max_focus_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SessionListResponse {
  items: StudySession[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface AnalyticsSummary {
  total_study_sessions: number;
  total_study_hours: number;
  avg_focus_score: number;
  best_focus_score: number;
  total_distractions: number;
  focus_improvement_percentage: number;
}

export interface DailyAnalytics {
  date: string;
  total_sessions: number;
  total_duration_minutes: number;
  avg_focus_score: number;
}

export interface WeeklyAnalytics {
  week_start: string;
  week_end: string;
  total_sessions: number;
  total_study_hours: number;
  avg_focus_score: number;
  daily_breakdown: DailyAnalytics[];
}

export interface StudyPattern {
  most_productive_hour: number;
  most_productive_day: string;
  preferred_source_type?: string | null;
  avg_session_length_minutes: number;
  hourly_distribution: Record<number, number>;
}
