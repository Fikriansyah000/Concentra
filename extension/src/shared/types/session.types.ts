export type SessionStatus = 'idle' | 'active' | 'paused' | 'completed';

export interface ActiveSessionState {
  status: SessionStatus;
  sessionId: string | null;
  title: string;
  sourceUrl: string;
  sourceType: string;
  startedAt: string | null;
  pausedAt: string | null;
  elapsedSeconds: number;
  pauseCount: number;
  currentFocusScore: number;
  avgFocusScore: number;
  totalDistractions: number;
}

export interface UserAuthInfo {
  token: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
}
