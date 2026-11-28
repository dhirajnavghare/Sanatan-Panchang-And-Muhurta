import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { getAppTheme, Typography } from '@/src/utils/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
}

/**
 * Standardized section header enforcing consistent typography, spacing, and trailing controls.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  rightSlot,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={[Typography.sectionHeading, { color: theme.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[Typography.bodyMuted, { color: theme.textMuted, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  textCol: {
    flex: 1,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
