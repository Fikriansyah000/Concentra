import { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export type HeadDirection = 'front' | 'left' | 'right' | 'down' | 'up';

export interface EyeGazeResult {
  leftIris: Landmark3D | null;
  rightIris: Landmark3D | null;
  gazeOffsetX: number; // -1 (far left) to +1 (far right), 0 = straight
  gazeOffsetY: number; // -1 (up) to +1 (down), 0 = straight
  isLookingAtScreen: boolean;
  ear: number; // Eye Aspect Ratio
  blinkScore: number; // 0.0 (open) to 1.0 (closed / merem)
  isEyesClosed: boolean; // True when user is closing eyes (merem)
}

export interface HeadPoseResult {
  yaw: number;   // Angle in degrees (- left, + right)
  pitch: number; // Angle in degrees (- up, + down)
  roll: number;  // Angle in degrees (- tilt left, + tilt right)
  direction: HeadDirection;
  eyeGaze: EyeGazeResult;
}

export class HeadPoseEstimator {
  /**
   * Estimates 3D head pose and Eye Gaze / Iris / Blink tracking from MediaPipe landmarks & blendshapes.
   */
  static estimatePose(landmarks: Landmark3D[], rawResult?: FaceLandmarkerResult): HeadPoseResult {
    const defaultEyeGaze: EyeGazeResult = {
      leftIris: null,
      rightIris: null,
      gazeOffsetX: 0,
      gazeOffsetY: 0,
      isLookingAtScreen: true,
      ear: 0.3,
      blinkScore: 0,
      isEyesClosed: false,
    };

    if (!landmarks || landmarks.length < 468) {
      return { yaw: 0, pitch: 0, roll: 0, direction: 'front', eyeGaze: defaultEyeGaze };
    }

    const nose = landmarks[1];      // Nose tip
    const chin = landmarks[152];    // Chin
    const leftEyeOuter = landmarks[33];  // Left eye outer corner
    const leftEyeInner = landmarks[133]; // Left eye inner corner
    const rightEyeOuter = landmarks[263];// Right eye outer corner
    const rightEyeInner = landmarks[362];// Right eye inner corner
    const forehead = landmarks[10]; // Top forehead

    // Eye midpoint
    const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
    const eyeDist = Math.hypot(rightEyeOuter.x - leftEyeOuter.x, rightEyeOuter.y - leftEyeOuter.y);

    // 1. Yaw Estimation (Horizontal rotation)
    const noseOffsetX = (nose.x - eyeMidX) / (eyeDist || 0.001);
    const rawYaw = Math.atan2(noseOffsetX * 1.5, 1.0) * (180 / Math.PI);
    const yaw = Math.max(-90, Math.min(90, Math.round(rawYaw * 2.2)));

    // 2. Pitch Estimation (Vertical rotation)
    const upperFaceHeight = Math.abs(nose.y - forehead.y);
    const lowerFaceHeight = Math.abs(chin.y - nose.y);
    const verticalRatio = upperFaceHeight / (lowerFaceHeight || 0.001);
    const pitchOffset = (verticalRatio - 1.1) * 35;
    const pitch = Math.max(-90, Math.min(90, Math.round(pitchOffset)));

    // 3. Roll Estimation (Head tilt sideways)
    const deltaY = rightEyeOuter.y - leftEyeOuter.y;
    const deltaX = rightEyeOuter.x - leftEyeOuter.x;
    const rollRad = Math.atan2(deltaY, deltaX);
    const roll = Math.max(-90, Math.min(90, Math.round(rollRad * (180 / Math.PI))));

    // 4. Eye Gaze, Iris & Blink Detection (Blendshapes + EAR geometry)
    let eyeGaze = defaultEyeGaze;
    let isEyesClosed = false;
    let blinkScore = 0;

    // Check Blendshapes for eyeBlinkLeft and eyeBlinkRight (Neural Network trained)
    if (rawResult?.faceBlendshapes && rawResult.faceBlendshapes.length > 0) {
      const categories = rawResult.faceBlendshapes[0].categories;
      const blinkLeftCat = categories.find((c) => c.categoryName === 'eyeBlinkLeft');
      const blinkRightCat = categories.find((c) => c.categoryName === 'eyeBlinkRight');

      const blinkLeft = blinkLeftCat?.score || 0;
      const blinkRight = blinkRightCat?.score || 0;
      blinkScore = Math.max(blinkLeft, blinkRight);

      if (blinkScore > 0.42) {
        isEyesClosed = true;
      }
    }

    // Geometric EAR calculation
    const leftEyeWidth = Math.abs(leftEyeInner.x - leftEyeOuter.x) || 0.001;
    const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
    const leftEAR = leftEyeHeight / leftEyeWidth;

    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x) || 0.001;
    const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
    const rightEAR = rightEyeHeight / rightEyeWidth;

    const ear = Number(((leftEAR + rightEAR) / 2).toFixed(2));

    // Fallback: If EAR is very low, mark as closed
    if (ear < 0.18) {
      isEyesClosed = true;
      if (blinkScore < 0.5) blinkScore = 0.8;
    }

    if (landmarks.length >= 478) {
      const leftIris = landmarks[468];
      const rightIris = landmarks[473];

      const leftIrisRatioX = (leftIris.x - leftEyeOuter.x) / leftEyeWidth;
      const rightIrisRatioX = (rightIris.x - rightEyeInner.x) / rightEyeWidth;

      const avgIrisX = (leftIrisRatioX + rightIrisRatioX) / 2;
      const gazeOffsetX = Math.max(-1, Math.min(1, (avgIrisX - 0.5) * 3.5));

      const eyeMidY = (landmarks[159].y + landmarks[145].y + landmarks[386].y + landmarks[374].y) / 4;
      const avgIrisY = (leftIris.y + rightIris.y) / 2;
      const gazeOffsetY = Math.max(-1, Math.min(1, (avgIrisY - eyeMidY) * 20));

      const isLookingAtScreen = Math.abs(gazeOffsetX) < 0.45 && Math.abs(gazeOffsetY) < 0.5 && !isEyesClosed;

      eyeGaze = {
        leftIris,
        rightIris,
        gazeOffsetX: Number(gazeOffsetX.toFixed(2)),
        gazeOffsetY: Number(gazeOffsetY.toFixed(2)),
        isLookingAtScreen,
        ear,
        blinkScore: Number(blinkScore.toFixed(2)),
        isEyesClosed,
      };
    } else {
      eyeGaze.isEyesClosed = isEyesClosed;
      eyeGaze.blinkScore = blinkScore;
      eyeGaze.ear = ear;
    }

    // Classify direction
    let direction: HeadDirection = 'front';
    if (isEyesClosed) {
      direction = 'front'; // Eyes closed/merem
    } else if (Math.abs(yaw) > 18 || eyeGaze.gazeOffsetX > 0.45) {
      direction = (yaw > 0 || eyeGaze.gazeOffsetX > 0) ? 'right' : 'left';
    } else if (pitch > 18 || eyeGaze.gazeOffsetY > 0.45) {
      direction = 'down';
    } else if (pitch < -15 || eyeGaze.gazeOffsetY < -0.45) {
      direction = 'up';
    }

    return {
      yaw,
      pitch,
      roll,
      direction,
      eyeGaze,
    };
  }
}
