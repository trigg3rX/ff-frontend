/**
 * API Client with X-Request-ID Support
 *
 * Centralized HTTP client that automatically:
 * - Generates and attaches X-Request-ID to all outgoing requests
 * - Reads response X-Request-ID for debugging and correlation
 * - Provides consistent error handling with request ID context
 */

import { buildApiUrl } from "@/config/api";

// Header name constant (matches backend)
export const REQUEST_ID_HEADER = "X-Request-ID";

/**
 * Generate a UUID v4 for request IDs
 * Uses crypto.randomUUID() when available, falls back to manual generation
 */
export function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Request/Response metadata including request ID
 */
export interface RequestMetadata {
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
}

/**
 * Enhanced API response with request ID
 */
export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T | null;
  error: ApiClientError | null;
  requestId: string;
  metadata: RequestMetadata;
}

/**
 * API client error with request ID for debugging
 */
export interface ApiClientError {
  message: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
  retryAfter?: number;
  requestId: string;
  statusCode?: number;
}

/**
 * Options for API requests
 */
export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  accessToken?: string;
  customRequestId?: string; // Allow override for testing/tracing
}

/**
 * Log levels for request logging
 */
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * Configuration for the API client
 */
interface ApiClientConfig {
  enableLogging: boolean;
  logLevel: LogLevel;
  onRequest?: (metadata: RequestMetadata) => void;
  onResponse?: (metadata: RequestMetadata, response: Response) => void;
  onError?: (metadata: RequestMetadata, error: Error | ApiClientError) => void;
}

// Default configuration
const defaultConfig: ApiClientConfig = {
  enableLogging: process.env.NODE_ENV === "development",
  logLevel: "debug",
};

// Current configuration
let config: ApiClientConfig = { ...defaultConfig };

/**
 * Configure the API client
 */
export function configureApiClient(newConfig: Partial<ApiClientConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Get current request ID from localStorage for debugging
 * (Used to display last request ID in error messages, etc.)
 */
export function getLastRequestId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("lastRequestId");
}

/**
 * Store the last request ID for debugging
 */
function storeLastRequestId(requestId: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("lastRequestId", requestId);
  }
}

/**
 * Log a message with request context
 */
function log(
  level: LogLevel,
  message: string,
  metadata?: RequestMetadata,
  extra?: unknown,
): void {
  if (!config.enableLogging) return;

  const levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  if (levels[level] < levels[config.logLevel]) return;

  const prefix = metadata ? `[${metadata.requestId}]` : "";
  const logFn = console[level] || console.log;

  if (extra) {
    logFn(`${prefix} ${message}`, extra);
  } else {
    logFn(`${prefix} ${message}`);
  }
}

/**
 * Create headers with X-Request-ID and optional auth token
 */
function createHeaders(
  requestId: string,
  accessToken?: string,
  customHeaders?: HeadersInit,
): Headers {
  const headers = new Headers(customHeaders);

  // Always set X-Request-ID
  headers.set(REQUEST_ID_HEADER, requestId);

  // Set Content-Type if not already set
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Set Authorization if token provided
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return headers;
}

/**
 * Parse response body safely
 */
async function parseResponseBody<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type");

  if (!contentType) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  // For non-JSON responses, return text as string (cast to T)
  try {
    const text = await response.text();
    return text as unknown as T;
  } catch {
    return null;
  }
}

/**
 * Make an API request with automatic X-Request-ID handling
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    body,
    accessToken,
    customRequestId,
    headers: customHeaders,
    ...fetchOptions
  } = options;

  // Generate or use provided request ID
  const requestId = customRequestId || generateRequestId();
  const url = endpoint.startsWith("http") ? endpoint : buildApiUrl(endpoint);
  const method = (fetchOptions.method || "GET").toUpperCase();

  // Create metadata for logging/callbacks
  const metadata: RequestMetadata = {
    requestId,
    url,
    method,
    startTime: Date.now(),
  };

  // Store for debugging
  storeLastRequestId(requestId);

  log("debug", `→ ${method} ${url}`, metadata);
  config.onRequest?.(metadata);

  try {
    // Create headers
    const headers = createHeaders(requestId, accessToken, customHeaders);

    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Update metadata
    metadata.endTime = Date.now();
    metadata.duration = metadata.endTime - metadata.startTime;
    metadata.statusCode = response.status;

    // Get response request ID (backend may have used a different one)
    const responseRequestId =
      response.headers.get(REQUEST_ID_HEADER) || requestId;

    log(
      response.ok ? "debug" : "warn",
      `← ${response.status} ${response.statusText} (${metadata.duration}ms)`,
      metadata,
    );
    config.onResponse?.(metadata, response);

    // Parse response body
    const data = await parseResponseBody<T>(response);

    if (!response.ok) {
      // Extract error details from response body
      const errorBody = data as {
        error?: {
          message?: string;
          code?: string;
          details?: Array<{ field: string; message: string }>;
        };
        retryAfter?: number;
      };

      const error: ApiClientError = {
        message:
          errorBody?.error?.message || response.statusText || "Request failed",
        code: errorBody?.error?.code,
        details: errorBody?.error?.details,
        retryAfter: errorBody?.retryAfter,
        requestId: responseRequestId,
        statusCode: response.status,
      };

      log("error", `Request failed: ${error.message}`, metadata, error);
      config.onError?.(metadata, error);

      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        data: null,
        error,
        requestId: responseRequestId,
        metadata,
      };
    }

    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      data,
      error: null,
      requestId: responseRequestId,
      metadata,
    };
  } catch (err) {
    // Handle network/fetch errors
    metadata.endTime = Date.now();
    metadata.duration = metadata.endTime - metadata.startTime;

    const error: ApiClientError = {
      message: err instanceof Error ? err.message : "Network error",
      code: "NETWORK_ERROR",
      requestId,
    };

    log("error", `Network error: ${error.message}`, metadata, err);
    config.onError?.(metadata, error);

    return {
      ok: false,
      status: 0,
      statusText: "Network Error",
      data: null,
      error,
      requestId,
      metadata,
    };
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T = unknown>(
    endpoint: string,
    body?: unknown,
    options?: ApiRequestOptions,
  ) => apiRequest<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};

/**
 * Create an error message with request ID for user-facing displays
 */
export function formatErrorWithRequestId(error: ApiClientError): string {
  const baseMessage = error.message;
  return `${baseMessage} (Request ID: ${error.requestId})`;
}

/**
 * Create a short reference for support requests
 */
export function getErrorReference(error: ApiClientError): string {
  // Use first 8 characters of request ID as reference
  return error.requestId.substring(0, 8).toUpperCase();
}
