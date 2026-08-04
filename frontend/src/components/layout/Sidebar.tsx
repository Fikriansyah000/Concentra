import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  BarChart2,
  FileText,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useUIStore();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Sesi Belajar', icon: PlayCircle, path: '/sessions' },
    { label: 'Analitik & Tren', icon: BarChart2, path: '/analytics' },
    { label: 'Laporan Sesi', icon: FileText, path: '/reports' },
    { label: 'Pengaturan', icon: Settings, path: '/settings' },
  ];

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-40 w-64 bg-dark-card border-r border-dark-border transition-transform duration-300 flex flex-col pt-16 md:pt-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <div className="h-16 px-6 hidden md:flex items-center gap-3 border-b border-dark-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/30">
          C
        </div>
        <span className="font-bold text-lg text-dark-text tracking-wide">Concentra</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold ml-auto">
          MVP
        </span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-dark-muted uppercase tracking-wider mb-2">
          Menu Utama
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30 font-semibold'
                    : 'text-dark-muted hover:text-dark-text hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Extension status info footer */}
      <div className="p-4 m-4 rounded-xl glass-panel border border-brand-500/20 bg-brand-500/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Chrome Extension</span>
        </div>
        <p className="text-[11px] text-dark-muted">Privasi Terjaga Real-time Face Detection di Local Browser.</p>
      </div>
    </aside>
  );
};
