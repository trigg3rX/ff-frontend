"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { usePrivyWallet } from "./usePrivyWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import type {
    EmailNotification,
    EmailLoadingState,
} from "@/types/email";

interface UseEmailNodeProps {
    nodeData: Record<string, unknown>;
    onDataChange: (updates: Record<string, unknown>) => void;
}

interface UseEmailNodeReturn {
    // State
    emailTo: string;
    emailSubject: string;
    emailBody: string;
    loading: EmailLoadingState;
    notification: EmailNotification | null;

    // Actions
    actions: {
        updateEmailTo: (value: string) => void;
        updateEmailSubject: (value: string) => void;
        updateEmailBody: (value: string) => void;
        sendTestEmail: () => Promise<void>;
        clearNotification: () => void;
    };
}

/**
 * Custom hook for managing email node state and operations
 * Simpler than useSlackConnection since we don't need connection management
 */
export function useEmailNode({
    nodeData,
    onDataChange,
}: UseEmailNodeProps): UseEmailNodeReturn {
    const { getPrivyAccessToken } = usePrivyWallet();

    // Email form state (synced with node data)
    const [emailTo, setEmailTo] = useState((nodeData.emailTo as string) || "");
    const [emailSubject, setEmailSubject] = useState((nodeData.emailSubject as string) || "");
    const [emailBody, setEmailBody] = useState((nodeData.emailBody as string) || "");

    // Loading states
    const [loading, setLoading] = useState<EmailLoadingState>({
        testing: false,
        sending: false,
    });

    // Notification state
    const [notification, setNotification] = useState<EmailNotification | null>(null);
    const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    /**
     * Show notification with auto-dismiss
     */
    const showNotification = useCallback((type: EmailNotification["type"], message: string) => {
        // Clear any existing timeout
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        setNotification({ type, message });

        // Auto-dismiss based on type
        const duration = type === "error"
            ? API_CONFIG.NOTIFICATION.ERROR_DURATION_MS
            : API_CONFIG.NOTIFICATION.SUCCESS_DURATION_MS;

        notificationTimeoutRef.current = setTimeout(() => {
            setNotification(null);
        }, duration);
    }, []);

    const clearNotification = useCallback(() => {
        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }
        setNotification(null);
    }, []);

    /**
     * Update email recipient and sync with node data
     */
    const updateEmailTo = useCallback((value: string) => {
        setEmailTo(value);
        onDataChange({ emailTo: value });
    }, [onDataChange]);

    /**
     * Update email subject and sync with node data
     */
    const updateEmailSubject = useCallback((value: string) => {
        setEmailSubject(value);
        onDataChange({ emailSubject: value });
    }, [onDataChange]);

    /**
     * Update email body and sync with node data
     */
    const updateEmailBody = useCallback((value: string) => {
        setEmailBody(value);
        onDataChange({ emailBody: value });
    }, [onDataChange]);

    /**
     * Send test email
     */
    const sendTestEmail = useCallback(async () => {
        // Validation
        if (!emailTo.trim()) {
            showNotification("error", "Recipient email is required");
            return;
        }

        if (!emailSubject.trim()) {
            showNotification("error", "Subject is required");
            return;
        }

        if (!emailBody.trim()) {
            showNotification("error", "Email body is required");
            return;
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailTo)) {
            showNotification("error", "Invalid email address format");
            return;
        }

        setLoading(prev => ({ ...prev, testing: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to send test emails");
                return;
            }

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMAIL.TEST), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    to: emailTo.trim(),
                    subject: emailSubject.trim(),
                    body: emailBody.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || "Failed to send test email";
                throw new Error(errorMessage);
            }

            showNotification("success", "Test email sent successfully!");
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to send test email");
        } finally {
            setLoading(prev => ({ ...prev, testing: false }));
        }
    }, [emailTo, emailSubject, emailBody, getPrivyAccessToken, showNotification, clearNotification]);

    return {
        emailTo,
        emailSubject,
        emailBody,
        loading,
        notification,
        actions: {
            updateEmailTo,
            updateEmailSubject,
            updateEmailBody,
            sendTestEmail,
            clearNotification,
        },
    };
}

