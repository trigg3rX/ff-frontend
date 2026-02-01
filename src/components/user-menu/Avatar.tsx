"use client";

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Get the first letter from email address
 */
function getInitialsFromEmail(email: string): string {
  return email[0]?.toUpperCase() || "";
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  email: string;
  gradient: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  email,
  gradient,
  className,
  style,
  ...props
}) => {
  const initials = getInitialsFromEmail(email);

  return (
    <div
      className={cn(
        'relative rounded-full flex items-center justify-center font-bold tracking-tight select-none text-white',
        'ring-2 ring-white/10 ring-offset-2 ring-offset-slate-950',
        className
      )}
      style={{
        width: '2.5rem',
        height: '2.5rem',
        fontSize: '0.75rem',
        background: gradient,
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 rounded-full bg-black/10 mix-blend-overlay" />
      <span className="relative z-10">{initials}</span>
    </div>
  );
};