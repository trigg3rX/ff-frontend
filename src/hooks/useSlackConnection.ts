"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { usePrivyWallet } from "./usePrivyWallet";
import { API_CONFIG, buildApiUrl } from "@/config/api";
import type {
    SlackConnection,
    SlackChannel,
    SlackNotification,
    SlackLoadingState,
    ConnectionType,
} from "@/types/slack";

interface UseSlackConnectionProps {
    nodeData: Record<string, unknown>;
    /**
     * Batch update callback - receives all updates in a single object
     * to prevent UI flicker from multiple state updates
     */
    onDataChange: (updates: Record<string, unknown>) => void;
    authenticated: boolean;
}

interface UseSlackConnectionReturn {
    // State
    connections: SlackConnection[];
    channels: SlackChannel[];
    loading: SlackLoadingState;
    notification: SlackNotification | null;
    selectedConnectionId: string | null;
    selectedChannelId: string;
    connectionType: ConnectionType;
    isTestSuccessful: boolean;

    // Form state (for connection creation)
    webhookUrl: string;
    connectionName: string;
    testMessage: string;
    showCreateForm: boolean;

    // Workflow message (stored in node data)
    slackMessage: string;

    // Delete dialog state
    deleteConnectionId: string | null;
    showDeleteDialog: boolean;

    // Actions
    actions: {
        loadConnections: () => Promise<void>;
        loadChannels: (connectionId: string) => Promise<void>;
        selectConnection: (connectionId: string, connectionData?: SlackConnection) => void;
        testWebhook: (webhookUrl: string, message: string) => Promise<void>;
        saveWebhook: () => Promise<void>;
        testOAuthConnection: (connectionId: string, channelId: string) => Promise<void>;
        authorizeOAuth: () => Promise<void>;
        updateChannel: (connectionId: string, channelId: string, channelName: string) => Promise<void>;
        deleteConnection: () => Promise<void>;
        /** Send preview message for the configured workflow message */
        sendPreviewMessage: () => Promise<void>;
        /** Update the workflow message (stored in node data) */
        updateSlackMessage: (message: string) => void;

        // UI actions
        setConnectionType: (type: ConnectionType) => void;
        setWebhookUrl: (url: string) => void;
        setConnectionName: (name: string) => void;
        setTestMessage: (message: string) => void;
        setShowCreateForm: (show: boolean) => void;
        setDeleteConnectionId: (id: string | null) => void;
        setShowDeleteDialog: (show: boolean) => void;
        clearNotification: () => void;
        resetTestState: () => void;
    };
}

/**
 * Custom hook for managing Slack connection state and operations
 * Extracts all Slack logic from the component for better separation of concerns
 */
