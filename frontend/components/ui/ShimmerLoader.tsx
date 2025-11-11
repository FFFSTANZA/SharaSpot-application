// Shimmer Loader Component - Premium Loading Skeleton
// Core Principles: Premium Minimalism, Electric Energy

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, AnimationDuration } from '../../constants/theme';

export interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: keyof typeof BorderRadius;
  style?: StyleProp<ViewStyle>;
  variant?: 'light' | 'dark';
  speed?: 'slow' | 'normal' | 'fast';
}

/**
 * Premium shimmer loading skeleton
 * Inspired by: Linear's loading states, Stripe's skeleton screens
 */
export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 'md',
  style,
  variant = 'light',
  speed = 'normal',
}) => {
  // Animation value
  const translateX = useSharedValue(-1);

  // Get duration based on speed
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return AnimationDuration.slowest * 1.5;
      case 'fast':
        return AnimationDuration.slower;
      case 'normal':
      default:
        return AnimationDuration.slowest;
    }
  };

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(1, {
        duration: getDuration(),
        easing: Easing.ease,
      }),
      -1,
      false
    );
  }, [speed]);

  // Animated shimmer style
  const animatedStyle = useAnimatedStyle(() => {
    const outputRange = typeof width === 'number' ? [-width, width] : [-300, 300];
    return {
      transform: [
        {
          translateX: interpolate(translateX.value, [-1, 1], outputRange),
        },
      ],
    };
  });

  const radiusValue = BorderRadius[borderRadius];
  const baseColor = variant === 'dark' ? Colors.surfaceDark : Colors.backgroundSecondary;
  const shimmerColors =
    variant === 'dark'
      ? ['rgba(30, 41, 59, 0)', 'rgba(148, 163, 184, 0.1)', 'rgba(30, 41, 59, 0)']
      : ['rgba(241, 245, 249, 0)', 'rgba(255, 255, 255, 0.8)', 'rgba(241, 245, 249, 0)'];

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: radiusValue,
          backgroundColor: baseColor,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default ShimmerLoader;
