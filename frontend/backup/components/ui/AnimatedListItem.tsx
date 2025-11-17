import React, { useEffect, useRef, ReactNode } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  style?: ViewStyle;
  maxStaggeredItems?: number;
}

export default function AnimatedListItem({
  children,
  index,
  style,
  maxStaggeredItems = 5,
}: AnimatedListItemProps) {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Only animate first N items, rest appear instantly
    if (index < maxStaggeredItems) {
      // Stagger delay: 50ms per item
      const delay = index * 50;

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Instant appearance for items beyond the stagger limit
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [index]);

  if (index >= maxStaggeredItems) {
    // No animation wrapper for items beyond limit
    return <>{children}</>;
  }

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
