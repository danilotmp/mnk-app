/**
 * Modal lateral que se desliza desde la derecha
 * En web: ocupa 1/3 del ancho
 * En móvil: ocupa 100% del ancho
 * Header y footer fijos, solo el contenido hace scroll
 */

import { ThemedText } from '@/components/themed-text';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { createSideModalStyles } from '@/src/styles/components/side-modal.styles';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

interface SideModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Footer fijo con botones de acción
  width?: number | string; // Porcentaje o número absoluto (default: 33.33% para web, 100% para móvil)
  topAlert?: React.ReactNode; // Alerta que aparece encima del título del modal
}

export function SideModal({ visible, onClose, title, subtitle, children, footer, width, topAlert }: SideModalProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const styles = createSideModalStyles(colors, isMobile);
  const slideAnim = useRef(new Animated.Value(windowWidth)).current;

  // Determinar el ancho por defecto según la plataforma
  const defaultWidth = isMobile ? '100%' : '33.33%';
  const effectiveWidth = width || defaultWidth;

  // Calcular altura estándar del modal: altura de ventana menos padding arriba y abajo (16px cada uno)
  const modalHeight = windowHeight - 32; // 16px arriba + 16px abajo

  // Usar surfaceVariant en modo dark para evitar transparencia, o background si está disponible
  const modalBackgroundColor = isDark 
    ? (colors.surfaceVariant || colors.background || '#1E293B')
    : colors.surface;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: windowWidth,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, windowWidth]);

  // Calcular el ancho del modal
  const modalWidth = typeof effectiveWidth === 'string' && effectiveWidth.includes('%')
    ? (windowWidth * parseFloat(effectiveWidth)) / 100
    : typeof effectiveWidth === 'number'
    ? effectiveWidth
    : isMobile ? windowWidth : windowWidth * 0.3333;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                width: modalWidth,
                height: modalHeight,
                marginTop: 16,
                marginBottom: 16,
                transform: [{ translateX: slideAnim }],
                // Forzar fondo opaco en modo dark
                backgroundColor: modalBackgroundColor,
              },
            ]}
          >
            {/* Top Alert - aparece encima del título */}
            {topAlert && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                {topAlert}
              </View>
            )}

            {/* Header fijo */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitle}>
                <ThemedText type="h3" style={styles.title}>
                  {title}
                </ThemedText>
                {subtitle && (
                  <ThemedText type="body2" style={{ color: (colors as any).subtitle || colors.textSecondary }}>
                    {subtitle}
                  </ThemedText>
                )}
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Content scrollable */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>

            {/* Footer fijo con botones de acción */}
            {footer && (
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                {footer}
              </View>
            )}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

