import { ThemedText } from '@/components/themed-text';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useThemeMode } from '@/hooks/use-theme-mode';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface ThemeToggleProps {
  onToggle?: () => void;
}

/**
 * Componente para cambiar entre tema claro y oscuro
 * Muestra un icono que cambia según el tema actual
 */
export function ThemeToggle({ onToggle }: ThemeToggleProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { isDark, setThemeMode } = useThemeMode();

  // Iconos que cambian según el tema
  const lightIcon = '☀️'; // Sol para modo claro
  const darkIcon = '🌙';  // Luna para modo oscuro
  
  const currentIcon = isDark ? lightIcon : darkIcon;
  const tooltip = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  const handlePress = () => {
    // Cambiar tema real
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
    
    // Ejecutar callback si existe
    if (onToggle) {
      onToggle();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.themeToggle,
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        isMobile && styles.mobileThemeToggle
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel={tooltip}
      accessibilityHint="Toca para cambiar entre tema claro y oscuro"
    >
      <ThemedText style={styles.themeIcon}>
        {currentIcon}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  themeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileThemeToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  themeIcon: {
    fontSize: 16,
  },
});