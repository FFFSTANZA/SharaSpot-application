import React, { useRef, ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import { Colors, Shadows, BorderRadius } from '../../constants/theme';

interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  enableSwipe?: boolean;
}

export default function AnimatedCard({
  children,
  style,
  onPress,
  disabled = false,
  enableSwipe = false,
  ...pressableProps
}: AnimatedCardProps) {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(0)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    // Press: Scale down to 0.98x and increase shadow
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Release: Spring back with bounce
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Interpolate shadow
  const shadowOpacity = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.15],
  });

  const shadowRadius = shadowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 16],
  });

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateX: swipeAnim },
    ],
  };

  const animatedShadowStyle = {
    shadowOpacity,
    shadowRadius,
  };

  if (!onPress && !pressableProps.onLongPress) {
    // Non-pressable card
    return (
      <Animated.View style={[styles.card, style, animatedShadowStyle]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      {...pressableProps}
    >
      <Animated.View
        style={[
          styles.card,
          style,
          animatedStyle,
          animatedShadowStyle,
          { opacity: disabled ? 0.5 : 1 },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
