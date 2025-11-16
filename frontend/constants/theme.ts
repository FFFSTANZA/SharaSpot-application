// Premium Theme System for SharaSpot
// Unique Brand Identity: "Ocean Charge" - Calm Meets Energy
// Core Principles: Dynamic Energy, Premium Technology, Trusted Navigation

import { Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM - Unique & Energetic
// ============================================================================

// Primary Palette - Deep Teal (Distinctive & Warm Energy)
// Inspired by ocean depths - sophisticated calm with electric energy
const burntOrange = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6',  // Base - Vibrant deep teal
  600: '#0D9488',  // Primary - Deep teal
  700: '#0F766E',  // Primary Dark - Rich teal tone
  800: '#115E59',
  900: '#134E4A',
  950: '#042F2E',
};

// Secondary Palette - Charcoal (Premium & Grounding)
// Sophisticated dark gray with subtle warmth to complement teal
const charcoal = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',  // Secondary
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#09090B',
};

// Accent Palette - Electric Lime (Energy & Innovation)
// Vibrant green representing charging/energy - perfect contrast to teal
const electricLime = {
  50: '#F7FEE7',
  100: '#ECFCCB',
  200: '#D9F99D',
  300: '#BEF264',
  400: '#A3E635',
  500: '#84CC16',  // Accent Base
  600: '#65A30D',
  700: '#4D7C0F',
  800: '#3F6212',
  900: '#365314',
  950: '#1A2E05',
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

// Neutral Palette - Warm Grays
// Slight warm tint to harmonize with teal primary
const neutral = {
  0: '#FFFFFF',
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#57534E',
  700: '#44403C',
  800: '#292524',
  900: '#1C1917',
  950: '#0C0A09',
};

// Semantic Colors - Clear & Professional
const semantic = {
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    950: '#052E16',
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
  primary: burntOrange[600],          // #0D9488 - Rich teal
  primaryLight: burntOrange[500],     // #14B8A6 - Bright teal
  primaryDark: burntOrange[700],      // #0F766E - Deep teal
  primarySubtle: burntOrange[50],     // #F0FDFA - Cool tint

  // Secondary - Premium Charcoal
  secondary: charcoal[700],           // #3F3F46 - Strong contrast
  secondaryLight: charcoal[600],      // #52525B - Lighter variant
  secondaryDark: charcoal[800],       // #27272A - Deeper variant
  secondarySubtle: charcoal[50],      // #FAFAFA - Subtle backgrounds

  // Accent - Electric Lime
  accent: electricLime[500],          // #84CC16 - Charging/Active
  accentLight: electricLime[400],     // #A3E635 - Hover
  accentDark: electricLime[600],      // #65A30D - Active
  accentSubtle: electricLime[50],     // #F7FEE7 - Subtle tint

  // Additional Accents - Supporting Colors
  accentTeal: deepTeal[600],          // #1B3DB8 - Deep Navy - Tech/Trust
  accentAmber: warmAmber[500],        // #F59E0B - Premium/Rewards
  accentGold: warmAmber[400],         // #FBBF24 - Highlights
  accentPurple: '#A78BFA',            // Premium features
  accentCyan: '#06B6D4',              // Information
  accentCopper: '#CD7F32',            // Metallic accent

  // Background - Clean Warm Foundation (Eye-friendly soft tones)
  background: '#FDFCFB',              // Soft warm white (reduced glare)
  backgroundSecondary: '#FAF9F8',     // Warm off-white for sections
  backgroundTertiary: '#F5F4F2',      // Gentle gray-beige

  // Surface - Card Layers (Softer whites for comfort)
  surface: '#FEFEFE',                 // Very soft white (not pure white)
  surfaceElevated: '#FEFEFE',         // Elevated elements
  surfaceOverlay: 'rgba(253, 252, 251, 0.96)',
  surfaceTinted: 'rgba(240, 253, 250, 0.6)',  // Cool teal tint

  // Text - Comfortable contrast (Eye-friendly, reduced harshness)
  textPrimary: '#2A2827',             // Softer dark (not pure black)
  textSecondary: '#6B6662',           // Comfortable mid-tone
  textTertiary: '#8B8682',            // Gentle hints
  textDisabled: '#B0ABA7',            // Soft disabled state
  textInverse: '#FEFEFE',             // Soft white on dark
  textAccent: burntOrange[600],       // Teal highlights

  // Border - Warm Subtle Definition (Softer for eye comfort)
  border: '#EDECEA',                  // Gentle border (softer than default)
  borderLight: '#F7F6F5',             // Very subtle
  borderStrong: '#DDD9D6',            // Emphasized but not harsh
  borderAccent: burntOrange[200],     // #99F6E4 - Accent borders

  // States - Clear Feedback
  success: electricLime[600],         // #65A30D - Using accent for consistency
  successLight: electricLime[50],
  successDark: electricLime[700],

  warning: warmAmber[500],            // #F59E0B - Warm warning
  warningLight: warmAmber[50],
  warningDark: warmAmber[700],

  error: semantic.error[600],         // #DC2626 - Clear error
  errorLight: semantic.error[50],
  errorDark: semantic.error[700],

  info: deepTeal[600],                // #1B3DB8 - Calm info
  infoLight: deepTeal[50],
  infoDark: deepTeal[700],

  // Special States
  charging: electricLime[500],        // #84CC16 - Active charging
  chargingGlow: electricLime[400],    // #A3E635 - Glow effect
  available: deepTeal[500],           // #2452D6 - Available
  occupied: burntOrange[500],         // #14B8A6 - In use

  // Overlays - Professional Depth
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
  overlayHeavy: 'rgba(0, 0, 0, 0.7)',
  overlayWarm: 'rgba(13, 148, 136, 0.08)',  // Cool teal overlay

  // Glass Effects - Modern Warm Glass
  glass: 'rgba(255, 255, 255, 0.75)',
  glassSubtle: 'rgba(255, 255, 255, 0.6)',
  glassStrong: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.18)',
  glassWarm: 'rgba(240, 253, 250, 0.8)',   // Cool tinted glass

  // Gradients - Dynamic & Memorable
  gradientPrimary: [burntOrange[500], burntOrange[700]],      // Teal glow
  gradientCharge: [electricLime[400], electricLime[600]],     // Charging gradient
  gradientPremium: [burntOrange[600], charcoal[700]],         // Premium dark
  gradientEnergy: ['#0D9488', '#84CC16'],                     // Teal to green
  gradientEmber: ['#14B8A6', '#0D9488', '#0F766E'],           // Deep teal
  gradientSunrise: ['#99F6E4', '#5EEAD4', '#2DD4BF'],         // Cool morning
  gradientSpeed: ['#0D9488', '#2DD4BF', '#FBBF24'],           // Fast charging
  gradientNight: [charcoal[800], charcoal[950]],              // Dark mode base
  gradientWarmth: ['#F0FDFA', '#CCFBF1', '#99F6E4'],          // Cool background
  gradientFire: ['#FBBF24', '#14B8A6', '#0D9488'],            // Teal energy
  gradientTech: [deepTeal[500], burntOrange[500]],            // Navy meets teal energy
};

