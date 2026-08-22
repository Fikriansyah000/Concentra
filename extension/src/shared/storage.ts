import { STORAGE_KEYS, DEFAULT_SESSION_STATE } from './constants';
import { ActiveSessionState, UserAuthInfo } from './types';

export const extensionStorage = {
  getAuthInfo: async (): Promise<UserAuthInfo | null> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_INFO);
      return result[STORAGE_KEYS.AUTH_INFO] || null;
    } catch {
      return null;
    }
  },

  setAuthInfo: async (auth: UserAuthInfo): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_INFO]: auth });
    } catch (e) {
      console.error('Failed to set auth info in storage', e);
    }
  },

  clearAuthInfo: async (): Promise<void> => {
    try {
      await chrome.storage.local.remove(STORAGE_KEYS.AUTH_INFO);
    } catch (e) {
      console.error('Failed to clear auth info', e);
    }
  },

  getActiveSession: async (): Promise<ActiveSessionState> => {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_SESSION);
      return result[STORAGE_KEYS.ACTIVE_SESSION] || DEFAULT_SESSION_STATE;
    } catch {
      return DEFAULT_SESSION_STATE;
    }
  },

  setActiveSession: async (session: ActiveSessionState): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_SESSION]: session });
    } catch (e) {
      console.error('Failed to save session state', e);
    }
  },

  clearActiveSession: async (): Promise<void> => {
    try {
      await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_SESSION]: DEFAULT_SESSION_STATE });
    } catch (e) {
      console.error('Failed to clear session state', e);
    }
  },
};
