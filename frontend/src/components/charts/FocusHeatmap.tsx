import React from 'react';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';

interface HeatmapData {
  date: string; // ISO string
  score: number; // 0-100
}

interface FocusHeatmapProps {
  data: HeatmapData[];
  days?: number;
  className?: string;
}

export const FocusHeatmap: React.FC<FocusHeatmapProps> = ({ 
  data, 
  days = 90, 
  className = '' 
}) => {
  // Generate the last `days` of dates
  const today = new Date();
  const startDate = startOfWeek(subDays(today, days - 1), { weekStartsOn: 1 }); // Start on Monday
  
  const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const grid = Array.from({ length: totalDays }).map((_, i) => {
    const currentDate = addDays(startDate, i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dataPoint = data.find(d => {
      const dDate = new Date(d.date);
      return isSameDay(dDate, currentDate);
    });

    return {
      date: currentDate,
      score: dataPoint ? dataPoint.score : null
    };
  });

  const getColorClass = (score: number | null) => {
    if (score === null) return 'bg-slate-800/50'; // Empty
    if (score < 30) return 'bg-brand-900/40';
    if (score < 60) return 'bg-brand-700/60';
    if (score < 80) return 'bg-brand-500/80';
    return 'bg-brand-400'; // High focus
  };

  // Group by weeks for columns
  const weeks = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Riwayat Konsistensi</h3>
        <p className="text-xs text-dark-muted">Tingkat fokus dalam {days} hari terakhir.</p>
      </div>
      
      <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
        {weeks.map((week, wIndex) => (
          <div key={wIndex} className="flex flex-col gap-1">
            {week.map((day, dIndex) => (
              <div
                key={dIndex}
                title={`${format(day.date, 'dd MMM yyyy')}: ${day.score !== null ? `${day.score}% Fokus` : 'Tidak ada sesi'}`}
                className={`w-3.5 h-3.5 rounded-sm transition-colors hover:ring-1 hover:ring-slate-300 ${getColorClass(day.score)}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-slate-400">
        <span>Kurang</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800/50"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-900/40"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-700/60"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-500/80"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-400"></div>
        </div>
        <span>Fokus Tinggi</span>
      </div>
    </div>
  );
};
