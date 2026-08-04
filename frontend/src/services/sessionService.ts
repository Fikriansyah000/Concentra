import { api } from './api';
import { SessionListResponse, StudySession } from '../types';

export interface CreateSessionPayload {
  title?: string;
  source_url?: string;
  source_type?: string;
}

export const sessionService = {
  createSession: async (payload: CreateSessionPayload): Promise<StudySession> => {
    const res = await api.post('/sessions', payload);
    return res.data;
  },

  getActiveSession: async (): Promise<StudySession | null> => {
    const res = await api.get('/sessions/active');
    return res.data;
  },

  getSessions: async (page = 1, perPage = 10, status?: string): Promise<SessionListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (status) params.append('status', status);
    const res = await api.get(`/sessions?${params.toString()}`);
    return res.data;
  },

  updateSession: async (id: string, action: string, title?: string): Promise<StudySession> => {
    const res = await api.patch(`/sessions/${id}`, { action, title });
    return res.data;
  },
};
