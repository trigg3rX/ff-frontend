/**
 * Telegram Integration Types (Centralized Bot)
 */

export interface TelegramBotInfo {
    id: number;
    name: string;
    username: string;
    canJoinGroups: boolean;
    canReadAllMessages: boolean;
}

export interface TelegramConnection {
    id: string;
    name: string | null;
    chatId: string;
    chatTitle: string;
    chatType: 'private' | 'group' | 'supergroup' | 'channel';
    createdAt: string;
}

export interface TelegramChat {
    id: string;
    title: string;
    username?: string;
    type: 'private' | 'group' | 'supergroup' | 'channel';
}

export interface TelegramNodeData {
    label: string;
    description?: string;
    iconName?: string;
    status?: 'idle' | 'running' | 'success' | 'error';
    blockId?: string;
    telegramConnectionId?: string;
    telegramChatId?: string;
    telegramChatTitle?: string;
    telegramChatType?: 'private' | 'group' | 'supergroup' | 'channel';
    telegramMessage?: string;
}

export interface TelegramNotification {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

export interface TelegramLoadingState {
    bot: boolean;
    chats: boolean;
    connections: boolean;
    saving: boolean;
    sending: boolean;
    verification: boolean;
}

// Verification Code Types
export type VerificationCodeStatus = 'pending' | 'verified' | 'expired';

export interface TelegramVerificationCode {
    code: string;
    status: VerificationCodeStatus;
    expiresAt: string;
    remainingMinutes: number;
    instructions: string[];
}

export interface TelegramVerificationStatus {
    hasCode: boolean;
    code?: string;
    status?: VerificationCodeStatus;
    expiresAt?: string;
    verifiedAt?: string;
    chat?: {
        id: string;
        title: string;
        type: string;
    } | null;
    message?: string;
}

