// Pulse Indicator Component - Live Status Indicator
// Core Principles: Electric Energy, Delight at Every Touchpoint

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated, Easing } from 'react-native';
import { Colors, AnimationDuration } from '../../../shared/constants/theme';

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
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

  // Get duration based on speed
  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return AnimationDuration.slowest || 1200;
      case 'fast':
        return AnimationDuration.slow || 400;
      case 'normal':
      default:
        return AnimationDuration.slower || 800;
    }
  };

  useEffect(() => {
    if (active) {
      const duration = getDuration();

      // Pulse animation
      const pulseAnimation = Animated.parallel([
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 1.5,
              duration: duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: duration,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [active, speed]);

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
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
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