// Dark Theme Colors - Sophisticated Night Mode with Cool Glow
export const DarkColors = {
  // Primary - Glowing Teal
  primary: burntOrange[500],          // #14B8A6 - Bright teal
  primaryLight: burntOrange[400],     // #2DD4BF - Lighter glow
  primaryDark: burntOrange[600],      // #0D9488 - Deeper teal
  primarySubtle: burntOrange[950],    // #042F2E - Subtle tint

  // Secondary - Lighter Charcoal
  secondary: charcoal[500],           // #71717A - Softer in dark
  secondaryLight: charcoal[400],      // #A1A1AA - Lighter
  secondaryDark: charcoal[600],       // #52525B - Deeper
  secondarySubtle: charcoal[950],     // #09090B - Subtle backgrounds

  // Accent - Bright Lime Glow
  accent: electricLime[400],          // #A3E635 - Bright in dark
  accentLight: electricLime[300],     // #BEF264 - Hover
  accentDark: electricLime[500],      // #84CC16 - Active
  accentSubtle: electricLime[950],    // #1A2E05 - Subtle tint

  // Additional Accents - Night Mode
  accentTeal: deepTeal[400],          // #4D7DFF - Bright navy
  accentAmber: warmAmber[400],        // #FBBF24 - Warm gold
  accentGold: warmAmber[300],         // #FCD34D - Bright gold
  accentPurple: '#C4B5FD',            // Lighter purple
  accentCyan: '#22D3EE',              // Brighter cyan
  accentCopper: '#E89E6B',            // Bright copper

  // Background - Rich Dark with Warmth
  background: '#0A0908',              // Almost black with warm tint
  backgroundSecondary: neutral[900],  // #1C1917 - Elevated
  backgroundTertiary: neutral[800],   // #292524 - Cards

  // Surface - Dark Layers
  surface: '#121110',                 // Slightly lighter than background
  surfaceElevated: neutral[800],      // #292524 - Raised
  surfaceOverlay: 'rgba(28, 25, 23, 0.96)',
  surfaceTinted: 'rgba(4, 47, 46, 0.12)',  // Cool teal tint

  // Text - Optimized Contrast
  textPrimary: '#F5F5F4',             // Soft white
  textSecondary: neutral[400],        // #A8A29E - Secondary
  textTertiary: neutral[500],         // #78716C - Hints
  textDisabled: neutral[600],         // #57534E - Disabled
  textInverse: neutral[950],          // Dark on light
  textAccent: burntOrange[400],       // Teal highlights

  // Border - Subtle Dark with Warmth
  border: 'rgba(168, 162, 158, 0.15)',     // Subtle border
  borderLight: 'rgba(168, 162, 158, 0.08)', // Very subtle
  borderStrong: 'rgba(168, 162, 158, 0.25)', // Emphasized
  borderAccent: 'rgba(20, 184, 166, 0.3)',  // Teal glow

  // States - Dark Adjusted
  success: electricLime[500],
  successLight: electricLime[950],
  successDark: electricLime[600],

  warning: warmAmber[400],
  warningLight: warmAmber[950],
  warningDark: warmAmber[600],

  error: semantic.error[500],
  errorLight: semantic.error[950],
  errorDark: semantic.error[600],

  info: deepTeal[400],
  infoLight: deepTeal[950],
  infoDark: deepTeal[600],

  // Special States
  charging: electricLime[400],        // #A3E635 - Bright charging
  chargingGlow: electricLime[300],    // #BEF264 - Intense glow
  available: deepTeal[400],           // #4D7DFF - Available
  occupied: burntOrange[400],         // #2DD4BF - In use

  // Overlays - Dark Mode
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayHeavy: 'rgba(0, 0, 0, 0.85)',
  overlayWarm: 'rgba(20, 184, 166, 0.12)',  // Cool glow overlay

  // Glass Effects - Dark Glass with Glow
  glass: 'rgba(28, 25, 23, 0.7)',
  glassSubtle: 'rgba(28, 25, 23, 0.5)',
  glassStrong: 'rgba(28, 25, 23, 0.85)',
  glassBorder: 'rgba(168, 162, 158, 0.12)',
  glassWarm: 'rgba(4, 47, 46, 0.3)',       // Cool teal glass

  // Gradients - Night Versions with Glow
  gradientPrimary: [burntOrange[400], burntOrange[600]],      // Teal glow
  gradientCharge: [electricLime[300], electricLime[500]],     // Charging
  gradientPremium: [burntOrange[500], charcoal[800]],         // Premium dark
  gradientEnergy: ['#2DD4BF', '#A3E635'],                     // Teal to green
  gradientEmber: ['#2DD4BF', '#14B8A6', '#0D9488'],           // Night teal
  gradientNight: [neutral[900], neutral[950]],                // Deep dark
  gradientNeon: ['#2DD4BF', '#5EEAD4', '#FCD34D'],            // Neon glow
  gradientMidnight: [charcoal[900], deepTeal[900]],           // Blue-black
  gradientFire: ['#FCD34D', '#2DD4BF', '#14B8A6'],            // Teal glow
  gradientCoal: ['#292524', '#0A0908'],                       // Hot coal
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
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: '#84CC16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  emberGlow: {
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  warmGlow: {
    shadowColor: '#5EEAD4',
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