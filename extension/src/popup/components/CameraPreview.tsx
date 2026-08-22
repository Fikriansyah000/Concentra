import React, { useEffect, useRef, useState } from 'react';
import { FaceDetector } from '../../content/modules/FaceDetector';
import { HeadPoseEstimator, HeadDirection, Landmark3D } from '../../content/modules/HeadPoseEstimator';
import { FocusCalculator, FocusMetrics } from '../../content/modules/FocusCalculator';
import { Camera, CameraOff, Loader2, KeyRound, Sparkles } from 'lucide-react';

interface CameraPreviewProps {
  isActive: boolean;
  onMetricsUpdate: (metrics: FocusMetrics) => void;
}

// MediaPipe landmark connection indices for wireframe rendering
const FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
const LEFT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const RIGHT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const LEFT_EYEBROW = [70, 63, 105, 66, 107];
const RIGHT_EYEBROW = [336, 296, 334, 293, 300];
const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1, 19, 94, 2];
const LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

function drawPath(ctx: CanvasRenderingContext2D, landmarks: Landmark3D[], indices: number[], width: number, height: number, close: boolean = false) {
  if (indices.length < 2) return;
  ctx.beginPath();
  const first = landmarks[indices[0]];
  if (!first) return;
  ctx.moveTo(first.x * width, first.y * height);

  for (let i = 1; i < indices.length; i++) {
    const pt = landmarks[indices[i]];
    if (pt) {
      ctx.lineTo(pt.x * width, pt.y * height);
    }
  }

  if (close) {
    ctx.closePath();
  }
  ctx.stroke();
}

