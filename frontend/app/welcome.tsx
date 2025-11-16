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

  // Animation refs
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const button1TranslateY = useRef(new Animated.Value(50)).current;
  const button2TranslateY = useRef(new Animated.Value(50)).current;
  const button3TranslateY = useRef(new Animated.Value(50)).current;
  const button4TranslateY = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.sequence([
      // Logo entrance with scale
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Title fade in with slide up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Subtitle fade in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start button animations with stagger effect
      Animated.parallel([
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.stagger(100, [
          Animated.spring(button1TranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(button2TranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(button3TranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(button4TranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    // Continuous pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Animated.View
            style={{
              transform: [
                { scale: Animated.multiply(logoScale, logoPulse) }
              ]
            }}
          >
            <Ionicons name="flash" size={80} color={Colors.primary} />
          </Animated.View>
          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }]
              }
            ]}
          >
            SharaSpot
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              { opacity: subtitleOpacity }
            ]}
          >
            Whether you drive, Charge Nearby
          </Animated.Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Signing in...</Text>
          </View>
        ) : (
          <View style={styles.buttonsContainer}>
            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ translateY: button1TranslateY }]
              }}
            >
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ translateY: button2TranslateY }]
              }}
            >
              <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/login')}>
                <Ionicons name="mail" size={24} color={Colors.textInverse} />
                <Text style={styles.emailButtonText}>Sign in with Email</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ translateY: button3TranslateY }]
              }}
            >
              <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
                <Text style={styles.signupButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ translateY: button4TranslateY }]
              }}
            >
              <TouchableOpacity
                style={styles.guestButton}
                onPress={handleGuest}
                disabled={isLoading}
              >
                <Text style={styles.guestButtonText}>Continue as Guest</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        <Animated.Text
          style={[
            styles.disclaimer,
            { opacity: buttonOpacity }
          ]}
        >
          Guest mode has limited features
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
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
  title: {
    ...Typography.displaySmall,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing['3'],
    ...Shadows.xs,
  },
  googleButtonText: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing['3'],
    ...Shadows.md,
  },
  emailButtonText: {
    ...Typography.labelLarge,
    color: Colors.textInverse,
  },
  signupButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentTeal,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    ...Shadows.md,
  },
  signupButtonText: {
    ...Typography.labelLarge,
    color: Colors.textInverse,
  },
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  guestButtonText: {
    ...Typography.labelLarge,
    color: Colors.textSecondary,
  },
  disclaimer: {
    textAlign: 'center',
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginTop: Spacing.lg,
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
