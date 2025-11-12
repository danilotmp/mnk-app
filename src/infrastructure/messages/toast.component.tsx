/**
 * Componente Toast para mostrar notificaciones visuales
 * Se muestra en la parte superior derecha de la pantalla
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Toast, useToast } from './toast.context';

/**
 * Colores para cada tipo de toast
 */
const TOAST_COLORS = {
  success: {
    background: '#10B981', // Verde
    text: '#FFFFFF',
    icon: 'checkmark-circle',
  },
  error: {
    background: '#EF4444', // Rojo
    text: '#FFFFFF',
    icon: 'close-circle',
  },
  info: {
    background: '#3B82F6', // Azul
    text: '#FFFFFF',
    icon: 'information-circle',
  },
  warning: {
    background: '#F59E0B', // Amarillo/Naranja
    text: '#FFFFFF',
    icon: 'warning',
  },
};

/**
 * Componente individual de Toast
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
  index: number;
}

function ToastItem({ toast, onDismiss, index }: ToastItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [showDetail, setShowDetail] = useState(false);
  const detailLabel = (t as any)?.common?.detail || (t as any)?.api?.detail || 'Detalle';

  useEffect(() => {
    // Animación de entrada
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Si está abierto el detalle, nunca cerrar automáticamente
  useEffect(() => {
    if (showDetail) return undefined;
    if (!toast.noAutoClose && toast.duration && toast.duration > 0) {
      const timer = setTimeout(onDismiss, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [showDetail, toast.duration, toast.noAutoClose]);

  const handleDismiss = () => {
    // Animación de salida
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const toastColors = TOAST_COLORS[toast.type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          marginTop: index * 8, // Espaciado entre toasts
        },
      ]}
    >
      <ThemedView
        style={[
          styles.toast,
          {
            backgroundColor: toastColors.background,
            shadowColor: toastColors.background,
          },
        ]}
      >
        {/* Icono */}
        <View style={styles.iconContainer}>
          <Ionicons name={toastColors.icon as any} size={24} color={toastColors.text} />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {toast.title && (
            <ThemedText style={[styles.title, { color: toastColors.text }]}>
              {toast.title}
            </ThemedText>
          )}
          <ThemedText style={[styles.message, { color: toastColors.text }]} numberOfLines={3}>
            {toast.message}
          </ThemedText>

          {/* Detalle error */}
          {toast.detail && (
            <TouchableOpacity
              style={styles.detailToggle}
              onPress={() => setShowDetail((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.detailToggleRow}>
                <Ionicons
                  name={showDetail ? 'chevron-up' as any : 'chevron-down' as any}
                  size={16}
                  color={toastColors.text}
                />
                <ThemedText style={[styles.detailToggleText, { color: toastColors.text }]}>
                  {detailLabel}
                </ThemedText>
              </View>
            </TouchableOpacity>
          )}
          {toast.detail && showDetail && (
            <View style={styles.detailContainer}>
              <ThemedText style={[styles.detailText, { color: toastColors.text }]}>
                {toast.detail}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Botón de cierre */}
        <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={toastColors.text} />
        </TouchableOpacity>
      </ThemedView>
    </Animated.View>
  );
}

/**
 * Componente contenedor de Toasts
 * Se renderiza en el layout principal
 */
export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <Modal transparent animationType="none" visible pointerEvents="box-none">
      <View style={styles.modalOverlay} pointerEvents="box-none">
        <View style={styles.container} pointerEvents="box-none">
          {toasts.map((toast, index) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => hideToast(toast.id)}
              index={index}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 80 : 60,
    right: 16,
    left: 'auto',
    zIndex: 9999,
    alignItems: 'flex-end',
    maxWidth: 400,
  },
  toastContainer: {
    width: '100%',
    marginBottom: 8,
    maxWidth: 400,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingRight: 44, // espacio para la X
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    paddingTop: 5,
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
    maxHeight: 120,
    minWidth: 200,
  },
  detailText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
  },
});

