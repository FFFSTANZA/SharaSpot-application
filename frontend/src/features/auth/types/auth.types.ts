/**
 * Auth Types
 *
 * TypeScript types for authentication feature.
 */

export interface User {
  id: string;
  email: string;
  display_name: string;
  profile_image_url?: string;
  shara_coins: number;
  trust_score: number;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface PreferencesRequest {
  port_type?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  battery_capacity?: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
