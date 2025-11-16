// Premium Theme System for SharaSpot
// Brand Identity: Professional & Consistent
// Core Colors: Deep Teal (#008C7E), Navy (#0A2342), Success Green (#2ECC71)
// Core Principles: Premium Feel, Branded Consistency, Clear Status Indicators

import { Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM - Unique & Energetic
// ============================================================================

// Primary Palette - Deep Teal (Brand Primary Color)
// Inspired by ocean depths - sophisticated calm with electric energy
const burntOrange = {
  50: '#E6F8F6',   // Light teal background shade
  100: '#CCEFEB',
  200: '#99DFD7',
  300: '#66CFC3',
  400: '#33BFAF',
  500: '#00AF9B',  // Lighter variant
  600: '#008C7E',  // Primary - Deep teal (BRAND COLOR)
  700: '#006D61',  // Primary Dark - Rich teal tone
  800: '#004E45',
  900: '#002F29',
  950: '#001A16',
};

// Secondary Palette - Navy (Premium & Trust)
// Deep navy representing trust and technology
const charcoal = {
  50: '#F0F4F8',
  100: '#D9E2EC',
  200: '#BCCCDC',
  300: '#9FB3C8',
  400: '#829AB1',
  500: '#627D98',
  600: '#486581',
  700: '#334E68',
  800: '#243B53',
  900: '#102A43',
  950: '#0A2342',  // Secondary - Deep Navy (BRAND COLOR)
};

// Accent Palette - Success Green (Status & Energy)
// Success green for uptime and available status - clear and consistent
const electricLime = {
  50: '#E8F8F0',
  100: '#D1F2E1',
  200: '#A3E4C3',
  300: '#75D7A5',
  400: '#47C987',
  500: '#2ECC71',  // Accent Base - Success Green (BRAND COLOR)
  600: '#27AD5F',
  700: '#1F8E4D',
  800: '#186E3B',
  900: '#104F29',
  950: '#083017',
};

// Complementary Palette - Deep Navy (Trust & Technology)
// Cool counterbalance to teal - represents reliability
const deepTeal = {
  50: '#EBF2FF',
  100: '#D6E4FF',
  200: '#ADC9FF',
  300: '#7DA3FF',
  400: '#4D7DFF',
  500: '#2452D6',
  600: '#1B3DB8',  // Complement
  700: '#132D99',
  800: '#0C1F7A',
  900: '#091176',
  950: '#050955',
};

// Supporting Palette - Warm Amber
// Rich amber for premium features and highlights
const warmAmber = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
};

// Neutral Palette - Cool Grays
// Professional grey tones for text and icons
const neutral = {
  0: '#FFFFFF',
  50: '#F9FAFB',   // Lightest grey
  100: '#F3F4F6',  // Very light grey
  200: '#E5E7EB',  // Light grey
  300: '#D1D5DB',  // Medium-light grey
  400: '#9CA3AF',  // Icon grey (BRAND COLOR)
  500: '#6B7280',  // Secondary text (BRAND COLOR)
  600: '#4B5563',  // Medium-dark grey
  700: '#374151',  // Dark grey
  800: '#1F2937',  // Primary text (BRAND COLOR)
  900: '#111827',  // Near black
  950: '#030712',  // Almost black
};

// Semantic Colors - Clear & Professional
const semantic = {
  success: {
    50: '#E8F8F0',
    100: '#D1F2E1',
    500: '#2ECC71',  // Success Green (BRAND COLOR)
    600: '#27AD5F',
    700: '#1F8E4D',
    950: '#083017',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    950: '#451A03',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    950: '#450A0A',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    950: '#172554',
  },
};

