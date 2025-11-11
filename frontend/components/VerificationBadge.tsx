import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface VerificationBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

const VERIFICATION_CONFIG = {
  1: { color: '#F44336', label: 'L1', bg: '#FFEBEE' },
  2: { color: '#FF9800', label: 'L2', bg: '#FFF3E0' },
  3: { color: '#FFC107', label: 'L3', bg: '#FFF8E1' },
  4: { color: '#8BC34A', label: 'L4', bg: '#F1F8E9' },
  5: { color: '#4CAF50', label: 'L5', bg: '#E8F5E9' },
};

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ level, size = 'medium' }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const config = VERIFICATION_CONFIG[level as keyof typeof VERIFICATION_CONFIG] || VERIFICATION_CONFIG[1];

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.6, 1],
  });

  const sizeStyles = {
    small: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    medium: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 },
    large: { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 },
  };

  return (
    <Animated.View style={[styles.badge, { backgroundColor: config.bg, opacity }]}>
      <Text style={[styles.label, { color: config.color, fontSize: sizeStyles[size].fontSize }]}>
        {config.label}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  label: {
    fontWeight: '700',
  },
});
