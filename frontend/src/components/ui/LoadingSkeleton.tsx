import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'chart' | 'avatar' | 'text';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 1,
  className = ''
}) => {
  const renderSkeleton = (key: number) => {
    switch (type) {
      case 'card':
        return (
          <div key={key} className={`glass-panel rounded-2xl p-6 flex flex-col gap-4 animate-pulse ${className}`}>
            <div className="h-6 bg-slate-700/50 rounded-lg w-1/3"></div>
            <div className="h-10 bg-slate-700/50 rounded-lg w-1/2"></div>
            <div className="h-4 bg-slate-700/50 rounded-lg w-1/4 mt-4"></div>
          </div>
        );
      case 'list':
        return (
          <div key={key} className={`flex items-center gap-4 animate-pulse p-4 border-b border-dark-border/50 ${className}`}>
            <div className="w-12 h-12 bg-slate-700/50 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
              <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
            </div>
            <div className="h-8 bg-slate-700/50 rounded w-20"></div>
          </div>
        );
      case 'chart':
        return (
          <div key={key} className={`glass-panel rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-end gap-2 ${className}`}>
            <div className="flex items-end justify-between h-full gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="w-full bg-slate-700/50 rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
              ))}
            </div>
          </div>
        );
      case 'avatar':
        return <div key={key} className={`w-10 h-10 rounded-full bg-slate-700/50 animate-pulse ${className}`}></div>;
      case 'text':
      default:
        return <div key={key} className={`h-4 bg-slate-700/50 rounded animate-pulse w-full ${className}`}></div>;
    }
  };

  return (
    <>
      {[...Array(count)].map((_, i) => renderSkeleton(i))}
    </>
  );
};
