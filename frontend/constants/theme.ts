// Premium Theme Constants for SharaSpot

export const Colors = {
  // Primary Palette - Deep Electric Blues & Purples
  primary: '#2D3FE8',
  primaryDark: '#1E2BB8',
  primaryLight: '#4F5FF9',
  
  secondary: '#8B5CF6',
  secondaryDark: '#7C3AED',
  secondaryLight: '#A78BFA',
  
  // Accent Colors
  accent: '#06B6D4',
  accentOrange: '#F97316',
  accentPink: '#EC4899',
  accentGreen: '#10B981',
  
  // Gradients
  gradientPrimary: ['#2D3FE8', '#8B5CF6'],
  gradientSecondary: ['#06B6D4', '#2D3FE8'],
  gradientSunset: ['#F97316', '#EC4899'],
  gradientSuccess: ['#10B981', '#06B6D4'],
  
  // Neutrals
  background: '#F8FAFC',
  backgroundDark: '#0F172A',
  surface: '#FFFFFF',
  surfaceDark: '#1E293B',
  
  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  textDark: '#FFFFFF',
  
  // States
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  glassLight: 'rgba(255, 255, 255, 0.8)',
  glassDark: 'rgba(30, 41, 59, 0.8)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  colored: {
    shadowColor: '#2D3FE8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Animations = {
  fast: 200,
  normal: 300,
  slow: 500,
};
