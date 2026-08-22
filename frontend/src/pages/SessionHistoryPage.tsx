import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronRight, Search, Play } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';

// Dummy data for offline mode / UI development
const DUMMY_SESSIONS = [
  { id: '1', title: 'Belajar React & TypeScript', start_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), duration: 3600, focus_score: 85, status: 'completed' },
  { id: '2', title: 'Deep Work: Backend API', start_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), duration: 5400, focus_score: 92, status: 'completed' },
  { id: '3', title: 'Membaca Jurnal', start_time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), duration: 1800, focus_score: 65, status: 'completed' },
  { id: '4', title: 'Sesi Belajar Malam', start_time: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), duration: 7200, focus_score: 78, status: 'completed' },
  { id: '5', title: 'Persiapan Ujian', start_time: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), duration: 4500, focus_score: 88, status: 'completed' },
];

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = DUMMY_SESSIONS.filter(session => 
    session.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}j ${m % 60}m`;
    return `${m}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Riwayat Sesi</h1>
          <p className="text-dark-muted text-sm mt-1">Lacak dan evaluasi semua sesi belajar Anda sebelumnya.</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} variant="primary" className="gap-2">
          <Play className="w-4 h-4" />
          Sesi Baru
        </Button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border/50 flex items-center justify-between bg-slate-800/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari sesi belajar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama Sesi</th>
                <th className="px-6 py-4 font-semibold">Tanggal</th>
                <th className="px-6 py-4 font-semibold">Durasi</th>
                <th className="px-6 py-4 font-semibold">Focus Score</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/30">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200 group-hover:text-brand-400 transition-colors">
                        {session.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(session.start_time), 'dd MMM yyyy, HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="w-4 h-4" />
                        {formatDuration(session.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info" className={`font-bold ${getScoreColor(session.focus_score)} border-current bg-transparent`}>
                        {session.focus_score}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        className="text-slate-400 hover:text-white"
                      >
                        Detail <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada sesi yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="p-4 border-t border-dark-border/50 flex items-center justify-between bg-slate-800/20 text-sm text-slate-400">
          <span>Menampilkan 1 hingga 5 dari 5 sesi</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Sebelumnnya</Button>
            <Button variant="outline" size="sm" disabled>Selanjutnya</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
