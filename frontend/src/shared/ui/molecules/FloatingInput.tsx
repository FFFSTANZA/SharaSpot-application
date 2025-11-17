// Premium Floating Label Input Component
// Core Principles: Premium Minimalism, Delight at Every Touchpoint, Accessibility First

import React, { useState, useEffect, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Platform,
  Animated,
} from 'react-native';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  Layout,
  AnimationDuration,
} from '../../../shared/constants/theme';
import { createInputA11y } from '../../utils/accessibility';

export interface FloatingInputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'glass';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * Premium input with floating label animation
 * Inspired by: Material Design 3, Stripe's form inputs
 */
export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  required = false,
  value,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Update label position when value changes
  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: value || isFocused ? 1 : 0,
      duration: AnimationDuration.normal || 300,
      useNativeDriver: true,
    }).start();
  }, [value, isFocused]);

  // Handle focus
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // Handle blur
  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Interpolated values
  const labelTranslateY = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const labelScale = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  const labelColor = isFocused
    ? error
      ? Colors.error
      : Colors.primary
    : error
    ? Colors.error
    : Colors.textSecondary;

  const borderColor = error ? Colors.error : isFocused ? Colors.primary : Colors.border;
  const borderWidth = isFocused ? 2 : 1;

  // Get size-specific styles
  const sizeStyles = getSizeStyles(size);

  // Get variant-specific styles
  const variantStyles = getVariantStyles(variant);

  // Accessibility props
  const a11yProps = createInputA11y(
    accessibilityLabel || label,
    accessibilityHint || helperText,
    disabled
  );

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.container,
          sizeStyles.container,
          variantStyles.container,
          { borderColor, borderWidth },
          disabled && styles.disabled,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        {/* Input Field */}
        <View style={styles.inputWrapper}>
          {/* Floating Label */}
          <Animated.Text
            style={[
              styles.label,
              sizeStyles.label,
              {
                transform: [{ translateY: labelTranslateY }, { scale: labelScale }],
                color: labelColor,
              },
            ]}
            numberOfLines={1}
          >
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Animated.Text>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            style={[
              styles.input,
              sizeStyles.input,
              variantStyles.input,
              leftIcon && { paddingLeft: Spacing.xs },
              rightIcon && { paddingRight: Spacing.xs },
              inputStyle,
            ]}
            placeholderTextColor={Colors.textTertiary}
            {...textInputProps}
            {...a11yProps}
          />
        </View>

        {/* Right Icon */}
        {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
      </View>

      {/* Helper Text or Error */}
      {(helperText || error) && (
        <Text
          style={[
            styles.helperText,
            error && styles.errorText,
          ]}
          accessible={!!error}
          accessibilityRole={error ? 'alert' : 'text'}
          accessibilityLiveRegion={error ? 'assertive' : 'none'}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// Get size-specific styles
const getSizeStyles = (size: FloatingInputProps['size']) => {
  switch (size) {
    case 'small':
      return {
        container: {
          height: Layout.inputHeight.small,
        },
        input: {
          ...Typography.bodySmall,
        },
        label: {
          ...Typography.bodySmall,
        },
      };
    case 'large':
      return {
        container: {
          height: Layout.inputHeight.large,
        },
        input: {
          ...Typography.bodyLarge,
        },
        label: {
          ...Typography.bodyLarge,
        },
      };
    case 'medium':
    default:
      return {
        container: {
          height: Layout.inputHeight.medium,
        },
        input: {
          ...Typography.bodyMedium,
        },
        label: {
          ...Typography.bodyMedium,
        },
      };
  }
};

// Get variant-specific styles
const getVariantStyles = (variant: FloatingInputProps['variant']) => {
  switch (variant) {
    case 'filled':
      return {
        container: {
          backgroundColor: Colors.backgroundSecondary,
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: BorderRadius.sm,
        },
        input: {
          backgroundColor: 'transparent',
        },
      };
    case 'glass':
      return {
        container: {
          backgroundColor: Colors.glass,
          borderColor: Colors.glassBorder,
          ...Platform.select({
            web: {
              backdropFilter: 'blur(10px)',
            },
          }),
        },
        input: {
          backgroundColor: 'transparent',
        },
      };
    case 'outlined':
    default:
      return {
        container: {
          backgroundColor: Colors.surface,
        },
        input: {
          backgroundColor: 'transparent',
        },
      };
  }
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: 0,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.xs,
    transformOrigin: 'left center',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    paddingTop: Spacing.sm,
    paddingBottom: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  leftIconContainer: {
    marginRight: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIconContainer: {
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.md,
  },
  errorText: {
    color: Colors.error,
  },
  required: {
    color: Colors.error,
  },
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.backgroundSecondary,
  },
});

export default FloatingInput;
