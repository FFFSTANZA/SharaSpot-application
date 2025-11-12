import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  Easing,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Animated button component with press effects
const AnimatedButton = ({
  onPress,
  style,
  textStyle,
  children,
  icon,
  iconColor,
  delay = 0,
  gradient = false,
  gradientColors = ['#6366F1', '#8B5CF6']  // Minimalist indigo to purple gradient
}: any) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    opacity: fadeAnim,
    transform: [
      { scale: Animated.multiply(scaleAnim, pressAnim) },
      {
        translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
  };

  const ButtonContent = () => (
    <View style={styles.buttonContent}>
      {icon && <Ionicons name={icon} size={24} color={iconColor} />}
      <Text style={textStyle}>{children}</Text>
    </View>
  );

  return (
    <Animated.View style={[animatedStyle]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {gradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.buttonBase, style]}
          >
            <ButtonContent />
          </LinearGradient>
        ) : (
          <View style={[styles.buttonBase, style]}>
            <ButtonContent />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Floating particle component
const FloatingParticle = ({ delay, size, duration, startX, startY }: any) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration / 2,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(floatAnim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: startX,
          top: startY,
          width: size,
          height: size,
          opacity: opacityAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 0.3],
          }),
          transform: [
            {
              translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -100],
              }),
            },
            {
              translateX: floatAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 20, 0],
              }),
            },
          ],
        },
      ]}
    />
  );
};

export default function Welcome() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  // Animation refs
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const logoGlowAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoGlowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoGlowAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleGoogleSignIn = () => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    alert('Google Sign-In will open in your browser. For testing, use email/password login.');
  };

  const handleGuest = async () => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await continueAsGuest();
      router.replace('/home');
    } catch (error: any) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      alert(error.message);
    }
  };

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Animated gradient background */}
      <LinearGradient
        colors={['#0F2027', '#203A43', '#2C5364']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating particles */}
      <FloatingParticle delay={0} size={80} duration={4000} startX={50} startY={height * 0.2} />
      <FloatingParticle delay={500} size={60} duration={5000} startX={width - 100} startY={height * 0.3} />
      <FloatingParticle delay={1000} size={100} duration={4500} startX={width * 0.5} startY={height * 0.5} />
      <FloatingParticle delay={1500} size={70} duration={5500} startX={100} startY={height * 0.6} />
      <FloatingParticle delay={2000} size={90} duration={6000} startX={width - 80} startY={height * 0.7} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.header}>
            {/* Animated logo with glow effect */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  transform: [{ scale: logoScaleAnim }, { rotate: logoRotate }],
                  opacity: logoGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ]}
            >
              <View style={styles.logoGlowOuter}>
                <View style={styles.logoGlowInner}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6', '#0EA5E9']}  // Rich indigo to sky blue gradient
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="flash" size={60} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>

            {/* Animated title with glassmorphic shimmer effect */}
            <Animated.View
              style={{
                opacity: titleFadeAnim,
                transform: [
                  {
                    translateY: titleFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.titleContainer}>
                {/* Glass background layer */}
                <BlurView intensity={30} tint="light" style={styles.titleGlassBackground} />

                {/* Main title with shimmer effect */}
                <LinearGradient
                  colors={['#FFFFFF', '#E0E7FF', '#FFFFFF']}  // Subtle shimmer gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.titleGradient}
                >
                  <Text style={styles.title}>SharaSpot</Text>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Animated subtitle */}
            <Animated.View
              style={{
                opacity: subtitleFadeAnim,
                transform: [
                  {
                    translateY: subtitleFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <BlurView intensity={20} tint="dark" style={styles.subtitleBlur}>
                <Text style={styles.subtitle}>Whether you drive, Charge Nearby</Text>
              </BlurView>
            </Animated.View>
          </View>

          <View style={styles.buttonsContainer}>
            {/* Google button with glass morphism */}
            <AnimatedButton
              onPress={handleGoogleSignIn}
              style={styles.googleButton}
              textStyle={styles.googleButtonText}
              icon="logo-google"
              iconColor="#DB4437"
              delay={800}
            >
              Continue with Google
            </AnimatedButton>

            {/* Email button with gradient */}
            <AnimatedButton
              onPress={() => router.push('/login')}
              style={styles.emailButton}
              textStyle={styles.emailButtonText}
              icon="mail"
              iconColor="#FFFFFF"
              delay={1000}
              gradient={true}
              gradientColors={['#6366F1', '#8B5CF6', '#0EA5E9']}  // Premium indigo gradient
            >
              Sign in with Email
            </AnimatedButton>

            {/* Signup button with gradient */}
            <AnimatedButton
              onPress={() => router.push('/signup')}
              style={styles.signupButton}
              textStyle={styles.signupButtonText}
              delay={1200}
              gradient={true}
              gradientColors={['#2196F3', '#1976D2', '#42A5F5']}
            >
              Create Account
            </AnimatedButton>

            {/* Guest button with blur */}
            <AnimatedButton
              onPress={handleGuest}
              style={styles.guestButton}
              textStyle={styles.guestButtonText}
              delay={1400}
            >
              Continue as Guest
            </AnimatedButton>
          </View>

          <Animated.View
            style={{
              opacity: subtitleFadeAnim,
            }}
          >
            <BlurView intensity={10} tint="dark" style={styles.disclaimerBlur}>
              <Text style={styles.disclaimer}>Guest mode has limited features</Text>
            </BlurView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGlowOuter: {
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',  // Minimalist indigo glow
  },
  logoGlowInner: {
    padding: 10,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',  // Rich indigo inner glow
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',  // Premium indigo shadow
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,      // Softer for minimalist look
    shadowRadius: 24,        // Wider, more premium glow
    elevation: 10,
  },
  titleContainer: {
    marginTop: 16,
    position: 'relative',
    alignSelf: 'center',
  },
  titleGlassBackground: {
    position: 'absolute',
    top: -8,
    left: -16,
    right: -16,
    bottom: -8,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',  // Subtle glass effect
  },
  titleGradient: {
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,        // More spacing for premium look
    textShadowColor: 'rgba(99, 102, 241, 0.3)',  // Subtle indigo shimmer
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,    // Softer, more diffused glow
  },
  subtitleBlur: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 16,
  },
  buttonBase: {
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emailButton: {
    // Gradient applied via LinearGradient
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  signupButton: {
    // Gradient applied via LinearGradient
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E0E0E0',
  },
  disclaimerBlur: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  particle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',  // Minimalist indigo particles
  },
});
