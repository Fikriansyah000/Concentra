import { create } from 'zustand';
import { LOCAL_STORAGE_KEYS } from '../lib/constants';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  loginDev: (email?: string) => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN),
  isAuthenticated: !!localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN),
  isLoading: false,

  setToken: (token: string) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, token);
    set({ token, isAuthenticated: true });
  },

  setUser: (user: User) => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({ user });
  },

  loginDev: async (email = 'dev@concentra.local') => {
    set({ isLoading: true });
    try {
      const res = await authService.devLogin(email);
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, res.access_token);
      localStorage.setItem(LOCAL_STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));
      set({
        token: res.access_token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USER_DATA);
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
