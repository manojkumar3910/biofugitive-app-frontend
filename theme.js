// Biofugitive App - Premium Theme System with Light/Dark Mode
// Law Enforcement / Security Focused Design

import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

// ============================================
// 🎨 PREMIUM DARK COLOR PALETTE
// ============================================

// Base Dark Colors
const darkBase = {
  black: '#000000',
  background: '#030712',      // Near black with blue tint
  backgroundSecondary: '#0A0F1E', // Slightly lighter
  surface: '#111827',          // Card backgrounds
  surfaceElevated: '#1F2937',  // Modals, elevated surfaces
  surfaceHighlight: '#374151', // Hover/press states
  surfaceCard: '#1F2937',      // Card surface
  card: '#111827',             // Alias for card
};

// ============================================
// ☀️ PREMIUM LIGHT COLOR PALETTE
// ============================================

// Base Light Colors
const lightBase = {
  black: '#000000',
  background: '#F8FAFC',       // Light gray-blue
  backgroundSecondary: '#F1F5F9', // Slightly darker
  surface: '#FFFFFF',          // Pure white cards
  surfaceElevated: '#FFFFFF',  // White elevated surfaces
  surfaceHighlight: '#E2E8F0', // Hover/press states
  surfaceCard: '#FFFFFF',      // Card surface
  card: '#FFFFFF',             // Alias for card
};

// Accent Colors - Law Enforcement Theme (same for both modes)
const accents = {
  primary: '#3B82F6',          // Professional blue (trust)
  primaryLight: '#60A5FA',     // Lighter blue
  primaryDark: '#1D4ED8',      // Darker blue
  
  secondary: '#06B6D4',        // Cyan (tech/scanning)
  secondaryLight: '#22D3EE',
  secondaryDark: '#0891B2',
  
  accent: '#8B5CF6',           // Purple (premium feel)
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',
};

// Status Colors (same for both modes)
const status = {
  success: '#10B981',          // Verified/Cleared
  successLight: '#34D399',
  successDark: '#059669',
  successBg: 'rgba(16, 185, 129, 0.15)',
  
  warning: '#F59E0B',          // Alerts/Pending
  warningLight: '#FBBF24',
  warningDark: '#D97706',
  warningBg: 'rgba(245, 158, 11, 0.15)',
  
  danger: '#EF4444',           // Critical/Wanted
  dangerLight: '#F87171',
  dangerDark: '#DC2626',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.15)',
};

// Text Colors - Dark Mode
const textDark = {
  primary: '#F9FAFB',          // White text
  secondary: '#9CA3AF',        // Gray text
  muted: '#6B7280',            // Disabled/placeholder
  inverse: '#030712',          // On light backgrounds
  link: '#60A5FA',             // Links
};

// Text Colors - Light Mode
const textLight = {
  primary: '#111827',          // Dark text
  secondary: '#4B5563',        // Gray text
  muted: '#9CA3AF',            // Disabled/placeholder
  inverse: '#F9FAFB',          // On dark backgrounds
  link: '#2563EB',             // Links
};

// Border Colors - Dark Mode
const bordersDark = {
  subtle: 'rgba(255, 255, 255, 0.06)',
  default: 'rgba(255, 255, 255, 0.1)',
  strong: 'rgba(255, 255, 255, 0.15)',
  focus: accents.primary,
};

// Border Colors - Light Mode
const bordersLight = {
  subtle: 'rgba(0, 0, 0, 0.06)',
  default: 'rgba(0, 0, 0, 0.1)',
  strong: 'rgba(0, 0, 0, 0.15)',
  focus: accents.primary,
};

// Gradient Presets - Dark Mode
const gradientsDark = {
  primary: ['#3B82F6', '#1D4ED8'],
  secondary: ['#06B6D4', '#0891B2'],
  accent: ['#8B5CF6', '#7C3AED'],
  dark: ['#111827', '#030712'],
  card: ['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)'],
  danger: ['#EF4444', '#DC2626'],
  success: ['#10B981', '#059669'],
  mesh: ['#0A0F1E', '#111827', '#030712'],
  glow: ['rgba(59, 130, 246, 0.3)', 'transparent'],
};

// Gradient Presets - Light Mode
const gradientsLight = {
  primary: ['#3B82F6', '#2563EB'],
  secondary: ['#06B6D4', '#0891B2'],
  accent: ['#8B5CF6', '#7C3AED'],
  dark: ['#E2E8F0', '#CBD5E1'],
  card: ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.95)'],
  danger: ['#EF4444', '#DC2626'],
  success: ['#10B981', '#059669'],
  mesh: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
  glow: ['rgba(59, 130, 246, 0.2)', 'transparent'],
};

// Glassmorphism Styles - Dark Mode
const glassDark = {
  background: 'rgba(17, 24, 39, 0.75)',
  backgroundLight: 'rgba(31, 41, 55, 0.6)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  blur: 20,
  blurIntense: 40,
};

// Glassmorphism Styles - Light Mode
const glassLight = {
  background: 'rgba(255, 255, 255, 0.75)',
  backgroundLight: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.12)',
  blur: 20,
  blurIntense: 40,
};

// ============================================
// 📐 SPACING SYSTEM (8px base)
// ============================================

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
};

// ============================================
// 🔤 TYPOGRAPHY
// ============================================

export const typography = {
  // Display - for hero text
  display: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    lineHeight: 56,
    letterSpacing: -1,
  },
  
  // Headlines
  h1: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 28,
  },
  
  // Subtitles
  subtitle1: {
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
    lineHeight: 26,
  },
  subtitle2: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    lineHeight: 24,
  },
  
  // Body
  body1: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  
  // Captions & Labels
  caption: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  
  // Buttons
  button: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 20,
  },
  
  // Special
  mono: {
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  stat: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  // Title style (used in HomeScreen)
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  
  // Size shortcuts for quick access
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
  },
  
  // Font weight shortcuts
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ============================================
// 🔲 BORDER RADIUS
// ============================================

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 9999,
};

