/**
 * Email Node Data Interface
 * Represents the data stored in an email workflow node
 */
export interface EmailNodeData {
  // Email configuration
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;

  // Standard node fields
  label?: string;
  description?: string;
  status?: 'idle' | 'success' | 'error';

  // Additional metadata
  [key: string]: unknown;
}

/**
 * Email Notification Interface
 * Represents notification state for email operations
 */
export interface EmailNotification {
  type: 'success' | 'error' | 'info';
  message: string;
}

/**
 * Email Loading State Interface
 * Tracks loading states for different email operations
 */
export interface EmailLoadingState {
  testing: boolean;
  sending: boolean;
}

