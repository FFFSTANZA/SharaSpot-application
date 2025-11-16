// Premium Theme System for SharaSpot
// Unique Brand Identity: "Ocean Charge" - Calm Meets Energy
// Core Principles: Dynamic Energy, Premium Technology, Trusted Navigation

import { Platform } from 'react-native';

// ============================================================================
// COLOR SYSTEM - Clean & Modern Cyan/Slate
// ============================================================================

// Primary Palette - Cyan (Clean & Professional Energy)
// Fresh cyan palette for modern, clean UI
const cyan = {
  50: '#ECFEFF',
  100: '#CFFAFE',
  200: '#A5F3FC',
  300: '#67E8F9',
  400: '#22D3EE',
  500: '#06B6D4',
  600: '#0891B2',  // Primary - Cyan 600
  700: '#0E7490',  // Primary Dark
  800: '#155E75',
  900: '#164E63',
  950: '#083344',
};

// Secondary Palette - Slate (Clean & Neutral)
// Modern slate grays for text and UI elements
const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',  // Secondary
  800: '#1E293B',
  900: '#0F172A',  // Text primary
  950: '#020617',
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

// Complementary Palette - Blue (Info & Trust)
// Blue palette for informational elements
const blue = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',  // Info
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
  950: '#172554',
};

// Supporting Palette - Amber (Warnings & Highlights)
// Amber for warnings and premium features
const amber = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',  // Warning
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
};

// Additional Palette - Red (Errors)
// Red for error states
const red = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',  // Error
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
  950: '#450A0A',
};

// Semantic Colors - Clear & Professional
const semantic = {
  success: electricLime,
  warning: amber,
  error: red,
  info: blue,
};

