"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  gradient?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, gradient, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onCheckedChange?.(e.target.checked);
    };

    return (
      <label className={cn(
        "relative inline-flex items-center group",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}>
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          {...props}
        />
        <div
          className={cn(
            'relative w-12 h-6 bg-slate-800 rounded-full transition-all duration-300',
            'border border-slate-700',
            !disabled && 'group-hover:border-slate-600',
            'peer-focus:ring-2 peer-focus:ring-indigo-500/40',
            'after:content-[""] after:absolute after:top-0.5 after:left-0.5',
            'after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300',
            'peer-checked:after:translate-x-6 peer-checked:after:bg-white',
            'peer-checked:after:shadow-[0_0_10px_rgba(255,255,255,0.4)]',
            !gradient && 'peer-checked:bg-indigo-600',
            className
          )}
          style={checked && gradient ? { background: gradient } : undefined}
        />
      </label>
    );
  }
);

Switch.displayName = 'Switch';
