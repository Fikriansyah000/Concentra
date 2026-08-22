import React from 'react';
import { Eye } from 'lucide-react';

interface FocusStatusProps {
  score: number;
  status: 'idle' | 'active' | 'paused' | 'completed';
  distractions: number;
}

export const FocusStatus: React.FC<FocusStatusProps> = ({ score, status, distractions: _distractions }) => {
  const getStatusDetails = () => {
    if (status === 'idle' || status === 'completed') {
      return {
        label: 'Siap Belajar',
        desc: 'Mulai sesi untuk mengaktifkan AI Facecam Tracker',
        color: 'text-slate-400',
        bg: 'bg-slate-800/40',
        border: 'border-slate-700/50',
      };
    }
    if (status === 'paused') {
      return {
        label: 'Sesi Terjeda',
        desc: 'Deteksi kamera dihentikan sementara',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
      };
    }
    if (score >= 80) {
      return {
        label: 'Fokus Sangat Baik',
        desc: 'Pandangan lurus & konsentrasi optimal',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/20',
      };
    }
    if (score >= 50) {
      return {
        label: 'Fokus Sedang',
        desc: 'Terdeteksi sedikit gerakan berpaling',
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/20',
      };
    }
    return {
      label: 'Konsentrasi Rendah',
      desc: 'Sering berpaling dari layar belajar',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    };
  };

  const details = getStatusDetails();

  return (
    <div className={`p-4 rounded-xl glass-card border ${details.border} ${details.bg} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className={`w-4 h-4 ${details.color}`} />
          <span className="text-xs font-bold text-white">{details.label}</span>
        </div>
        {status === 'active' && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200">
            {score}%
          </span>
        )}
      </div>

      <p className="text-[11px] text-dark-muted leading-relaxed">
        {details.desc}
      </p>

      {status === 'active' && (
        <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className={`h-full transition-all duration-500 ${
              score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};