// Light Theme Colors - Clean & Modern
export const LightColors = {
  // Primary - Cyan (Clean Energy)
  primary: cyan[600],                 // #0891B2 - Cyan 600
  primaryLight: cyan[500],            // #06B6D4 - Bright cyan
  primaryDark: cyan[700],             // #0E7490 - Deep cyan
  primarySubtle: cyan[50],            // #ECFEFF - Subtle tint

  // Secondary - Slate
  secondary: slate[700],              // #334155 - Slate 700
  secondaryLight: slate[600],         // #475569 - Lighter slate
  secondaryDark: slate[800],          // #1E293B - Deeper slate
  secondarySubtle: slate[50],         // #F8FAFC - Subtle backgrounds

  // Accent - Electric Lime
  accent: electricLime[500],          // #84CC16 - Success/Charging
  accentLight: electricLime[400],     // #A3E635 - Hover
  accentDark: electricLime[600],      // #65A30D - Active
  accentSubtle: electricLime[50],     // #F7FEE7 - Subtle tint

  // Additional Accents - Supporting Colors
  accentBlue: blue[500],              // #3B82F6 - Info
  accentAmber: amber[500],            // #F59E0B - Warning
  accentGold: amber[400],             // #FBBF24 - Highlights
  accentPurple: '#A78BFA',            // Premium features
  accentCyan: cyan[500],              // #06B6D4 - Information
  accentRed: red[500],                // #EF4444 - Error

  // Background - Clean White Foundation
  background: '#FFFFFF',              // Pure white
  backgroundSecondary: slate[50],     // #F8FAFC - Slate 50
  backgroundTertiary: slate[100],     // #F1F5F9 - Slate 100

  // Surface - Card Layers
  surface: '#FFFFFF',                 // White
  surfaceElevated: '#FFFFFF',         // Elevated white
  surfaceOverlay: 'rgba(255, 255, 255, 0.96)',
  surfaceTinted: 'rgba(236, 254, 255, 0.6)',  // Cyan tint

  // Text - Clean Contrast
  textPrimary: slate[900],            // #0F172A - Slate 900
  textSecondary: slate[500],          // #64748B - Slate 500
  textTertiary: slate[400],           // #94A3B8 - Slate 400
  textDisabled: slate[300],           // #CBD5E1 - Slate 300
  textInverse: '#FFFFFF',             // White on dark
  textAccent: cyan[600],              // #0891B2 - Cyan highlights

  // Border - Clean Definition
  border: slate[200],                 // #E2E8F0 - Slate 200
  borderLight: slate[100],            // #F1F5F9 - Very subtle
  borderStrong: slate[300],           // #CBD5E1 - Emphasized
  borderAccent: cyan[300],            // #67E8F9 - Accent borders

  // States - Clear Feedback
  success: electricLime[500],         // #84CC16 - Lime 500
  successLight: electricLime[50],     // #F7FEE7
  successDark: electricLime[700],     // #4D7C0F

  warning: amber[500],                // #F59E0B - Amber 500
  warningLight: amber[100],           // #FEF3C7
  warningDark: amber[800],            // #92400E

  error: red[500],                    // #EF4444 - Red 500
  errorLight: red[100],               // #FEE2E2
  errorDark: red[700],                // #B91C1C

  info: blue[500],                    // #3B82F6 - Blue 500
  infoLight: blue[100],               // #DBEAFE
  infoDark: blue[700],                // #1D4ED8

  // Special States
  charging: electricLime[500],        // #84CC16 - Active charging
  chargingGlow: electricLime[300],    // #BEF264 - Glow effect
  available: cyan[600],               // #0891B2 - Available
  occupied: amber[500],               // #F59E0B - In use

  // Overlays - Professional Depth
  overlay: 'rgba(15, 23, 42, 0.7)',   // Slate 900 with transparency
  overlayLight: 'rgba(15, 23, 42, 0.5)',
  overlayHeavy: 'rgba(15, 23, 42, 0.85)',
  overlayWarm: 'rgba(8, 145, 178, 0.08)',  // Cyan overlay

  // Glass Effects - Modern Glass
  glass: 'rgba(255, 255, 255, 0.75)',
  glassSubtle: 'rgba(255, 255, 255, 0.6)',
  glassStrong: 'rgba(255, 255, 255, 0.95)',
  glassBorder: 'rgba(226, 232, 240, 0.5)',
  glassWarm: 'rgba(236, 254, 255, 0.8)',   // Cyan tinted glass

  // Gradients - Dynamic & Clean
  gradientPrimary: [cyan[600], cyan[700]],           // Cyan gradient
  gradientCharge: [electricLime[400], electricLime[600]], // Charging gradient
  gradientPremium: [cyan[600], slate[700]],          // Premium
  gradientEnergy: ['#0891B2', '#84CC16'],            // Cyan to lime
  gradientEmber: ['#0891B2', '#06B6D4', '#22D3EE'],  // Cyan variants
  gradientSunrise: ['#A5F3FC', '#67E8F9', '#22D3EE'], // Light cyan
  gradientSpeed: ['#0891B2', '#22D3EE', '#FBBF24'],  // Fast charging
  gradientNight: [slate[800], slate[950]],           // Dark mode base
  gradientWarmth: ['#ECFEFF', '#CFFAFE', '#A5F3FC'], // Cyan background
  gradientFire: ['#FBBF24', '#0891B2', '#06B6D4'],   // Cyan energy
  gradientTech: [blue[500], cyan[600]],              // Blue meets cyan
};

