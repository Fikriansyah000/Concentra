import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface FocusLineChartProps {
  data: any[];
  className?: string;
}

export const FocusLineChart: React.FC<FocusLineChartProps> = ({ data, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`glass-panel rounded-2xl flex items-center justify-center p-6 ${className}`}>
        <p className="text-dark-muted text-sm">Tidak ada data untuk grafik ini.</p>
      </div>
    );
  }

  // Format the data if necessary, assuming data has { timestamp, focus_score }
  const formattedData = data.map(item => ({
    ...item,
    timeLabel: item.timestamp ? format(new Date(item.timestamp), 'HH:mm') : item.timeLabel || '',
  }));

  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Timeline Fokus</h3>
        <p className="text-xs text-dark-muted">Pergerakan Focus Score selama sesi ini.</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              domain={[0, 100]} 
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
              itemStyle={{ color: '#818cf8' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
            />
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
            <Line
              type="monotone"
              dataKey="focus_score"
              name="Focus Score"
              stroke="#818cf8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#c7d2fe', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
