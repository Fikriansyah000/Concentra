import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendUp = true,
}) => {
  return (
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-dark-text mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-dark-muted mt-1">{subtitle}</p>}
        </div>
        <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trendUp ? 'text-emerald-400' : 'text-rose-400'}>{trend}</span>
          <span className="text-dark-muted">vs minggu lalu</span>
        </div>
      )}
    </Card>
  );
};
