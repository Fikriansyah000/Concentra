import { DEFAULT_API_BASE_URL } from '../shared/constants';
import { extensionStorage } from '../shared/storage';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const auth = await extensionStorage.getAuthInfo();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (auth?.token) {
      headers['Authorization'] = `Bearer ${auth.token}`;
    }
    return headers;
  }

  async createSession(payload: { title?: string; source_url?: string; source_type?: string }) {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('ApiClient createSession fallback to offline mode', err);
      // Fallback offline session ID
      return {
        id: `offline-session-${Date.now()}`,
        title: payload.title || 'Sesi Belajar Mandiri',
        status: 'active',
        started_at: new Date().toISOString(),
      };
    }
  }

  async updateSession(sessionId: string, action: 'pause' | 'resume' | 'stop' | 'abandon') {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('ApiClient updateSession offline mode', err);
      return { id: sessionId, status: action === 'stop' ? 'completed' : action };
    }
  }

  async sendFocusLogsBatch(sessionId: string, logs: any[]) {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/focus-logs/batch`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          session_id: sessionId,
          logs,
        }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('ApiClient sendFocusLogsBatch error (queued)', err);
      return null;
    }
  }

  async generateReport(sessionId: string) {
    try {
      const headers = await this.getHeaders();
      const res = await fetch(`${this.baseUrl}/reports/sessions/${sessionId}/generate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('ApiClient generateReport error', err);
      return null;
    }
  }
}

export const apiClient = new ApiClient();
