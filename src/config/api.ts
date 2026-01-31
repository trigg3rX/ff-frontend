/**
 * API Configuration
 * Centralized API configuration to avoid re-evaluation on every render
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL!,

  ENDPOINTS: {
    META: {
      RUNTIME_CONFIG: "/meta/runtime-config",
    },
    RELAY: {
      CREATE_SAFE: "/relay/create-safe",
      ENABLE_MODULE: "/relay/enable-module",
    },
  },
} as const;

/**
 * Helper to build full API URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}
