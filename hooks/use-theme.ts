import { BrandColors, DarkTheme, LightTheme, Typography } from '@/constants/theme';
import { useThemeMode } from './use-theme-mode';

export function useTheme() {
  const { isDark } = useThemeMode();
  const theme = isDark ? DarkTheme : LightTheme;

  return {
    theme,
    colorScheme: isDark ? 'dark' : 'light',
    colors: theme.colors,
    spacing: theme.spacing,
    borderRadius: theme.borderRadius,
    shadows: theme.shadows,
    typography: Typography,
    brandColors: BrandColors,
    isDark,
    isLight: !isDark,
  };
}
