import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  port_type?: string;
  vehicle_type?: string;
  distance_unit?: string;
  is_guest: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<{ success: boolean; needsPreferences?: boolean }>;
  handleGoogleCallback: (sessionId: string) => Promise<{ success: boolean; needsPreferences: boolean }>;
  continueAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: { port_type: string; vehicle_type: string; distance_unit: string }) => Promise<void>;
  needsPreferences: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPreferences, setNeedsPreferences] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        const needsPrefs = !response.data.port_type || !response.data.vehicle_type;
        setNeedsPreferences(needsPrefs);
      }
    } catch (error) {
      await AsyncStorage.removeItem('session_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      await AsyncStorage.setItem('session_token', response.data.session_token);
      setUser(response.data.user);
      setNeedsPreferences(response.data.needs_preferences);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/signup`, { email, password, name });
      await AsyncStorage.setItem('session_token', response.data.session_token);
      setUser(response.data.user);
      setNeedsPreferences(response.data.needs_preferences);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Signup failed');
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; needsPreferences?: boolean }> => {
    try {
      // For now, this will be called from welcome.tsx with proper browser handling
      // This function just returns the auth URL to be used
      return { success: false };
    } catch (error: any) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const handleGoogleCallback = async (sessionId: string): Promise<{ success: boolean; needsPreferences: boolean }> => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/session-data`, {
        headers: { 'X-Session-ID': sessionId }
      });

      await AsyncStorage.setItem('session_token', response.data.session_token);
      setUser(response.data.user);
      setNeedsPreferences(response.data.needs_preferences);

      return {
        success: true,
        needsPreferences: response.data.needs_preferences
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to complete Google sign-in');
    }
  };

  const continueAsGuest = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/guest`);
      await AsyncStorage.setItem('session_token', response.data.session_token);
      setUser(response.data.user);
      setNeedsPreferences(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to continue as guest');
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
      setNeedsPreferences(false);
    }
  };

  const updatePreferences = async (preferences: { port_type: string; vehicle_type: string; distance_unit: string }) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      const response = await axios.put(`${API_URL}/api/auth/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setNeedsPreferences(false);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update preferences');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, handleGoogleCallback, continueAsGuest, logout, updatePreferences, needsPreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
