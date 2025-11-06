/**
 * Estilos para el componente Tooltip
 */

import { StyleSheet } from 'react-native';

export const createTooltipStyles = () =>
  StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 9999, // Z-index muy alto para contenedor
    },
    tooltip: {
      position: 'absolute',
      zIndex: 99999, // Z-index extremadamente alto para estar por encima de todo
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 10, // Elevación alta para Android
      minWidth: 60,
      maxWidth: 600, // Aumentado significativamente para permitir crecimiento horizontal y mostrar texto completo en 2 líneas
    },
    tooltipTop: {
      bottom: '100%',
      marginBottom: 2, // Reducido de 4 a 2 para estar más cerca del botón
      alignSelf: 'center',
    },
    tooltipBottom: {
      top: '100%',
      marginTop: 4,
      alignSelf: 'center',
    },
    tooltipLeft: {
      right: '100%',
      marginRight: 0, // Reducido a 0 para estar más cerca del botón
      alignSelf: 'flex-start',
      marginTop: -12, // Aumentado de -8 a -12 para estar más arriba
    },
    tooltipRight: {
      left: '100%',
      marginLeft: 4,
      alignSelf: 'center',
    },
    tooltipText: {
      fontSize: 12,
      textAlign: 'center',
      flexShrink: 0, // No comprimir el texto
      // El color se establecerá dinámicamente según el tema
    },
  });
