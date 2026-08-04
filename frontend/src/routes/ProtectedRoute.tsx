import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, fetchCurrentUser, isLoading, token } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchCurrentUser();
    }
  }, [token, isAuthenticated, fetchCurrentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-dark-muted">Memuat antarmuka Concentra...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
