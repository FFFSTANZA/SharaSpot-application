import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { Buffer } from 'buffer';

// Polyfill Buffer globally for React Native
global.Buffer = Buffer;

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="home" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-charger" />
        <Stack.Screen name="charger-detail" />
        <Stack.Screen name="profile" />
      </Stack>
    </AuthProvider>
  );
}
