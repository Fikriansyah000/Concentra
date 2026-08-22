import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface WeeklyBarChartProps {
  data: {
    day: string;
    focusScore: number;
    duration: number; // in minutes
  }[];
  className?: string;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({ data, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`glass-panel rounded-2xl flex items-center justify-center p-6 ${className}`}>
        <p className="text-dark-muted text-sm">Belum ada data untuk minggu ini.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const focusScore = payload[0].value;
      const duration = payload[0].payload.duration;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-200 font-medium mb-1">{label}</p>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-brand-400">Rata-rata Fokus: {focusScore}%</span>
            <span className="text-slate-400">Total Waktu: {duration} mnt</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">Aktivitas Mingguan</h3>
          <p className="text-xs text-dark-muted">Rata-rata skor fokus per hari.</p>
        </div>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="day" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#334155', opacity: 0.4 }} />
            <Bar 
              dataKey="focusScore" 
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            >
              {data.map((entry, index) => {
                let color = '#818cf8'; // brand
                if (entry.focusScore >= 80) color = '#10b981'; // emerald
                else if (entry.focusScore < 50) color = '#f59e0b'; // amber
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
