import React from 'react';
import { ExternalLink, User } from 'lucide-react';
import { UserAuthInfo } from '../../shared/types';

interface PopupHeaderProps {
  auth: UserAuthInfo | null;
  isActive: boolean;
}

export const PopupHeader: React.FC<PopupHeaderProps> = ({ auth, isActive }) => {
  const openDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:5173/dashboard' });
  };

  return (
    <header className="p-4 border-b border-dark-border bg-dark-bg flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-brand-500/30">
          C
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm text-white tracking-tight">Concentra</span>
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </div>
          <p className="text-[10px] text-dark-muted">Focus Monitor AI</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700/60 text-[11px] text-slate-300">
          <User className="w-3 h-3 text-brand-400" />
          <span className="truncate max-w-[80px]">{auth?.fullName?.split(' ')[0] || 'Dev'}</span>
        </div>
        <button
          onClick={openDashboard}
          title="Buka Web Dashboard"
          className="p-1.5 rounded-md hover:bg-slate-800 text-dark-muted hover:text-white transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
