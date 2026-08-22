export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export type HeadDirection = 'front' | 'left' | 'right' | 'down' | 'up';

export interface HeadPoseResult {
  yaw: number;   // Angle in degrees (- left, + right)
  pitch: number; // Angle in degrees (- up, + down)
  roll: number;  // Angle in degrees (- tilt left, + tilt right)
  direction: HeadDirection;
}

export class HeadPoseEstimator {
  /**
   * Estimates 3D head pose from MediaPipe 478 face landmarks.
   */
  static estimatePose(landmarks: Landmark3D[]): HeadPoseResult {
    if (!landmarks || landmarks.length < 468) {
      return { yaw: 0, pitch: 0, roll: 0, direction: 'front' };
    }

    const nose = landmarks[1];      // Nose tip
    const chin = landmarks[152];    // Chin
    const leftEye = landmarks[33];  // Left eye outer corner
    const rightEye = landmarks[263];// Right eye outer corner
    const forehead = landmarks[10]; // Top forehead

    // Eye midpoint
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeDist = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);

    // 1. Yaw Estimation (Horizontal rotation)
    // Deviation of nose x from the midpoint of eyes relative to eye distance
    const noseOffsetX = (nose.x - eyeMidX) / (eyeDist || 0.001);
    const rawYaw = Math.atan2(noseOffsetX * 1.5, 1.0) * (180 / Math.PI);
    const yaw = Math.max(-90, Math.min(90, Math.round(rawYaw * 2.2)));

    // 2. Pitch Estimation (Vertical rotation: nod up / down)
    // Ratio of forehead-to-nose vs nose-to-chin distance
    const upperFaceHeight = Math.abs(nose.y - forehead.y);
    const lowerFaceHeight = Math.abs(chin.y - nose.y);
    const verticalRatio = upperFaceHeight / (lowerFaceHeight || 0.001);
    // Standard neutral ratio is approx 1.0 to 1.15
    const pitchOffset = (verticalRatio - 1.1) * 35;
    const pitch = Math.max(-90, Math.min(90, Math.round(pitchOffset)));

    // 3. Roll Estimation (Head tilt sideways)
    const deltaY = rightEye.y - leftEye.y;
    const deltaX = rightEye.x - leftEye.x;
    const rollRad = Math.atan2(deltaY, deltaX);
    const roll = Math.max(-90, Math.min(90, Math.round(rollRad * (180 / Math.PI))));

    // Classify direction
    let direction: HeadDirection = 'front';
    if (Math.abs(yaw) > 18) {
      direction = yaw > 0 ? 'right' : 'left';
    } else if (pitch > 18) {
      direction = 'down';
    } else if (pitch < -15) {
      direction = 'up';
    }

    return {
      yaw,
      pitch,
      roll,
      direction,
    };
  }
}
