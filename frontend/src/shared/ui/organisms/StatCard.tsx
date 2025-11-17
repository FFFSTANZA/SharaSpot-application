// StatCard Component - Premium Statistics Display
// Core Principles: Data Visualization Excellence, Premium Minimalism

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from '../../../shared/constants/theme';
import { createHeadingA11y } from '../../utils/accessibility';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'primary';
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium statistics card for displaying key metrics
 * Perfect for: Dashboard stats, KPIs, analytics
 * Inspired by: Stripe's dashboard, Linear's metrics
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor,
  trend,
  trendValue,
  variant = 'default',
  style,
}) => {
  // Get trend color
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return Colors.success;
      case 'down':
        return Colors.error;
      case 'neutral':
      default:
        return Colors.textSecondary;
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  // Accessibility props
  const a11yProps = createHeadingA11y(
    3,
    `${title}: ${value}${subtitle ? `, ${subtitle}` : ''}${
      trendValue ? `, trend: ${trendValue}` : ''
    }`
  );

  // Render gradient variant
  if (variant === 'gradient') {
    return (
      <View style={[styles.wrapper, style]} {...a11yProps}>
        <LinearGradient
          colors={Colors.gradientPrimary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.container, Shadows.md]}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  // Render primary variant
  if (variant === 'primary') {
    return (
      <View
        style={[
          styles.wrapper,
          styles.container,
          styles.primaryVariant,
          Shadows.md,
          style,
        ]}
        {...a11yProps}
      >
        {renderContent()}
      </View>
    );
  }

  // Render glass variant
  if (variant === 'glass') {
    return (
      <View
        style={[
          styles.wrapper,
          styles.container,
          styles.glassVariant,
          Shadows.sm,
          style,
        ]}
        {...a11yProps}
      >
        {renderContent()}
      </View>
    );
  }

  // Render default variant
  return (
    <View
      style={[
        styles.wrapper,
        styles.container,
        styles.defaultVariant,
        Shadows.sm,
        style,
      ]}
      {...a11yProps}
    >
      {renderContent()}
    </View>
  );

  function renderContent() {
    const isGradientOrPrimary = variant === 'gradient' || variant === 'primary';
    const textColor = isGradientOrPrimary ? Colors.surface : Colors.textPrimary;
    const subtitleColor = isGradientOrPrimary
      ? 'rgba(255, 255, 255, 0.8)'
      : Colors.textSecondary;

    return (
      <>
        {/* Header with title and icon */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: subtitleColor },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {icon && (
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: isGradientOrPrimary
                    ? 'rgba(255, 255, 255, 0.2)'
                    : Colors.primarySubtle,
                },
              ]}
            >
              <Ionicons
                name={icon}
                size={20}
                color={iconColor || (isGradientOrPrimary ? Colors.surface : Colors.primary)}
              />
            </View>
          )}
        </View>

        {/* Value */}
        <Text
          style={[
            styles.value,
            { color: textColor },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        {/* Footer with subtitle and trend */}
        {(subtitle || trend) && (
          <View style={styles.footer}>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: subtitleColor },
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
            {trend && trendValue && (
              <View style={styles.trendContainer}>
                <Ionicons
                  name={getTrendIcon() as any}
                  size={14}
                  color={getTrendColor()}
                />
                <Text
                  style={[
                    styles.trendValue,
                    { color: getTrendColor() },
                  ]}
                >
                  {trendValue}
                </Text>
              </View>
            )}
          </View>
        )}
      </>
    );
  }
};

const styles = StyleSheet.create({
  wrapper: {
    minHeight: 120,
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    justifyContent: 'space-between',
  },
  defaultVariant: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primaryVariant: {
    backgroundColor: Colors.primary,
  },
  glassVariant: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.labelMedium,
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  value: {
    ...Typography.displaySmall,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subtitle: {
    ...Typography.bodySmall,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  trendValue: {
    ...Typography.labelMedium,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});

export default StatCard;
