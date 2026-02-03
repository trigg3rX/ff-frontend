/**
 * Workflow Utility Functions
 * Shared utilities for workflow status display and formatting
 */

import {
    LuCircleCheck,
    LuCircleX,
    LuLoaderCircle,
    LuClock,
} from "react-icons/lu";
import type { ReactNode } from "react";

export type WorkflowStatus =
    | "SUCCESS"
    | "FAILED"
    | "RUNNING"
    | "PENDING"
    | "CANCELLED"
    | "RETRYING"
    | null;

/**
 * Get Tailwind CSS color class for execution status
 */
export function getStatusColor(status: WorkflowStatus | string | null): string {
    switch (status) {
        case "SUCCESS":
            return "text-green-400";
        case "FAILED":
            return "text-red-400";
        case "RUNNING":
            return "text-yellow-400";
        case "PENDING":
            return "text-blue-400";
        case "CANCELLED":
            return "text-gray-400";
        default:
            return "text-muted-foreground";
    }
}

/**
 * Get icon component for execution status
 */
export function getStatusIcon(status: WorkflowStatus | string | null): ReactNode {
    switch (status) {
        case "SUCCESS":
            return <LuCircleCheck className="w-4 h-4" />;
        case "FAILED":
            return <LuCircleX className="w-4 h-4" />;
        case "RUNNING":
            return <LuLoaderCircle className="w-4 h-4 animate-spin" />;
        case "PENDING":
            return <LuClock className="w-4 h-4" />;
        default:
            return <LuClock className="w-4 h-4" />;
    }
}

/**
 * Format duration between two timestamps
 */
export function formatDuration(startedAt: string, completedAt: string | null): string {
    if (!completedAt) return "—";
    const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${Math.round(duration / 60000)}m`;
}
