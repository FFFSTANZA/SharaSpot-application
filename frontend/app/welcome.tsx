import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  const handleGoogleSignIn = () => {
    // For MVP, we'll show info that this opens browser
    alert('Google Sign-In will open in your browser. For testing, use email/password login.');
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
      router.replace('/home');
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="flash" size={80} color={Colors.primary} />
          <Text style={styles.title}>SharaSpot</Text>
          <Text style={styles.subtitle}>Whether you drive, Charge Nearby</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
            <Ionicons name="logo-google" size={24} color="#DB4437" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/login')}>
            <Ionicons name="mail" size={24} color={Colors.textInverse} />
            <Text style={styles.emailButtonText}>Sign in with Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>Guest mode has limited features</Text>
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
    backgroundColor: Colors.secondary,
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
});