// Light Theme Colors - Warm & Dynamic
export const LightColors = {
  // Primary - Deep Teal (Energy & Warmth)
  primary: burntOrange[600],          // #008C7E - Deep Teal (BRAND COLOR)
  primaryLight: burntOrange[500],     // #00AF9B - Bright teal
  primaryDark: burntOrange[700],      // #006D61 - Darker teal
  primarySubtle: burntOrange[50],     // #E6F8F6 - Light Teal Background (BRAND COLOR)

  // Secondary - Navy
  secondary: charcoal[950],           // #0A2342 - Deep Navy (BRAND COLOR)
  secondaryLight: charcoal[900],      // #102A43 - Lighter navy
  secondaryDark: charcoal[950],       // #0A2342 - Deep navy
  secondarySubtle: charcoal[50],      // #F0F4F8 - Subtle backgrounds

  // Accent - Success Green
  accent: electricLime[500],          // #2ECC71 - Success Green (BRAND COLOR)
  accentLight: electricLime[400],     // #47C987 - Hover
  accentDark: electricLime[600],      // #27AD5F - Active
  accentSubtle: electricLime[50],     // #E8F8F0 - Subtle tint

  // Additional Accents - Supporting Colors
  accentTeal: burntOrange[600],       // #008C7E - Deep Teal
  accentAmber: warmAmber[500],        // #F59E0B - Premium/Rewards
  accentGold: warmAmber[400],         // #FBBF24 - Highlights
  accentPurple: '#A78BFA',            // Premium features
  accentCyan: '#06B6D4',              // Information
  accentCopper: '#CD7F32',            // Metallic accent

  // Background - Clean Foundation
  background: '#FFFFFF',              // Pure white background
  backgroundSecondary: burntOrange[50], // #E6F8F6 - Light Teal Background (BRAND COLOR)
  backgroundTertiary: neutral[50],    // #F9FAFB - Light grey background

  // Surface - Card Layers
  surface: '#F9FAF9',                 // Card Background (BRAND COLOR)
  surfaceElevated: '#F9FAF9',         // Elevated card elements
  surfaceOverlay: 'rgba(249, 250, 249, 0.96)',
  surfaceTinted: burntOrange[50],     // #E6F8F6 - Light teal tint

  // Text - Clear & Professional
  textPrimary: neutral[800],          // #1F2937 - Primary text (BRAND COLOR)
  textSecondary: neutral[500],        // #6B7280 - Secondary text (BRAND COLOR)
  textTertiary: neutral[400],         // #9CA3AF - Tertiary text
  textDisabled: neutral[400],         // #9CA3AF - Disabled text (BRAND COLOR)
  textInverse: '#FFFFFF',             // White on dark
  textAccent: burntOrange[600],       // #008C7E - Teal highlights

  // Border - Subtle Teal Tinted
  border: '#DFF3F0',                  // Card Border - Ultra Light Teal (BRAND COLOR)
  borderLight: neutral[100],          // #F3F4F6 - Very subtle
  borderStrong: neutral[300],         // #D1D5DB - Emphasized
  borderAccent: burntOrange[200],     // #99DFD7 - Accent borders

  // States - Clear Feedback
  success: electricLime[500],         // #2ECC71 - Success Green (BRAND COLOR)
  successLight: electricLime[50],     // #E8F8F0 - Light success
  successDark: electricLime[700],     // #1F8E4D - Dark success

  warning: warmAmber[500],            // #F59E0B - Warm warning
  warningLight: warmAmber[50],
  warningDark: warmAmber[700],

  error: semantic.error[600],         // #DC2626 - Clear error
  errorLight: semantic.error[50],
  errorDark: semantic.error[700],

  info: charcoal[950],                // #0A2342 - Navy for info
  infoLight: charcoal[50],            // #F0F4F8 - Light navy
  infoDark: charcoal[800],            // #243B53 - Dark navy

  // Special States
  charging: electricLime[500],        // #2ECC71 - Active charging
  chargingGlow: electricLime[400],    // #47C987 - Glow effect
  available: electricLime[500],       // #2ECC71 - Available (Success Green)
  occupied: burntOrange[600],         // #008C7E - In use (Deep Teal)

  // Overlays - Professional Depth
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayHeavy: 'rgba(0, 0, 0, 0.7)',
  overlayWarm: 'rgba(0, 140, 126, 0.08)',  // Deep teal overlay

  // Glass Effects - Modern Glass
  glass: 'rgba(255, 255, 255, 0.75)',
  glassSubtle: 'rgba(255, 255, 255, 0.6)',
  glassStrong: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  glassWarm: 'rgba(230, 248, 246, 0.8)',   // Light teal tinted glass

  // Gradients - Dynamic & Memorable
  gradientPrimary: [burntOrange[500], burntOrange[700]],      // Teal glow
  gradientCharge: [electricLime[400], electricLime[600]],     // Charging gradient
  gradientPremium: [burntOrange[600], charcoal[950]],         // Premium dark (Teal to Navy)
  gradientEnergy: ['#008C7E', '#2ECC71'],                     // Teal to green
  gradientEmber: ['#00AF9B', '#008C7E', '#006D61'],           // Deep teal range
  gradientSunrise: ['#E6F8F6', '#CCEFEB', '#99DFD7'],         // Light teal morning
  gradientSpeed: ['#008C7E', '#33BFAF', '#FBBF24'],           // Fast charging
  gradientNight: [charcoal[900], charcoal[950]],              // Dark mode base
  gradientWarmth: ['#E6F8F6', '#CCEFEB', '#99DFD7'],          // Light teal background
  gradientFire: ['#FBBF24', '#00AF9B', '#008C7E'],            // Teal energy
  gradientTech: [charcoal[950], burntOrange[600]],            // Navy meets teal
};

