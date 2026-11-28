import React, { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius } from '@/constants/Colors';
import { COMFORT_TOUCH_TARGET, getAppTheme, Typography } from '@/src/utils/theme';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  iconName?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

/**
 * Standardized accessible button with >= 44px touch target, disabled state,
 * spinner guard against double-taps, and reduced-motion-aware press scale.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  iconName,
  loading = false,
  disabled = false,
  testID,
  accessibilityLabel,
  style,
  textStyle,
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const reduceMotion = useReducedMotion();
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const isBlocked = disabled || loading;

  const animatePress = (toValue: number) => {
    if (reduceMotion || isBlocked) return;
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start();
  };

  const palette = (() => {
    if (isBlocked && variant !== 'ghost') {
      return {
        bg: theme.disabledBg,
        border: theme.disabledBorder,
        fg: theme.disabledText,
      };
    }
    switch (variant) {
      case 'secondary':
        return { bg: theme.primaryBg, border: theme.primaryBorder, fg: theme.primary };
      case 'outline':
        return { bg: theme.card, border: theme.border, fg: theme.text };
      case 'danger':
        return { bg: '#b91c1c', border: '#b91c1c', fg: '#ffffff' };
      case 'ghost':
        return { bg: 'transparent', border: 'transparent', fg: theme.primary };
      case 'primary':
      default:
        return { bg: theme.primary, border: theme.primary, fg: '#ffffff' };
    }
  })();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityState={{ disabled: isBlocked, busy: loading }}
        disabled={isBlocked}
        onPress={onPress}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        style={({ pressed }) => [
          styles.base,
          {
            backgroundColor: palette.bg,
            borderColor: palette.border,
            opacity: pressed && !isBlocked ? 0.88 : isBlocked ? 0.72 : 1,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={palette.fg} />
        ) : (
          <>
            {iconName ? <Ionicons name={iconName} size={18} color={palette.fg} /> : null}
            <Text style={[Typography.button, styles.label, { color: palette.fg }, textStyle]}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: COMFORT_TOUCH_TARGET,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    textAlign: 'center',
    flexShrink: 1,
  },
});
