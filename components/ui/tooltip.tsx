/**
 * Componente Tooltip
 * Muestra un tooltip al hacer hover (web) o mantener presionado (mobile)
 */

import { useTheme } from "@/hooks/use-theme";
import { createTooltipStyles } from "@/src/styles/components/tooltip.styles";
import React, { useEffect, useRef, useState } from "react";
import { Platform, View, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";
import { TouchableOpacitySafe } from "./touchable-opacity-safe";

export interface TooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

/**
 * Componente Tooltip
 * Funciona en web (hover) y mobile (long press)
 */
export function Tooltip({
  children,
  text,
  position = "top",
  delay = 200,
}: TooltipProps) {
  const { colors } = useTheme();
  const styles = createTooltipStyles();
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<View>(null);

  const showTooltip = () => {
    if (Platform.OS === "web") {
      // En web, usar delay para hover
      timeoutRef.current = setTimeout(() => {
        setVisible(true);
      }, delay);
    } else {
      // En mobile, mostrar inmediatamente
      setVisible(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Estilos para posicionamiento
  const getTooltipStyle = (): ViewStyle => {
    // Usar un color de fondo sólido y opaco
    const backgroundColor = colors.surfaceVariant ?? colors.surface;

    const baseStyle: ViewStyle = {
      ...styles.tooltip,
      backgroundColor, // Fondo sólido y opaco
      shadowColor: colors.shadow,
    };

    switch (position) {
      case "top":
        return {
          ...baseStyle,
          ...styles.tooltipTop,
        };
      case "bottom":
        return {
          ...baseStyle,
          ...styles.tooltipBottom,
        };
      case "left":
        return {
          ...baseStyle,
          ...styles.tooltipLeft,
        };
      case "right":
        return {
          ...baseStyle,
          ...styles.tooltipRight,
        };
      default:
        return baseStyle;
    }
  };

  // Para web, usar eventos de mouse en el contenedor
  const webProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: showTooltip,
          onMouseLeave: hideTooltip,
        }
      : {};

  // Para mobile, usar long press
  const mobileProps =
    Platform.OS !== "web"
      ? {
          onPressIn: showTooltip,
          onPressOut: hideTooltip,
          delayPressIn: delay,
        }
      : {};

  return (
    <View ref={containerRef} style={styles.container} {...webProps}>
      {Platform.OS === "web" ? (
        <View>{children}</View>
      ) : (
        <TouchableOpacitySafe activeOpacity={1} {...mobileProps}>
          {children}
        </TouchableOpacitySafe>
      )}
      {visible && (
        <View style={[getTooltipStyle(), { flexWrap: "wrap" }]}>
          <ThemedText
            type="caption"
            style={[styles.tooltipText, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {text}
          </ThemedText>
        </View>
      )}
    </View>
  );
}