// Dark Theme Colors - Sophisticated Night Mode with Cool Glow
export const DarkColors = {
  // Primary - Glowing Teal
  primary: burntOrange[500],          // #00AF9B - Bright teal
  primaryLight: burntOrange[400],     // #33BFAF - Lighter glow
  primaryDark: burntOrange[600],      // #008C7E - Deep teal
  primarySubtle: burntOrange[950],    // #001A16 - Subtle tint

  // Secondary - Lighter Navy
  secondary: charcoal[700],           // #334E68 - Softer navy in dark
  secondaryLight: charcoal[600],      // #486581 - Lighter navy
  secondaryDark: charcoal[800],       // #243B53 - Deeper navy
  secondarySubtle: charcoal[950],     // #0A2342 - Subtle backgrounds

  // Accent - Bright Success Green
  accent: electricLime[400],          // #47C987 - Bright in dark
  accentLight: electricLime[300],     // #75D7A5 - Hover
  accentDark: electricLime[500],      // #2ECC71 - Active
  accentSubtle: electricLime[950],    // #083017 - Subtle tint

  // Additional Accents - Night Mode
  accentTeal: burntOrange[500],       // #00AF9B - Bright teal
  accentAmber: warmAmber[400],        // #FBBF24 - Warm gold
  accentGold: warmAmber[300],         // #FCD34D - Bright gold
  accentPurple: '#C4B5FD',            // Lighter purple
  accentCyan: '#22D3EE',              // Brighter cyan
  accentCopper: '#E89E6B',            // Bright copper

  // Background - Rich Dark
  background: neutral[950],           // #030712 - Almost black
  backgroundSecondary: neutral[900],  // #111827 - Elevated
  backgroundTertiary: neutral[800],   // #1F2937 - Cards

  // Surface - Dark Layers
  surface: neutral[900],              // #111827 - Slightly lighter
  surfaceElevated: neutral[800],      // #1F2937 - Raised
  surfaceOverlay: 'rgba(17, 24, 39, 0.96)',
  surfaceTinted: 'rgba(0, 26, 22, 0.12)',  // Deep teal tint

  // Text - Optimized Contrast
  textPrimary: neutral[50],           // #F9FAFB - Soft white
  textSecondary: neutral[400],        // #9CA3AF - Secondary
  textTertiary: neutral[500],         // #6B7280 - Hints
  textDisabled: neutral[600],         // #4B5563 - Disabled
  textInverse: neutral[950],          // Dark on light
  textAccent: burntOrange[400],       // #33BFAF - Teal highlights

  // Border - Subtle Dark
  border: 'rgba(156, 163, 175, 0.15)',     // Subtle border
  borderLight: 'rgba(156, 163, 175, 0.08)', // Very subtle
  borderStrong: 'rgba(156, 163, 175, 0.25)', // Emphasized
  borderAccent: 'rgba(0, 175, 155, 0.3)',  // Teal glow

  // States - Dark Adjusted
  success: electricLime[400],         // #47C987 - Bright success
  successLight: electricLime[950],
  successDark: electricLime[600],

  warning: warmAmber[400],
  warningLight: warmAmber[950],
  warningDark: warmAmber[600],

  error: semantic.error[500],
  errorLight: semantic.error[950],
  errorDark: semantic.error[600],

  info: charcoal[700],                // #334E68 - Navy for info
  infoLight: charcoal[950],
  infoDark: charcoal[600],

  // Special States
  charging: electricLime[400],        // #47C987 - Bright charging
  chargingGlow: electricLime[300],    // #75D7A5 - Intense glow
  available: electricLime[400],       // #47C987 - Available
  occupied: burntOrange[500],         // #00AF9B - In use

  // Overlays - Dark Mode
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayHeavy: 'rgba(0, 0, 0, 0.85)',
  overlayWarm: 'rgba(0, 175, 155, 0.12)',  // Teal glow overlay

  // Glass Effects - Dark Glass with Glow
  glass: 'rgba(17, 24, 39, 0.7)',
  glassSubtle: 'rgba(17, 24, 39, 0.5)',
  glassStrong: 'rgba(17, 24, 39, 0.85)',
  glassBorder: 'rgba(156, 163, 175, 0.12)',
  glassWarm: 'rgba(0, 26, 22, 0.3)',       // Deep teal glass

  // Gradients - Night Versions with Glow
  gradientPrimary: [burntOrange[400], burntOrange[600]],      // Teal glow
  gradientCharge: [electricLime[300], electricLime[500]],     // Charging
  gradientPremium: [burntOrange[500], charcoal[900]],         // Premium dark
  gradientEnergy: ['#33BFAF', '#47C987'],                     // Teal to green
  gradientEmber: ['#33BFAF', '#00AF9B', '#008C7E'],           // Night teal
  gradientNight: [neutral[900], neutral[950]],                // Deep dark
  gradientNeon: ['#33BFAF', '#66CFC3', '#FCD34D'],            // Neon glow
  gradientMidnight: [charcoal[900], charcoal[950]],           // Navy dark
  gradientFire: ['#FCD34D', '#33BFAF', '#00AF9B'],            // Teal glow
  gradientCoal: [neutral[800], neutral[950]],                 // Dark coal
};

