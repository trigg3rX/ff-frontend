"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WorkflowCardSkeletonProps {
    viewMode: "grid" | "list";
}

export const WorkflowCardSkeleton = React.memo(function WorkflowCardSkeleton({ viewMode }: WorkflowCardSkeletonProps) {
    if (viewMode === "list") {
        return (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-card/50 border border-border/50 animate-pulse">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-secondary/50" />

                {/* Info */}
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-secondary/50 rounded" />
                    <div className="h-3 w-48 bg-secondary/30 rounded" />
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6">
                    <div className="h-3 w-16 bg-secondary/30 rounded" />
                    <div className="h-3 w-24 bg-secondary/30 rounded" />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary/30" />
                    <div className="w-8 h-8 rounded-lg bg-secondary/30" />
                    <div className="w-8 h-8 rounded-lg bg-secondary/30" />
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div className={cn(
            "rounded-xl overflow-hidden",
            "bg-gradient-to-br from-card/80 to-card/40",
            "border border-border/50",
            "animate-pulse"
        )}>
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50" />
                    <div className="w-6 h-6 rounded bg-secondary/30" />
                </div>

                {/* Title & Description */}
                <div className="h-5 w-3/4 bg-secondary/50 rounded mb-2" />
                <div className="space-y-1.5 mb-4">
                    <div className="h-3 w-full bg-secondary/30 rounded" />
                    <div className="h-3 w-2/3 bg-secondary/30 rounded" />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-secondary/30 rounded" />
                    <div className="h-3 w-20 bg-secondary/30 rounded" />
                </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-border/50 p-3 flex gap-2 bg-secondary/20">
                <div className="flex-1 h-9 rounded-lg bg-secondary/30" />
                <div className="flex-1 h-9 rounded-lg bg-secondary/30" />
            </div>
        </div>
    );
});

