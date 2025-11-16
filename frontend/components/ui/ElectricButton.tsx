// Premium Electric Button Component
// Core Principles: Electric Energy, Delight at Every Touchpoint, Accessibility First

import React, { useCallback, useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  Layout,
  Shadows,
  AnimationDuration,
} from '../../constants/theme';
import { createButtonA11y } from '../../utils/accessibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ElectricButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  hapticFeedback?: boolean;
  glowEffect?: boolean;
}

/**
 * Premium button component with electric animations and haptic feedback
 * Inspired by: Tesla's responsive UI, Linear's smooth interactions
 */
export const ElectricButton: React.FC<ElectricButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
  hapticFeedback = true,
  glowEffect = false,
}) => {
  // Animation values
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  // Handle press in
  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.96,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.8,
        duration: AnimationDuration.fast || 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (glowEffect) {
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: AnimationDuration.fast || 150,
        useNativeDriver: true,
      }).start();
    }

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled, loading, hapticFeedback, glowEffect]);

  // Handle press out
  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: AnimationDuration.fast || 150,
        useNativeDriver: true,
      }),
    ]).start();

    if (glowEffect) {
      Animated.timing(glowOpacity, {
        toValue: 0,
        duration: AnimationDuration.normal || 300,
        useNativeDriver: true,
      }).start();
    }
  }, [glowEffect]);

  // Handle press
  const handlePress = useCallback(() => {
    if (disabled || loading) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  }, [disabled, loading, onPress, hapticFeedback]);

  // Get size-specific styles
  const sizeStyles = getSizeStyles(size);

  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant, disabled);

  // Accessibility props
  const a11yProps = createButtonA11y(
    accessibilityLabel || title,
    accessibilityHint,
    { disabled, busy: loading }
  );

  // Render button content
  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.surface}
          size="small"
        />
      );
    }

    return (
      <View style={styles.contentContainer}>
        {icon && iconPosition === 'left' && (
          <View style={[styles.iconContainer, { marginRight: Spacing.sm }]}>{icon}</View>
        )}
        <Text
          style={[
            styles.text,
            sizeStyles.text,
            variantStyles.text,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {icon && iconPosition === 'right' && (
          <View style={[styles.iconContainer, { marginLeft: Spacing.sm }]}>{icon}</View>
        )}
      </View>
    );
  };

  // Render gradient variant
  if (variant === 'gradient' && !disabled) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          { transform: [{ scale }], opacity },
          fullWidth && styles.fullWidth,
          style,
        ]}
        {...a11yProps}
      >
        {glowEffect && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.glow,
              sizeStyles.container,
              { opacity: glowOpacity },
            ]}
          />
        )}
        <LinearGradient
          colors={Colors.gradientPrimary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.container,
            sizeStyles.container,
            Shadows.md,
            disabled && styles.disabled,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  // Render standard variants
  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        { transform: [{ scale }], opacity },
        styles.container,
        sizeStyles.container,
        variantStyles.container,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
      {...a11yProps}
    >
      {glowEffect && !disabled && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.glow,
            sizeStyles.container,
            { opacity: glowOpacity },
          ]}
        />
      )}
      {renderContent()}
    </AnimatedPressable>
  );
};

// Get size-specific styles
const getSizeStyles = (size: ElectricButtonProps['size']) => {
  switch (size) {
    case 'small':
      return {
        container: {
          height: Layout.buttonHeight.small,
          paddingHorizontal: Spacing.md,
          borderRadius: BorderRadius.md,
        },
        text: {
          ...Typography.labelMedium,
        },
      };
    case 'large':
      return {
        container: {
          height: Layout.buttonHeight.large,
          paddingHorizontal: Spacing.xl,
          borderRadius: BorderRadius.lg,
        },
        text: {
          ...Typography.titleMedium,
        },
      };
    case 'xlarge':
      return {
        container: {
          height: Layout.buttonHeight.xlarge,
          paddingHorizontal: Spacing.xxl,
          borderRadius: BorderRadius.xl,
        },
        text: {
          ...Typography.titleLarge,
        },
      };
    case 'medium':
    default:
      return {
        container: {
          height: Layout.buttonHeight.medium,
          paddingHorizontal: Spacing.lg,
          borderRadius: BorderRadius.md,
        },
        text: {
          ...Typography.labelLarge,
        },
      };
  }
};

// Get variant-specific styles
const getVariantStyles = (
  variant: ElectricButtonProps['variant'],
  disabled: boolean
) => {
  switch (variant) {
    case 'secondary':
      return {
        container: {
          backgroundColor: Colors.secondary,
          ...Shadows.md,
        },
        text: {
          color: Colors.surface,
        },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: disabled ? Colors.border : Colors.primary,
        },
        text: {
          color: disabled ? Colors.textDisabled : Colors.primary,
        },
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
        },
        text: {
          color: disabled ? Colors.textDisabled : Colors.primary,
        },
      };
    case 'primary':
    default:
      return {
        container: {
          backgroundColor: Colors.primary,
          ...Shadows.md,
        },
        text: {
          color: Colors.surface,
        },
      };
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.textDisabled,
  },
  fullWidth: {
    width: '100%',
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    opacity: 0.3,
    ...Shadows.primaryGlow,
  },
});

export default ElectricButton;
