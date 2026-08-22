import { FilesetResolver, FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { Landmark3D } from './HeadPoseEstimator';

export class FaceDetector {
  private landmarker: FaceLandmarker | null = null;
  private isInitializing: boolean = false;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private lastProcessedTime: number = 0;
  private readonly frameInterval: number = 1000 / 20; // ~50ms (20 FPS smooth tracking)

  async init(): Promise<void> {
    if (this.landmarker || this.isInitializing) return;

    this.isInitializing = true;
    try {
      // Determine local extension path if available, otherwise CDN
      let wasmPath = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
      let modelPath = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
          wasmPath = chrome.runtime.getURL('wasm');
          modelPath = chrome.runtime.getURL('models/face_landmarker.task');
        }
      } catch {}

      console.log('[Concentra FaceDetector] Loading MediaPipe vision tasks from:', wasmPath);
      const vision = await FilesetResolver.forVisionTasks(wasmPath);

      console.log('[Concentra FaceDetector] Loading FaceLandmarker model from:', modelPath);
      try {
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      } catch (gpuError) {
        console.warn('[Concentra FaceDetector] GPU delegate fallback to CPU:', gpuError);
        this.landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.4,
          minFacePresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }

      console.log('[Concentra FaceDetector] MediaPipe FaceLandmarker successfully initialized and READY!');
    } catch (error) {
      console.error('[Concentra FaceDetector] Failed to load MediaPipe:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  startDetection(
    videoElement: HTMLVideoElement,
    onResult: (landmarks: Landmark3D[] | null, rawResult?: FaceLandmarkerResult) => void
  ) {
    if (!this.landmarker) {
      console.error('[Concentra FaceDetector] Landmarker not initialized before start');
      return;
    }

    this.isRunning = true;
    this.lastProcessedTime = 0;

    const detectLoop = () => {
      if (!this.isRunning) return;

      const now = performance.now();
      if (now - this.lastProcessedTime >= this.frameInterval) {
        if (videoElement && videoElement.readyState >= 2 && !videoElement.paused) {
          try {
            const results = this.landmarker?.detectForVideo(videoElement, now);
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
              const landmarks = results.faceLandmarks[0] as Landmark3D[];
              onResult(landmarks, results);
            } else {
              onResult(null, results);
            }
          } catch (e) {
            console.warn('[Concentra FaceDetector] Detection frame error:', e);
          }
          this.lastProcessedTime = now;
        }
      }

      this.animFrameId = requestAnimationFrame(detectLoop);
    };

    this.animFrameId = requestAnimationFrame(detectLoop);
    console.log('[Concentra FaceDetector] Detection loop running');
  }

  stopDetection() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    console.log('[Concentra FaceDetector] Detection loop stopped');
  }

  isReady(): boolean {
    return !!this.landmarker;
  }
}
