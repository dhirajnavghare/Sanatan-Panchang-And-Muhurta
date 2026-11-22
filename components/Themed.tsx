/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */
import { Text as DefaultText, View as DefaultView } from 'react-native';

import { useColorScheme } from './useColorScheme';

import Colors from '@/constants/Colors';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & React.ComponentProps<typeof DefaultText>;
export type ViewProps = ThemeProps & React.ComponentProps<typeof DefaultView>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const themeColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const hasExplicitColor = lightColor !== undefined || darkColor !== undefined;
  const color = hasExplicitColor ? themeColor : undefined;

  return <DefaultText style={[color ? { color } : undefined, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const themeColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const hasExplicitColor = lightColor !== undefined || darkColor !== undefined;
  const backgroundColor = hasExplicitColor ? themeColor : undefined;

  return (
    <DefaultView
      style={[backgroundColor ? { backgroundColor } : undefined, style]}
      {...otherProps}
    />
  );
}
