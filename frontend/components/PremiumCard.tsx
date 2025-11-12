import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, BorderRadius } from '../constants/theme';

interface PremiumCardProps {
  children: React.ReactNode;
  gradient?: boolean;
  glass?: boolean;
  style?: ViewStyle;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  gradient = false, 
  glass = false,
  style 
}) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={Colors.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.gradientCard, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  if (glass) {
    return (
      <View style={[styles.card, styles.glassCard, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 20,
    ...Shadows.md,
  },
  gradientCard: {
    backgroundColor: 'transparent',
    ...Shadows.primaryGlow,
  },
  glassCard: {
    backgroundColor: Colors.glassLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
