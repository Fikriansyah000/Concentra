import { FaceDetector } from '../content/modules/FaceDetector';
import { HeadPoseEstimator } from '../content/modules/HeadPoseEstimator';
import { FocusCalculator } from '../content/modules/FocusCalculator';

console.log('[Concentra Offscreen] Offscreen Document Initialized');

const faceDetector = new FaceDetector();
const focusCalculator = new FocusCalculator();
let stream: MediaStream | null = null;
let isTracking = false;
let lastMessageTime = 0;

async function startOffscreenTracking() {
  if (isTracking) return;
  isTracking = true;

  try {
    const video = document.getElementById('offscreen-video') as HTMLVideoElement;
    if (!video) throw new Error('Video element not found in offscreen document');

    console.log('[Concentra Offscreen] Requesting webcam stream in background...');
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: 'user',
        frameRate: { ideal: 30 },
      },
      audio: false,
    });

    video.srcObject = stream;
    await video.play();

    console.log('[Concentra Offscreen] Initializing MediaPipe AI...');
    if (!faceDetector.isReady()) {
      await faceDetector.init();
    }

    focusCalculator.reset();

    // Start detection loop
    faceDetector.startDetection(video, (landmarks) => {
      if (!isTracking) return;

      const hasFace = !!(landmarks && landmarks.length >= 468);
      const headPose = HeadPoseEstimator.estimatePose(landmarks || []);
      const metrics = focusCalculator.calculate(hasFace, headPose);

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
        }).catch(() => {});
      }
    });

    console.log('[Concentra Offscreen] Background webcam tracking is now RUNNING');
  } catch (error) {
    console.error('[Concentra Offscreen] Error starting offscreen camera:', error);
    isTracking = false;
  }
}

function stopOffscreenTracking() {
  isTracking = false;
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
