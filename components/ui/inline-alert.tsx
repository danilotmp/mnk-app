/**
 * Componente de alerta inline para mostrar dentro de modales
 * Se muestra directamente en el contenido sin problemas de z-index
 */

import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

export type InlineAlertType = 'error' | 'success' | 'warning' | 'info';

interface InlineAlertProps {
  readonly type: InlineAlertType;
  readonly message: string;
  readonly title?: string;
  readonly detail?: string;
  readonly onDismiss?: () => void;
  readonly duration?: number; // Duración en ms antes de auto-cerrar (0 = no auto-cerrar, default: 5000ms)
  readonly autoClose?: boolean; // Si true, se cierra automáticamente después de duration (default: true)
}

export function InlineAlert({
  type,
  message,
  title,
  detail,
  onDismiss,
  duration = 5000, // Default: 5 segundos, igual que el toast para errores
  autoClose = true, // Por defecto se cierra automáticamente
}: InlineAlertProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [visible, setVisible] = useState(true);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Usar los mismos colores que el Toast
  const alertColors = {
    error: {
      background: '#EF4444', // Rojo sólido como el Toast
      text: '#FFFFFF',
      icon: 'close-circle' as const,
    },
    success: {
      background: '#10B981', // Verde sólido como el Toast
      text: '#FFFFFF',
      icon: 'checkmark-circle' as const,
    },
    warning: {
      background: '#F59E0B', // Amarillo/Naranja sólido como el Toast
      text: '#FFFFFF',
      icon: 'warning' as const,
    },
    info: {
      background: '#3B82F6', // Azul sólido como el Toast
      text: '#FFFFFF',
      icon: 'information-circle' as const,
    },
  };

  const colorsForType = alertColors[type];

  const handleDismiss = React.useCallback(() => {
    // Cancelar el timer si existe
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  }, [fadeAnim, onDismiss]);

  useEffect(() => {
    // Animación de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto-cerrar si está habilitado y hay duración
    // Si el detalle está abierto, no cerrar automáticamente (igual que el toast)
    if (autoClose && !showDetail && duration > 0 && onDismiss) {
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, autoClose, showDetail, handleDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          backgroundColor: colorsForType.background,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Icono */}
        <View style={styles.iconContainer}>
          <Ionicons name={colorsForType.icon} size={24} color={colorsForType.text} />
        </View>

        {/* Contenido */}
        <View style={styles.textContainer}>
          {title && (
            <ThemedText
              type="body2"
              style={[styles.title, { color: colorsForType.text }]}
            >
              {title}
            </ThemedText>
          )}
          <ThemedText type="body2" style={[styles.message, { color: colorsForType.text }]}>
            {message}
          </ThemedText>

          {/* Detalle error */}
          {detail && (
            <>
              <TouchableOpacity
                style={styles.detailToggle}
                onPress={() => setShowDetail((prev) => !prev)}
                activeOpacity={0.7}
              >
                <View style={styles.detailToggleRow}>
                  <Ionicons
                    name={showDetail ? ('chevron-up' as const) : ('chevron-down' as const)}
                    size={16}
                    color={colorsForType.text}
                  />
                  <ThemedText
                    type="caption"
                    style={[styles.detailToggleText, { color: colorsForType.text }]}
                  >
                    Detalle
                  </ThemedText>
                </View>
              </TouchableOpacity>
              {showDetail && (
                <View style={styles.detailContainer}>
                  <ThemedText
                    type="caption"
                    style={[styles.detailText, { color: colorsForType.text }]}
                  >
                    {detail}
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </View>

        {/* Botón de cierre */}
        {onDismiss && (
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colorsForType.text} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    lineHeight: 20,
  },
  detailToggle: {
    marginTop: 8,
    marginBottom: 2,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  detailToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailToggleText: {
    fontSize: 13,
  },
  detailContainer: {
    marginTop: 7,
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: 7,
  },
  detailText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 6,
    marginTop: -6,
    marginRight: -6,
  },
});