export function useSlackConnection({
    nodeData,
    onDataChange,
    authenticated,
}: UseSlackConnectionProps): UseSlackConnectionReturn {
    const { getPrivyAccessToken } = usePrivyWallet();

    // Connection state
    const [connections, setConnections] = useState<SlackConnection[]>([]);
    const [channels, setChannels] = useState<SlackChannel[]>([]);
    const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
    const [selectedChannelId, setSelectedChannelId] = useState<string>("");

    // Loading states
    const [loading, setLoading] = useState<SlackLoadingState>({
        connections: false,
        channels: false,
        processing: false,
        testing: false,
        saving: false,
    });

    // Notification state (centralized)
    const [notification, setNotification] = useState<SlackNotification | null>(null);

    // Form state (for connection creation testing)
    const [connectionType, setConnectionType] = useState<ConnectionType>("webhook");
    const [webhookUrl, setWebhookUrl] = useState("");
    const [connectionName, setConnectionName] = useState("");
    const [testMessage, setTestMessage] = useState("Hello from FlowForge! 🚀");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [isTestSuccessful, setIsTestSuccessful] = useState(false);

    // Workflow message (synced with node data)
    // Fallback to testMessage for backwards compatibility with older workflows
    const [slackMessage, setSlackMessage] = useState(
        (nodeData.slackMessage as string) || (nodeData.testMessage as string) || ""
    );

    // Delete dialog state
    const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // OAuth polling cleanup ref
    const oauthPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Token ref for OAuth polling (prevents race condition on session expiry)
    const oauthTokenRef = useRef<string | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (oauthPollIntervalRef.current) {
                clearInterval(oauthPollIntervalRef.current);
            }
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
            oauthTokenRef.current = null;
        };
    }, []);

    // Sync selectedConnectionId with nodeData
    useEffect(() => {
        if (nodeData.slackConnectionId) {
            setSelectedConnectionId(nodeData.slackConnectionId as string);
        } else {
            setSelectedConnectionId(null);
        }
    }, [nodeData.slackConnectionId]);

    /**
     * Show notification with auto-dismiss
     */
    const showNotification = useCallback((type: SlackNotification["type"], message: string) => {
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
     * Load all Slack connections
     */
    const loadConnections = useCallback(async () => {
        setLoading(prev => ({ ...prev, connections: true }));

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.CONNECTIONS),
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setConnections(data.data.connections || []);
            }
        } catch (error) {
            console.error("Failed to load connections:", error);
        } finally {
            setLoading(prev => ({ ...prev, connections: false }));
        }
    }, [getPrivyAccessToken]);

    /**
     * Load channels for an OAuth connection
     */
    const loadChannels = useCallback(async (connectionId: string) => {
        setLoading(prev => ({ ...prev, channels: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) return;

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.SLACK.CONNECTIONS}/${connectionId}/channels`),
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setChannels(data.data.channels || []);
            }
        } catch (error) {
            console.error("Failed to load channels:", error);
            showNotification("error", "Failed to load channels");
        } finally {
            setLoading(prev => ({ ...prev, channels: false }));
        }
    }, [getPrivyAccessToken, showNotification, clearNotification]);

    /**
     * Select a connection and update node data
     * Batches all updates into a single operation to prevent UI flicker
     */
    const selectConnection = useCallback((connectionId: string, connectionData?: SlackConnection) => {
        const connection = connectionData || connections.find(c => c.id === connectionId);
        if (!connection) return;

        const connType = connection.connectionType || "webhook";

        // Update local state immediately for UI responsiveness
        setSelectedConnectionId(connectionId);

        // Batch all node data updates into a single object
        const updates: Record<string, unknown> = {
            slackConnectionId: connection.id,
            slackConnectionType: connType,
            slackConnectionName: connection.name || (connType === "oauth" ? connection.teamName : "Slack Webhook"),
        };

        if (connType === "oauth") {
            updates.slackTeamName = connection.teamName;
            if (connection.channelId) {
                updates.slackChannelId = connection.channelId;
                setSelectedChannelId(connection.channelId);
            } else {
                updates.slackChannelId = undefined;
                setSelectedChannelId("");
            }
            updates.slackChannelName = connection.channelName || undefined;

            // Load channels for OAuth connection
            loadChannels(connectionId);
        } else {
            // Clear OAuth-specific fields for webhook connections
            updates.slackTeamName = undefined;
            updates.slackChannelId = undefined;
            updates.slackChannelName = undefined;
            setSelectedChannelId("");
        }

        // Apply all updates at once - single state update in parent
        onDataChange(updates);

        clearNotification();
    }, [connections, onDataChange, loadChannels, clearNotification]);

    /**
     * Test a webhook URL
     */
    const testWebhook = useCallback(async (webhookUrlToTest: string, messageToSend: string) => {
        if (!webhookUrlToTest.trim()) {
            showNotification("error", "Webhook URL is required");
            return;
        }

        if (!messageToSend.trim()) {
            showNotification("error", "Test message is required");
            return;
        }

        setLoading(prev => ({ ...prev, testing: true }));
        setIsTestSuccessful(false);
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to test webhook");
                return;
            }

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.TEST), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    webhookUrl: webhookUrlToTest.trim(),
                    text: messageToSend.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || "Failed to test webhook";

                if (response.status === 429) {
                    throw new Error(`⏱️ ${errorMessage}`);
                }
                throw new Error(errorMessage);
            }

            setIsTestSuccessful(true);
            showNotification("success", "✅ Test successful! You can now save the webhook.");
        } catch (error) {
            setIsTestSuccessful(false);
            showNotification("error", error instanceof Error ? error.message : "Failed to test webhook");
        } finally {
            setLoading(prev => ({ ...prev, testing: false }));
        }
    }, [getPrivyAccessToken, showNotification, clearNotification]);

    /**
     * Save a new webhook connection
     */
    const saveWebhook = useCallback(async () => {
        if (!webhookUrl.trim()) {
            showNotification("error", "Webhook URL is required");
            return;
        }

        setLoading(prev => ({ ...prev, saving: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to save webhook");
                return;
            }

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.WEBHOOKS), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    webhookUrl: webhookUrl.trim(),
                    name: connectionName.trim() || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || "Failed to save webhook");
            }

            showNotification("success", "Webhook saved successfully!");
            setWebhookUrl("");
            setConnectionName("");
            setIsTestSuccessful(false);
            setShowCreateForm(false);

            // Reload connections
            await loadConnections();
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to save webhook");
        } finally {
            setLoading(prev => ({ ...prev, saving: false }));
        }
    }, [webhookUrl, connectionName, getPrivyAccessToken, loadConnections, showNotification, clearNotification]);

    /**
     * Send preview message using the configured workflow message (slackMessage)
     * This tests the message that will be sent when the workflow executes
     */
    const sendPreviewMessage = useCallback(async () => {
        if (!nodeData.slackConnectionId) {
            showNotification("error", "No connection selected");
            return;
        }

        const messageToSend = (nodeData.slackMessage as string) || slackMessage;
        if (!messageToSend.trim()) {
            showNotification("error", "Please enter a message to send");
            return;
        }

        setLoading(prev => ({ ...prev, processing: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to send messages");
                return;
            }

            const requestBody: Record<string, unknown> = {
                connectionId: nodeData.slackConnectionId,
                text: messageToSend.trim(),
            };

            // For OAuth connections, include the channel ID
            if (nodeData.slackConnectionType === "oauth" && nodeData.slackChannelId) {
                requestBody.channelId = nodeData.slackChannelId;
            }

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.SEND), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || "Failed to send message";

                if (response.status === 429) {
                    throw new Error(`⏱️ ${errorMessage}`);
                }
                throw new Error(errorMessage);
            }

            showNotification("success", "✅ Preview message sent successfully!");
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to send message");
        } finally {
            setLoading(prev => ({ ...prev, processing: false }));
        }
    }, [nodeData, slackMessage, getPrivyAccessToken, showNotification, clearNotification]);

    /**
     * Update the workflow message (stored in node data)
     * Called when user types in the message template input
     */
    const updateSlackMessage = useCallback((message: string) => {
        setSlackMessage(message);
        onDataChange({ slackMessage: message });
    }, [onDataChange]);

    /**
     * Test an OAuth connection with a specific channel
     */
    const testOAuthConnection = useCallback(async (connectionId: string, channelId: string) => {
        if (!channelId) {
            showNotification("error", "Please select a channel first");
            return;
        }

        setLoading(prev => ({ ...prev, processing: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to send messages");
                return;
            }

            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.SEND), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    connectionId,
                    text: "🧪 Test message from FlowForge - Bot is working correctly!",
                    channelId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || errorData.message || "Failed to send message";

                if (response.status === 429) {
                    throw new Error(`⏱️ ${errorMessage}`);
                }
                throw new Error(errorMessage);
            }

            showNotification("success", "✅ Test message sent successfully!");
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to send test message");
        } finally {
            setLoading(prev => ({ ...prev, processing: false }));
        }
    }, [getPrivyAccessToken, showNotification, clearNotification]);

    /**
     * Start OAuth authorization flow
     * Uses token ref to prevent race condition on session expiry during polling
     */
    const authorizeOAuth = useCallback(async () => {
        setLoading(prev => ({ ...prev, processing: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to authorize Slack");
                return;
            }

            // Store token in ref for polling (prevents race condition on session expiry)
            oauthTokenRef.current = accessToken;

            // Get authorization URL
            const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.OAUTH_AUTHORIZE), {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!response.ok) {
                throw new Error("Failed to get authorization URL");
            }

            const data = await response.json();
            const authUrl = data.data.authUrl;

            // Open popup
            const { POPUP_WIDTH, POPUP_HEIGHT } = API_CONFIG.OAUTH;
            const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
            const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

            const popup = window.open(
                authUrl,
                "Slack Authorization",
                `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top}`
            );

            // Poll for OAuth completion with timeout
            let pollCount = 0;
            const maxPolls = API_CONFIG.OAUTH.MAX_POLL_DURATION_MS / API_CONFIG.OAUTH.POLL_INTERVAL_MS;

            // Clear any existing poll interval
            if (oauthPollIntervalRef.current) {
                clearInterval(oauthPollIntervalRef.current);
            }

            oauthPollIntervalRef.current = setInterval(async () => {
                pollCount++;

                // Check if token is still valid (ref-based to avoid stale closure)
                const currentToken = oauthTokenRef.current;
                if (!currentToken) {
                    if (oauthPollIntervalRef.current) {
                        clearInterval(oauthPollIntervalRef.current);
                        oauthPollIntervalRef.current = null;
                    }
                    setLoading(prev => ({ ...prev, processing: false }));
                    showNotification("error", "Session expired. Please try again.");
                    return;
                }

                // Timeout check
                if (pollCount > maxPolls) {
                    if (oauthPollIntervalRef.current) {
                        clearInterval(oauthPollIntervalRef.current);
                        oauthPollIntervalRef.current = null;
                    }
                    oauthTokenRef.current = null;
                    setLoading(prev => ({ ...prev, processing: false }));
                    showNotification("error", "OAuth authorization timed out. Please try again.");
                    return;
                }

                if (popup?.closed) {
                    if (oauthPollIntervalRef.current) {
                        clearInterval(oauthPollIntervalRef.current);
                        oauthPollIntervalRef.current = null;
                    }
                    setLoading(prev => ({ ...prev, processing: false }));

                    // Use stored token from ref (avoids refetching and potential race condition)
                    const token = currentToken;
                    if (token) {
                        try {
                            const connectionsResponse = await fetch(
                                buildApiUrl(API_CONFIG.ENDPOINTS.SLACK.CONNECTIONS),
                                { headers: { Authorization: `Bearer ${token}` } }
                            );

                            if (connectionsResponse.ok) {
                                const connectionsData = await connectionsResponse.json();
                                const updatedConnections = connectionsData.data.connections || [];
                                setConnections(updatedConnections);

                                // Auto-select the newest OAuth connection
                                const oauthConnections = updatedConnections.filter(
                                    (c: SlackConnection) => c.connectionType === "oauth"
                                );

                                if (oauthConnections.length > 0) {
                                    const newConnection = oauthConnections[0];
                                    setTimeout(() => {
                                        selectConnection(newConnection.id, newConnection);
                                    }, 150);
                                }
                            }
                        } catch (err) {
                            console.error("Failed to load connections after OAuth:", err);
                        }
                    }

                    oauthTokenRef.current = null;
                    setShowCreateForm(false);
                    showNotification("success", "OAuth connection created successfully! Please select a channel below.");
                }
            }, API_CONFIG.OAUTH.POLL_INTERVAL_MS);
        } catch (error) {
            oauthTokenRef.current = null;
            showNotification("error", error instanceof Error ? error.message : "Failed to authorize Slack");
            setLoading(prev => ({ ...prev, processing: false }));
        }
    }, [getPrivyAccessToken, selectConnection, showNotification, clearNotification]);

    /**
     * Update channel for an OAuth connection
     */
    const updateChannel = useCallback(async (connectionId: string, channelId: string, channelName: string) => {
        setLoading(prev => ({ ...prev, processing: true }));
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to update channel");
                return;
            }

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.SLACK.CONNECTIONS}/${connectionId}/channel`),
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ channelId, channelName }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to update channel");
            }

            // Update local and node state
            setSelectedChannelId(channelId);
            onDataChange({
                slackChannelId: channelId,
                slackChannelName: channelName,
            });

            showNotification("success", "Channel updated successfully! Bot has been added to the channel.");
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to update channel");
        } finally {
            setLoading(prev => ({ ...prev, processing: false }));
        }
    }, [getPrivyAccessToken, onDataChange, showNotification, clearNotification]);

    /**
     * Delete a connection
     */
    const deleteConnection = useCallback(async () => {
        if (!deleteConnectionId) return;

        setLoading(prev => ({ ...prev, processing: true }));
        setShowDeleteDialog(false);
        clearNotification();

        try {
            const accessToken = await getPrivyAccessToken();
            if (!accessToken) {
                showNotification("error", "Please log in to delete connections");
                return;
            }

            const response = await fetch(
                buildApiUrl(`${API_CONFIG.ENDPOINTS.SLACK.CONNECTIONS}/${deleteConnectionId}`),
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || "Failed to delete connection");
            }

            // Clear selected connection if it was deleted
            if (nodeData.slackConnectionId === deleteConnectionId || selectedConnectionId === deleteConnectionId) {
                onDataChange({
                    slackConnectionId: undefined,
                    slackConnectionName: undefined,
                });
                setSelectedConnectionId(null);
            }

            // Reload connections
            await loadConnections();

            showNotification("success", "Connection deleted successfully");
        } catch (error) {
            showNotification("error", error instanceof Error ? error.message : "Failed to delete connection");
        } finally {
            setLoading(prev => ({ ...prev, processing: false }));
            setDeleteConnectionId(null);
        }
    }, [deleteConnectionId, nodeData, selectedConnectionId, getPrivyAccessToken, onDataChange, loadConnections, showNotification, clearNotification]);

    /**
     * Reset test state (when URL changes)
     */
    const resetTestState = useCallback(() => {
        setIsTestSuccessful(false);
        clearNotification();
    }, [clearNotification]);

    // Load connections on mount when authenticated
    useEffect(() => {
        if (authenticated) {
            loadConnections();
        }
    }, [authenticated, loadConnections]);

    return {
        connections,
        channels,
        loading,
        notification,
        selectedConnectionId,
        selectedChannelId,
        connectionType,
        isTestSuccessful,
        webhookUrl,
        connectionName,
        testMessage,
        showCreateForm,
        slackMessage,
        deleteConnectionId,
        showDeleteDialog,
        actions: {
            loadConnections,
            loadChannels,
            selectConnection,
            testWebhook,
            saveWebhook,
            testOAuthConnection,
            authorizeOAuth,
            updateChannel,
            deleteConnection,
            sendPreviewMessage,
            updateSlackMessage,
            setConnectionType,
            setWebhookUrl,
            setConnectionName,
            setTestMessage,
            setShowCreateForm,
            setDeleteConnectionId,
            setShowDeleteDialog,
            clearNotification,
            resetTestState,
        },
    };
}
