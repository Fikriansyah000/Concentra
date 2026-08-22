import { extensionStorage } from '../shared/storage';
import { ActiveSessionState } from '../shared/types';
import { apiClient } from './ApiClient';
import { AuthManager } from './AuthManager';

export class SessionManager {
  private static timerInterval: any = null;

  static async init() {
    // Check if session was active before SW went idle
    const session = await extensionStorage.getActiveSession();
    if (session.status === 'active') {
      this.startTimer();
    }
  }

  static async startSession(title: string = 'Sesi Belajar Mandiri', sourceUrl: string = '', sourceType: string = 'other'): Promise<ActiveSessionState> {
    await AuthManager.ensureDefaultDevAuth();

    // Call API or create offline session
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

    return session;
  }

  static async stopSession(): Promise<ActiveSessionState> {
    const session = await extensionStorage.getActiveSession();
    if (session.status === 'idle') return session;

    this.stopTimer();

    if (session.sessionId) {
      await apiClient.updateSession(session.sessionId, 'stop');
      // Request report generation
      await apiClient.generateReport(session.sessionId);
    }

    session.status = 'completed';
    await extensionStorage.setActiveSession(session);
    this.updateExtensionBadge('', '');

    return session;
  }

  static async handleFocusUpdate(score: number, isDistracted: boolean) {
    const session = await extensionStorage.getActiveSession();
    if (session.status !== 'active') return;

    session.currentFocusScore = score;
    // Calculate running average
    session.avgFocusScore = Math.round((session.avgFocusScore * 0.9) + (score * 0.1));
    if (isDistracted) {
      session.totalDistractions += 1;
    }

    await extensionStorage.setActiveSession(session);
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
