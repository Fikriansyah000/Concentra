import { CameraManager } from './modules/CameraManager';
import { FaceDetector } from './modules/FaceDetector';
import { HeadPoseEstimator } from './modules/HeadPoseEstimator';
import { FocusCalculator } from './modules/FocusCalculator';
import { FocusOverlay } from './overlay/FocusOverlay';
import { BaseExtensionMessage } from '../shared/types';
import { extensionStorage } from '../shared/storage';

console.log('[Concentra Content Script] Initialized on:', window.location.href);

const cameraManager = new CameraManager();
const faceDetector = new FaceDetector();
const focusCalculator = new FocusCalculator();
let focusOverlay: FocusOverlay | null = null;

let isSessionActive = false;
let lastMessageTime = 0;

async function startTracking() {
  if (isSessionActive) return;
  isSessionActive = true;

  try {
    if (!focusOverlay) {
      focusOverlay = new FocusOverlay();
    }
    focusOverlay.show();

    // 1. Start Webcam
    const videoEl = await cameraManager.startCamera(640, 480);

    // 2. Initialize MediaPipe
    if (!faceDetector.isReady()) {
      await faceDetector.init();
    }

    focusCalculator.reset();

    // 3. Start Detection Loop
    faceDetector.startDetection(videoEl, (landmarks) => {
      if (!isSessionActive) return;

      const faceDetected = !!(landmarks && landmarks.length >= 468);
      const headPose = HeadPoseEstimator.estimatePose(landmarks || []);
      const metrics = focusCalculator.calculate(faceDetected, headPose);

      // Update Overlay HUD (video canvas, score badge, direction)
      focusOverlay?.updateMetrics(metrics, videoEl, landmarks);

      // Send update to background SW once every 1 second
      const now = performance.now();
      if (now - lastMessageTime >= 1000) {
        lastMessageTime = now;
        chrome.runtime.sendMessage({
          type: 'FOCUS_UPDATE',
          payload: {
            focusScore: metrics.smoothedScore,
            headDirection: metrics.headPose.direction,
            faceDetected: metrics.faceDetected,
            isDistracted: metrics.isDistracted,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {
          // Background script might be sleeping
        });
      }
    });

    console.log('[Concentra Content Script] Tracking started');
  } catch (error: any) {
    console.error('[Concentra Content Script] Error starting camera/detection:', error);
    isSessionActive = false;
    stopTracking();
  }
}

function pauseTracking() {
  faceDetector.stopDetection();
  cameraManager.stopCamera();
  focusOverlay?.hide();
  isSessionActive = false;
  console.log('[Concentra Content Script] Tracking paused');
}

function stopTracking() {
  isSessionActive = false;
  faceDetector.stopDetection();
  cameraManager.stopCamera();
  focusOverlay?.destroy();
  focusOverlay = null;
  console.log('[Concentra Content Script] Tracking stopped & cleaned up');
}

// Listen for commands from Background SW or Popup
chrome.runtime.onMessage.addListener((message: BaseExtensionMessage, _sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'START_SESSION':
      case 'RESUME_SESSION':
        startTracking();
        sendResponse({ success: true });
        break;

      case 'PAUSE_SESSION':
        pauseTracking();
        sendResponse({ success: true });
        break;

      case 'STOP_SESSION':
        stopTracking();
        sendResponse({ success: true });
        break;

      case 'SESSION_STATE_CHANGED':
        if (message.payload?.status === 'active') {
          startTracking();
        } else if (message.payload?.status === 'paused') {
          pauseTracking();
        } else {
          stopTracking();
        }
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ received: true });
    }
  } catch (err: any) {
    sendResponse({ error: err?.message });
  }
  return true;
});

// Check if a session is already active when content script loads
(async () => {
  try {
    const active = await extensionStorage.getActiveSession();
    if (active && active.status === 'active') {
      console.log('[Concentra Content Script] Found active session in storage, resuming camera...');
      startTracking();
    }
  } catch (e) {
    console.warn('[Concentra Content Script] Init check error', e);
  }
})();
