// ProgressRing Component - Circular Progress Indicator
// Core Principles: Data Visualization Excellence, Electric Energy

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Colors,
  Typography,
  AnimationDuration,
} from '../../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  duration?: number;
  useGradient?: boolean;
  gradientColors?: string[];
  label?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium circular progress indicator
 * Perfect for: Battery levels, charging progress, completion status
 * Inspired by: Apple's activity rings, Tesla's charging indicator
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  size = 100,
  strokeWidth = 8,
  progress = 0,
  color = Colors.primary,
  backgroundColor = Colors.border,
  showPercentage = true,
  duration = AnimationDuration.slower,
  useGradient = false,
  gradientColors = Colors.gradientPrimary as string[],
  label,
  style,
}) => {
  // Calculate dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;

  // Animation value
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * animatedProgress.value) / 100;

    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {/* Gradient definition */}
        {useGradient && (
          <Defs>
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientColors.map((color, index) => (
                <Stop
                  key={index}
                  offset={`${(index / (gradientColors.length - 1)) * 100}%`}
                  stopColor={color}
                  stopOpacity="1"
                />
              ))}
            </SvgLinearGradient>
          </Defs>
        )}

        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? 'url(#progressGradient)' : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        {showPercentage && (
          <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        )}
        {label && (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    ...Typography.titleLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

export default ProgressRing;
