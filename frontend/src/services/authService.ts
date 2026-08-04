import { api } from './api';
import { User } from '../types';

export interface SyncUserPayload {
  supabase_uid: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
}

export const authService = {
  syncUser: async (payload: SyncUserPayload): Promise<User> => {
    const res = await api.post('/auth/sync-user', payload);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  devLogin: async (email: string = 'dev@concentra.local') => {
    try {
      const res = await api.post(`/auth/dev/login?email=${encodeURIComponent(email)}`);
      return res.data;
    } catch (error) {
      // Fallback to dummy data if backend is offline so user can preview UI
      console.warn("Backend offline, using dummy login data.");
      return {
        access_token: "dummy_jwt_token_for_ui_testing",
        user: {
          id: "dummy-user-id-1234",
          email: email,
          full_name: "Mahasiswa Dev (Offline Mode)",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    }
  },

  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
};
