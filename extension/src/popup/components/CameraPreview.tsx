import React, { useEffect, useRef, useState } from 'react';
import { FaceDetector } from '../../content/modules/FaceDetector';
import { HeadPoseEstimator, HeadDirection } from '../../content/modules/HeadPoseEstimator';
import { FocusCalculator, FocusMetrics } from '../../content/modules/FocusCalculator';
import { Camera, CameraOff, Loader2, KeyRound } from 'lucide-react';

interface CameraPreviewProps {
  isActive: boolean;
  onMetricsUpdate: (metrics: FocusMetrics) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isActive, onMetricsUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const metricsCallbackRef = useRef(onMetricsUpdate);
  metricsCallbackRef.current = onMetricsUpdate;

  const [faceDetector] = useState(() => new FaceDetector());
  const [focusCalculator] = useState(() => new FocusCalculator());

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [currentDir, setCurrentDir] = useState<HeadDirection>('front');
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startStream = async () => {
      if (!isActive) return;

      setIsLoading(true);
      setErrorMsg(null);
      setIsPermissionError(false);

      try {
        // 1. Request Webcam Stream directly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) throw new Error('Video element not available');

        video.srcObject = stream;
        await video.play();

        // 2. Initialize MediaPipe
        if (!faceDetector.isReady()) {
          await faceDetector.init();
        }

        if (!isMounted) return;

        setIsLoading(false);
        focusCalculator.reset();

        // 3. Start MediaPipe Detection Loop
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
          metricsCallbackRef.current(metrics);
        });
      } catch (err: any) {
        if (!isMounted) return;
        setIsLoading(false);
        const msg = err?.message || err?.name || '';
        if (
          msg.includes('Permission') ||
          msg.includes('NotAllowedError') ||
          msg.includes('denied') ||
          msg.includes('dismissed')
        ) {
          setIsPermissionError(true);
          setErrorMsg('Izin kamera belum diberikan.');
        } else {
          setErrorMsg(msg || 'Gagal mengakses kamera webcam.');
        }
      }
    };

    startStream();

    return () => {
      isMounted = false;
      faceDetector.stopDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]); // Only depend on isActive!

  const openPermissionTab = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
  };

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
      {/* Hidden native video for feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ display: 'none' }}
      />

      <div className="relative w-full h-[145px] flex items-center justify-center bg-slate-900">
        {isLoading && (
          <div className="flex flex-col items-center gap-2 text-brand-400 z-10">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[11px] font-medium text-slate-300">Menyiapkan Kamera & AI...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 text-center text-rose-300 text-xs flex flex-col items-center gap-2 z-10 max-w-[280px]">
            <CameraOff className="w-5 h-5 text-rose-400" />
            <span>{errorMsg}</span>
            {isPermissionError && (
              <button
                onClick={openPermissionTab}
                className="mt-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[11px] shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Aktifkan Izin Kamera
              </button>
            )}
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
