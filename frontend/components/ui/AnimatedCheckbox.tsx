import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  disabled?: boolean;
}

export default function AnimatedCheckbox({
  checked,
  onToggle,
  size = 24,
  disabled = false,
}: AnimatedCheckboxProps) {
  // Animation values
  const checkmarkProgress = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const backgroundColorAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (checked) {
      // Animate checkmark drawing in
      Animated.parallel([
        Animated.timing(checkmarkProgress, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundColorAnim, {
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
        Animated.timing(checkmarkProgress, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundColorAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [checked]);

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.primary],
  });

  const borderColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.primary],
  });

  const checkmarkScale = checkmarkProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
    >
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: size,
            height: size,
            borderRadius: size * 0.25,
            backgroundColor,
            borderColor,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: checkmarkProgress,
            transform: [{ scale: checkmarkScale }],
          }}
        >
          <Ionicons name="checkmark" size={size * 0.75} color={Colors.textInverse} />
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
