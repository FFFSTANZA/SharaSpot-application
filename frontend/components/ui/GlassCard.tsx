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
              'rgba(45, 63, 232, 0.1)',
              'rgba(139, 92, 246, 0.1)',
              'rgba(6, 182, 212, 0.05)',
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
            colors={['rgba(45, 63, 232, 0.15)', 'rgba(139, 92, 246, 0.15)']}
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
              intensity={80}
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
              intensity={80}
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
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  lightVariantFallback: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  darkVariant: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkVariantFallback: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  primaryVariant: {
    borderWidth: 1,
    borderColor: 'rgba(79, 95, 249, 0.3)',
  },
  gradientVariant: {
    borderWidth: 1,
    borderColor: 'rgba(79, 95, 249, 0.2)',
  },
});

export default GlassCard;
