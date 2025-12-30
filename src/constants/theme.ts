export const Colors = {
  light: {
    // Primary - Emergency Orange (matching web --primary: 24 100% 50%)
    primary: '#ff6600',
    primaryDark: '#e65c00',
    primaryLight: 'rgba(255, 102, 0, 0.1)',
    primaryShadow: 'rgba(255, 102, 0, 0.25)',
    // Backgrounds (matching web --background, --midnight-navy)
    background: '#ffffff',
    surface: '#fafafa',
    surfaceSecondary: '#f1f5f9',
    // Text colors (matching web --foreground, --muted-foreground)
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    // Borders (matching web --border)
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    white: '#ffffff',
    black: '#0f172a',
    // Additional colors for gradients
    midnightNavy: '#fafafa',
    deepBlue: '#ffffff',
    cardBorder: '#e2e8f0',
  },
  dark: {
    // Primary - Emergency Orange brighter (matching web dark --primary: 24 100% 55%)
    primary: '#ff7a1a',
    primaryDark: '#ff6600',
    primaryLight: 'rgba(255, 122, 26, 0.2)',
    primaryShadow: 'rgba(255, 122, 26, 0.3)',
    // Backgrounds (matching web dark --background: 213 45% 11%, --card: 216 36% 17%)
    background: '#0f1729',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    // Text colors (matching web dark --foreground, --muted-foreground)
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    // Borders (matching web dark --border)
    border: '#334155',
    borderLight: '#475569',
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    white: '#ffffff',
    black: '#0f1729',
    // Additional colors for gradients
    midnightNavy: '#0f1729',
    deepBlue: '#1e293b',
    cardBorder: '#475569',
  },
};

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
};

export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
