export const colors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  error: '#EF4444',
  success: '#22C55E',
  warning: '#F97316',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightTheme = {
  colors: {
    ...colors,
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceVariant: '#F3F4F6',
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    card: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
    statusBar: 'dark' as 'dark' | 'light',
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
    background: '#111827',
    surface: '#1F2937',
    surfaceVariant: '#374151',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    border: '#374151',
    divider: '#1F2937',
    card: '#1F2937',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tabBar: '#1F2937',
    tabBarBorder: '#374151',
    statusBar: 'light' as const,
  },
};

export type Theme = typeof lightTheme;
