/**
 * API Configuration
 */

// Get API base URL from environment or use default
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

// API timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    GOOGLE_LOGIN: '/api/auth/google/login',
    PREFERENCES: '/api/auth/preferences',
  },

  // Chargers
  CHARGERS: {
    LIST: '/api/chargers',
    NEARBY: '/api/chargers/nearby',
    DETAILS: (id: string) => `/api/chargers/${id}`,
    CREATE: '/api/chargers',
    UPDATE: (id: string) => `/api/chargers/${id}`,
    DELETE: (id: string) => `/api/chargers/${id}`,
    VERIFY: (id: string) => `/api/chargers/${id}/verify`,
    PHOTOS: (id: string) => `/api/chargers/${id}/photos`,
  },

  // Routing
  ROUTING: {
    CALCULATE: '/api/routing/calculate',
    ALTERNATIVES: '/api/routing/alternatives',
  },

  // Profile
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
    STATS: '/api/profile/stats',
  },

  // Gamification
  GAMIFICATION: {
    BALANCE: '/api/gamification/balance',
    TRANSACTIONS: '/api/gamification/transactions',
    AWARD: '/api/gamification/award',
    SPEND: '/api/gamification/spend',
  },

  // Analytics
  ANALYTICS: {
    METRICS: '/api/analytics/metrics',
    USER_GROWTH: '/api/analytics/user-growth',
    ENGAGEMENT: '/api/analytics/engagement',
  },
} as const;

// Export type for endpoints
export type ApiEndpoints = typeof API_ENDPOINTS;
