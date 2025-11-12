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
    50: '#F0F9FF',      // Sky blue (minimalist, crisp)
    500: '#0EA5E9',     // Rich sky blue (modern, premium)
    600: '#0284C7',     // Deep sky blue
    700: '#0369A1',     // Darkest sky blue
    950: '#082F49',     // Dark mode variant
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
  accentSky: '#0EA5E9',        // Rich sky blue (minimalist premium)

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

  // Overlays - HD Refined
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.25)',        // More subtle
  overlayMedium: 'rgba(15, 23, 42, 0.4)',        // Mid-range
  overlayStrong: 'rgba(15, 23, 42, 0.65)',       // Strong but not opaque
  overlayHeavy: 'rgba(15, 23, 42, 0.8)',         // Very strong

  // Glass Effects - Premium Glassmorphism
  glass: 'rgba(255, 255, 255, 0.65)',            // More refined
  glassSubtle: 'rgba(255, 255, 255, 0.45)',      // Subtle glass
  glassStrong: 'rgba(255, 255, 255, 0.85)',      // Strong glass
  glassBorder: 'rgba(255, 255, 255, 0.25)',      // More subtle border
  glassBorderStrong: 'rgba(255, 255, 255, 0.4)', // Stronger border
  glassShadow: 'rgba(0, 0, 0, 0.05)',            // Internal shadow

  // Gradients - Enhanced for HD
  gradientPrimary: [electricBlue[700], electricPurple[600]],
  gradientSecondary: [electricCyan[500], electricBlue[700]],
  gradientSunset: ['#F97316', '#EC4899', '#C026D3'], // 3-stop gradient
  gradientSuccess: ['#0EA5E9', '#06B6D4'],       // Sky to cyan (minimalist premium)
  gradientElectric: [electricBlue[600], electricPurple[500], electricCyan[400]],
  gradientNight: ['#1E293B', '#0F172A'],         // Dark gradient
  gradientEnergy: [electricBlue[500], electricPurple[600], electricCyan[500]], // Vibrant
  gradientHero: ['#6366F1', '#8B5CF6', '#06B6D4', '#0EA5E9'], // Multi-stop (minimalist)
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
  accentSky: '#38BDF8',        // Lighter sky blue for dark theme

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

  // Overlays - HD Refined
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',           // More subtle
  overlayMedium: 'rgba(0, 0, 0, 0.4)',           // Mid-range
  overlayStrong: 'rgba(0, 0, 0, 0.65)',          // Strong but not opaque
  overlayHeavy: 'rgba(0, 0, 0, 0.8)',            // Very strong

  // Glass Effects - Premium Glassmorphism
  glass: 'rgba(30, 41, 59, 0.65)',               // More refined
  glassSubtle: 'rgba(30, 41, 59, 0.45)',         // Subtle glass
  glassStrong: 'rgba(30, 41, 59, 0.85)',         // Strong glass
  glassBorder: 'rgba(148, 163, 184, 0.15)',      // More subtle border
  glassBorderStrong: 'rgba(148, 163, 184, 0.3)', // Stronger border
  glassShadow: 'rgba(0, 0, 0, 0.2)',             // Internal shadow

  // Gradients - Enhanced for HD
  gradientPrimary: [electricBlue[500], electricPurple[500]],
  gradientSecondary: [electricCyan[400], electricBlue[500]],
  gradientSunset: ['#FB923C', '#F472B6', '#D946EF'], // 3-stop gradient
  gradientSuccess: ['#38BDF8', '#22D3EE'],       // Light sky to cyan (minimalist)
  gradientElectric: [electricBlue[500], electricPurple[400], electricCyan[300]],
  gradientNight: ['#0F172A', '#020617'],         // Dark gradient
  gradientEnergy: [electricBlue[400], electricPurple[500], electricCyan[400]], // Vibrant
  gradientHero: ['#6366F1', '#8B5CF6', '#06B6D4', '#0EA5E9'], // Multi-stop (minimalist)
};

// Default to light theme (can be made dynamic with context)
export const Colors = LightColors;

// ============================================================================
// SPACING SYSTEM - Enhanced 4pt Grid with HD Precision
// ============================================================================