// Dark Theme Colors - Sophisticated Night Mode with Cool Glow
export const DarkColors = {
  // Primary - Glowing Cyan
  primary: cyan[500],                 // #06B6D4 - Bright cyan
  primaryLight: cyan[400],            // #22D3EE - Lighter glow
  primaryDark: cyan[600],             // #0891B2 - Deeper cyan
  primarySubtle: cyan[950],           // #083344 - Subtle tint

  // Secondary - Lighter Slate
  secondary: slate[500],              // #64748B - Softer in dark
  secondaryLight: slate[400],         // #94A3B8 - Lighter
  secondaryDark: slate[600],          // #475569 - Deeper
  secondarySubtle: slate[950],        // #020617 - Subtle backgrounds

  // Accent - Bright Lime Glow
  accent: electricLime[400],          // #A3E635 - Bright in dark
  accentLight: electricLime[300],     // #BEF264 - Hover
  accentDark: electricLime[500],      // #84CC16 - Active
  accentSubtle: electricLime[950],    // #1A2E05 - Subtle tint

  // Additional Accents - Night Mode
  accentBlue: blue[400],              // #60A5FA - Bright blue
  accentAmber: amber[400],            // #FBBF24 - Warm gold
  accentGold: amber[300],             // #FCD34D - Bright gold
  accentPurple: '#C4B5FD',            // Lighter purple
  accentCyan: cyan[400],              // #22D3EE - Brighter cyan
  accentRed: red[400],                // #F87171 - Bright red

  // Background - Rich Dark
  background: slate[950],             // #020617 - Almost black
  backgroundSecondary: slate[900],    // #0F172A - Elevated
  backgroundTertiary: slate[800],     // #1E293B - Cards

  // Surface - Dark Layers
  surface: slate[900],                // #0F172A - Slightly lighter
  surfaceElevated: slate[800],        // #1E293B - Raised
  surfaceOverlay: 'rgba(15, 23, 42, 0.96)',
  surfaceTinted: 'rgba(8, 51, 68, 0.12)',  // Cyan tint

  // Text - Optimized Contrast
  textPrimary: '#FFFFFF',             // White
  textSecondary: slate[400],          // #94A3B8 - Secondary
  textTertiary: slate[500],           // #64748B - Hints
  textDisabled: slate[600],           // #475569 - Disabled
  textInverse: slate[950],            // Dark on light
  textAccent: cyan[400],              // #22D3EE - Cyan highlights

  // Border - Subtle Dark
  border: 'rgba(148, 163, 184, 0.15)',     // Subtle border
  borderLight: 'rgba(148, 163, 184, 0.08)', // Very subtle
  borderStrong: 'rgba(148, 163, 184, 0.25)', // Emphasized
  borderAccent: 'rgba(6, 182, 212, 0.3)',   // Cyan glow

  // States - Dark Adjusted
  success: electricLime[500],         // #84CC16
  successLight: electricLime[950],    // #1A2E05
  successDark: electricLime[600],     // #65A30D

  warning: amber[400],                // #FBBF24
  warningLight: amber[950],           // #451A03
  warningDark: amber[600],            // #D97706

  error: red[500],                    // #EF4444
  errorLight: red[950],               // #450A0A
  errorDark: red[600],                // #DC2626

  info: blue[400],                    // #60A5FA
  infoLight: blue[950],               // #172554
  infoDark: blue[600],                // #2563EB

  // Special States
  charging: electricLime[400],        // #A3E635 - Bright charging
  chargingGlow: electricLime[300],    // #BEF264 - Intense glow
  available: cyan[400],               // #22D3EE - Available
  occupied: amber[400],               // #FBBF24 - In use

  // Overlays - Dark Mode
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayHeavy: 'rgba(0, 0, 0, 0.85)',
  overlayWarm: 'rgba(6, 182, 212, 0.12)',  // Cyan glow overlay

  // Glass Effects - Dark Glass with Glow
  glass: 'rgba(15, 23, 42, 0.7)',
  glassSubtle: 'rgba(15, 23, 42, 0.5)',
  glassStrong: 'rgba(15, 23, 42, 0.85)',
  glassBorder: 'rgba(148, 163, 184, 0.12)',
  glassWarm: 'rgba(8, 51, 68, 0.3)',       // Cyan glass

  // Gradients - Night Versions with Glow
  gradientPrimary: [cyan[400], cyan[600]],           // Cyan glow
  gradientCharge: [electricLime[300], electricLime[500]], // Charging
  gradientPremium: [cyan[500], slate[800]],          // Premium dark
  gradientEnergy: ['#22D3EE', '#A3E635'],            // Cyan to green
  gradientEmber: ['#22D3EE', '#06B6D4', '#0891B2'],  // Night cyan
  gradientNight: [slate[900], slate[950]],           // Deep dark
  gradientNeon: ['#22D3EE', '#67E8F9', '#FCD34D'],   // Neon glow
  gradientMidnight: [slate[900], blue[900]],         // Blue-black
  gradientFire: ['#FCD34D', '#22D3EE', '#06B6D4'],   // Cyan glow
  gradientCoal: [slate[800], slate[950]],            // Hot coal
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

  // Colored Glows - Cyan & Energy
  primaryGlow: {
    shadowColor: '#0891B2',      // Cyan 600
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: '#84CC16',      // Lime 500
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  cyanGlow: {
    shadowColor: '#06B6D4',      // Cyan 500
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  lightGlow: {
    shadowColor: '#67E8F9',      // Cyan 300
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