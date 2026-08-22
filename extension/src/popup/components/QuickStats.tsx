import React from 'react';
import { Clock, AlertTriangle, Zap } from 'lucide-react';

interface QuickStatsProps {
  elapsedSeconds: number;
  avgFocusScore: number;
  distractions: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  elapsedSeconds,
  avgFocusScore,
  distractions,
}) => {
  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="glass-card p-2.5 rounded-xl text-center">
        <div className="flex items-center justify-center gap-1 text-dark-muted mb-1">
          <Clock className="w-3 h-3 text-brand-400" />
          <span className="text-[10px]">Durasi</span>
        </div>
        <p className="text-xs font-bold text-white font-mono">{formatTime(elapsedSeconds)}</p>
      </div>

      <div className="glass-card p-2.5 rounded-xl text-center">
        <div className="flex items-center justify-center gap-1 text-dark-muted mb-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[10px]">Rata-rata</span>
        </div>
        <p className="text-xs font-bold text-white">{avgFocusScore}%</p>
      </div>

      <div className="glass-card p-2.5 rounded-xl text-center">
        <div className="flex items-center justify-center gap-1 text-dark-muted mb-1">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span className="text-[10px]">Distraksi</span>
        </div>
        <p className="text-xs font-bold text-white">{distractions}x</p>
      </div>
    </div>
  );
};
