/**
 * Slack Integration Types
 * Centralized type definitions for Slack integration
 */

export interface SlackConnection {
    id: string;
    name: string | null;
    createdAt: string;
    connectionType: 'webhook' | 'oauth';
    teamId?: string;
    teamName?: string;
    channelId?: string;
    channelName?: string;
}

export interface SlackChannel {
    id: string;
    name: string;
    isPrivate?: boolean;
    isMember?: boolean;
}

export interface SlackNodeData {
    label: string;
    description?: string;
    iconName?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    blockId?: string;
    slackConnectionId?: string;
    slackConnectionType?: 'webhook' | 'oauth';
    slackConnectionName?: string;
    slackTeamName?: string;
    slackChannelId?: string;
    slackChannelName?: string;
    /** The message that will be sent when the workflow executes */
    slackMessage?: string;
}

export interface SlackNotification {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

export interface SlackLoadingState {
    connections: boolean;
    channels: boolean;
    processing: boolean;
    testing: boolean;
    saving: boolean;
}

export type ConnectionType = 'webhook' | 'oauth';

/**
 * Slack API Response types
 */
export interface SlackConnectionsResponse {
    data: {
        connections: SlackConnection[];
    };
}

export interface SlackChannelsResponse {
    data: {
        channels: SlackChannel[];
    };
}

export interface SlackAuthUrlResponse {
    data: {
        authUrl: string;
    };
}
