import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface CustomRefreshControlProps {
  refreshing: boolean;
  progress?: Animated.Value; // 0 to 1
}

export default function CustomRefreshControl({
  refreshing,
  progress,
}: CustomRefreshControlProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (refreshing) {
      // Start rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();

      // Bouncy scale effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Stop animations
      rotateAnim.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [refreshing]);

  // Pull progress effect (stretchy bounce)
  useEffect(() => {
    if (progress && !refreshing) {
      Animated.spring(bounceAnim, {
        toValue: progress,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [progress, refreshing]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pullOpacity = progress
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      })
    : 1;

  const pullScale = progress
    ? progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.2, 1],
      })
    : 1;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            opacity: refreshing ? 1 : pullOpacity,
            transform: [
              { rotate: refreshing ? rotation : '0deg' },
              { scale: refreshing ? scaleAnim : pullScale },
            ],
          },
        ]}
      >
        <Ionicons
          name="refresh"
          size={24}
          color={Colors.primary}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
