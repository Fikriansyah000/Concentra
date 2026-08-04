import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverable = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-xl p-5 border transition-all duration-300',
        hoverable ? 'glass-panel-hover' : 'glass-panel',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
