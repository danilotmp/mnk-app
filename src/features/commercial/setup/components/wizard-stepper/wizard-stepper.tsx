/**
 * Componente Stepper Visual para el Wizard de Contextualización
 * Muestra el progreso de las capas con círculos y líneas conectadas
 */

import { ThemedText } from "@/components/themed-text";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { WizardStep } from "./wizard-stepper.types";

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep?: string;
  onStepPress?: (step: WizardStep) => void;
}

export function WizardStepper({
  steps,
  currentStep,
  onStepPress,
}: WizardStepperProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();

  // Crear estilos dinámicos basados en el tema
  const styles = useMemo(() => createWizardStepperStyles(colors), [colors]);

  // Función helper para obtener la primera palabra del título
  const getFirstWord = (text: string): string => {
    const firstSpaceIndex = text.indexOf(" ");
    return firstSpaceIndex > 0 ? text.substring(0, firstSpaceIndex) : text;
  };

  const getStepStatus = (step: WizardStep, index: number) => {
    // Verificar si el paso está completado (100% o explícitamente marcado como completado)
    if (step.completed || step.completionPercentage === 100) {
      return "completed";
    }
    // Verificar si está omitida sin datos (skipped y completionPercentage < 100)
    if (step.skipped && step.completionPercentage < 100) {
      return "skipped";
    }
    if (step.id === currentStep) return "active";
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex >= 0 && index < currentIndex) return "upcoming";
    return "pending";
  };

  return (
    <View style={[styles.container, isMobile && { paddingBottom: 0 }]}>
      {steps.map((step, index) => {
        const status = getStepStatus(step, index);
        const isLast = index === steps.length - 1;
        const isClickable = step.enabled && onStepPress;

        // Debug: verificar que completed se está pasando correctamente
        // console.log(`Step ${step.id}: completed=${step.completed}, completionPercentage=${step.completionPercentage}, status=${status}`);

        return (
          <View key={step.id} style={styles.stepContainer}>
            {/* Línea conectora ANTES del círculo (solo si no es el primero) */}
            {index > 0 && (
              <View
                style={[
                  styles.connectorLineLeft,
                  {
                    backgroundColor:
                      steps[index - 1]?.completed ||
                      steps[index - 1]?.completionPercentage === 100
                        ? colors.success // Verde cuando la capa anterior tiene datos
                        : steps[index - 1]?.skipped &&
                            steps[index - 1]?.completionPercentage < 100
                          ? colors.suspended // Tomate cuando la capa anterior está omitida sin datos
                          : colors.borderLight || colors.border,
                    height: 2,
                  },
                ]}
              />
            )}

            {/* Círculo del paso */}
            <TouchableOpacity
              onPress={() => isClickable && onStepPress?.(step)}
              disabled={!isClickable}
              activeOpacity={isClickable ? 0.7 : 1}
              style={styles.stepCircleContainer}
            >
              {/* Círculo principal - siempre perfectamente redondo */}
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor:
                      status === "completed" ||
                      step.completed ||
                      step.completionPercentage === 100
                        ? colors.success // Verde cuando tiene datos
                        : status === "skipped"
                          ? colors.suspended // Omitida sin datos
                          : status === "active"
                            ? colors.primary
                            : colors.surface, // Usar el mismo color que los inputs del formulario
                    borderColor:
                      status === "completed" ||
                      step.completed ||
                      step.completionPercentage === 100
                        ? colors.success
                        : status === "skipped"
                          ? colors.suspended
                          : status === "active"
                            ? colors.primary
                            : colors.border,
                    borderWidth: status === "active" ? 3 : 2,
                  },
                ]}
              >
                {status === "completed" ||
                step.completed ||
                step.completionPercentage === 100 ? (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.contrastText}
                  />
                ) : status === "skipped" ? (
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.contrastText}
                  />
                ) : status === "active" ? (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: colors.contrastText },
                    ]}
                  />
                ) : (
                  <ThemedText
                    type="body2"
                    style={{ color: colors.textSecondary, fontWeight: "600" }}
                  >
                    {index + 1}
                  </ThemedText>
                )}
              </View>
            </TouchableOpacity>

            {/* Línea conectora DESPUÉS del círculo (excepto el último) */}
            {!isLast && (
              <View
                style={[
                  styles.connectorLineRight,
                  {
                    backgroundColor:
                      status === "completed" ||
                      step.completed ||
                      step.completionPercentage === 100
                        ? colors.success
                        : colors.borderLight || colors.border,
                    height: 2,
                  },
                ]}
              />
            )}

            {/* Etiqueta del paso - todo en una sola línea */}
            <View style={styles.stepLabelContainer}>
              <ThemedText
                type="caption"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.stepLabel,
                  {
                    color:
                      status === "completed" || status === "active"
                        ? colors.text
                        : colors.textSecondary,
                    fontWeight: status === "active" ? "600" : "400",
                  },
                ]}
              >
                {(() => {
                  // Si está activo, mostrar texto completo (con porcentaje si aplica)
                  if (status === "active") {
                    return step.completionPercentage > 0 &&
                      step.completionPercentage < 100
                      ? `${step.label} (${step.completionPercentage}%)`
                      : step.label;
                  }
                  // Si es móvil y no está activo, mostrar solo la primera palabra
                  if (isMobile) {
                    const displayText =
                      step.completionPercentage > 0 &&
                      step.completionPercentage < 100
                        ? `${step.label} (${step.completionPercentage}%)`
                        : step.label;
                    return getFirstWord(displayText);
                  }
                  // Desktop: mostrar texto completo
                  return step.completionPercentage > 0 &&
                    step.completionPercentage < 100
                    ? `${step.label} (${step.completionPercentage}%)`
                    : step.label;
                })()}
              </ThemedText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * Función para crear estilos dinámicos basados en los colores del tema
 */
const createWizardStepperStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 16,
      paddingHorizontal: 8,
    },
    stepContainer: {
      flex: 1,
      alignItems: "center",
      position: "relative",
    },
    stepCircleContainer: {
      marginBottom: 8,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3, // Aumentar z-index para estar por encima de las líneas
    },
    stepCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 3, // Aumentar z-index para estar por encima de las líneas
      // Asegurar que el background sea opaco para ocultar las líneas detrás
      overflow: "hidden",
      // Asegurar que el círculo tenga un background sólido
      elevation: 1, // Para Android
      shadowColor: colors.shadow ?? "#000",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
    },
    activeDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    stepLabelContainer: {
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: 32,
    },
    stepLabel: {
      textAlign: "center",
      fontSize: 10,
      lineHeight: 12,
    },
    connectorLineLeft: {
      position: "absolute",
      top: 24, // Centrado con el círculo (mitad de la altura: 48px / 2 = 24px)
      left: 0,
      right: "50%",
      marginRight: 24, // Dejar espacio para el círculo (radio: 24px)
      zIndex: 0, // Detrás de los círculos (que tienen zIndex: 2)
    },
    connectorLineRight: {
      position: "absolute",
      top: 24, // Centrado con el círculo (mitad de la altura: 48px / 2 = 24px)
      left: "50%",
      marginLeft: 24, // Dejar espacio para el círculo (radio: 24px)
      right: 0,
      zIndex: 0, // Detrás de los círculos (que tienen zIndex: 2)
    },
  });
};
