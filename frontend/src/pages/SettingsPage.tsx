import React, { useState } from 'react';
import { Save, Bell, Shield, Moon, Eye, Monitor } from 'lucide-react';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    strictMode: false,
    theme: 'dark', // Always dark for now
    cameraSensitivity: 50
  });

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Pengaturan berhasil disimpan!', {
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        }
      });
    }, 800);
  };

  return (
    <div className="max-w-3xl space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Pengaturan</h1>
        <p className="text-dark-muted text-sm mt-1">Sesuaikan preferensi aplikasi dan sensitivitas sensor.</p>
      </div>

      <div className="space-y-6">
        {/* Section: General */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-border/50 bg-slate-800/40">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-brand-400" /> Tampilan & Notifikasi
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Notifikasi Browser</p>
                <p className="text-xs text-slate-400 mt-1">Tampilkan popup saat fokus menurun tajam.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </label>
            </div>

            <div className="border-t border-dark-border/50 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Tema Aplikasi</p>
                <p className="text-xs text-slate-400 mt-1">Saat ini dikunci pada mode Gelap (Glassmorphism).</p>
              </div>
              <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
                <button className="px-3 py-1.5 text-xs font-medium bg-slate-800 text-white rounded-md shadow-sm flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5" /> Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section: AI Detection */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-border/50 bg-slate-800/40">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-400" /> Deteksi AI & Sensor
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-medium text-slate-200">Sensitivitas Deteksi Wajah</p>
                  <p className="text-xs text-slate-400 mt-1">Semakin tinggi, gerakan kecil akan dianggap distraksi.</p>
                </div>
                <span className="text-sm font-bold text-brand-400">{settings.cameraSensitivity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.cameraSensitivity}
                onChange={(e) => setSettings({...settings, cameraSensitivity: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="border-t border-dark-border/50 pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200 text-amber-400 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Strict Mode
                </p>
                <p className="text-xs text-slate-400 mt-1">Sesi akan otomatis terjeda (paused) jika wajah tidak terdeteksi &gt; 10 detik.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.strictMode}
                  onChange={(e) => setSettings({...settings, strictMode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            isLoading={isSaving}
            variant="primary" 
            className="w-full sm:w-auto px-8 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
};