function drawFaceMesh(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark3D[],
  width: number,
  height: number,
  isDistracted: boolean,
  direction: HeadDirection
) {
  ctx.save();

  const mainColor = isDistracted ? '#f87171' : '#818cf8';
  const glowColor = isDistracted ? '#ef4444' : '#6366f1';
  const accentColor = isDistracted ? '#fca5a5' : '#38bdf8';

  // 1. Draw Facial Contours & Wireframe Mesh Lines
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.4;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 6;

  // Face Oval Outline
  drawPath(ctx, landmarks, FACE_OVAL, width, height, true);

  // Eyes & Eyebrows
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.2;
  drawPath(ctx, landmarks, LEFT_EYE, width, height, true);
  drawPath(ctx, landmarks, RIGHT_EYE, width, height, true);
  drawPath(ctx, landmarks, LEFT_EYEBROW, width, height, false);
  drawPath(ctx, landmarks, RIGHT_EYEBROW, width, height, false);

  // Nose Bridge & Lips
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 1.2;
  drawPath(ctx, landmarks, NOSE_BRIDGE, width, height, false);
  drawPath(ctx, landmarks, LIPS, width, height, true);

  // 2. Central Alignment Crosshair (Forehead to Chin & Cheek to Cheek)
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;

  const topForehead = landmarks[10];
  const chin = landmarks[152];
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  const noseTip = landmarks[1];

  if (topForehead && chin) {
    ctx.beginPath();
    ctx.moveTo(topForehead.x * width, topForehead.y * height);
    ctx.lineTo(chin.x * width, chin.y * height);
    ctx.stroke();
  }

  if (leftCheek && rightCheek) {
    ctx.beginPath();
    ctx.moveTo(leftCheek.x * width, leftCheek.y * height);
    ctx.lineTo(rightCheek.x * width, rightCheek.y * height);
    ctx.stroke();
  }

  ctx.setLineDash([]); // Reset dash

  // 3. Key Landmark Feature Glowing Dots
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 8;
  [1, 33, 263, 61, 291, 152, 10, 234, 454, 168].forEach((idx) => {
    const pt = landmarks[idx];
    if (pt) {
      const px = pt.x * width;
      const py = pt.y * height;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });

  // 4. Head Pose 3D Orientation Pointer from Nose Tip
  if (noseTip) {
    const nx = noseTip.x * width;
    const ny = noseTip.y * height;

    let dirOffsetX = 0;
    let dirOffsetY = 0;
    if (direction === 'left') dirOffsetX = -20;
    else if (direction === 'right') dirOffsetX = 20;
    else if (direction === 'down') dirOffsetY = 20;
    else if (direction === 'up') dirOffsetY = -20;

    // Vector line
    ctx.strokeStyle = isDistracted ? '#ef4444' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = isDistracted ? '#ef4444' : '#10b981';
    ctx.shadowBlur = 8;

    ctx.beginPath();
    ctx.moveTo(nx, ny);
    ctx.lineTo(nx + dirOffsetX, ny + dirOffsetY);
    ctx.stroke();

    // Target pointer circle
    ctx.fillStyle = isDistracted ? '#ef4444' : '#10b981';
    ctx.beginPath();
    ctx.arc(nx + dirOffsetX, ny + dirOffsetY, 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // 5. Sci-Fi Cybernetic Bounding Box with Corner Accents
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  FACE_OVAL.forEach((idx) => {
    const pt = landmarks[idx];
    if (pt) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  });

  const padX = 12;
  const padY = 12;
  const bx = Math.max(0, minX * width - padX);
  const by = Math.max(0, minY * height - padY);
  const bw = Math.min(width - bx, (maxX - minX) * width + padX * 2);
  const bh = Math.min(height - by, (maxY - minY) * height + padY * 2);
  const cornerLen = 14;

  ctx.strokeStyle = isDistracted ? '#ef4444' : '#6366f1';
  ctx.lineWidth = 2;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  // Top-Left Corner
  ctx.beginPath();
  ctx.moveTo(bx, by + cornerLen);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + cornerLen, by);
  ctx.stroke();

  // Top-Right Corner
  ctx.beginPath();
  ctx.moveTo(bx + bw - cornerLen, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw, by + cornerLen);
  ctx.stroke();

  // Bottom-Left Corner
  ctx.beginPath();
  ctx.moveTo(bx, by + bh - cornerLen);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + cornerLen, by + bh);
  ctx.stroke();

  // Bottom-Right Corner
  ctx.beginPath();
  ctx.moveTo(bx + bw - cornerLen, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + bh - cornerLen);
  ctx.stroke();

  ctx.restore();
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ isActive, onMetricsUpdate }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const metricsCallbackRef = useRef(onMetricsUpdate);
  metricsCallbackRef.current = onMetricsUpdate;

  const [faceDetector] = useState(() => new FaceDetector());
  const [focusCalculator] = useState(() => new FocusCalculator());

  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionError, setIsPermissionError] = useState(false);
  const [currentDir, setCurrentDir] = useState<HeadDirection>('front');
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startStream = async () => {
      if (!isActive) return;

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
        setIsCameraReady(true);

        // 2. Initialize MediaPipe in parallel
        try {
          if (!faceDetector.isReady()) {
            await faceDetector.init();
          }
          if (isMounted) setIsAiLoading(false);
        } catch (aiErr) {
          console.warn('[Concentra] MediaPipe init error, running basic mode', aiErr);
          if (isMounted) setIsAiLoading(false);
        }

        if (!isMounted) return;

        focusCalculator.reset();

        // 3. Start MediaPipe Detection Loop
        faceDetector.startDetection(video, (landmarks) => {
          if (!isMounted) return;

          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');

          const hasFace = !!(landmarks && landmarks.length >= 468);
          setIsFaceDetected(hasFace);

          const headPose = HeadPoseEstimator.estimatePose(landmarks || []);
          setCurrentDir(headPose.direction);

          const metrics = focusCalculator.calculate(hasFace, headPose);
          metricsCallbackRef.current(metrics);

          // Render Face Wireframe Mesh & Contour Lines
          if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (hasFace && landmarks) {
              drawFaceMesh(
                ctx,
                landmarks,
                canvas.width,
                canvas.height,
                metrics.isDistracted,
                headPose.direction
              );
            }
          }
        });
      } catch (err: any) {
        if (!isMounted) return;
        setIsCameraReady(false);
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
  }, [isActive]);

  const openPermissionTab = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
  };

  const getDirectionLabel = (dir: HeadDirection, face: boolean) => {
    if (!face) return 'Mencari Wajah...';
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
    <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 shadow-xl">
      <div className="relative w-full h-[160px] flex items-center justify-center bg-slate-900">
        {!isCameraReady && !errorMsg && (
          <div className="flex flex-col items-center gap-2 text-brand-400 z-10">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-[11px] font-medium text-slate-300">Menghubungkan Kamera...</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 text-center text-rose-300 text-xs flex flex-col items-center gap-2 z-20 max-w-[280px]">
            <CameraOff className="w-6 h-6 text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
            {isPermissionError && (
              <button
                onClick={openPermissionTab}
                className="mt-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Aktifkan Izin Kamera
              </button>
            )}
          </div>
        )}

        {/* Live Direct Video Stream Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isCameraReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Transparent Face Mesh Wireframe Overlay Canvas */}
        <canvas
          ref={canvasRef}
          width={320}
          height={180}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
            isCameraReady ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Live HUD Badges on top of camera */}
        {isCameraReady && !errorMsg && (
          <>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-slate-700/50 text-[10px] z-10">
              <span className={`w-2 h-2 rounded-full ${isFaceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-200 font-semibold">{isFaceDetected ? 'AI LIVE' : isAiLoading ? 'MEMUAT AI...' : 'NO FACE'}</span>
            </div>

            {isAiLoading && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-brand-500/20 backdrop-blur-md px-2 py-0.5 rounded-md border border-brand-500/30 text-[10px] text-brand-300 z-10">
                <Sparkles className="w-3 h-3 animate-spin" />
                <span>Memuat Model AI</span>
              </div>
            )}

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-md border border-slate-700/50 text-[10px] z-10">
              <span className="text-slate-200 font-medium flex items-center gap-1.5 truncate">
                <Camera className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="truncate">{getDirectionLabel(currentDir, isFaceDetected)}</span>
              </span>
              <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${isFaceDetected ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 bg-slate-800'}`}>
                {isFaceDetected ? 'TERDETEKSI' : 'STANDBY'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
