import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/theme';

interface VerificationBadgeProps {
  level: number;
  size?: 'small' | 'medium' | 'large';
}

const VERIFICATION_CONFIG = {
  1: { color: '#9E9E9E', label: 'L1', bg: '#F5F5F5', name: 'New Entry' },
  2: { color: Colors.primary, label: 'L2', bg: 'rgba(13, 148, 136, 0.1)', name: 'Community Verified' },
  3: { color: '#2196F3', label: 'L3', bg: '#E3F2FD', name: 'Reliable' },
  4: { color: '#FFB300', label: 'L4', bg: '#FFF8E1', name: 'Trusted' },
  5: { color: '#9C27B0', label: 'L5', bg: '#F3E5F5', name: 'Certified Partner' },
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
