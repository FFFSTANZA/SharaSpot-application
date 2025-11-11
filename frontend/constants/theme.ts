// Premium Theme System for SharaSpot
// Inspired by: Tesla, Apple, Stripe, Linear, Airbnb
// Core Principles: Premium Minimalism, Electric Energy, Trust & Transparency

import { Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM - Premium Minimalism & Electric Energy
// ============================================================================

// Semantic Color Scales (50-900)
const electricBlue = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#6366F1', // Base
  600: '#4F5FF9', // Primary
  700: '#2D3FE8', // Primary Dark
  800: '#1E2BB8',
  900: '#1E1B4B',
};

const electricPurple = {
  50: '#FAF5FF',
  100: '#F3E8FF',
  200: '#E9D5FF',
  300: '#D8B4FE',
  400: '#C084FC',
  500: '#A855F7',
  600: '#8B5CF6', // Secondary
  700: '#7C3AED',
  800: '#6D28D9',
  900: '#4C1D95',
};

const electricCyan = {
  50: '#ECFEFF',
  100: '#CFFAFE',
  200: '#A5F3FC',
  300: '#67E8F9',
  400: '#22D3EE',
  500: '#06B6D4', // Accent
  600: '#0891B2',
  700: '#0E7490',
  800: '#155E75',
  900: '#164E63',
};

const neutral = {
  0: '#FFFFFF',
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
};

const semantic = {
  success: {
    50: '#ECFDF5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
};

// Light Theme Colors
export const LightColors = {
  // Primary
  primary: electricBlue[700],
  primaryLight: electricBlue[600],
  primaryDark: electricBlue[800],
  primarySubtle: electricBlue[50],

  // Secondary
  secondary: electricPurple[600],
  secondaryLight: electricPurple[500],
  secondaryDark: electricPurple[700],
  secondarySubtle: electricPurple[50],

  // Accent
  accent: electricCyan[500],
  accentLight: electricCyan[400],
  accentDark: electricCyan[600],
  accentSubtle: electricCyan[50],

  // Additional Accents
  accentOrange: '#F97316',
  accentPink: '#EC4899',
  accentGreen: '#10B981',

  // Background
  background: neutral[50],
  backgroundSecondary: neutral[100],
  backgroundTertiary: neutral[0],

  // Surface
  surface: neutral[0],
  surfaceElevated: neutral[0],
  surfaceOverlay: neutral[0],

  // Text
  textPrimary: neutral[900],
  textSecondary: neutral[600],
  textTertiary: neutral[500],
  textDisabled: neutral[400],
  textInverse: neutral[0],

  // Border
  border: neutral[200],
  borderLight: neutral[100],
  borderStrong: neutral[300],

  // States
  success: semantic.success[500],
  successLight: semantic.success[50],
  successDark: semantic.success[700],

  warning: semantic.warning[500],
  warningLight: semantic.warning[50],
  warningDark: semantic.warning[700],

  error: semantic.error[500],
  errorLight: semantic.error[50],
  errorDark: semantic.error[700],

  info: semantic.info[500],
  infoLight: semantic.info[50],
  infoDark: semantic.info[700],

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',
  overlayStrong: 'rgba(15, 23, 42, 0.7)',

  // Glass Effects
  glass: 'rgba(255, 255, 255, 0.7)',
  glassStrong: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',

  // Gradients
  gradientPrimary: [electricBlue[700], electricPurple[600]],
  gradientSecondary: [electricCyan[500], electricBlue[700]],
  gradientSunset: ['#F97316', '#EC4899'],
  gradientSuccess: ['#10B981', '#06B6D4'],
  gradientElectric: [electricBlue[600], electricPurple[500], electricCyan[400]],
};

// Dark Theme Colors
export const DarkColors = {
  // Primary
  primary: electricBlue[500],
  primaryLight: electricBlue[400],
  primaryDark: electricBlue[600],
  primarySubtle: electricBlue[950],

  // Secondary
  secondary: electricPurple[500],
  secondaryLight: electricPurple[400],
  secondaryDark: electricPurple[600],
  secondarySubtle: electricPurple[950],

  // Accent
  accent: electricCyan[400],
  accentLight: electricCyan[300],
  accentDark: electricCyan[500],
  accentSubtle: electricCyan[950],

  // Additional Accents
  accentOrange: '#FB923C',
  accentPink: '#F472B6',
  accentGreen: '#34D399',

  // Background
  background: neutral[950],
  backgroundSecondary: neutral[900],
  backgroundTertiary: neutral[800],

  // Surface
  surface: neutral[900],
  surfaceElevated: neutral[800],
  surfaceOverlay: neutral[700],

  // Text
  textPrimary: neutral[50],
  textSecondary: neutral[400],
  textTertiary: neutral[500],
  textDisabled: neutral[600],
  textInverse: neutral[900],

  // Border
  border: neutral[800],
  borderLight: neutral[850],
  borderStrong: neutral[700],

  // States
  success: semantic.success[500],
  successLight: semantic.success[950],
  successDark: semantic.success[600],

  warning: semantic.warning[500],
  warningLight: semantic.warning[950],
  warningDark: semantic.warning[600],

  error: semantic.error[500],
  errorLight: semantic.error[950],
  errorDark: semantic.error[600],

  info: semantic.info[500],
  infoLight: semantic.info[950],
  infoDark: semantic.info[600],

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',

  // Glass Effects
  glass: 'rgba(30, 41, 59, 0.7)',
  glassStrong: 'rgba(30, 41, 59, 0.9)',
  glassBorder: 'rgba(148, 163, 184, 0.2)',

  // Gradients
  gradientPrimary: [electricBlue[500], electricPurple[500]],
  gradientSecondary: [electricCyan[400], electricBlue[500]],
  gradientSunset: ['#FB923C', '#F472B6'],
  gradientSuccess: ['#34D399', '#22D3EE'],
  gradientElectric: [electricBlue[500], electricPurple[400], electricCyan[300]],
};

// Default to light theme (can be made dynamic with context)
export const Colors = LightColors;

// ============================================================================
// SPACING SYSTEM - 8pt Grid
// ============================================================================

export const Spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,

  // Semantic Aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================================================
// TYPOGRAPHY SYSTEM - Premium Hierarchy
// ============================================================================

export const FontFamily = {
  primary: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'ui-monospace, monospace',
  }),
};

