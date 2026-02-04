/**
 * Modal centrado que aparece en el medio de la pantalla
 * Cubre casi toda la pantalla pero no toda (90% de ancho y alto)
 * Header y footer fijos, solo el contenido hace scroll
 */

import { ThemedText } from "@/components/themed-text";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { createCenteredModalStyles } from "@/src/styles/components/centered-modal.styles";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Modal,
    Pressable,
    ScrollView,
    View,
    useWindowDimensions,
} from "react-native";

interface CenteredModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode; // Footer fijo con botones de acción
  width?: number | string; // Porcentaje o número absoluto (default: 90%)
  height?: number | string; // Porcentaje o número absoluto (default: 90%)
  topAlert?: React.ReactNode; // Alerta que aparece encima del título del modal
}

export function CenteredModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "90%",
  height = "90%",
  topAlert,
}: CenteredModalProps) {
  const { colors, modalLayout } = useTheme();
  const { isMobile } = useResponsive();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const styles = createCenteredModalStyles({ colors, modalLayout }, isMobile);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Calcular el ancho y alto del modal
  const modalWidth =
    typeof width === "string" && width.includes("%")
      ? (windowWidth * parseFloat(width)) / 100
      : typeof width === "number"
        ? width
        : windowWidth * 0.9;

  const modalHeight =
    typeof height === "string" && height.includes("%")
      ? (windowHeight * parseFloat(height)) / 100
      : typeof height === "number"
        ? height
        : windowHeight * 0.9;

  // Mismo color que el menú vertical (surfaceVariant) en ambos temas
  const modalBackgroundColor = colors.surfaceVariant ?? colors.surface;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

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
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                backgroundColor: modalBackgroundColor,
              },
            ]}
          >
            {/* Top Alert - aparece encima del título */}
            {topAlert && (
              <View style={styles.topAlertContainer}>{topAlert}</View>
            )}

            {/* Header fijo */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerTitle}>
                <ThemedText type="h3" style={styles.title}>
                  {title}
                </ThemedText>
                {subtitle && (
                  <ThemedText
                    type="body2"
                    style={{ color: colors.textSecondary }}
                  >
                    {subtitle}
                  </ThemedText>
                )}
              </View>
              <Pressable style={styles.closeButton} onPress={onClose}>
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
