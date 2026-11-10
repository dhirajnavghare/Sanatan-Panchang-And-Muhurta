const tintColorLight = '#d97706'; // Warm amber-600
const tintColorDark = '#f59e0b';  // Golden amber-500

export const Palette = {
  // Brand / Saffron & Gold
  primary: '#d97706',
  primaryHover: '#b45309',
  primaryLight: '#fffbeb',
  primaryBorder: '#fde68a',
  accent: '#f59e0b',
  accentDark: '#92400e',

  // Neutrals (Light mode base)
  bgLight: '#f8f8fa',
  surfaceLight: '#ffffff',
  cardLight: '#ffffff',
  borderLight: '#e4e4e7',
  borderSubtleLight: '#f4f4f5',
  textLight: '#18181b',
  textSecondaryLight: '#52525b',
  textMutedLight: '#71717a',
  textSubtleLight: '#a1a1aa',

  // Neutrals (Dark mode base)
  bgDark: '#0e0e12',
  surfaceDark: '#16161c',
  cardDark: '#1a1a24',
  borderDark: '#27272a',
  borderSubtleDark: '#1f1f23',
  textDark: '#fafafa',
  textSecondaryDark: '#d4d4d8',
  textMutedDark: '#a1a1aa',
  textSubtleDark: '#71717a',

  // Semantics
  success: '#10b981',
  successBg: '#ecfdf5',
  successText: '#047857',
  successBorder: '#a7f3d0',

  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningText: '#b45309',
  warningBorder: '#fde68a',

  danger: '#ef4444',
  dangerBg: '#fef2f2',
  dangerText: '#b91c1c',
  dangerBorder: '#fecaca',

  info: '#0284c7',
  infoBg: '#eff6ff',
  infoText: '#0369a1',
  infoBorder: '#bae6fd',

  lavender: '#7c3aed',
  lavenderBg: '#ede9fe',
  lavenderText: '#5b21b6',
  lavenderBorder: '#ddd6fe',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  dockHeight: 64,
  dockClearance: 24,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  pill: 9999,
};

export default {
  light: {
    text: Palette.textLight,
    textSecondary: Palette.textSecondaryLight,
    textMuted: Palette.textMutedLight,
    background: Palette.bgLight,
    surface: Palette.surfaceLight,
    card: Palette.cardLight,
    border: Palette.borderLight,
    borderSubtle: Palette.borderSubtleLight,
    tint: tintColorLight,
    tabIconDefault: Palette.textSubtleLight,
    tabIconSelected: tintColorLight,
    accent: Palette.accent,
  },
  dark: {
    text: Palette.textDark,
    textSecondary: Palette.textSecondaryDark,
    textMuted: Palette.textMutedDark,
    background: Palette.bgDark,
    surface: Palette.surfaceDark,
    card: Palette.cardDark,
    border: Palette.borderDark,
    borderSubtle: Palette.borderSubtleDark,
    tint: tintColorDark,
    tabIconDefault: Palette.textMutedDark,
    tabIconSelected: tintColorDark,
    accent: Palette.accent,
  },
};
