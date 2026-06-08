export const colors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#4ADE80',
  secondary: '#10B981',
  accent: '#FACC15',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F59E0B',
  white: '#FFFFFF',
  black: '#000000',
};

/** Reusable gradient stops for the modern glassmorphism look. */
export const gradients = {
  brand: ['#22C55E', '#15803D'] as const,
  brandVivid: ['#4ADE80', '#16A34A', '#15803D'] as const,
  accent: ['#FDE047', '#22C55E'] as const,
  sun: ['#FDE047', '#FACC15', '#F59E0B'] as const,
  darkHero: ['#052E16', '#14532D'] as const,
};

export const lightTheme = {
  colors: {
    ...colors,
    background: '#F0FDF4',
    surface: '#FFFFFF',
    surfaceVariant: '#DCFCE7',
    text: '#0B1F14',
    textSecondary: '#4B6356',
    textTertiary: '#9DB5A8',
    border: '#D7F0DF',
    divider: '#E8F8EE',
    card: '#FFFFFF',
    shadow: 'rgba(21, 128, 61, 0.12)',
    overlay: 'rgba(11, 31, 20, 0.5)',
    tabBar: 'rgba(255, 255, 255, 0.85)',
    tabBarBorder: 'rgba(22, 163, 74, 0.12)',
    statusBar: 'dark' as 'dark' | 'light',
    // Glassmorphism surfaces
    glass: 'rgba(255, 255, 255, 0.65)',
    glassStrong: 'rgba(255, 255, 255, 0.85)',
    glassBorder: 'rgba(22, 163, 74, 0.18)',
    glassHighlight: 'rgba(255, 255, 255, 0.9)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
    bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
  },
};

export const darkTheme: typeof lightTheme = {
  ...lightTheme,
  colors: {
    ...colors,
    background: '#06140C',
    surface: '#0E2418',
    surfaceVariant: '#143123',
    text: '#ECFDF3',
    textSecondary: '#A9CBB7',
    textTertiary: '#6E8C7B',
    border: '#1E3A2A',
    divider: '#0E2418',
    card: '#0E2418',
    shadow: 'rgba(0, 0, 0, 0.45)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: 'rgba(14, 36, 24, 0.85)',
    tabBarBorder: 'rgba(74, 222, 128, 0.16)',
    statusBar: 'light' as const,
    // Glassmorphism surfaces (dark)
    glass: 'rgba(20, 49, 35, 0.6)',
    glassStrong: 'rgba(20, 49, 35, 0.82)',
    glassBorder: 'rgba(74, 222, 128, 0.22)',
    glassHighlight: 'rgba(74, 222, 128, 0.12)',
  },
};

export type Theme = typeof lightTheme;
