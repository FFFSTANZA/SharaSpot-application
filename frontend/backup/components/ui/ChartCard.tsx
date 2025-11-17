// ChartCard Component - Premium Chart Container
// Core Principles: Data Visualization Excellence, Premium Minimalism

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from '../../constants/theme';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'glass' | 'primary';
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Premium card container for charts and data visualizations
 * Perfect for: Analytics dashboards, usage graphs, statistics
 * Inspired by: Stripe's analytics, Airbnb's insights
 */
export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  headerAction,
  footer,
  variant = 'default',
  loading = false,
  error,
  onRefresh,
  style,
}) => {
  // Get variant styles
  const getVariantStyle = () => {
    switch (variant) {
      case 'glass':
        return styles.glassVariant;
      case 'primary':
        return styles.primaryVariant;
      case 'default':
      default:
        return styles.defaultVariant;
    }
  };

  const isPrimaryOrGlass = variant === 'primary' || variant === 'glass';
  const titleColor = variant === 'primary' ? Colors.surface : Colors.textPrimary;
  const subtitleColor = variant === 'primary'
    ? 'rgba(255, 255, 255, 0.8)'
    : Colors.textSecondary;

  return (
    <View
      style={[
        styles.container,
        getVariantStyle(),
        Shadows.md,
        style,
      ]}
      accessible={true}
      accessibilityLabel={`${title} chart`}
      accessibilityRole="none"
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Header action or refresh button */}
        {headerAction || (onRefresh && (
          <Pressable
            onPress={onRefresh}
            style={styles.refreshButton}
            accessibilityRole="button"
            accessibilityLabel="Refresh chart data"
            accessibilityHint="Double tap to refresh"
          >
            <Ionicons
              name="refresh"
              size={20}
              color={variant === 'primary' ? Colors.surface : Colors.textSecondary}
            />
          </Pressable>
        ))}
        {headerAction && <View style={styles.headerAction}>{headerAction}</View>}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={32} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            {onRefresh && (
              <Pressable
                onPress={onRefresh}
                style={styles.retryButton}
                accessibilityRole="button"
                accessibilityLabel="Retry loading chart"
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            )}
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: subtitleColor }]}>
              Loading chart data...
            </Text>
          </View>
        ) : (
          children
        )}
      </View>

      {/* Footer */}
      {footer && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  defaultVariant: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  glassVariant: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  primaryVariant: {
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.titleMedium,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodySmall,
  },
  headerAction: {
    marginLeft: Spacing.md,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    minHeight: 200,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    ...Typography.bodyMedium,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    ...Typography.bodyMedium,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    ...Typography.labelMedium,
    color: Colors.surface,
    fontWeight: '600',
  },
});

export default ChartCard;
