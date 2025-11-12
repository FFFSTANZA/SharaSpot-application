import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 0.5, 1],
      [0.3, 0.6, 0.3]
    );
    return { opacity };
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]} />
    </View>
  );
};

export const ChargerCardSkeleton: React.FC = () => {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <SkeletonLoader width={48} height={48} borderRadius={24} />
        <View style={styles.skeletonInfo}>
          <SkeletonLoader width="80%" height={18} />
          <View style={{ height: 4 }} />
          <SkeletonLoader width="60%" height={14} />
        </View>
        <SkeletonLoader width={60} height={30} borderRadius={15} />
      </View>

      <View style={styles.skeletonDetails}>
        <SkeletonLoader width="40%" height={14} />
        <SkeletonLoader width="40%" height={14} />
      </View>

      <View style={styles.skeletonPortTypes}>
        <SkeletonLoader width={60} height={24} borderRadius={6} />
        <SkeletonLoader width={60} height={24} borderRadius={6} />
        <SkeletonLoader width={60} height={24} borderRadius={6} />
      </View>

      <View style={styles.skeletonFooter}>
        <SkeletonLoader width="50%" height={12} />
        <SkeletonLoader width={70} height={24} borderRadius={6} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    backgroundColor: Colors.borderLight,
  },
  skeletonCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['3'],
  },
  skeletonInfo: {
    flex: 1,
    marginLeft: Spacing['3'],
  },
  skeletonDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing['3'],
  },
  skeletonPortTypes: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing['3'],
  },
  skeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing['3'],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
