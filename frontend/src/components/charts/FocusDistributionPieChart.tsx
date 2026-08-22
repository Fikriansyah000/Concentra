import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface FocusDistributionPieChartProps {
  data: {
    focused: number;
    distracted: number;
    drowsy: number;
  };
  className?: string;
}

export const FocusDistributionPieChart: React.FC<FocusDistributionPieChartProps> = ({ data, className = '' }) => {
  const chartData = [
    { name: 'Fokus', value: data.focused, color: '#10b981' }, // emerald-500
    { name: 'Terdistraksi', value: data.distracted, color: '#f59e0b' }, // amber-500
    { name: 'Mengantuk', value: data.drowsy, color: '#ef4444' }, // red-500
  ];

  const total = data.focused + data.distracted + data.drowsy;

  if (total === 0) {
    return (
      <div className={`glass-panel rounded-2xl flex items-center justify-center p-6 ${className}`}>
        <p className="text-dark-muted text-sm">Tidak ada data untuk distribusi.</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-200 font-medium">{data.name}</p>
          <p className="text-sm" style={{ color: data.color }}>
            {data.value} detik ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      <div className="mb-2 text-center">
        <h3 className="text-lg font-semibold text-slate-200">Distribusi Fokus</h3>
      </div>
      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-36px]">
          <span className="text-2xl font-bold text-emerald-400">
            {((data.focused / total) * 100).toFixed(0)}%
          </span>
          <span className="text-[10px] text-dark-muted uppercase tracking-widest">Fokus</span>
        </div>
      </div>
    </div>
  );
};
