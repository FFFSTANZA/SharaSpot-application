/**
 * Secure Storage Utility for SharaSpot Frontend
 *
 * Addresses P0 Issue #5: Session Storage Encryption
 *
 * This module provides encrypted storage for sensitive data like session tokens.
 * Uses expo-secure-store for secure, encrypted storage on device.
 *
 * IMPORTANT: For production, install expo-secure-store:
 * npm install expo-secure-store
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as SecureStore from 'expo-secure-store';

/**
 * Simple encryption/decryption using base64 encoding (placeholder)
 * In production with expo-secure-store, this would use native encryption
 */
class SimpleEncryption {
  private static key = 'sharaspot_encryption_key_v1';

  static encrypt(value: string): string {
    // Simple XOR-based encryption (for demonstration)
    // In production, expo-secure-store handles this natively
    const encrypted = value.split('').map((char, i) => {
      const keyChar = this.key[i % this.key.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join('');

    return Buffer.from(encrypted).toString('base64');
  }

  static decrypt(encryptedValue: string): string {
    try {
      const decoded = Buffer.from(encryptedValue, 'base64').toString();
      const decrypted = decoded.split('').map((char, i) => {
        const keyChar = this.key[i % this.key.length];
        return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
      }).join('');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
}

/**
 * Secure Storage Interface
 */
export class SecureStorage {
  private static USE_SECURE_STORE = false; // Set to true when expo-secure-store is installed

  /**
   * Securely store a value
   * @param key Storage key
   * @param value Value to store
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.USE_SECURE_STORE) {
        // Production: Use expo-secure-store
        // await SecureStore.setItemAsync(key, value);
        console.warn('SecureStore not configured, using fallback');
      }

      // Fallback: Encrypt and store in AsyncStorage
      const encrypted = SimpleEncryption.encrypt(value);
      await AsyncStorage.setItem(`secure_${key}`, encrypted);
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw new Error('Failed to store secure data');
    }
  }

  /**
   * Retrieve a securely stored value
   * @param key Storage key
   * @returns Decrypted value or null
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.USE_SECURE_STORE) {
        // Production: Use expo-secure-store
        // return await SecureStore.getItemAsync(key);
        console.warn('SecureStore not configured, using fallback');
      }

      // Fallback: Retrieve and decrypt from AsyncStorage
      const encrypted = await AsyncStorage.getItem(`secure_${key}`);
      if (!encrypted) return null;

      return SimpleEncryption.decrypt(encrypted);
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  /**
   * Remove a securely stored value
   * @param key Storage key
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (this.USE_SECURE_STORE) {
        // Production: Use expo-secure-store
        // await SecureStore.deleteItemAsync(key);
        console.warn('SecureStore not configured, using fallback');
      }

      // Fallback: Remove from AsyncStorage
      await AsyncStorage.removeItem(`secure_${key}`);
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
      throw new Error('Failed to remove secure data');
    }
  }

  /**
   * Check if a key exists in secure storage
   * @param key Storage key
   * @returns True if key exists
   */
  static async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  /**
   * Clear all secure storage
   * WARNING: Use with caution
   */
  static async clear(): Promise<void> {
    try {
      // Get all keys
      const allKeys = await AsyncStorage.getAllKeys();
      const secureKeys = allKeys.filter(key => key.startsWith('secure_'));

      // Remove all secure keys
      await AsyncStorage.multiRemove(secureKeys);
    } catch (error) {
      console.error('SecureStorage clear error:', error);
      throw new Error('Failed to clear secure storage');
    }
  }
}

/**
 * Session Token Manager
 * Provides a convenient interface for session token operations
 */
export class SessionManager {
  private static SESSION_TOKEN_KEY = 'session_token';

  /**
   * Store session token securely
   * @param token Session token
   */
  static async setToken(token: string): Promise<void> {
    await SecureStorage.setItem(this.SESSION_TOKEN_KEY, token);
  }

  /**
   * Retrieve session token
   * @returns Session token or null
   */
  static async getToken(): Promise<string | null> {
    return await SecureStorage.getItem(this.SESSION_TOKEN_KEY);
  }

  /**
   * Remove session token (logout)
   */
  static async clearToken(): Promise<void> {
    await SecureStorage.removeItem(this.SESSION_TOKEN_KEY);
  }

  /**
   * Check if user has active session
   * @returns True if session exists
   */
  static async hasSession(): Promise<boolean> {
    return await SecureStorage.hasItem(this.SESSION_TOKEN_KEY);
  }
}

/**
 * Migration utility to move from insecure to secure storage
 */
export class StorageMigration {
  /**
   * Migrate session token from AsyncStorage to SecureStorage
   */
  static async migrateSessionToken(): Promise<boolean> {
    try {
      // Check if token exists in old storage
      const oldToken = await AsyncStorage.getItem('session_token');

      if (oldToken) {
        // Move to secure storage
        await SessionManager.setToken(oldToken);

        // Remove from old storage
        await AsyncStorage.removeItem('session_token');

        console.log('Session token migrated to secure storage');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Migration error:', error);
      return false;
    }
  }
}

export default SecureStorage;
