/**
 * useAuth Hook
 *
 * Custom hook for accessing auth functionality.
 */

import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import type { LoginRequest, SignupRequest } from '../types/auth.types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: loginAction,
    signup: signupAction,
    logout: logoutAction,
    clearError,
  } = useAuthStore();

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        await loginAction(credentials);
      } catch (error) {
        // Error is already set in store
        throw error;
      }
    },
    [loginAction]
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      try {
        await signupAction(data);
      } catch (error) {
        throw error;
      }
    },
    [signupAction]
  );

  const logout = useCallback(async () => {
    await logoutAction();
  }, [logoutAction]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout,
    clearError,
  };
}
