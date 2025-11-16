import React, { useRef, ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle, PressableProps } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

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
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    // Press: Scale down to 0.98x
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    // Release: Spring back with bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const animatedStyle = {
    transform: [
      { scale: scaleAnim },
      { translateX: swipeAnim },
    ],
  };

  if (!onPress && !pressableProps.onLongPress) {
    // Non-pressable card
    return (
      <Animated.View style={[styles.card, style]}>
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
