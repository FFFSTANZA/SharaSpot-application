// Success Animation Component - Delightful Success Feedback
// Core Principles: Delight at Every Touchpoint, Electric Energy

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, SpringConfig, AnimationDuration } from '../../constants/theme';

export interface SuccessAnimationProps {
  size?: number;
  color?: string;
  onAnimationComplete?: () => void;
  style?: StyleProp<ViewStyle>;
  autoPlay?: boolean;
  hapticFeedback?: boolean;
}

/**
 * Delightful success animation with checkmark
 * Perfect for: Form submissions, payment confirmations, task completions
 */
export const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
  size = 60,
  color = Colors.success,
  onAnimationComplete,
  style,
  autoPlay = true,
  hapticFeedback = true,
}) => {
  // Animation values using React Native's built-in Animated
  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(-90)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0.8)).current;

  const playAnimation = () => {
    // Trigger haptic feedback
    if (hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Circle scale in
    Animated.spring(circleScale, {
      toValue: 1,
      friction: SpringConfig.bouncy.damping,
      tension: SpringConfig.bouncy.stiffness,
      useNativeDriver: true,
    }).start();

    // Checkmark appears with delay
    Animated.sequence([
      Animated.delay(150),
      Animated.sequence([
        Animated.spring(checkScale, {
          toValue: 1.2,
          friction: SpringConfig.snappy.damping,
          tension: SpringConfig.snappy.stiffness,
          useNativeDriver: true,
        }),
        Animated.spring(checkScale, {
          toValue: 1,
          friction: SpringConfig.smooth.damping,
          tension: SpringConfig.smooth.stiffness,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(150),
      Animated.timing(checkRotate, {
        toValue: 0,
        duration: AnimationDuration.moderate,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple effect
    Animated.sequence([
      Animated.delay(100),
      Animated.timing(rippleScale, {
        toValue: 1.5,
        duration: AnimationDuration.slower,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(100),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: AnimationDuration.slower,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  };

  useEffect(() => {
    if (autoPlay) {
      playAnimation();
    }
  }, [autoPlay]);

  // Animated styles
  const animatedCircleStyle = {
    transform: [{ scale: circleScale }],
  };

  const animatedCheckStyle = {
    transform: [
      { scale: checkScale },
      {
        rotate: checkRotate.interpolate({
          inputRange: [-90, 0],
          outputRange: ['-90deg', '0deg'],
        }),
      },
    ],
  };

  const animatedRippleStyle = {
    transform: [{ scale: rippleScale }],
    opacity: rippleOpacity,
  };

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Ripple effect */}
      <Animated.View
        style={[
          styles.ripple,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedRippleStyle,
        ]}
      />

      {/* Circle background */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          animatedCircleStyle,
        ]}
      >
        {/* Checkmark icon */}
        <Animated.View style={animatedCheckStyle}>
          <Ionicons
            name="checkmark"
            size={size * 0.6}
            color={Colors.surface}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  ripple: {
    position: 'absolute',
  },
});

export default SuccessAnimation;
