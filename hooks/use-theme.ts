import { BrandColors, DarkTheme, LightTheme, Typography } from '@/constants/theme';
import { useColorScheme } from './use-color-scheme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return {
    theme,
    colorScheme,
    colors: theme.colors,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    typography: Typography,
    brandColors: BrandColors,
    isDark: colorScheme === 'dark',
    isLight: colorScheme === 'light',
  };
}
