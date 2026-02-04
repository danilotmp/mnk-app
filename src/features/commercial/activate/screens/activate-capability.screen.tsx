/**
 * Pantalla Pública para Activar Capacidades
 * Permite activar capacidades del sistema sin requerir autenticación
 * Se accede mediante un token o código único
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CapabilitiesService } from "@/src/domains/commercial/capabilities.service";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const AVAILABLE_CAPABILITIES = [
  {
    id: "chat-ia",
    title: "Chat con IA",
    description:
      "Asistente inteligente que interactúa con tus clientes por WhatsApp",
    icon: "chatbubbles-outline" as const,
  },
];

export function ActivateCapabilityScreen() {
  const { colors, spacing } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const router = useRouter();
  const alert = useAlert();
  const params = useLocalSearchParams<{
    companyId?: string;
    capabilityId?: string;
    token?: string;
  }>();

  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState(false);
  const [companyId, setCompanyId] = useState(params.companyId || "");
  const [capabilityId, setCapabilityId] = useState(
    params.capabilityId || "chat-ia",
  );
  const [token, setToken] = useState(params.token || "");
  const [error, setError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const [success, setSuccess] = useState(false);

  const selectedCapability = AVAILABLE_CAPABILITIES.find(
    (c) => c.id === capabilityId,
  );

  useEffect(() => {
    // Si vienen parámetros en la URL, intentar activar automáticamente
    if (params.companyId && params.capabilityId && params.token) {
      handleActivate();
    }
  }, []);

  const handleActivate = async () => {
    if (!companyId.trim()) {
      setError({ message: "El ID de la empresa es requerido" });
      return;
    }

    if (!capabilityId.trim()) {
      setError({ message: "Debes seleccionar una capacidad" });
      return;
    }

    setActivating(true);
    setError(null);
    setSuccess(false);

    try {
      await CapabilitiesService.activateCapability({
        companyId: companyId.trim(),
        capabilityId: capabilityId.trim(),
      });

      setSuccess(true);
      alert.showSuccess("Capacidad activada correctamente");

      // Redirigir después de 2 segundos
      setTimeout(() => {
        router.push("/capabilities");
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.message || "Error al activar la capacidad";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      setError({ message: errorMessage, detail: errorDetail });
      alert.showError(errorMessage, false, undefined, errorDetail);
    } finally {
      setActivating(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="rocket-outline" size={48} color={colors.primary} />
          <ThemedText type="h2" style={styles.title}>
            Activar Capacidad
          </ThemedText>
          <ThemedText
            type="body1"
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Activa una capacidad del sistema para tu empresa
          </ThemedText>
        </View>

        {success ? (
          <Card variant="elevated" style={styles.successCard}>
            <View style={styles.successContent}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              <ThemedText
                type="h3"
                style={{
                  color: colors.success,
                  marginTop: spacing.md,
                  textAlign: "center",
                }}
              >
                ¡Capacidad Activada!
              </ThemedText>
              <ThemedText
                type="body2"
                style={{
                  color: colors.textSecondary,
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                La capacidad {selectedCapability?.title} ha sido activada
                correctamente para tu empresa. Serás redirigido a la página de
                capacidades...
              </ThemedText>
            </View>
          </Card>
        ) : (
          <>
            {/* Selección de Capacidad */}
            <Card variant="elevated" style={styles.sectionCard}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Selecciona la Capacidad
              </ThemedText>
              <View style={styles.capabilitiesList}>
                {AVAILABLE_CAPABILITIES.map((capability) => (
                  <TouchableOpacity
                    key={capability.id}
                    style={[
                      styles.capabilityOption,
                      {
                        borderColor:
                          capabilityId === capability.id
                            ? colors.primary
                            : colors.border,
                        backgroundColor:
                          capabilityId === capability.id
                            ? colors.primary + "20"
                            : colors.surface,
                      },
                    ]}
                    onPress={() => setCapabilityId(capability.id)}
                  >
                    <Ionicons
                      name={capability.icon}
                      size={32}
                      color={
                        capabilityId === capability.id
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <View style={styles.capabilityInfo}>
                      <ThemedText type="body1" style={{ fontWeight: "600" }}>
                        {capability.title}
                      </ThemedText>
                      <ThemedText
                        type="body2"
                        style={{ color: colors.textSecondary, marginTop: 4 }}
                      >
                        {capability.description}
                      </ThemedText>
                    </View>
                    {capabilityId === capability.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Formulario de Activación */}
            <Card variant="elevated" style={styles.formCard}>
              <ThemedText type="h4" style={styles.sectionTitle}>
                Información de la Empresa
              </ThemedText>

              {error && (
                <InlineAlert
                  type="error"
                  message={error.message}
                  detail={error.detail}
                  style={styles.alert}
                  autoClose={false}
                />
              )}

              <View style={styles.inputGroup}>
                <ThemedText
                  type="body2"
                  style={[styles.label, { color: colors.text }]}
                >
                  ID de la Empresa *
                </ThemedText>
                <InputWithFocus
                  containerStyle={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderColor: error ? colors.error : colors.border,
                    },
                  ]}
                  primaryColor={colors.primary}
                  error={!!error}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Ingresa el ID de tu empresa"
                    placeholderTextColor={colors.textSecondary}
                    value={companyId}
                    onChangeText={(val) => {
                      setCompanyId(val);
                      setError(null);
                    }}
                    editable={!activating}
                  />
                </InputWithFocus>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  Puedes encontrar este ID en la configuración de tu empresa
                </ThemedText>
              </View>

              {token && (
                <View style={styles.inputGroup}>
                  <ThemedText
                    type="body2"
                    style={[styles.label, { color: colors.text }]}
                  >
                    Token de Activación (opcional)
                  </ThemedText>
                  <InputWithFocus
                    containerStyle={[
                      styles.inputContainer,
                      {
                        backgroundColor: colors.surfaceVariant,
                        borderColor: colors.border,
                      },
                    ]}
                    primaryColor={colors.primary}
                  >
                    <Ionicons
                      name="key-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Token de activación"
                      placeholderTextColor={colors.textSecondary}
                      value={token}
                      onChangeText={setToken}
                      editable={!activating}
                      secureTextEntry
                    />
                  </InputWithFocus>
                </View>
              )}

              <Button
                title={activating ? "Activando..." : "Activar Capacidad"}
                onPress={handleActivate}
                variant="primary"
                size="lg"
                disabled={activating || !companyId.trim()}
                style={styles.activateButton}
              >
                {activating && (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
              </Button>
            </Card>

            {/* Información */}
            <Card variant="outlined" style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.infoText}>
                  <ThemedText
                    type="body2"
                    style={{ fontWeight: "600", marginBottom: 4 }}
                  >
                    ¿Qué sucede al activar?
                  </ThemedText>
                  <ThemedText
                    type="body2"
                    style={{ color: colors.textSecondary }}
                  >
                    Al activar una capacidad, se habilitará para tu empresa.
                    Luego podrás configurarla desde la página de capacidades.
                    Esta acción es reversible.
                  </ThemedText>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    gap: 12,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  capabilitiesList: {
    gap: 12,
  },
  capabilityOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  capabilityInfo: {
    flex: 1,
  },
  formCard: {
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  alert: {
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  activateButton: {
    marginTop: 8,
  },
  successCard: {
    padding: 32,
    alignItems: "center",
  },
  successContent: {
    alignItems: "center",
    gap: 8,
  },
  infoCard: {
    padding: 16,
  },
  infoContent: {
    flexDirection: "row",
    gap: 12,
  },
  infoText: {
    flex: 1,
    gap: 4,
  },
});
