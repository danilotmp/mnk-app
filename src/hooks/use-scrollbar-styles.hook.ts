/**
 * Hook para aplicar estilos de scrollbar adaptados al tema
 * Solo funciona en web, en móvil no aplica cambios
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from './use-theme.hook';

export function useScrollbarStyles() {
  const theme = useTheme();
  const colors = theme?.theme?.colors;
  const isDark = theme?.isDark || false;

  useEffect(() => {
    // Solo aplicar estilos en web
    if (Platform.OS !== 'web') {
      return;
    }

    // Validar que colors esté disponible
    if (!colors) {
      return;
    }

    // Crear o actualizar el estilo del scrollbar
    const styleId = 'scrollbar-theme-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Solo aplicar estilos personalizados en modo oscuro
    // En modo claro, mantener el scrollbar por defecto (blanco)
    if (!isDark) {
      // En modo claro, eliminar estilos personalizados para usar el scrollbar por defecto
      styleElement.textContent = '';
      return;
    }

    // Colores del scrollbar para modo oscuro
    const scrollbarTrackColor = 'transparent';  // Fondo del track en modo oscuro
    const scrollbarThumbColor = colors.tabIconDefault;  // Color del thumb en modo oscuro
    const scrollbarThumbHoverColor = colors.borderLight;  // Color del thumb al hover en modo oscuro

    // Estilos CSS para el scrollbar (solo en modo oscuro)
    styleElement.textContent = `
      /* Webkit browsers (Chrome, Safari, Edge) */
      *::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      *::-webkit-scrollbar-track {
        background: ${scrollbarTrackColor};
        border-radius: 6px;
      }

      *::-webkit-scrollbar-thumb {
        background: ${scrollbarThumbColor};
        border-radius: 6px;
        border: 2px solid ${scrollbarTrackColor};
      }

      *::-webkit-scrollbar-thumb:hover {
        background: ${scrollbarThumbHoverColor};
      }

      *::-webkit-scrollbar-corner {
        background: ${scrollbarTrackColor};
      }

      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: ${scrollbarThumbColor} ${scrollbarTrackColor};
      }
    `;

    // Cleanup: no es necesario eliminar el estilo ya que se actualiza dinámicamente
  }, [colors, isDark, theme]);
}