// ============================================
// 🌫️ SHADOWS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  glow: (color = accents.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  }),
  glowSmall: (color = accents.primary) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  }),
};

// ============================================
// ⏱️ ANIMATION
// ============================================

export const animation = {
  // Durations
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 800,
  
  // Spring configs for Reanimated
  spring: {
    gentle: { damping: 20, stiffness: 100, mass: 1 },
    bouncy: { damping: 10, stiffness: 100, mass: 0.5 },
    stiff: { damping: 20, stiffness: 300, mass: 0.8 },
    wobbly: { damping: 8, stiffness: 180, mass: 0.5 },
  },
  
  // Easing
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// ============================================
// 🎨 COMBINED COLORS EXPORT (Dark - default)
// ============================================

export const colors = {
  ...darkBase,
  ...accents,
  ...status,
  text: textDark,
  borders: bordersDark,
  gradients: gradientsDark,
  glass: glassDark,
};

// ============================================
// 📱 REACT NATIVE PAPER THEMES
// ============================================

// Dark Paper Theme
export const paperThemeDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: accents.primary,
    primaryContainer: accents.primaryDark,
    secondary: accents.secondary,
    secondaryContainer: accents.secondaryDark,
    tertiary: accents.accent,
    background: darkBase.background,
    surface: darkBase.surface,
    surfaceVariant: darkBase.surfaceElevated,
    error: status.danger,
    errorContainer: status.dangerBg,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: textDark.primary,
    onSurface: textDark.primary,
    onSurfaceVariant: textDark.secondary,
    outline: bordersDark.default,
    elevation: {
      level0: 'transparent',
      level1: darkBase.surface,
      level2: darkBase.surfaceElevated,
      level3: darkBase.surfaceHighlight,
      level4: darkBase.surfaceHighlight,
      level5: darkBase.surfaceHighlight,
    },
  },
  roundness: borderRadius.md,
  dark: true,
};

// Light Paper Theme
export const paperThemeLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: accents.primary,
    primaryContainer: accents.primaryLight,
    secondary: accents.secondary,
    secondaryContainer: accents.secondaryLight,
    tertiary: accents.accent,
    background: lightBase.background,
    surface: lightBase.surface,
    surfaceVariant: lightBase.surfaceElevated,
    error: status.danger,
    errorContainer: status.dangerBg,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: textLight.primary,
    onSurface: textLight.primary,
    onSurfaceVariant: textLight.secondary,
    outline: bordersLight.default,
    elevation: {
      level0: 'transparent',
      level1: lightBase.surface,
      level2: lightBase.surfaceElevated,
      level3: lightBase.surfaceHighlight,
      level4: lightBase.surfaceHighlight,
      level5: lightBase.surfaceHighlight,
    },
  },
  roundness: borderRadius.md,
  dark: false,
};

// Backward compatibility
export const paperTheme = paperThemeDark;

// ============================================
// 🌗 LIGHT/DARK COLOR SETS (for App.js)
// ============================================

// Dark colors (full set)
export const darkColors = {
  // Base
  ...darkBase,
  ...accents,
  ...status,
  // Text (flat access)
  text: textDark.primary,
  textSecondary: textDark.secondary,
  textMuted: textDark.muted,
  textInverse: textDark.inverse,
  textLink: textDark.link,
  // Nested text (for components that need it)
  textColors: textDark,
  // Borders (flat access)
  border: bordersDark.default,
  borderSubtle: bordersDark.subtle,
  borderStrong: bordersDark.strong,
  borderFocus: bordersDark.focus,
  // Nested borders
  borders: bordersDark,
  // Gradients
  gradients: gradientsDark,
  // Glass
  glass: glassDark,
  inputBackground: glassDark.background,
  // Tab bar
  tabBar: darkBase.surface,
  tabBarInactive: textDark.muted,
  // Misc
  shimmer: 'rgba(255, 255, 255, 0.1)',
  card: darkBase.card,
  surfaceCard: darkBase.surfaceCard,
  // Paper theme
  paperTheme: paperThemeDark,
};

// Light colors (full set)
export const lightColors = {
  // Base
  ...lightBase,
  ...accents,
  ...status,
  // Text (flat access)
  text: textLight.primary,
  textSecondary: textLight.secondary,
  textMuted: textLight.muted,
  textInverse: textLight.inverse,
  textLink: textLight.link,
  // Nested text (for components that need it)
  textColors: textLight,
  // Borders (flat access)
  border: bordersLight.default,
  borderSubtle: bordersLight.subtle,
  borderStrong: bordersLight.strong,
  borderFocus: bordersLight.focus,
  // Nested borders
  borders: bordersLight,
  // Gradients
  gradients: gradientsLight,
  // Glass
  glass: glassLight,
  inputBackground: glassLight.background,
  // Tab bar
  tabBar: lightBase.surface,
  tabBarInactive: textLight.muted,
  // Misc
  shimmer: 'rgba(0, 0, 0, 0.08)',
  card: lightBase.card,
  surfaceCard: lightBase.surfaceCard,
  // Paper theme
  paperTheme: paperThemeLight,
};

// ============================================
// 📦 DEFAULT EXPORT
// ============================================

const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
  paper: paperThemeDark,
  // Theme variants
  light: { paper: paperThemeLight, colors: lightColors },
  dark: { paper: paperThemeDark, colors: darkColors },
};

export default theme;
