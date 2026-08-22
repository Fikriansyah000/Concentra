import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Zap,
  AlertTriangle,
  Play,
  TrendingUp,
  ExternalLink,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { useAnalyticsSummary, useWeeklyAnalytics } from '../queries/useAnalyticsQueries';
import { useActiveSession, useSessions, useCreateSession } from '../queries/useSessionQueries';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDuration, formatDate, getFocusBadgeColor } from '../lib/utils';
import { SOURCE_TYPE_LABELS } from '../lib/constants';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { data: summary, isLoading: isSummaryLoading } = useAnalyticsSummary();
  const { data: weeklyData } = useWeeklyAnalytics();
  const { data: activeSession } = useActiveSession();
  const { data: sessionsData } = useSessions(1, 5);
  const createSessionMutation = useCreateSession();

  const [newTitle, setNewTitle] = useState('');
  const [newSourceType, setNewSourceType] = useState('youtube');
  const [showModal, setShowModal] = useState(false);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSessionMutation.mutateAsync({
      title: newTitle || 'Sesi Belajar Mandiri',
      source_type: newSourceType,
    });
    setNewTitle('');
    setShowModal(false);
  };

  const chartData =
    weeklyData?.daily_breakdown.map((d) => ({
      name: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }),
      fokus: d.avg_focus_score,
      durasi: d.total_duration_minutes,
    })) || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-600/10 via-indigo-600/5 to-transparent">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Selamat Datang, {user?.full_name?.split(' ')[0] || 'Pembelajar'}! 👋
          </h1>
          <p className="text-sm text-dark-muted mt-1">
            Siap tingkatkan efektivitas fokus belajar Anda hari ini?
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 self-start md:self-auto"
        >
          <Play className="w-4 h-4 fill-current" />
          Mulai Sesi Belajar Baru
        </Button>
      </div>

      {/* Active Session Alert Banner (If Any) */}
      {activeSession && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></span>
            <div>
              <p className="text-sm font-semibold text-amber-200">
                Sesi Belajar Sedang Berjalan ({activeSession.status.toUpperCase()})
              </p>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {activeSession.title} &bull; Ditransfer via Chrome Extension real-time
              </p>
            </div>
          </div>
          <Badge variant="warning" className="uppercase font-bold">
            {activeSession.status}
          </Badge>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Jam Belajar"
          value={isSummaryLoading ? '...' : `${summary?.total_study_hours || 0} Jam`}
          subtitle="Akumulasi seluruh sesi"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          title="Sesi Selesai"
          value={isSummaryLoading ? '...' : summary?.total_study_sessions || 0}
          subtitle="Target minggu ini"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          title="Rata-rata Fokus"
          value={isSummaryLoading ? '...' : `${summary?.avg_focus_score || 0}%`}
          subtitle="Tingkat konsentrasi"
          trend={summary?.focus_improvement_percentage ? `+${summary.focus_improvement_percentage}%` : undefined}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          title="Total Distraksi"
          value={isSummaryLoading ? '...' : summary?.total_distractions || 0}
          subtitle="Kamera berpaling/hilang"
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          trendUp={false}
        />
      </div>

      {/* Main Charts & Recent Sessions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Focus Chart */}
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white">Tren Konsentrasi Mingguan</h3>
              <p className="text-xs text-dark-muted">Rata-rata skor fokus per hari (Senin - Minggu)</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-brand-400 font-semibold bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
              <TrendingUp className="w-4 h-4" />
              Tingkat fokus stabil
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorFokus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="fokus"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorFokus)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Sessions List */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">Sesi Terakhir</h3>
            <Link to="/history" className="text-xs text-brand-400 hover:underline flex items-center gap-1 font-medium">
              Lihat semua <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {sessionsData?.items && sessionsData.items.length > 0 ? (
              sessionsData.items.map((session) => (
                <div
                  key={session.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{session.title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-dark-muted mt-1">
                      <span>{SOURCE_TYPE_LABELS[session.source_type || 'other']}</span>
                      <span>&bull;</span>
                      <span>{formatDuration(session.total_duration_seconds)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getFocusBadgeColor(
                        session.avg_focus_score
                      )}`}
                    >
                      {session.avg_focus_score ? `${session.avg_focus_score}%` : 'N/A'}
                    </span>
                    <p className="text-[10px] text-dark-muted mt-1">
                      {formatDate(session.started_at).split(',')[0]}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-muted text-xs space-y-2">
                <p>Belum ada riwayat sesi belajar.</p>
                <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
                  Mulai Pertama Kali
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Mulai Sesi Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 border border-white/10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Mulai Sesi Belajar Baru
            </h3>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-muted uppercase tracking-wider mb-1.5">
                  Judul Sesi Belajar
                </label>
                <input
                  type="text"
                  placeholder="Misal: Belajar Kalkulus Bab 3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-muted uppercase tracking-wider mb-1.5">
                  Sumber / Platform Belajar
                </label>
                <select
                  value={newSourceType}
                  onChange={(e) => setNewSourceType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white focus:outline-none focus:border-brand-500 text-sm"
                >
                  <option value="youtube">YouTube</option>
                  <option value="google_meet">Google Meet</option>
                  <option value="coursera">Coursera</option>
                  <option value="zoom">Zoom</option>
                  <option value="lms">LMS / Portal Kampus</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={createSessionMutation.isPending}>
                  Mulai Sekarang
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