export const Spacing = {
  '0': 0,
  '0.5': 2,    // Ultra-fine spacing for HD alignment
  '1': 4,
  '1.5': 6,    // Fine-tuned spacing
  '2': 8,
  '2.5': 10,   // Mid-range precision
  '3': 12,
  '3.5': 14,   // Typography fine-tuning
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,     // Added for better granularity
  '8': 32,
  '9': 36,     // Improved component spacing
  '10': 40,
  '11': 44,    // Touch target alignment
  '12': 48,
  '14': 56,    // Large component spacing
  '16': 64,
  '18': 72,    // Section spacing
  '20': 80,
  '24': 96,
  '28': 112,   // Hero spacing
  '32': 128,   // Ultra-large spacing

  // Semantic Aliases - HD Precision
  xxs: 2,      // Ultra-fine
  xs: 4,       // Extra small
  sm: 8,       // Small
  md: 16,      // Medium (base)
  lg: 24,      // Large
  xl: 32,      // Extra large
  xxl: 48,     // Double XL
  xxxl: 64,    // Triple XL
  huge: 96,    // Huge spacing
  massive: 128, // Massive spacing
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
  // Display - Hero text with HD precision
  displayLarge: {
    fontSize: 57,
    fontWeight: FontWeight.bold,
    lineHeight: 68,        // Improved for better breathing
    letterSpacing: -0.5,   // Tighter for premium look
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: FontWeight.bold,
    lineHeight: 56,        // Better proportion
    letterSpacing: -0.25,  // Slight tightening
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: FontWeight.bold,
    lineHeight: 48,        // More breathing room
    letterSpacing: -0.15,  // Subtle tightening
  },

  // Headlines - Enhanced hierarchy
  headlineLarge: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 44,        // Improved readability
    letterSpacing: -0.25,  // Premium tightness
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 38,        // Better proportion
    letterSpacing: -0.15,  // Subtle refinement
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: FontWeight.semiBold,
    lineHeight: 34,        // More breathing space
    letterSpacing: 0,      // Neutral
  },

  // Titles - Perfect for cards and lists
  titleLarge: {
    fontSize: 22,
    fontWeight: FontWeight.semiBold,
    lineHeight: 32,        // Improved spacing
    letterSpacing: 0.15,   // Slight openness
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: FontWeight.semiBold,
    lineHeight: 30,        // Better proportion
    letterSpacing: 0.15,   // Maintained
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: FontWeight.medium,
    lineHeight: 28,        // Improved readability
    letterSpacing: 0.2,    // More openness
  },

  // Body - Optimized for reading
  bodyLarge: {
    fontSize: 17,          // Slightly larger for HD
    fontWeight: FontWeight.regular,
    lineHeight: 28,        // 1.65 ratio - optimal reading
    letterSpacing: 0.3,    // Refined spacing
  },
  bodyMedium: {
    fontSize: 15,          // Improved from 14
    fontWeight: FontWeight.regular,
    lineHeight: 24,        // 1.6 ratio
    letterSpacing: 0.2,    // Subtle refinement
  },
  bodySmall: {
    fontSize: 13,          // Improved from 12
    fontWeight: FontWeight.regular,
    lineHeight: 20,        // Better proportion
    letterSpacing: 0.25,   // Refined
  },

  // Label - UI elements
  labelLarge: {
    fontSize: 15,          // Improved from 14
    fontWeight: FontWeight.medium,
    lineHeight: 22,        // Better spacing
    letterSpacing: 0.3,    // More refined
  },
  labelMedium: {
    fontSize: 13,          // Improved from 12
    fontWeight: FontWeight.medium,
    lineHeight: 18,        // Better proportion
    letterSpacing: 0.4,    // Refined
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,    // Maintained
  },

  // Legacy aliases - Enhanced for backwards compatibility
  h1: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 44,        // Improved
    letterSpacing: -0.25,  // Added refinement
  },
  h2: {
    fontSize: 28,
    fontWeight: FontWeight.bold,
    lineHeight: 38,        // Improved
    letterSpacing: -0.15,  // Added refinement
  },
  h3: {
    fontSize: 24,
    fontWeight: FontWeight.semiBold,
    lineHeight: 34,        // Improved
    letterSpacing: 0,      // Neutral
  },
  h4: {
    fontSize: 20,
    fontWeight: FontWeight.semiBold,
    lineHeight: 30,        // Improved
    letterSpacing: 0.15,   // Added refinement
  },
  body: {
    fontSize: 17,          // Improved
    fontWeight: FontWeight.regular,
    lineHeight: 28,        // Improved
    letterSpacing: 0.3,    // Added refinement
  },
  bodySmall: {
    fontSize: 15,          // Improved
    fontWeight: FontWeight.regular,
    lineHeight: 24,        // Improved
    letterSpacing: 0.2,    // Added refinement
  },
  caption: {
    fontSize: 13,          // Improved
    fontWeight: FontWeight.regular,
    lineHeight: 20,        // Improved
    letterSpacing: 0.25,   // Added refinement
  },
};

// ============================================================================
// BORDER RADIUS - Premium HD Curves
// ============================================================================

export const BorderRadius = {
  none: 0,
  xxs: 2,      // Ultra-subtle - fine details
  xs: 6,       // Subtle curves - small elements
  sm: 10,      // Small curves - buttons, inputs
  md: 14,      // Medium curves - cards (more modern than 12)
  lg: 18,      // Large curves - feature cards
  xl: 24,      // Extra large - hero sections
  xxl: 28,     // Double XL - prominent features
  xxxl: 36,    // Triple XL - major sections
  huge: 44,    // Huge - immersive elements
  massive: 56, // Massive - hero backgrounds
  full: 9999,  // Perfect circles - avatars, badges
};

