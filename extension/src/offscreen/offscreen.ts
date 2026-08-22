import { FaceDetector } from '../content/modules/FaceDetector';
import { HeadPoseEstimator } from '../content/modules/HeadPoseEstimator';
import { FocusCalculator } from '../content/modules/FocusCalculator';

console.log('[Concentra Offscreen] AI Background Tracker Initialized');

const faceDetector = new FaceDetector();
const focusCalculator = new FocusCalculator();
let stream: MediaStream | null = null;
let isTracking = false;
let lastMessageTime = 0;
let retryTimer: any = null;

async function startOffscreenTracking() {
  if (isTracking && stream?.active) return;
  isTracking = true;

  try {
    const video = document.getElementById('offscreen-video') as HTMLVideoElement;
    if (!video) throw new Error('Video element not found in offscreen document');

    console.log('[Concentra Offscreen] Starting continuous background camera stream...');
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: 'user',
        frameRate: { ideal: 25 },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    console.log('[Concentra Offscreen] Initializing MediaPipe AI in background...');
    if (!faceDetector.isReady()) {
      await faceDetector.init();
    }

    focusCalculator.reset();

    // Start detection loop with blendshapes (eye closed / merem detection)
    faceDetector.startDetection(video, (landmarks, rawResult) => {
      if (!isTracking) return;

      const hasFace = !!(landmarks && landmarks.length >= 468);
      const headPose = HeadPoseEstimator.estimatePose(landmarks || [], rawResult);
      const metrics = focusCalculator.calculate(hasFace, headPose);

      const now = performance.now();
      // Send metric update to Background SW every 800ms
      if (now - lastMessageTime >= 800) {
        lastMessageTime = now;

        const isMerem = headPose.eyeGaze?.isEyesClosed || false;
        let direction = headPose.direction;
        if (isMerem) {
          direction = 'front';
        }

        chrome.runtime.sendMessage({
          type: 'FOCUS_UPDATE',
          payload: {
            focusScore: metrics.smoothedScore,
            headDirection: direction,
            faceDetected: metrics.faceDetected,
            isDistracted: metrics.isDistracted,
            isEyesClosed: isMerem,
            timestamp: new Date().toISOString(),
          },
        }).catch(() => {});
      }
    });

    console.log('[Concentra Offscreen] Background webcam tracking is now RUNNING & ACTIVE');
  } catch (error) {
    console.error('[Concentra Offscreen] Error starting offscreen camera:', error);
    isTracking = false;

    // Retry after 2 seconds if failed
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      startOffscreenTracking();
    }, 2000);
  }
}

function stopOffscreenTracking() {
  isTracking = false;
  if (retryTimer) clearTimeout(retryTimer);
  faceDetector.stopDetection();
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  const video = document.getElementById('offscreen-video') as HTMLVideoElement;
  if (video) {
    video.pause();
    video.srcObject = null;
  }
  console.log('[Concentra Offscreen] Background webcam tracking STOPPED');
}

// Listen for messages from Background SW
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_OFFSCREEN_CAMERA') {
    startOffscreenTracking();
    sendResponse({ success: true });
  } else if (message.type === 'STOP_OFFSCREEN_CAMERA') {
    stopOffscreenTracking();
    sendResponse({ success: true });
  }
  return true;
});

// Auto-start on load
startOffscreenTracking();
