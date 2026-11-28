import React from 'react';
import { StyleProp, StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Colors';
import { getAppTheme, Typography } from '@/src/utils/theme';
import { AppButton } from './AppButton';

interface ScreenStateViewProps {
  iconEmoji?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  actionTestID?: string;
  onAction?: () => void;
  tone?: 'empty' | 'error';
  testID?: string;
}

/**
 * Reusable accessible empty/error card with clear human copy and single recovery CTA.
 */
export const ScreenStateView: React.FC<ScreenStateViewProps> = ({
  iconEmoji,
  iconName,
  title,
  description,
  actionLabel,
  actionTestID,
  onAction,
  tone = 'empty',
  testID,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const isError = tone === 'error';

  return (
    <View
      testID={testID}
      accessibilityRole={isError ? 'alert' : undefined}
      accessibilityLiveRegion={isError ? 'polite' : undefined}
      style={[
        styles.container,
        {
          backgroundColor: isError ? theme.dangerBg : theme.card,
          borderColor: isError ? theme.dangerBorder : theme.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isError ? theme.card : theme.primaryBg },
        ]}
      >
        {iconName ? (
          <Ionicons name={iconName} size={26} color={isError ? theme.dangerText : theme.primary} />
        ) : (
          <Text style={styles.emoji}>{iconEmoji || (isError ? '⚠️' : '🔍')}</Text>
        )}
      </View>

      <Text style={[styles.title, { color: isError ? theme.dangerText : theme.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: isError ? theme.textSecondary : theme.textMuted }]}>
        {description}
      </Text>

      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <AppButton
            testID={actionTestID}
            label={actionLabel}
            onPress={onAction}
            variant={isError ? 'danger' : 'primary'}
            iconName={isError ? 'refresh' : 'options-outline'}
          />
        </View>
      ) : null}
    </View>
  );
};

interface InlineFeedbackBannerProps {
  tone: 'success' | 'error' | 'info' | 'warning';
  message: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Consistent inline feedback banner for forms, settings updates, and validation alerts.
 */
export const InlineFeedbackBanner: React.FC<InlineFeedbackBannerProps> = ({
  tone,
  message,
  testID,
  style,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  const colors = {
    success: { bg: theme.successBg, border: theme.successBorder, fg: theme.successText, icon: 'checkmark-circle' as const },
    error: { bg: theme.dangerBg, border: theme.dangerBorder, fg: theme.dangerText, icon: 'alert-circle' as const },
    warning: { bg: theme.warningBg, border: theme.warningBorder, fg: theme.warningText, icon: 'warning' as const },
    info: { bg: theme.infoBg, border: theme.infoBorder, fg: theme.infoText, icon: 'information-circle' as const },
  }[tone];

  return (
    <View
      testID={testID}
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      style={[
        styles.banner,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Ionicons name={colors.icon} size={17} color={colors.fg} />
      <Text style={[styles.bannerText, { color: colors.fg }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    ...Typography.sectionHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  desc: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 360,
  },
  actionWrap: {
    marginTop: 18,
    minWidth: 180,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  bannerText: {
    ...Typography.bodyMuted,
    fontWeight: '700',
    flex: 1,
  },
});
