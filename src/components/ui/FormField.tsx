import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  useColorScheme,
  View,
} from 'react-native';
import { Radius } from '@/constants/Colors';
import { COMFORT_TOUCH_TARGET, getAppTheme, Typography } from '@/src/utils/theme';

interface FormFieldProps extends TextInputProps {
  label: string;
  helperText?: string;
  errorText?: string | null;
  requiredLabel?: string;
  optionalLabel?: string;
  charCount?: { current: number; max: number };
  inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>;
}

/**
 * Age-friendly labeled form field with comfortable >= 48dp touch input area,
 * clear required/optional badges, plain helper description, and inline error feedback.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  errorText,
  requiredLabel,
  optionalLabel,
  charCount,
  inputRef,
  multiline,
  style,
  ...inputProps
}) => {
  const isDark = useColorScheme() === 'dark';
  const theme = getAppTheme(isDark);
  const hasError = Boolean(errorText);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <View style={styles.metaRow}>
          {requiredLabel ? (
            <View style={[styles.reqBadge, { backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }]}>
              <Text style={[styles.reqBadgeText, { color: theme.primary }]}>{requiredLabel}</Text>
            </View>
          ) : optionalLabel ? (
            <View style={[styles.optBadge, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
              <Text style={[styles.optBadgeText, { color: theme.textMuted }]}>{optionalLabel}</Text>
            </View>
          ) : null}
          {charCount ? (
            <Text style={[styles.counter, { color: theme.textMuted }]}>
              {charCount.current}/{charCount.max}
            </Text>
          ) : null}
        </View>
      </View>

      {helperText ? (
        <Text style={[styles.helper, { color: theme.textMuted }]}>{helperText}</Text>
      ) : null}

      <TextInput
        ref={inputRef}
        multiline={multiline}
        placeholderTextColor={theme.textSubtle}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg,
            borderColor: hasError ? theme.dangerBorder : theme.inputBorder,
            color: theme.text,
          },
          multiline && styles.textArea,
          style,
        ]}
        {...inputProps}
      />

      {errorText ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: theme.dangerText }]}>
          {errorText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  label: {
    ...Typography.label,
    fontSize: 14,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  reqBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  optBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  optBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  counter: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  helper: {
    ...Typography.bodyMuted,
    fontSize: 13.5,
  },
  input: {
    minHeight: COMFORT_TOUCH_TARGET,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 108,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
