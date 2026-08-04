import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, Sparkles, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginDev, isLoading } = useAuthStore();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) setErrorMsg(error.message);
    } catch {
      setErrorMsg('Gagal menghubungkan ke Supabase OAuth Provider');
    }
  };

  const handleDevLogin = async () => {
    try {
      setErrorMsg(null);
      await loginDev('mhs_dev@concentra.local');
      navigate('/dashboard');
    } catch {
      setErrorMsg('Mode Dev Login gagal. Pastikan backend local active (USE_LOCAL_AUTH=true).');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[96px] pointer-events-none"></div>

      <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 text-white shadow-xl shadow-brand-500/30 mb-2">
            <Eye className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Concentra</h1>
          <p className="text-sm text-dark-muted leading-relaxed">
            Platform Pemantauan Tingkat Konsentrasi Belajar Online Real-time Berbasis AI & Face Detection
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs text-center">
            {errorMsg}
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full py-3 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 flex items-center justify-center gap-3 font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            Masuk dengan Google
          </Button>

          <div className="relative flex items-center justify-center">
            <hr className="w-full border-dark-border" />
            <span className="absolute bg-dark-card px-3 text-[11px] font-semibold text-dark-muted uppercase tracking-wider">
              atau Mode Lokal (Dev)
            </span>
          </div>

          <Button
            onClick={handleDevLogin}
            isLoading={isLoading}
            variant="primary"
            className="w-full py-3 flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Dev Fast Login (Bypass Auth)
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-dark-border/50 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-brand-300 font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% Data Wajah Diproses di Browser (Client-side)
          </div>
          <p className="text-[11px] text-dark-muted">
            Privasi Anda terjamin. Video webcam tidak pernah dikirim ke server.
          </p>
        </div>
      </div>
    </div>
  );
};
