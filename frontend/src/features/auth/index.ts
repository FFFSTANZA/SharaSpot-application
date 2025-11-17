/**
 * Auth Feature Module
 *
 * Public API for the authentication feature.
 */

// Hooks
export { useAuth } from './hooks/useAuth';

// Store
export { useAuthStore } from './store/authStore';

// Types
export type {
  User,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  AuthState,
} from './types/auth.types';

// API (internal use only, not typically exported)
// export { authApi } from './api/authApi';
