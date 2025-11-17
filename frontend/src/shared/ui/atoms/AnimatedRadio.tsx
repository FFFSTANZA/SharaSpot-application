import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../../shared/constants/theme';

interface AnimatedRadioProps {
  selected: boolean;
  onSelect: () => void;
  size?: number;
  disabled?: boolean;
}

export default function AnimatedRadio({
  selected,
  onSelect,
  size = 24,
  disabled = false,
}: AnimatedRadioProps) {
  // Animation values
  const dotScale = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const outerRingColor = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (selected) {
      // Animate dot in
      Animated.parallel([
        Animated.spring(dotScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(outerRingColor, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(dotScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(outerRingColor, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selected]);

  const borderColor = outerRingColor.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  return (
    <TouchableOpacity
      onPress={onSelect}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.innerDot,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: size * 0.3,
              backgroundColor: Colors.primary,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerRing: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    // Styles applied inline
  },
});
