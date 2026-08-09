export const colors = {
  navy: '#0D1B2A',
  navyLight: '#16283D',
  tealDark: '#0F3D3E',
  teal: '#1B9C85',
  tealLight: '#4FC7AE',
  background: '#F7F9FB',
  cardBackground: '#FFFFFF',
  textPrimary: '#0D1B2A',
  textSecondary: '#8A94A6',
  textOnDark: '#FFFFFF',
  border: '#E7EBF0',
  priorityHigh: '#FF6B6B',
  priorityMedium: '#F5A623',
  priorityLow: '#4FC7AE',
  danger: '#FF4D4D',
};

export const gradients = {
  primary: [colors.tealDark, colors.teal] as const,
  navyToTeal: [colors.navy, colors.tealDark, colors.teal] as const,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodyMuted: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textSecondary },
  button: { fontSize: 15, fontWeight: '600' as const, color: colors.textOnDark },
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const priorityLabels: Record<string, string> = {
  high: 'Yuqori',
  medium: "O'rta",
  low: 'Past',
};

export const priorityColors: Record<string, string> = {
  high: colors.priorityHigh,
  medium: colors.priorityMedium,
  low: colors.priorityLow,
};