// Default to light theme
export const Colors = LightColors;

// ============================================================================
// SPACING SYSTEM - Apple-inspired 4pt Grid
// ============================================================================

export const Spacing = {
  '0': 0,
  '1': 4,      // Minimal
  '2': 8,      // Tight
  '3': 12,     // Compact
  '4': 16,     // Default
  '5': 20,     // Comfortable
  '6': 24,     // Spacious
  '8': 32,     // Large
  '10': 40,    // Extra large
  '12': 48,    // Huge
  '16': 64,    // Massive
  '20': 80,    // Hero
  '24': 96,    // Giant
  '32': 128,   // Ultra

  // Semantic Aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Component Specific
  cardPadding: 16,
  cardGap: 12,
  sectionGap: 24,
  screenPadding: 20,
};

// ============================================================================
// TYPOGRAPHY SYSTEM - Clean & Readable
// ============================================================================

export const FontFamily = {
  primary: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  }),
  text: Platform.select({
    ios: 'SF Pro Text',
    android: 'Roboto',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    android: 'Roboto Mono',
    default: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace',
  }),
  display: Platform.select({
    ios: 'SF Pro Display',
    android: 'Roboto',
    default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  // Display - Hero Typography
  displayLarge: {
    fontSize: 57,
    fontWeight: FontWeight.bold,
    lineHeight: 64,
    letterSpacing: -0.25,
    fontFamily: FontFamily.display,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: FontWeight.bold,
    lineHeight: 52,
    letterSpacing: 0,
    fontFamily: FontFamily.display,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: FontWeight.semiBold,
    lineHeight: 44,
    letterSpacing: 0,
    fontFamily: FontFamily.display,
  },

  // Headlines - Section Headers
  headlineLarge: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    lineHeight: 40,
    letterSpacing: 0,
    fontFamily: FontFamily.primary,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: FontWeight.semiBold,
    lineHeight: 36,
    letterSpacing: 0,
    fontFamily: FontFamily.primary,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: FontWeight.semiBold,
    lineHeight: 32,
    letterSpacing: 0,
    fontFamily: FontFamily.primary,
  },

  // Titles - Component Headers
  titleLarge: {
    fontSize: 22,
    fontWeight: FontWeight.semiBold,
    lineHeight: 28,
    letterSpacing: 0,
    fontFamily: FontFamily.text,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: FontWeight.semiBold,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontFamily: FontFamily.text,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontFamily: FontFamily.text,
  },

  // Body - Content Text
  bodyLarge: {
    fontSize: 16,
    fontWeight: FontWeight.regular,
    lineHeight: 24,
    letterSpacing: 0.5,
    fontFamily: FontFamily.text,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontFamily: FontFamily.text,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontFamily: FontFamily.text,
  },

  // Label - UI Elements
  labelLarge: {
    fontSize: 14,
    fontWeight: FontWeight.medium,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontFamily: FontFamily.text,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontFamily: FontFamily.text,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontFamily: FontFamily.text,
  },

  // Supporting Styles
  caption: {
    fontSize: 12,
    fontWeight: FontWeight.regular,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontFamily: FontFamily.text,
  },
  overline: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontFamily: FontFamily.text,
  },
  button: {
    fontSize: 14,
    fontWeight: FontWeight.semiBold,
    lineHeight: 20,
    letterSpacing: 0.5,
    fontFamily: FontFamily.text,
  },
};

