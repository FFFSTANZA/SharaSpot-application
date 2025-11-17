/**
 * Auth API
 *
 * API calls for authentication feature.
 */

import { apiClient, API_ENDPOINTS } from '../../../shared/api';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  PreferencesRequest,
  GoogleLoginRequest,
} from '../types/auth.types';

export const authApi = {
  /**
   * Sign up a new user
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, data);
  },

  /**
   * Log in a user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

  /**
   * Log out current user
   */
  async logout(): Promise<void> {
    return apiClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });
  },

  /**
   * Google OAuth login
   */
  async googleLogin(data: GoogleLoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.GOOGLE_LOGIN, data);
  },

  /**
   * Update user preferences
   */
  async updatePreferences(data: PreferencesRequest): Promise<void> {
    return apiClient.post<void>(API_ENDPOINTS.AUTH.PREFERENCES, data);
  },
};