export const FontWeight = {
  thin: '100' as const,
  extraLight: '200' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const Typography = {
  // Display - Hero text
  displayLarge: {
    fontSize: 57,
    fontWeight: FontWeight.bold,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: FontWeight.bold,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    lineHeight: 44,
    letterSpacing: 0,
  },

  // Headlines
  headlineLarge: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: FontWeight.semiBold,
    lineHeight: 32,
    letterSpacing: 0,
  },

  // Titles
  titleLarge: {
    fontSize: 22,
    fontWeight: FontWeight.semiBold,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: FontWeight.semiBold,
    lineHeight: 28,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: FontWeight.medium,
    lineHeight: 24,
    letterSpacing: 0.1,
  },

  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  // Label
  labelLarge: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,
  },

  // Legacy aliases for backwards compatibility
  h1: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: FontWeight.semiBold,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: FontWeight.semiBold,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
  },
};

// ============================================================================
// BORDER RADIUS - Smooth, Premium Feel
// ============================================================================

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
};

// ============================================================================
// SHADOWS - Elevation System
// ============================================================================

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },

  // Colored Shadows (Electric Energy)
  primaryGlow: {
    shadowColor: electricBlue[700],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  secondaryGlow: {
    shadowColor: electricPurple[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  accentGlow: {
    shadowColor: electricCyan[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

// ============================================================================
// ANIMATION SYSTEM - Electric Energy
// ============================================================================

// Timing
export const AnimationDuration = {
  instant: 0,
  fast: 150,
  normal: 250,
  moderate: 350,
  slow: 500,
  slower: 700,
  slowest: 1000,
};

// Easing Curves (Tesla/Apple inspired)
export const AnimationEasing = {
  // Standard curves
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Custom curves (for web - use with Animated.timing)
  sharp: [0.4, 0.0, 0.6, 1.0], // Quick entry
  smooth: [0.4, 0.0, 0.2, 1.0], // Standard smooth
  emphasized: [0.0, 0.0, 0.2, 1.0], // Emphasized
  decelerated: [0.0, 0.0, 0.0, 1.0], // Slow end
  accelerated: [0.4, 0.0, 1.0, 1.0], // Fast end

  // Apple-like curves
  appleSmooth: [0.25, 0.1, 0.25, 1.0],
  appleSnappy: [0.42, 0.0, 0.58, 1.0],

  // Tesla-inspired (quick, responsive)
  teslaQuick: [0.32, 0.0, 0.67, 0.0],
  teslaSmooth: [0.65, 0.0, 0.35, 1.0],
};

// Spring Configurations (for react-native-reanimated)
export const SpringConfig = {
  gentle: {
    damping: 15,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  smooth: {
    damping: 20,
    mass: 1,
    stiffness: 180,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  snappy: {
    damping: 18,
    mass: 0.5,
    stiffness: 250,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  tight: {
    damping: 25,
    mass: 1,
    stiffness: 300,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// Legacy aliases
export const Animations = {
  fast: AnimationDuration.fast,
  normal: AnimationDuration.normal,
  slow: AnimationDuration.slow,
};

// ============================================================================
// LAYOUT CONSTANTS - Premium Spacing
// ============================================================================

export const Layout = {
  // Screen padding
  screenHorizontal: Spacing.lg,
  screenVertical: Spacing.lg,

  // Container widths
  containerMaxWidth: 1200,
  containerPadding: Spacing.lg,

  // Component sizing
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 52,
    xlarge: 60,
  },
  inputHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
    xxl: 48,
  },
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
  },

  // Touch targets (Accessibility)
  minTouchTarget: 44,
  recommendedTouchTarget: 48,

  // Navigation
  tabBarHeight: 60,
  headerHeight: 56,

  // Cards
  cardPadding: Spacing.lg,
  cardGap: Spacing.md,
};

// ============================================================================
// ACCESSIBILITY - Inclusive Design
// ============================================================================

export const Accessibility = {
  // Minimum contrast ratios (WCAG AA)
  minContrastNormal: 4.5, // Normal text
  minContrastLarge: 3.0, // Large text (18pt+)
  minContrastUI: 3.0, // UI components

  // Touch targets
  minTouchSize: 44,
  recommendedTouchSize: 48,

  // Text sizing
  minTextSize: 12,
  bodyTextSize: 16,
  largeTextSize: 18,

  // Animation preferences
  reduceMotion: false, // Should be read from system preferences

  // Focus indicators
  focusRingWidth: 2,
  focusRingColor: electricBlue[600],
  focusRingOffset: 2,
};

// ============================================================================
// BREAKPOINTS - Responsive Design
// ============================================================================

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultrawide: 1536,
};

// ============================================================================
// Z-INDEX SYSTEM - Layer Management
// ============================================================================

export const ZIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  max: 9999,
};

// ============================================================================
// TRANSITIONS - Smooth Interactions
// ============================================================================

export const Transitions = {
  fade: {
    duration: AnimationDuration.normal,
    easing: AnimationEasing.smooth,
  },
  slide: {
    duration: AnimationDuration.normal,
    easing: AnimationEasing.emphasized,
  },
  scale: {
    duration: AnimationDuration.fast,
    easing: AnimationEasing.sharp,
  },
  collapse: {
    duration: AnimationDuration.moderate,
    easing: AnimationEasing.emphasized,
  },
};

// ============================================================================
// EXPORT DEFAULT THEME
// ============================================================================

export const Theme = {
  colors: Colors,
  darkColors: DarkColors,
  lightColors: LightColors,
  spacing: Spacing,
  typography: Typography,
  fontFamily: FontFamily,
  fontWeight: FontWeight,
  borderRadius: BorderRadius,
  shadows: Shadows,
  animations: Animations,
  animationDuration: AnimationDuration,
  animationEasing: AnimationEasing,
  springConfig: SpringConfig,
  layout: Layout,
  accessibility: Accessibility,
  breakpoints: Breakpoints,
  zIndex: ZIndex,
  transitions: Transitions,
};

export default Theme;
