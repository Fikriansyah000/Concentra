import { FocusOverlay } from './overlay/FocusOverlay';
import { BaseExtensionMessage } from '../shared/types';
import { extensionStorage } from '../shared/storage';

console.log('[Concentra Content Script] Injected on:', window.location.href);

let focusOverlay: FocusOverlay | null = null;
let isSessionActive = false;

function showHUD() {
  if (!focusOverlay) {
    focusOverlay = new FocusOverlay();
  }
  focusOverlay.show();
  isSessionActive = true;
}

function hideHUD() {
  isSessionActive = false;
  focusOverlay?.hide();
}

function destroyHUD() {
  isSessionActive = false;
  focusOverlay?.destroy();
  focusOverlay = null;
}

// Listen for commands and live metric broadcasts from background SW
chrome.runtime.onMessage.addListener((message: BaseExtensionMessage, _sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'START_SESSION':
      case 'RESUME_SESSION':
        showHUD();
        sendResponse({ success: true });
        break;

      case 'PAUSE_SESSION':
        hideHUD();
        sendResponse({ success: true });
        break;

      case 'STOP_SESSION':
        destroyHUD();
        sendResponse({ success: true });
        break;

      case 'LIVE_FOCUS_METRIC': {
        if (!focusOverlay && isSessionActive) {
          showHUD();
        }
        if (focusOverlay && message.payload) {
          const score = message.payload.score || 100;
          const focusLevel = score >= 80 ? 'high' : score >= 55 ? 'medium' : score >= 30 ? 'low' : 'critical';

          focusOverlay.updateMetrics({
            rawScore: score,
            smoothedScore: score,
            isDistracted: message.payload.isDistracted,
            faceDetected: true,
            headPose: {
              yaw: 0,
              pitch: 0,
              roll: 0,
              direction: (message.payload.headDirection || 'front') as any,
            },
            focusLevel,
          });
        }
        sendResponse({ success: true });
        break;
      }

      default:
        sendResponse({ received: true });
    }
  } catch (err: any) {
    sendResponse({ error: err?.message });
  }
  return true;
});

// Check if a session is already active when page loads
(async () => {
  try {
    const active = await extensionStorage.getActiveSession();
    if (active && active.status === 'active') {
      console.log('[Concentra Content Script] Active session detected, mounting HUD...');
      showHUD();
    }
  } catch (e) {
    console.warn('[Concentra Content Script] Init error', e);
  }
})();
