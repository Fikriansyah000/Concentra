import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart2, TrendingUp, Calendar as CalendarIcon, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WeeklyBarChart } from '../components/charts/WeeklyBarChart';
import { FocusDistributionPieChart } from '../components/charts/FocusDistributionPieChart';
import { format, subDays } from 'date-fns';

export const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Dummy aggregation data
  const reportData = {
    title: 'Laporan Mingguan: 15 - 21 Agustus 2026',
    generated_at: new Date().toISOString(),
    total_sessions: 12,
    total_duration: 3600 * 15, // 15 hours
    average_focus_score: 82,
    improvement_rate: '+5%',
    weekly_data: Array.from({ length: 7 }).map((_, i) => ({
      day: format(subDays(new Date(), 6 - i), 'EEE'),
      focusScore: Math.floor(Math.random() * 30) + 65,
      duration: Math.floor(Math.random() * 120) + 30, // 30-150 mins
    })),
    distribution: {
      focused: 45000,
      distracted: 6000,
      drowsy: 3000
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}j ${m % 60}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="rounded-full border-dark-border/50">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{reportData.title}</h1>
          <p className="text-dark-muted text-sm mt-1">Dihasilkan pada {format(new Date(reportData.generated_at), 'dd MMM yyyy, HH:mm')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-400">Total Sesi</p>
          </div>
          <p className="text-3xl font-bold text-slate-200">{reportData.total_sessions}</p>
        </div>
        
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-400">Total Waktu</p>
          </div>
          <p className="text-3xl font-bold text-slate-200">{formatDuration(reportData.total_duration)}</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-400">Rata-rata Fokus</p>
          </div>
          <p className="text-3xl font-bold text-slate-200">{reportData.average_focus_score}%</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-400">Peningkatan</p>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{reportData.improvement_rate}</p>
          <p className="text-[10px] text-slate-500 mt-1">Dibanding minggu lalu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyBarChart data={reportData.weekly_data} className="h-full" />
        </div>
        <div>
          <FocusDistributionPieChart data={reportData.distribution} className="h-full" />
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Wawasan & Rekomendasi AI</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20">
            <h4 className="text-emerald-400 font-medium mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" /> Apa yang sudah baik
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Konsentrasi Anda paling stabil pada hari <strong>Selasa</strong> dan <strong>Rabu</strong> pagi. Durasi belajar Anda juga meningkat 15% dari rata-rata biasanya.
            </p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 border border-amber-500/20">
            <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Area perbaikan
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Tingkat distraksi meningkat saat sesi malam hari (&gt; 20:00). Pertimbangkan untuk memindahkan sesi berat ke pagi/siang hari, atau gunakan teknik Pomodoro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
