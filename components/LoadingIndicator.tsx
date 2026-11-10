import React from 'react';
import { StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  if (inline) {
    return (
      <View style={[styles.inlineContainer, style]}>
        <ActivityIndicator size={size} color={theme.tint} />
        {message ? (
          <Text style={[styles.inlineMessage, { color: theme.text }]}>
            {message}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }, style]}>
      <View style={styles.symbolBadge}>
        <Text style={styles.symbolText}>ॐ</Text>
      </View>
      <ActivityIndicator size={size} color={theme.tint} />
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
    fontSize: 13,
    fontWeight: '500',
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    marginVertical: 16,
    gap: 12,
  },
  symbolBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 18,
    color: '#d97706',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
});
