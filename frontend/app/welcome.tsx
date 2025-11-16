import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

const API_URL = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_PUBLIC_BACKEND_URL;

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest, handleGoogleCallback } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Background animation refs
  const gradientPosition = useRef(new Animated.Value(0)).current;
  const floatingOrb1Y = useRef(new Animated.Value(0)).current;
  const floatingOrb2Y = useRef(new Animated.Value(0)).current;
  const floatingOrb3Y = useRef(new Animated.Value(0)).current;

  // Content animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animated gradient background
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientPosition, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(gradientPosition, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating orb animations (different speeds for each)
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingOrb1Y, {
          toValue: -30,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingOrb1Y, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingOrb2Y, {
          toValue: -40,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(floatingOrb2Y, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingOrb3Y, {
          toValue: -25,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(floatingOrb3Y, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Content entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Delayed buttons animation
    Animated.timing(buttonsFadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Listen for deep link callbacks
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened with a URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    try {
      // Parse the URL to extract session ID
      const parsedUrl = Linking.parse(url);
      const sessionId = parsedUrl.queryParams?.session_id as string;

      if (sessionId) {
        setIsLoading(true);
        const result = await handleGoogleCallback(sessionId);

        if (result.success) {
          if (result.needsPreferences) {
            router.replace('/preferences');
          } else {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Sign-in Error', error.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      // Create the redirect URL that points back to our app
      const redirectUrl = Linking.createURL('/auth/callback');
      const encodedRedirectUrl = encodeURIComponent(redirectUrl);

      // Construct Emergent Auth URL
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodedRedirectUrl}`;

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Handle the callback URL
        await handleDeepLink({ url: result.url });
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Google sign-in was cancelled');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
      router.replace('/(tabs)');
    } catch (error: any) {
      alert(error.message);
    }
  };

  const gradientOpacity = gradientPosition.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Background Elements */}
      <View style={styles.backgroundGradient} />
      <Animated.View
        style={[
          styles.backgroundOrb1,
          {
            opacity: gradientOpacity,
            transform: [{ translateY: floatingOrb1Y }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundOrb2,
          {
            opacity: gradientOpacity,
            transform: [{ translateY: floatingOrb2Y }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundOrb3,
          {
            opacity: gradientOpacity,
            transform: [{ translateY: floatingOrb3Y }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.backgroundOrb4,
          {
            opacity: gradientOpacity,
            transform: [{ translateY: floatingOrb1Y }],
          },
        ]}
      />

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow}>
              <Ionicons name="flash" size={80} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.title}>SharaSpot</Text>
          <Text style={styles.subtitle}>⚡ Whether you drive, Charge Nearby ⚡</Text>
        </Animated.View>

        {isLoading ? (
          <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Signing in...</Text>
          </Animated.View>
        ) : (
          <Animated.View style={[styles.buttonsContainer, { opacity: buttonsFadeAnim }]}>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/login')}>
              <Ionicons name="mail" size={24} color={Colors.textInverse} />
              <Text style={styles.emailButtonText}>Sign in with Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
              <Ionicons name="user-add" size={24} color={Colors.textInverse} />
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuest}
              disabled={isLoading}
            >
              <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.Text style={[styles.disclaimer, { opacity: buttonsFadeAnim }]}>
          💡 Guest mode has limited features
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',
  },
  backgroundOrb1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
    top: -150,
    right: -120,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
  backgroundOrb2: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#06B6D4',
    opacity: 0.08,
    bottom: -100,
    left: -100,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.1,
    shadowRadius: 40,
  },
  backgroundOrb3: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#8B5CF6',
    opacity: 0.06,
    top: '45%',
    right: -80,
    shadowColor: '#8B5CF6',
    shadowOpacity: 0.1,
    shadowRadius: 30,
  },
  backgroundOrb4: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#10B981',
    opacity: 0.05,
    top: '25%',
    left: -60,
    shadowColor: '#10B981',
    shadowOpacity: 0.1,
    shadowRadius: 25,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  iconGlow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 70,
    padding: Spacing.xl,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 5,
  },
  title: {
    ...Typography.displaySmall,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    borderRadius: 14,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    ...Typography.labelLarge,
    color: '#1E293B',
    fontWeight: '600',
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    gap: Spacing.sm,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  emailButtonText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 14,
    gap: Spacing.sm,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  signupButtonText: {
    ...Typography.labelLarge,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing['2'],
  },
  guestButtonText: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  disclaimer: {
    textAlign: 'center',
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.xl,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});