// ============================================================================
// BORDER RADIUS - Smooth Curves
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

  // Component Specific
  button: 12,
  card: 16,
  input: 12,
  modal: 24,
  chip: 9999,
};

// ============================================================================
// SHADOWS - Subtle Depth with Warm Glow
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
    shadowOpacity: 0.03,       // Softer (was 0.05)
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,       // Softer (was 0.08)
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,       // Softer (was 0.1)
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,       // Softer (was 0.12)
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.09,       // Softer (was 0.14)
    shadowRadius: 24,
    elevation: 12,
  },
  xxl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,        // Softer (was 0.16)
    shadowRadius: 40,
    elevation: 20,
  },

  // Colored Glows - Teal & Energy
  primaryGlow: {
    shadowColor: '#008C7E',  // Deep Teal
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: '#2ECC71',  // Success Green
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  emberGlow: {
    shadowColor: '#00AF9B',  // Bright Teal
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  warmGlow: {
    shadowColor: '#66CFC3',  // Light Teal
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
};

// ============================================================================
// ANIMATION - Smooth & Natural
// ============================================================================

export const AnimationDuration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 700,
};

export const AnimationEasing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Custom curves (for web animations)
  smooth: [0.4, 0.0, 0.2, 1.0],
  snappy: [0.32, 0.0, 0.67, 0.0],
  bounce: [0.68, -0.55, 0.265, 1.55],
  emphasized: [0.2, 0.0, 0, 1.0],
  standard: [0.4, 0.0, 0.6, 1.0],
};

export const SpringConfig = {
  gentle: {
    damping: 20,
    mass: 1,
    stiffness: 100,
  },
  responsive: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  snappy: {
    damping: 20,
    mass: 1,
    stiffness: 200,
  },
  bouncy: {
    damping: 10,
    mass: 1,
    stiffness: 180,
  },
};

// ============================================================================
// LAYOUT - Consistent Structure
// ============================================================================

export const Layout = {
  // Screen padding
  screenHorizontal: Spacing['5'],  // 20px
  screenVertical: Spacing['6'],    // 24px
  screenTop: Spacing['4'],         // 16px
  screenBottom: Spacing['6'],      // 24px

  // Component sizing
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 52,
    xlarge: 56,
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
    xxxl: 96,
  },

  // Touch targets
  minTouchTarget: 44,
  recommendedTouchTarget: 48,
  
  // Navigation
  tabBarHeight: 64,
  headerHeight: 56,
  bottomSheetHandle: 32,

  // Cards & Containers
  cardPadding: Spacing['4'],     // 16px
  cardGap: Spacing['3'],         // 12px
  containerMaxWidth: 1200,
  contentMaxWidth: 720,

  // Spacing Scales
  gap: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  // Borders
  borderWidth: {
    thin: 0.5,
    normal: 1,
    thick: 2,
    heavy: 3,
  },
};

// ============================================================================
// Z-INDEX - Layer Management
// ============================================================================

export const ZIndex = {
  base: 0,
  raised: 10,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1250,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  toast: 1700,
  notification: 1800,
  max: 9999,
};

// ============================================================================
// BREAKPOINTS - Responsive Design
// ============================================================================

export const Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536,
};

// ============================================================================
// OPACITY - Consistent Transparency
// ============================================================================

export const Opacity = {
  transparent: 0,
  subtle: 0.05,
  light: 0.1,
  medium: 0.25,
  strong: 0.5,
  heavy: 0.75,
  opaque: 1,
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
  animationDuration: AnimationDuration,
  animationEasing: AnimationEasing,
  springConfig: SpringConfig,
  layout: Layout,
  zIndex: ZIndex,
  breakpoints: Breakpoints,
  opacity: Opacity,
};

export default Theme;

// ============================================================================
// TYPE EXPORTS (for TypeScript users)
// ============================================================================

export type ThemeColors = typeof LightColors;
export type ThemeSpacing = typeof Spacing;
export type ThemeTypography = typeof Typography;
export type ThemeBorderRadius = typeof BorderRadius;
export type ThemeShadows = typeof Shadows;
export type ThemeLayout = typeof Layout;