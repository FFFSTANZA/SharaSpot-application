// Pulse Indicator Component - Live Status Indicator
// Core Principles: Electric Energy, Delight at Every Touchpoint

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
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
  // Animation values using React Native's built-in Animated
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;

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
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse opacity animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseScale.setValue(1);
      pulseOpacity.setValue(0);
    }
  }, [active, speed, pulseScale, pulseOpacity]);

  // Animated pulse ring style
  const animatedPulseStyle = {
    transform: [{ scale: pulseScale }],
    opacity: pulseOpacity,
  };

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
