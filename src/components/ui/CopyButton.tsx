"use client";

import React, { useState } from 'react';
import { TbCopy, TbCopyCheck } from "react-icons/tb";
import { cn } from '@/lib/utils';

export interface CopyButtonProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

export const CopyButton: React.FC<CopyButtonProps> = ({
    text,
    size = 'md',
    className,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // console.error('Failed to copy:', err);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                'p-1 rounded transition-all duration-200 cursor-pointer',
                'text-white/50 hover:text-white hover:bg-white/10',
                copied && 'text-amber-500 hover:text-amber-500',
                className
            )}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
        >
            {copied ? (
                <TbCopyCheck className={sizeClasses[size]} />
            ) : (
                <TbCopy className={sizeClasses[size]} />
            )}
        </button>
    );
};
