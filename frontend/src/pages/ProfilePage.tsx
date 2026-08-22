import React from 'react';
import { Mail, Shield, LogOut, Award, Star } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { FocusHeatmap } from '../components/charts/FocusHeatmap';
import { Avatar } from '../components/ui/Avatar';

// Dummy data for Heatmap
const DUMMY_HEATMAP = Array.from({ length: 60 }).map((_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  // Randomly drop some days to make it look realistic
  if (Math.random() > 0.8) return { date: d.toISOString(), score: null };
  return {
    date: d.toISOString(),
    score: Math.floor(Math.random() * 60) + 40 // 40-100
  };
}).filter(item => item.score !== null) as {date: string, score: number}[];

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Profil Pengguna</h1>
        <p className="text-dark-muted text-sm mt-1">Kelola informasi pribadi dan lihat pencapaian Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 md:col-span-1 flex flex-col items-center text-center space-y-4">
          <Avatar 
            src={user?.avatar_url || undefined} 
            name={user?.full_name || 'User'} 
            size="lg" 
            className="ring-4 ring-brand-500/20"
          />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{user?.full_name || 'Mahasiswa'}</h2>
            <p className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-1">
              <Mail className="w-3.5 h-3.5" />
              {user?.email || 'email@example.com'}
            </p>
          </div>
          
          <div className="w-full pt-4 mt-2 border-t border-dark-border/50">
            <Button 
              variant="outline" 
              onClick={() => logout()}
              className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/20 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Keluar Akun
            </Button>
          </div>
        </div>

        {/* Achievements / Stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Pencapaian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-xl p-4 border border-amber-500/20 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Star className="w-6 h-6 fill-amber-400/20" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Konsistensi 7 Hari</p>
                  <p className="text-xs text-slate-400">Belajar setiap hari berturut-turut.</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-emerald-500/20 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">Fokus Baja</p>
                  <p className="text-xs text-slate-400">Skor rata-rata di atas 85%.</p>
                </div>
              </div>
            </div>
          </div>

          <FocusHeatmap data={DUMMY_HEATMAP} days={60} />
        </div>
      </div>
    </div>
  );
};
