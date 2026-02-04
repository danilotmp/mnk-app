/**
 * Componente Toast para mostrar notificaciones visuales
 * Se muestra en la parte superior derecha de la pantalla
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TouchableOpacitySafe } from "@/components/ui/touchable-opacity-safe";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/src/infrastructure/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, View } from "react-native";
import { Toast, useToast } from "./toast.context";

/**
 * Colores para cada tipo de toast (info usa colors.primary en el componente)
 */
const TOAST_COLORS = {
  success: {
    background: "#10B981", // Verde
    text: "#FFFFFF",
    icon: "checkmark-circle",
  },
  error: {
    background: "#EF4444", // Rojo
    text: "#FFFFFF",
    icon: "close-circle",
  },
  info: {
    text: "#FFFFFF",
    icon: "information-circle",
  },
  warning: {
    background: "#F59E0B", // Amarillo/Naranja
    text: "#FFFFFF",
    icon: "warning",
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
  const detailLabel =
    (t as any)?.common?.detail || (t as any)?.api?.detail || "Detalle";

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

  const baseColors = TOAST_COLORS[toast.type] as {
    background?: string;
    text: string;
    icon: string;
  };
  const toastColors = {
    ...baseColors,
    background:
      toast.type === "info"
        ? colors.primary
        : (baseColors.background ?? colors.primary),
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateX: slideAnim }],
          opacity: opacityAnim,
          marginTop: index * 8, // Espaciado entre toasts
          pointerEvents: "auto",
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
          <Ionicons
            name={toastColors.icon as any}
            size={24}
            color={toastColors.text}
          />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          {toast.title && (
            <ThemedText style={[styles.title, { color: toastColors.text }]}>
              {toast.title}
            </ThemedText>
          )}
          <View style={styles.messageContainer}>
            {toast.message.includes("\n") || toast.message.includes("\r\n") ? (
              // Si hay saltos de línea, dividir y mostrar cada línea
              toast.message
                .split(/\r?\n/) // Manejar tanto \n como \r\n
                .map((line, index) => (
                  <ThemedText
                    key={`line-${index}`}
                    style={[
                      styles.message,
                      { color: toastColors.text },
                      index > 0 && styles.messageLine, // Agregar margen superior solo a partir de la segunda línea
                    ]}
                  >
                    {line || " "}{" "}
                    {/* Si la línea está vacía, mostrar un espacio para mantener el salto */}
                  </ThemedText>
                ))
            ) : (
              // Si no hay saltos de línea, mostrar el mensaje completo
              <ThemedText style={[styles.message, { color: toastColors.text }]}>
                {toast.message}
              </ThemedText>
            )}
          </View>

          {/* Detalle error */}
          {toast.detail && (
            <TouchableOpacitySafe
              style={styles.detailToggle}
              onPress={() => setShowDetail((prev) => !prev)}
              activeOpacity={0.7}
            >
              <View style={styles.detailToggleRow}>
                <Ionicons
                  name={
                    showDetail ? ("chevron-up" as any) : ("chevron-down" as any)
                  }
                  size={16}
                  color={toastColors.text}
                />
                <ThemedText
                  style={[styles.detailToggleText, { color: toastColors.text }]}
                >
                  {detailLabel}
                </ThemedText>
              </View>
            </TouchableOpacitySafe>
          )}
          {toast.detail && showDetail && (
            <View style={styles.detailContainer}>
              <ThemedText
                style={[styles.detailText, { color: toastColors.text }]}
              >
                {toast.detail}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Botón de cierre */}
        <TouchableOpacitySafe
          onPress={handleDismiss}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={20} color={toastColors.text} />
        </TouchableOpacitySafe>
      </ThemedView>
    </Animated.View>
  );
}

/**
 * Componente contenedor de Toasts
 * Se renderiza en el layout principal
 * Usa View absoluto en lugar de Modal para no bloquear la interacción
 */
export function ToastContainer() {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.container}>
        {toasts.map((toast, index) => (
          <View key={toast.id} style={{ pointerEvents: "auto" }}>
            <ToastItem
              toast={toast}
              onDismiss={() => hideToast(toast.id)}
              index={index}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "box-none",
    zIndex: 9999,
  },
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 80 : 60,
    right: 16,
    left: "auto",
    zIndex: 9999,
    alignItems: "flex-end",
    maxWidth: 400,
  },
  toastContainer: {
    width: "100%",
    marginBottom: 8,
    maxWidth: 400,
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    paddingRight: 44, // espacio para la X
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.25)",
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
      },
    }),
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  messageContainer: {
    flexDirection: "column",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageLine: {
    marginTop: 4, // Espaciado entre líneas
  },
  detailToggle: {
    marginTop: 8,
    marginBottom: 2,
    alignSelf: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  detailToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailToggleText: {
    fontSize: 13,
  },
  detailContainer: {
    marginTop: 7,
    padding: 0,
    backgroundColor: "transparent",
    borderRadius: 7,
    maxHeight: 120,
    minWidth: 200,
  },
  detailText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 6,
  },
});