// ============================================================================
// SHADOWS - HD Elevation System with Premium Depth
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
    shadowOpacity: 0.04,     // More subtle
    shadowRadius: 3,         // Slightly softer
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,     // Refined opacity
    shadowRadius: 6,         // Softer spread
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,     // Balanced depth
    shadowRadius: 12,        // More premium blur
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,      // Clear separation
    shadowRadius: 20,        // HD blur quality
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,     // Strong presence
    shadowRadius: 28,        // Ultra-soft edges
    elevation: 12,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,     // Maximum depth
    shadowRadius: 40,        // Premium blur radius
    elevation: 16,
  },
  xxxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.18,     // Hero-level depth
    shadowRadius: 56,        // Ultra-premium blur
    elevation: 24,
  },

  // Colored Glows - Electric Energy (Enhanced for HD)
  primaryGlow: {
    shadowColor: electricBlue[700],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,     // More vibrant
    shadowRadius: 20,        // Softer glow
    elevation: 8,
  },
  primaryGlowStrong: {
    shadowColor: electricBlue[700],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,      // Intense glow
    shadowRadius: 32,        // Wider spread
    elevation: 12,
  },
  secondaryGlow: {
    shadowColor: electricPurple[600],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,     // More vibrant
    shadowRadius: 20,        // Softer glow
    elevation: 8,
  },
  secondaryGlowStrong: {
    shadowColor: electricPurple[600],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,      // Intense glow
    shadowRadius: 32,        // Wider spread
    elevation: 12,
  },
  accentGlow: {
    shadowColor: electricCyan[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,     // More vibrant
    shadowRadius: 20,        // Softer glow
    elevation: 8,
  },
  accentGlowStrong: {
    shadowColor: electricCyan[500],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,      // Intense glow
    shadowRadius: 32,        // Wider spread
    elevation: 12,
  },
  successGlow: {
    shadowColor: semantic.success[500],  // #0EA5E9 sky blue glow (minimalist premium)
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,                  // Slightly stronger for visibility
    shadowRadius: 24,                     // Softer, more premium glow
    elevation: 8,
  },
  errorGlow: {
    shadowColor: semantic.error[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
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
// LAYOUT CONSTANTS - HD Precision & Perfect Alignment
// ============================================================================

export const Layout = {
  // Screen padding - Enhanced for HD displays
  screenHorizontal: Spacing.lg,      // 24px
  screenVertical: Spacing.lg,        // 24px
  screenHorizontalLarge: Spacing.xl, // 32px for larger screens
  screenVerticalLarge: Spacing.xl,   // 32px for larger screens

  // Container widths - Optimized for readability
  containerMaxWidth: 1280,           // Wider for modern displays
  containerMediumWidth: 960,         // Medium content
  containerSmallWidth: 640,          // Narrow content (reading)
  containerPadding: Spacing.lg,      // 24px
  containerPaddingLarge: Spacing.xl, // 32px

  // Component sizing - HD refined
  buttonHeight: {
    small: 40,     // Increased from 36 for better touch
    medium: 48,    // Increased from 44 (perfect touch target)
    large: 56,     // Increased from 52
    xlarge: 64,    // Increased from 60
  },
  inputHeight: {
    small: 40,     // Increased from 36
    medium: 48,    // Increased from 44
    large: 56,     // Increased from 52
  },
  iconSize: {
    xxs: 14,       // Ultra-small icons
    xs: 18,        // Improved from 16
    sm: 22,        // Improved from 20
    md: 26,        // Improved from 24
    lg: 34,        // Improved from 32
    xl: 42,        // Improved from 40
    xxl: 52,       // Improved from 48
    xxxl: 64,      // Large feature icons
  },
  avatarSize: {
    xs: 28,        // Improved from 24
    sm: 36,        // Improved from 32
    md: 44,        // Improved from 40
    lg: 52,        // Improved from 48
    xl: 68,        // Improved from 64
    xxl: 88,       // Improved from 80
    xxxl: 112,     // Hero avatars
  },

  // Touch targets (Accessibility) - Enhanced
  minTouchTarget: 44,
  recommendedTouchTarget: 48,
  optimalTouchTarget: 52,              // New: optimal for fat fingers

  // Navigation - Refined heights
  tabBarHeight: 64,        // Increased from 60 for better spacing
  headerHeight: 60,        // Increased from 56 for better proportion

  // Cards - Enhanced spacing
  cardPadding: Spacing.lg,             // 24px
  cardPaddingLarge: Spacing.xl,        // 32px for prominent cards
  cardPaddingSmall: Spacing.md,        // 16px for compact cards
  cardGap: Spacing.md,                 // 16px between card items
  cardGapLarge: Spacing.lg,            // 24px for more breathing room

  // List items - Perfect alignment
  listItemHeight: 64,                  // Standard list item
  listItemHeightCompact: 52,           // Compact list
  listItemHeightLarge: 80,             // Large list item
  listItemPadding: Spacing.md,         // 16px horizontal
  listItemGap: Spacing.sm,             // 8px between items

  // Borders - HD precision
  borderWidth: {
    thin: 0.5,     // Ultra-thin (hairline on retina)
    normal: 1,     // Standard
    thick: 1.5,    // Emphasized
    bold: 2,       // Strong borders
  },
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
