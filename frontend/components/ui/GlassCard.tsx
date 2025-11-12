// Premium Glassmorphic Card Component
// Core Principles: Premium Minimalism, Electric Energy, Trust & Transparency

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Colors, BorderRadius, Spacing, Shadows } from '../../constants/theme';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'light' | 'dark' | 'primary' | 'gradient';
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: keyof typeof Spacing;
  style?: StyleProp<ViewStyle>;
  borderRadius?: keyof typeof BorderRadius;
  onPress?: () => void;
}

/**
 * Premium glassmorphic card component with blur effects
 * Inspired by: Apple's design language, Stripe's card patterns
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'light',
  elevation = 'md',
  padding = 'lg',
  style,
  borderRadius = 'lg',
  onPress,
}) => {
  const paddingValue = Spacing[padding];
  const radiusValue = BorderRadius[borderRadius];
  const shadowStyle = elevation !== 'none' ? Shadows[elevation] : {};

  // Render different variants
  const renderContent = () => {
    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[
              'rgba(191, 255, 0, 0.08)',    // Electric kiwi
              'rgba(154, 255, 0, 0.08)',    // Chartreuse
              'rgba(223, 255, 0, 0.04)',    // Neon lime
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.container,
              {
                borderRadius: radiusValue,
                padding: paddingValue,
              },
              shadowStyle,
              styles.gradientVariant,
              style,
            ]}
          >
            {children}
          </LinearGradient>
        );

      case 'primary':
        return (
          <LinearGradient
            colors={[
              'rgba(191, 255, 0, 0.12)',    // Electric kiwi
              'rgba(154, 255, 0, 0.12)'     // Chartreuse
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.container,
              {
                borderRadius: radiusValue,
                padding: paddingValue,
              },
              shadowStyle,
              styles.primaryVariant,
              style,
            ]}
          >
            {children}
          </LinearGradient>
        );

      case 'dark':
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          return (
            <BlurView
              intensity={90}          // Increased for HD quality
              tint="dark"
              style={[
                styles.container,
                {
                  borderRadius: radiusValue,
                  padding: paddingValue,
                },
                shadowStyle,
                styles.darkVariant,
                style,
              ]}
            >
              {children}
            </BlurView>
          );
        }
        // Fallback for web
        return (
          <View
            style={[
              styles.container,
              {
                borderRadius: radiusValue,
                padding: paddingValue,
              },
              shadowStyle,
              styles.darkVariantFallback,
              style,
            ]}
          >
            {children}
          </View>
        );

      case 'light':
      default:
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          return (
            <BlurView
              intensity={90}          // Increased for HD quality
              tint="light"
              style={[
                styles.container,
                {
                  borderRadius: radiusValue,
                  padding: paddingValue,
                },
                shadowStyle,
                styles.lightVariant,
                style,
              ]}
            >
              {children}
            </BlurView>
          );
        }
        // Fallback for web
        return (
          <View
            style={[
              styles.container,
              {
                borderRadius: radiusValue,
                padding: paddingValue,
              },
              shadowStyle,
              styles.lightVariantFallback,
              style,
            ]}
          >
            {children}
          </View>
        );
    }
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  lightVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,              // HD border thickness
    borderColor: Colors.glassBorder,
  },
  lightVariantFallback: {
    backgroundColor: Colors.glass,
    borderWidth: 1.5,              // HD border thickness
    borderColor: Colors.glassBorder,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(1.2)', // Enhanced HD blur
      },
    }),
  },
  darkVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,              // HD border thickness
    borderColor: 'rgba(255, 255, 255, 0.08)', // More subtle
  },
  darkVariantFallback: {
    backgroundColor: 'rgba(30, 41, 59, 0.65)', // Updated opacity
    borderWidth: 1.5,              // HD border thickness
    borderColor: 'rgba(255, 255, 255, 0.08)', // More subtle
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(1.2)', // Enhanced HD blur
      },
    }),
  },
  primaryVariant: {
    borderWidth: 1.5,              // HD border thickness
    borderColor: 'rgba(191, 255, 0, 0.25)', // Electric kiwi border
  },
  gradientVariant: {
    borderWidth: 1.5,              // HD border thickness
    borderColor: 'rgba(191, 255, 0, 0.15)', // Subtle kiwi border
  },
});

export default GlassCard;
