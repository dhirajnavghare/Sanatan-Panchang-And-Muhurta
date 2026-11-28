import { Palette } from '@/constants/Colors';

export const MIN_TOUCH_TARGET = 44;
export const COMFORT_TOUCH_TARGET = 48;

export interface AppThemeTokens {
  isDark: boolean;
  bg: string;
  surface: string;
  elevatedSurface: string;
  card: string;
  cardMuted: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  disabledBg: string;
  disabledText: string;
  disabledBorder: string;
  primary: string;
  primaryHover: string;
  primaryBg: string;
  primaryBorder: string;
  inputBg: string;
  inputBorder: string;
  headerBg: string;
  warningBg: string;
  warningText: string;
  warningBorder: string;
  dangerBg: string;
  dangerText: string;
  dangerBorder: string;
  successBg: string;
  successText: string;
  successBorder: string;
  infoBg: string;
  infoText: string;
  infoBorder: string;
}

export const Typography = {
  screenTitle: { fontSize: 22, fontWeight: '800' as const, lineHeight: 29 },
  sectionHeading: { fontSize: 18, fontWeight: '800' as const, lineHeight: 25 },
  cardTitle: { fontSize: 16, fontWeight: '700' as const, lineHeight: 23 },
  body: { fontSize: 15, fontWeight: '500' as const, lineHeight: 22 },
  bodyMuted: { fontSize: 14, fontWeight: '500' as const, lineHeight: 21 },
  label: { fontSize: 13.5, fontWeight: '700' as const, lineHeight: 19 },
  caption: { fontSize: 12.5, fontWeight: '600' as const, lineHeight: 18 },
  button: { fontSize: 15, fontWeight: '700' as const, lineHeight: 20 },
  numeric: { fontSize: 20, fontWeight: '800' as const, lineHeight: 26 },
};

export const Elevation = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 8,
  },
};

/**
 * Shared light/dark color token helper grounded in Palette.
 * Preserves exact light-mode values while providing WCAG-compliant dark-mode surfaces.
 */
export function getAppTheme(isDark: boolean): AppThemeTokens {
  if (!isDark) {
    return {
      isDark: false,
      bg: Palette.bgLight,
      surface: Palette.surfaceLight,
      elevatedSurface: '#ffffff',
      card: Palette.cardLight,
      cardMuted: '#f4f4f5',
      border: Palette.borderLight,
      borderSubtle: Palette.borderSubtleLight,
      text: Palette.textLight,
      textSecondary: Palette.textSecondaryLight,
      textMuted: Palette.textMutedLight,
      textSubtle: Palette.textSubtleLight,
      disabledBg: '#f4f4f5',
      disabledText: '#71717a',
      disabledBorder: '#e4e4e7',
      primary: Palette.primary,
      primaryHover: Palette.primaryHover,
      primaryBg: Palette.primaryLight,
      primaryBorder: Palette.primaryBorder,
      inputBg: '#f4f4f5',
      inputBorder: '#e4e4e7',
      headerBg: '#ffffff',
      warningBg: Palette.warningBg,
      warningText: Palette.warningText,
      warningBorder: Palette.warningBorder,
      dangerBg: Palette.dangerBg,
      dangerText: Palette.dangerText,
      dangerBorder: Palette.dangerBorder,
      successBg: Palette.successBg,
      successText: Palette.successText,
      successBorder: Palette.successBorder,
      infoBg: Palette.infoBg,
      infoText: Palette.infoText,
      infoBorder: Palette.infoBorder,
    };
  }

  return {
    isDark: true,
    bg: Palette.bgDark,
    surface: Palette.surfaceDark,
    elevatedSurface: '#22222c',
    card: Palette.cardDark,
    cardMuted: '#27272a',
    border: Palette.borderDark,
    borderSubtle: Palette.borderSubtleDark,
    text: Palette.textDark,
    textSecondary: Palette.textSecondaryDark,
    textMuted: Palette.textMutedDark,
    textSubtle: Palette.textSubtleDark,
    disabledBg: '#1f1f27',
    disabledText: '#71717a',
    disabledBorder: '#2e2e38',
    primary: Palette.accent,
    primaryHover: Palette.primary,
    primaryBg: 'rgba(245, 158, 11, 0.14)',
    primaryBorder: 'rgba(245, 158, 11, 0.35)',
    inputBg: '#22222c',
    inputBorder: '#3f3f46',
    headerBg: Palette.surfaceDark,
    warningBg: 'rgba(245, 158, 11, 0.14)',
    warningText: '#fcd34d',
    warningBorder: 'rgba(245, 158, 11, 0.35)',
    dangerBg: 'rgba(239, 68, 68, 0.14)',
    dangerText: '#fca5a5',
    dangerBorder: 'rgba(239, 68, 68, 0.35)',
    successBg: 'rgba(16, 185, 129, 0.14)',
    successText: '#6ee7b7',
    successBorder: 'rgba(16, 185, 129, 0.35)',
    infoBg: 'rgba(2, 132, 199, 0.14)',
    infoText: '#7dd3fc',
    infoBorder: 'rgba(2, 132, 199, 0.35)',
  };
}

/**
 * Returns a clean single devotee display name without duplicating "साधक" / "Sadhak".
 */
export function displayProfileName(rawName: string | undefined | null, isHi: boolean): string {
  const trimmed = (rawName || '').trim();
  if (!trimmed || trimmed === 'साधक' || trimmed.toLowerCase() === 'sadhak') {
    return isHi ? 'साधक' : 'Sadhak';
  }
  return trimmed;
}
