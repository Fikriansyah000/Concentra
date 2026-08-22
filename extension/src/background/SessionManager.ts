import { extensionStorage } from '../shared/storage';
import { ActiveSessionState } from '../shared/types';
import { apiClient } from './ApiClient';
import { AuthManager } from './AuthManager';

export class SessionManager {
  private static timerInterval: any = null;

  static async init() {
    const session = await extensionStorage.getActiveSession();
    if (session.status === 'active') {
      this.startTimer();
      await this.ensureOffscreenDocument();
    }
  }

  static async startSession(title: string = 'Sesi Belajar Mandiri', sourceUrl: string = '', sourceType: string = 'other'): Promise<ActiveSessionState> {
    await AuthManager.ensureDefaultDevAuth();

    const apiRes = await apiClient.createSession({
      title,
      source_url: sourceUrl,
      source_type: sourceType,
    });

    const sessionState: ActiveSessionState = {
      status: 'active',
      sessionId: apiRes.id || `session-${Date.now()}`,
      title: apiRes.title || title,
      sourceUrl,
      sourceType,
      startedAt: new Date().toISOString(),
      pausedAt: null,
      elapsedSeconds: 0,
      pauseCount: 0,
      currentFocusScore: 100,
      avgFocusScore: 100,
      totalDistractions: 0,
    };

    await extensionStorage.setActiveSession(sessionState);
    this.startTimer();
    this.updateExtensionBadge('ON', '#10b981'); // Emerald

    // Start background camera via Offscreen Document
    await this.ensureOffscreenDocument();

    // Broadcast to web tabs for Floating HUD
    await this.broadcastToTabs({ type: 'START_SESSION', payload: sessionState });

    return sessionState;
  }

  static async pauseSession(): Promise<ActiveSessionState> {
    const session = await extensionStorage.getActiveSession();
    if (session.status !== 'active') return session;

    if (session.sessionId) {
      await apiClient.updateSession(session.sessionId, 'pause');
    }

    session.status = 'paused';
    session.pausedAt = new Date().toISOString();
    session.pauseCount += 1;

    await extensionStorage.setActiveSession(session);
    this.stopTimer();
    this.updateExtensionBadge('PAUSE', '#f59e0b'); // Amber

    await this.stopOffscreenCamera();
    await this.broadcastToTabs({ type: 'PAUSE_SESSION', payload: session });

    return session;
  }

  static async resumeSession(): Promise<ActiveSessionState> {
    const session = await extensionStorage.getActiveSession();
    if (session.status !== 'paused') return session;

    if (session.sessionId) {
      await apiClient.updateSession(session.sessionId, 'resume');
    }

    session.status = 'active';
    session.pausedAt = null;

    await extensionStorage.setActiveSession(session);
    this.startTimer();
    this.updateExtensionBadge('ON', '#10b981');

    await this.ensureOffscreenDocument();
    await this.broadcastToTabs({ type: 'RESUME_SESSION', payload: session });

    return session;
  }

  static async stopSession(): Promise<ActiveSessionState> {
    const session = await extensionStorage.getActiveSession();
    if (session.status === 'idle') return session;

    this.stopTimer();

    if (session.sessionId) {
      await apiClient.updateSession(session.sessionId, 'stop');
      await apiClient.generateReport(session.sessionId);
    }

    session.status = 'completed';
    await extensionStorage.setActiveSession(session);
    this.updateExtensionBadge('', '');

    await this.closeOffscreenDocument();
    await this.broadcastToTabs({ type: 'STOP_SESSION', payload: session });

    return session;
  }

  static async handleFocusUpdate(score: number, isDistracted: boolean, headDirection: string, isEyesClosed?: boolean) {
    const session = await extensionStorage.getActiveSession();
    if (session.status !== 'active') return;

    session.currentFocusScore = score;
    session.avgFocusScore = Math.round((session.avgFocusScore * 0.9) + (score * 0.1));
    if (isDistracted) {
      session.totalDistractions += 1;
    }

    await extensionStorage.setActiveSession(session);

    // Forward to active tab HUD
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'LIVE_FOCUS_METRIC',
          payload: { score, isDistracted, headDirection, isEyesClosed },
        }).catch(() => {});
      }
    });
  }

  private static async ensureOffscreenDocument() {
    try {
      if (await chrome.offscreen.hasDocument()) {
        chrome.runtime.sendMessage({ type: 'START_OFFSCREEN_CAMERA' }).catch(() => {});
        return;
      }
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA' as any],
        justification: 'Continuous camera tracking for focus analysis during study sessions',
      });
    } catch (e) {
      console.warn('[Concentra SW] ensureOffscreenDocument error', e);
    }
  }

  private static async stopOffscreenCamera() {
    try {
      chrome.runtime.sendMessage({ type: 'STOP_OFFSCREEN_CAMERA' }).catch(() => {});
    } catch {}
  }

  private static async closeOffscreenDocument() {
    try {
      if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
      }
    } catch {}
  }

  private static async broadcastToTabs(message: any) {
    try {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(async (tab) => {
          if (tab.id && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js'],
              }).catch(() => {});
            } catch {}

            chrome.tabs.sendMessage(tab.id, message).catch(() => {});
          }
        });
      });
    } catch (e) {
      console.warn('[Concentra SW] Broadcast error', e);
    }
  }

  private static startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(async () => {
      const session = await extensionStorage.getActiveSession();
      if (session.status === 'active') {
        session.elapsedSeconds += 1;
        await extensionStorage.setActiveSession(session);
      }
    }, 1000);
  }

  private static stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private static updateExtensionBadge(text: string, color: string) {
    try {
      chrome.action.setBadgeText({ text });
      if (color) {
        chrome.action.setBadgeBackgroundColor({ color });
      }
    } catch (e) {
      console.warn('Badge update error', e);
    }
  }
}
