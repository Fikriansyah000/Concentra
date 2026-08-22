import { HeadPoseResult } from './HeadPoseEstimator';

export interface FocusMetrics {
  rawScore: number;
  smoothedScore: number;
  isDistracted: boolean;
  faceDetected: boolean;
  headPose: HeadPoseResult;
  focusLevel: 'high' | 'medium' | 'low' | 'critical';
}

export class FocusCalculator {
  private smoothedScore: number = 100;
  private alpha: number = 0.2; // EMA smoothing factor
  private faceMissingFrames: number = 0;
  private eyeClosedFrames: number = 0;
  private readonly missingGraceFrames: number = 15; // ~1-1.5 sec grace period

  reset() {
    this.smoothedScore = 100;
    this.faceMissingFrames = 0;
    this.eyeClosedFrames = 0;
  }

  calculate(faceDetected: boolean, headPose: HeadPoseResult): FocusMetrics {
    let rawScore = 100;
    let isDistracted = false;

    if (!faceDetected) {
      this.faceMissingFrames += 1;
      if (this.faceMissingFrames > this.missingGraceFrames) {
        rawScore = 0;
        isDistracted = true;
      } else {
        // Linear drop during grace period
        rawScore = Math.max(0, 100 - (this.faceMissingFrames * 5));
      }
    } else {
      this.faceMissingFrames = 0;

      // 1. Head Yaw penalty (turning left/right)
      const absYaw = Math.abs(headPose.yaw);
      if (absYaw > 15) {
        const yawPenalty = Math.min(60, (absYaw - 15) * 2.5);
        rawScore -= yawPenalty;
        if (absYaw > 22) isDistracted = true;
      }

      // 2. Head Pitch penalty (looking down at phone/desk or looking up)
      if (headPose.pitch > 15) {
        const pitchDownPenalty = Math.min(50, (headPose.pitch - 15) * 2.2);
        rawScore -= pitchDownPenalty;
        if (headPose.pitch > 22) isDistracted = true;
      } else if (headPose.pitch < -12) {
        const pitchUpPenalty = Math.min(40, (Math.abs(headPose.pitch) - 12) * 2.0);
        rawScore -= pitchUpPenalty;
        if (headPose.pitch < -18) isDistracted = true;
      }

      // 3. Head Roll penalty (tilting head excessively)
      const absRoll = Math.abs(headPose.roll);
      if (absRoll > 15) {
        rawScore -= Math.min(25, (absRoll - 15) * 1.5);
      }

      // 4. Eye Gaze & Eyeball Iris Offset (Eye focus on screen)
      if (headPose.eyeGaze) {
        const { gazeOffsetX, gazeOffsetY, isEyesClosed } = headPose.eyeGaze;

        // Gaze wandering off screen (even if head is straight)
        const absGazeX = Math.abs(gazeOffsetX);
        const absGazeY = Math.abs(gazeOffsetY);

        if (absGazeX > 0.4) {
          const eyePenalty = (absGazeX - 0.4) * 45;
          rawScore -= eyePenalty;
          if (absGazeX > 0.6) isDistracted = true;
        }

        if (absGazeY > 0.45) {
          const eyeDownPenalty = (absGazeY - 0.45) * 40;
          rawScore -= eyeDownPenalty;
          if (absGazeY > 0.65) isDistracted = true;
        }

        // 5. Eye Closure / Drowsiness Check (EAR)
        if (isEyesClosed) {
          this.eyeClosedFrames += 1;
          if (this.eyeClosedFrames > 8) { // > 400ms (more than a regular blink)
            rawScore -= 50;
            isDistracted = true;
          }
        } else {
          this.eyeClosedFrames = 0;
        }
      }
    }

    rawScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Apply EMA Smoothing
    this.smoothedScore = Math.round(
      this.alpha * rawScore + (1 - this.alpha) * this.smoothedScore
    );
    this.smoothedScore = Math.max(0, Math.min(100, this.smoothedScore));

    // Focus Level
    let focusLevel: 'high' | 'medium' | 'low' | 'critical' = 'high';
    if (this.smoothedScore >= 80) focusLevel = 'high';
    else if (this.smoothedScore >= 55) focusLevel = 'medium';
    else if (this.smoothedScore >= 30) focusLevel = 'low';
    else focusLevel = 'critical';

    return {
      rawScore,
      smoothedScore: this.smoothedScore,
      isDistracted,
      faceDetected,
      headPose,
      focusLevel,
    };
  }
}
