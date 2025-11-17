/**
 * Storage Service
 *
 * Handles secure token storage and retrieval.
 * This is a placeholder - integrate with existing secureStorage.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored token:', error);
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing refresh token:', error);
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
}

export async function refreshAccessToken(): Promise<string> {
  // TODO: Implement token refresh logic
  // This should call the refresh endpoint with the refresh token
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  // Call refresh endpoint
  // const response = await fetch(...)
  // return response.access_token

  throw new Error('Token refresh not implemented');
}
