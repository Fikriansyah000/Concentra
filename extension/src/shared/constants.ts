export const STORAGE_KEYS = {
  AUTH_INFO: 'concentra_auth_info',
  ACTIVE_SESSION: 'concentra_active_session',
  SETTINGS: 'concentra_settings',
  OFFLINE_QUEUE: 'concentra_offline_queue',
};

export const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/v1';

export const DEFAULT_SESSION_STATE = {
  status: 'idle' as const,
  sessionId: null,
  title: 'Sesi Belajar Mandiri',
  sourceUrl: '',
  sourceType: 'other',
  startedAt: null,
  pausedAt: null,
  elapsedSeconds: 0,
  pauseCount: 0,
  currentFocusScore: 100,
  avgFocusScore: 100,
  totalDistractions: 0,
};
