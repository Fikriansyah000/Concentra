import React from 'react';
import { Menu, Bell, User as UserIcon, LogOut } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';

export const Header: React.FC = () => {
  const { toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-dark-border bg-dark-bg/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-slate-800 transition"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 md:hidden">
          <span className="font-bold text-lg text-brand-400">Concentra</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-dark-muted hover:text-dark-text hover:bg-slate-800 transition relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500"></span>
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-dark-border">
          <Avatar src={user?.avatar_url} name={user?.full_name || 'User'} size="sm" />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-dark-text">{user?.full_name || 'Pengguna'}</p>
            <p className="text-[10px] text-dark-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-dark-muted hover:text-rose-400 hover:bg-slate-800 transition ml-1"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
