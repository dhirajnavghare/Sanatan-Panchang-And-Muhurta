import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAppTheme, MIN_TOUCH_TARGET, Typography } from '@/src/utils/theme';

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  closeTestID?: string;
  closeAccessibilityLabel?: string;
  leadingEmoji?: string;
}

/**
 * Standardized accessible modal sheet header with a comfortable >= 44dp close button
 * and natural wrapping title/subtitle across system font sizes.
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  subtitle,
  onClose,
  closeTestID,
  closeAccessibilityLabel = 'Close',
  leadingEmoji,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);

  return (
    <View style={[styles.header, { borderBottomColor: theme.borderSubtle }]}>
      <View style={styles.titleRow}>
        {leadingEmoji ? <Text style={styles.emoji}>{leadingEmoji}</Text> : null}
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        testID={closeTestID}
        accessibilityRole="button"
        accessibilityLabel={closeAccessibilityLabel}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        onPress={onClose}
        activeOpacity={0.75}
        style={[
          styles.closeBtn,
          { backgroundColor: theme.cardMuted, borderColor: theme.border },
        ]}
      >
        <Ionicons name="close" size={22} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  emoji: {
    fontSize: 22,
    marginTop: 1,
  },
  textCol: {
    flex: 1,
  },
  title: {
    ...Typography.sectionHeading,
  },
  subtitle: {
    ...Typography.bodyMuted,
    marginTop: 3,
  },
  closeBtn: {
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
