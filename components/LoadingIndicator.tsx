import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle, Text, View, useColorScheme } from 'react-native';
import { Radius } from '@/constants/Colors';
import { getAppTheme, Typography } from '@/src/utils/theme';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
  inline?: boolean;
}

export function LoadingIndicator({
  message,
  size = 'large',
  style,
  inline = false,
}: LoadingIndicatorProps) {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  if (inline) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLiveRegion="polite"
        accessibilityLabel={message || 'Loading'}
        style={[styles.inlineContainer, style]}
      >
        <ActivityIndicator size={size} color={theme.primary} />
        {message ? (
          <Text style={[styles.inlineMessage, { color: theme.text }]}>
            {message}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={message || 'Loading'}
      style={[
        styles.cardContainer,
        { backgroundColor: theme.card, borderColor: theme.border },
        style,
      ]}
    >
      <View style={[styles.symbolBadge, { backgroundColor: theme.primaryBg }]}>
        <Text style={styles.symbolText}>ॐ</Text>
      </View>
      <ActivityIndicator size={size} color={theme.primary} />
      {message ? (
        <Text style={[styles.message, { color: theme.text }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  inlineMessage: {
    ...Typography.body,
    flexShrink: 1,
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginVertical: 16,
    gap: 12,
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 20,
    color: '#d97706',
    fontWeight: 'bold',
  },
  message: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
