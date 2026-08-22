import React, { useEffect, useRef, useState } from 'react';
import { CameraManager } from '../../content/modules/CameraManager';
import { FaceDetector } from '../../content/modules/FaceDetector';
import { HeadPoseEstimator, HeadDirection } from '../../content/modules/HeadPoseEstimator';
import { FocusCalculator, FocusMetrics } from '../../content/modules/FocusCalculator';
import { Camera, CameraOff, Loader2 } from 'lucide-react';

interface CameraPreviewProps {
  isActive: boolean;
  onMetricsUpdate: (metrics: FocusMetrics) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isActive, onMetricsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraManager] = useState(() => new CameraManager());
  const [faceDetector] = useState(() => new FaceDetector());
  const [focusCalculator] = useState(() => new FocusCalculator());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentDir, setCurrentDir] = useState<HeadDirection>('front');
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initCameraAndAI = async () => {
      if (!isActive) {
        faceDetector.stopDetection();
        cameraManager.stopCamera();
        return;
      }

      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1. Start Webcam
        const video = await cameraManager.startCamera(320, 240);
        if (!isMounted) return;

        // 2. Init MediaPipe
        if (!faceDetector.isReady()) {
          await faceDetector.init();
        }
        if (!isMounted) return;

        setIsLoading(false);
        focusCalculator.reset();

        // 3. Start Detection Loop
        faceDetector.startDetection(video, (landmarks) => {
          if (!isMounted) return;

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');

          // Draw video on canvas
          if (ctx && canvas && video.readyState >= 2) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Draw landmark dots
            if (landmarks && landmarks.length > 0) {
              ctx.fillStyle = '#6366f1';
              [1, 33, 263, 61, 291, 152, 10].forEach((idx) => {
                const pt = landmarks[idx];
                if (pt) {
                  const px = pt.x * canvas.width;
                  const py = pt.y * canvas.height;
                  ctx.beginPath();
                  ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
                  ctx.fill();
                }
              });
            }
          }

          const hasFace = !!(landmarks && landmarks.length >= 468);
          setIsFaceDetected(hasFace);

          const headPose = HeadPoseEstimator.estimatePose(landmarks || []);
          setCurrentDir(headPose.direction);

          const metrics = focusCalculator.calculate(hasFace, headPose);
          onMetricsUpdate(metrics);
        });
      } catch (err: any) {
        if (!isMounted) return;
        setIsLoading(false);
        setErrorMsg(err?.message || 'Gagal mengakses kamera webcam.');
      }
    };

    initCameraAndAI();

    return () => {
      isMounted = false;
      faceDetector.stopDetection();
      cameraManager.stopCamera();
    };
  }, [isActive]);

  const getDirectionLabel = (dir: HeadDirection, face: boolean) => {
    if (!face) return 'Wajah Tidak Terdeteksi';
    switch (dir) {
      case 'front': return 'Menatap Layar (Fokus)';
      case 'left': return 'Menoleh Kiri';
      case 'right': return 'Menoleh Kanan';
      case 'down': return 'Menunduk (Distraksi)';
      case 'up': return 'Mendongak';
      default: return 'Fokus';
    }
  };

  if (!isActive) return null;

  return (
    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-inner">
      <div className="relative w-full h-[140px] flex items-center justify-center bg-slate-900">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-brand-400 z-10">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[11px] font-medium text-slate-300">Menyiapkan Kamera & AI...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 text-center text-rose-400 text-xs flex flex-col items-center gap-1 z-10">
            <CameraOff className="w-5 h-5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading || errorMsg ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Live HUD Badges on top of camera */}
        {!isLoading && !errorMsg && (
          <>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700/50 text-[10px]">
              <span className={`w-2 h-2 rounded-full ${isFaceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-slate-200 font-semibold">{isFaceDetected ? 'AI LIVE' : 'NO FACE'}</span>
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700/50 text-[10px]">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <Camera className="w-3 h-3 text-brand-400" />
                {getDirectionLabel(currentDir, isFaceDetected)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
