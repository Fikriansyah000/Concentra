import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import '../popup/popup.css';

const PermissionApp: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestPermission = async () => {
    setStatus('requesting');
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop()); // Stop immediately after permission is stored
      setStatus('granted');

      setTimeout(() => {
        window.close();
      }, 1800);
    } catch (err: any) {
      setStatus('denied');
      setErrorMsg(err?.message || 'Izin kamera ditolak oleh browser.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/30">
        <Camera className="w-8 h-8" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Izin Kamera Webcam</h1>
        <p className="text-sm text-dark-muted mt-2 leading-relaxed">
          Concentra memerlukan izin kamera untuk menjalankan <strong>AI Face Landmarker</strong> (deteksi arah wajah). Video webcam diproses 100% di browser dan <strong>tidak pernah dikirim ke server</strong>.
        </p>
      </div>

      {status === 'granted' ? (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex flex-col items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          <p className="text-sm font-semibold">Izin Kamera Berhasil Diberikan!</p>
          <p className="text-xs text-emerald-400/80">Tab ini akan otomatis ditutup...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={requestPermission}
            disabled={status === 'requesting'}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            {status === 'requesting' ? 'Menunggu Konfirmasi...' : 'Aktifkan Izin Kamera'}
          </button>
        </div>
      )}
    </div>
  );
};

const root = document.getElementById('permission-root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <PermissionApp />
    </React.StrictMode>
  );
}
