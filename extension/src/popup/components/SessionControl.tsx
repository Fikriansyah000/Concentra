import React, { useState } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { ActiveSessionState } from '../../shared/types';

interface SessionControlProps {
  session: ActiveSessionState;
  onStart: (title: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isLoading: boolean;
}

export const SessionControl: React.FC<SessionControlProps> = ({
  session,
  onStart,
  onPause,
  onResume,
  onStop,
  isLoading,
}) => {
  const [inputTitle, setInputTitle] = useState('');

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(inputTitle.trim() || 'Sesi Belajar Mandiri');
  };

  if (session.status === 'idle' || session.status === 'completed') {
    return (
      <form onSubmit={handleStartSubmit} className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-dark-muted uppercase tracking-wider mb-1">
            Topik / Judul Sesi
          </label>
          <input
            type="text"
            placeholder="Misal: Membaca Modul AI, Video Kuliah"
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          Mulai Pantau Fokus
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] text-dark-muted uppercase tracking-wider font-semibold">Sedang Dipantau</p>
          <p className="text-xs font-bold text-white truncate">{session.title}</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            session.status === 'active'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}
        >
          {session.status}
        </span>
      </div>

      <div className="flex gap-2">
        {session.status === 'active' ? (
          <button
            onClick={onPause}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" /> Jeda
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-brand-600/30 hover:bg-brand-600/40 border border-brand-500/40 text-brand-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Lanjutkan
          </button>
        )}

        <button
          onClick={onStop}
          disabled={isLoading}
          className="flex-1 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
        >
          <Square className="w-3.5 h-3.5 fill-current" /> Selesaikan
        </button>
      </div>
    </div>
  );
};
