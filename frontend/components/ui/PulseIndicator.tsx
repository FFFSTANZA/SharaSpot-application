// Pulse Indicator Component - Live Status Indicator
// Core Principles: Electric Energy, Delight at Every Touchpoint

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, AnimationDuration } from '../../constants/theme';

export interface PulseIndicatorProps {
  size?: number;
  color?: string;
  pulseColor?: string;
  speed?: 'slow' | 'normal' | 'fast';
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}

/**
 * Animated pulse indicator for live/active status
 * Perfect for: Live charging status, active sessions, real-time updates
 */
export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  size = 12,
  color = Colors.success,
  pulseColor = Colors.success,
  speed = 'normal',
  style,
  active = true,
}) => {
  // Animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.7);

  // Get duration based on speed
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return AnimationDuration.slowest;
      case 'fast':
        return AnimationDuration.slow;
      case 'normal':
      default:
        return AnimationDuration.slower;
    }
  };

  useEffect(() => {
    if (active) {
      const duration = getDuration();

      // Pulse scale animation
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, {
            duration: duration,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      );

      // Pulse opacity animation
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, {
            duration: duration,
            easing: Easing.out(Easing.ease),
          }),
          withTiming(0.7, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = 1;
      pulseOpacity.value = 0;
    }
  }, [active, speed]);

  // Animated pulse ring style
  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size * 3, height: size * 3 }, style]}>
      {/* Outer pulse ring */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * 3,
            height: size * 3,
            borderRadius: size * 1.5,
            backgroundColor: pulseColor,
          },
          animatedPulseStyle,
        ]}
      />

      {/* Inner dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
  },
});

export default PulseIndicator;
