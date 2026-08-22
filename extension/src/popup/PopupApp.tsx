import React, { useState, useEffect, useCallback } from 'react';
import { PopupHeader } from './components/PopupHeader';
import { FocusStatus } from './components/FocusStatus';
import { QuickStats } from './components/QuickStats';
import { SessionControl } from './components/SessionControl';
import { CameraPreview } from './components/CameraPreview';
import { ActiveSessionState, UserAuthInfo } from '../shared/types';
import { extensionStorage } from '../shared/storage';
import { extensionMessaging } from '../shared/messaging';
import { DEFAULT_SESSION_STATE } from '../shared/constants';
import { FocusMetrics } from '../content/modules/FocusCalculator';
import { ShieldCheck } from 'lucide-react';

export const PopupApp: React.FC = () => {
  const [session, setSession] = useState<ActiveSessionState>(DEFAULT_SESSION_STATE);
  const [auth, setAuth] = useState<UserAuthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state from storage and background
  const refreshState = async () => {
    const active = await extensionStorage.getActiveSession();
    const userAuth = await extensionStorage.getAuthInfo();
    setSession(active);
    setAuth(userAuth);
  };

  useEffect(() => {
    refreshState();

    // Poll storage for timer every 1s
    const interval = setInterval(async () => {
      const active = await extensionStorage.getActiveSession();
      setSession((prev) => ({
        ...prev,
        status: active.status,
        elapsedSeconds: active.elapsedSeconds,
        pauseCount: active.pauseCount,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleMetricsUpdate = useCallback((metrics: FocusMetrics) => {
    setSession((prev) => {
      if (prev.status !== 'active') return prev;
      const newAvg = Math.round(prev.avgFocusScore * 0.9 + metrics.smoothedScore * 0.1);
      const newDistractions = metrics.isDistracted ? prev.totalDistractions + 1 : prev.totalDistractions;

      const updated = {
        ...prev,
        currentFocusScore: metrics.smoothedScore,
        avgFocusScore: newAvg,
        totalDistractions: newDistractions,
      };

      // Background update
      extensionMessaging.sendToBackground({
        type: 'FOCUS_UPDATE',
        payload: {
          focusScore: metrics.smoothedScore,
          headDirection: metrics.headPose.direction,
          faceDetected: metrics.faceDetected,
          isDistracted: metrics.isDistracted,
          timestamp: new Date().toISOString(),
        },
      }).catch(() => {});

      return updated;
    });
  }, []);

  const handleStart = async (title: string) => {
    setIsLoading(true);
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const url = tabs[0]?.url || '';
        let sourceType = 'other';
        if (url.includes('youtube.com')) sourceType = 'youtube';
        else if (url.includes('meet.google.com')) sourceType = 'google_meet';
        else if (url.includes('zoom.us')) sourceType = 'zoom';
        else if (url.includes('coursera.org')) sourceType = 'coursera';

        const res = await extensionMessaging.sendToBackground({
          type: 'START_SESSION',
          payload: { title, sourceUrl: url, sourceType },
        });

        if (res?.session) {
          setSession(res.session);
        }
        setIsLoading(false);
      });
    } catch {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    const res = await extensionMessaging.sendToBackground({ type: 'PAUSE_SESSION' });
    if (res?.session) setSession(res.session);
    setIsLoading(false);
  };

  const handleResume = async () => {
    setIsLoading(true);
    const res = await extensionMessaging.sendToBackground({ type: 'RESUME_SESSION' });
    if (res?.session) setSession(res.session);
    setIsLoading(false);
  };

  const handleStop = async () => {
    setIsLoading(true);
    const res = await extensionMessaging.sendToBackground({ type: 'STOP_SESSION' });
    if (res?.session) setSession(res.session);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-[520px]">
      <PopupHeader auth={auth} isActive={session.status === 'active'} />

      <main className="flex-1 p-4 space-y-4">
        {/* Live Camera Preview & Landmark Overlay when active */}
        {session.status === 'active' && (
          <CameraPreview
            isActive={session.status === 'active'}
            onMetricsUpdate={handleMetricsUpdate}
          />
        )}

        {/* Real-time Focus Gauge Card */}
        <FocusStatus
          score={session.currentFocusScore}
          status={session.status}
          distractions={session.totalDistractions}
        />

        {/* Quick Stats Grid */}
        <QuickStats
          elapsedSeconds={session.elapsedSeconds}
          avgFocusScore={session.avgFocusScore}
          distractions={session.totalDistractions}
        />

        {/* Session Action Controls */}
        <div className="glass-card p-4 rounded-xl">
          <SessionControl
            session={session}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            isLoading={isLoading}
          />
        </div>
      </main>

      <footer className="p-3 border-t border-dark-border/60 bg-dark-bg/60 text-center flex items-center justify-center gap-1.5 text-[10px] text-dark-muted">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>100% Client-side AI &bull; Video Privasi Terjaga</span>
      </footer>
    </div>
  );
};
