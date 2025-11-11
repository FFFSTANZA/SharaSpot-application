// Success Animation Component - Delightful Success Feedback
// Core Principles: Delight at Every Touchpoint, Electric Energy

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
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
  // Animation values
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const checkRotate = useSharedValue(-90);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0.8);

  const playAnimation = () => {
    // Trigger haptic feedback
    if (hapticFeedback) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Circle scale in
    circleScale.value = withSpring(1, SpringConfig.bouncy);

    // Checkmark appears with delay
    checkScale.value = withDelay(
      150,
      withSequence(
        withSpring(1.2, SpringConfig.snappy),
        withSpring(1, SpringConfig.smooth)
      )
    );

    checkRotate.value = withDelay(
      150,
      withTiming(0, {
        duration: AnimationDuration.moderate,
        easing: Easing.out(Easing.back(1.5)),
      })
    );

    // Ripple effect
    rippleScale.value = withDelay(
      100,
      withTiming(1.5, {
        duration: AnimationDuration.slower,
        easing: Easing.out(Easing.ease),
      })
    );

    rippleOpacity.value = withDelay(
      100,
      withTiming(0, {
        duration: AnimationDuration.slower,
        easing: Easing.out(Easing.ease),
      }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
  };

  useEffect(() => {
    if (autoPlay) {
      playAnimation();
    }
  }, [autoPlay]);

  // Animated styles
  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: checkScale.value },
      { rotate: `${checkRotate.value}deg` },
    ],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

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
