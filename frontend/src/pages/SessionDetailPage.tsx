import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, CheckCircle2, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { FocusLineChart } from '../components/charts/FocusLineChart';
import { FocusDistributionPieChart } from '../components/charts/FocusDistributionPieChart';
import { format } from 'date-fns';

// Dummy data
const DUMMY_SESSION_DATA = {
  id: '1',
  title: 'Belajar React & TypeScript',
  start_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  duration: 3600,
  focus_score: 85,
  status: 'completed',
  notes: 'Mempelajari dasar-dasar Hooks dan Context API.',
  distribution: {
    focused: 2880,
    distracted: 500,
    drowsy: 220
  },
  timeline: Array.from({ length: 60 }).map((_, i) => ({
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + i * 60000).toISOString(),
    focus_score: Math.floor(Math.random() * 40) + 60, // 60-100 range
  }))
};

export const SessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // In a real app, fetch session by ID using TanStack Query here.
  const session = DUMMY_SESSION_DATA; 

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}j ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-full border-dark-border/50">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100">{session.title}</h1>
            <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Selesai
            </Badge>
          </div>
          <p className="text-dark-muted text-sm mt-1">Detail sesi belajar dan analisis fokus.</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Tanggal</p>
            <p className="font-semibold text-slate-200">{format(new Date(session.start_time), 'dd MMM yyyy')}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Durasi Total</p>
            <p className="font-semibold text-slate-200">{formatDuration(session.duration)}</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Rata-rata Fokus</p>
            <p className="font-semibold text-slate-200 text-xl">{session.focus_score}%</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <p className="font-semibold text-slate-200 capitalize">{session.status}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FocusLineChart data={session.timeline} />
          
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Catatan Sesi</h3>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-slate-300 text-sm leading-relaxed min-h-[100px]">
              {session.notes || <span className="text-slate-500 italic">Tidak ada catatan untuk sesi ini.</span>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <FocusDistributionPieChart data={session.distribution} />
          
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Ringkasan AI</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                Fokus Anda sangat baik di 30 menit pertama.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                Terdapat sedikit gangguan konsentrasi di pertengahan sesi.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Secara keseluruhan, sesi ini termasuk produktif!
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
