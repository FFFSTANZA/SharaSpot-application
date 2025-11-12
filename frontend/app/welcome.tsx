import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

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
        <Animated.View entering={ZoomIn.duration(600).delay(100)} style={styles.header}>
          <Ionicons name="flash" size={80} color={Colors.primary} />
          <Text style={styles.title}>SharaSpot</Text>
          <Text style={styles.subtitle}>Whether you drive, Charge Nearby</Text>
        </Animated.View>

        <View style={styles.buttonsContainer}>
          <Animated.View entering={FadeInDown.duration(500).delay(300)} style={{ width: '100%' }}>
            <TouchableOpacity style={styles.emailButton} onPress={() => router.push('/login')}>
              <Ionicons name="mail" size={24} color={Colors.textInverse} />
              <Text style={styles.emailButtonText}>Sign in with Email</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(400)} style={{ width: '100%' }}>
            <TouchableOpacity style={styles.signupButton} onPress={() => router.push('/signup')}>
              <Text style={styles.signupButtonText}>Create Account</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(500).delay(500)} style={{ width: '100%' }}>
            <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.Text entering={FadeInUp.duration(500).delay(600)} style={styles.disclaimer}>
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
