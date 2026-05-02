export const theme = {
  colors: {
    bg: '#0A1628',
    card: '#0F1E35',
    border: '#1F2E44',
    text: '#F9FAFB',
    textMuted: '#94A3B8',
    accent: '#1DB954',
    accentMuted: 'rgba(29,185,84,0.15)',
    danger: '#EF4444',
    warning: '#F59E0B',
  },
  spacing: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
  },
  radius: { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 },
  typography: {
    title: { fontSize: 24, fontWeight: '800' as const },
    h1: { fontSize: 20, fontWeight: '700' as const },
    h2: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    small: { fontSize: 13, fontWeight: '400' as const },
    tiny: { fontSize: 11, fontWeight: '500' as const },
  },
};