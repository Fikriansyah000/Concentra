import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
