/**
 * Componente para Directrices de Interacción
 * Gestiona reglas y comportamientos esperados por la IA (saludos, despedidas, información requerida, etc.)
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CommercialService } from "@/src/domains/commercial";
import {
    InteractionGuideline,
    InteractionGuidelinePayload,
} from "@/src/domains/commercial/types";
import { useCompany } from "@/src/domains/shared";
import { DynamicIcon } from "@/src/domains/shared/components";
import { RecordStatus } from "@/src/domains/shared/types/status.types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InteractionGuidelinesLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: (hasData?: boolean) => void;
  onSkip?: () => void;
  searchFilter?: string; // Filtro de búsqueda
  isCompleted?: boolean; // Indica si la capa ya está completada
}

export function InteractionGuidelinesLayer({
  onProgressUpdate,
  onDataChange,
  onComplete,
  onSkip,
  searchFilter = "",
  isCompleted = false,
}: InteractionGuidelinesLayerProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const alert = useAlert();
  const { company } = useCompany();

  // Color para iconos de acción: primaryDark en dark theme, primary en light theme (igual que en las tablas)
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  const [loading, setLoading] = useState(false);
  const [guidelines, setGuidelines] = useState<InteractionGuideline[]>([]);
  const [editingGuidelineId, setEditingGuidelineId] = useState<string | null>(
    null,
  ); // ID de la directriz en edición
  const [saving, setSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const hasLoadedRef = useRef(false); // Flag para evitar cargas repetitivas
  const [showStatusOptions, setShowStatusOptions] = useState<string | null>(
    null,
  ); // ID de la directriz que muestra opciones de status
  const [showNewForm, setShowNewForm] = useState(false); // Para el formulario de nueva directriz

  // Estado del formulario para cada directriz en edición
  const [editingFormData, setEditingFormData] = useState<
    Record<string, { title: string; description: string; status: number }>
  >({});

  // Estado para nueva directriz
  const [newFormData, setNewFormData] = useState({
    title: "",
    description: "",
    status: RecordStatus.PENDING, // Default: Pendiente (2)
  });

  // Cargar directrices de interacción - evitar llamados repetitivos
  const loadGuidelines = useCallback(async () => {
    if (!company?.id || isLoadingData) return;

    setIsLoadingData(true);
    setLoading(true);

    try {
      // Usar company.id como commercialProfileId (el perfil se identifica por companyId)
      const data = await CommercialService.getInteractionGuidelines(company.id);
      setGuidelines(data || []);
    } catch (error: any) {
      // Si es 404 o no hay datos, no hay directrices aún - es normal
      if (error?.statusCode === 404 || error?.result?.statusCode === 404) {
        setGuidelines([]);
      } else {
        // Para otros errores, mostrar mensaje pero permitir continuar
        console.error("Error al cargar directrices:", error);
        setGuidelines([]);
        // No mostrar error para permitir agregar directrices
      }
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops infinitos

  // Cargar datos solo una vez cuando cambia company.id
  useEffect(() => {
    if (company?.id) {
      loadGuidelines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Calcular progreso - memoizar para evitar re-renders innecesarios
  useEffect(() => {
    if (!company?.id) return;

    const hasData = guidelines.length > 0;
    const progress = hasData ? 100 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guidelines.length, company?.id]); // No incluir callbacks para evitar loops

  const handleSave = async (guidelineId: string) => {
    if (!company?.id) {
      alert.showError("No se pudo obtener el ID de la empresa");
      return;
    }

    const formData = editingFormData[guidelineId];
    if (!formData) return;

    if (!formData.title.trim()) {
      alert.showError("El título es requerido");
      return;
    }

    if (!formData.description.trim()) {
      alert.showError("La descripción es requerida");
      return;
    }

    setSaving(true);

    try {
      // Actualizar directriz existente
      const payload: Partial<InteractionGuidelinePayload> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };
      await CommercialService.updateInteractionGuideline(guidelineId, payload);
      alert.showSuccess("Directriz actualizada correctamente");

      // Recargar directrices después de guardar
      hasLoadedRef.current = false; // Reset flag para permitir recarga
      setIsLoadingData(false); // Reset flag de carga
      await loadGuidelines();

      // Limpiar estado de edición
      setEditingGuidelineId(null);
      setEditingFormData({});
      setShowStatusOptions(null);
    } catch (error: any) {
      // Extraer mensaje de error de diferentes estructuras posibles
      const errorMessage =
        error?.message ||
        error?.result?.description ||
        error?.description ||
        "Error al guardar directriz";

      // Extraer detalles del error
      let errorDetail = "";
      if (error?.details) {
        errorDetail =
          typeof error.details === "object"
            ? JSON.stringify(error.details)
            : String(error.details);
      } else if (error?.result?.details) {
        errorDetail =
          typeof error.result.details === "object"
            ? JSON.stringify(error.result.details)
            : String(error.result.details);
      }

      const fullMessage = errorDetail
        ? `${errorMessage}: ${errorDetail}`
        : errorMessage;

      alert.showError(fullMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    if (!company?.id) {
      alert.showError("No se pudo obtener el ID de la empresa");
      return;
    }

    if (!newFormData.title.trim()) {
      alert.showError("El título es requerido");
      return;
    }

    if (!newFormData.description.trim()) {
      alert.showError("La descripción es requerida");
      return;
    }

    setSaving(true);

    try {
      const payload: InteractionGuidelinePayload = {
        companyId: company.id, // Usar companyId en lugar de commercialProfileId (recomendado por el backend)
        title: newFormData.title.trim(),
        description: newFormData.description.trim(),
        status: newFormData.status,
      };
      await CommercialService.createInteractionGuideline(payload);
      alert.showSuccess("Directriz creada correctamente");

      // Recargar directrices después de guardar
      hasLoadedRef.current = false;
      setIsLoadingData(false);
      await loadGuidelines();

      // Limpiar formulario
      setNewFormData({
        title: "",
        description: "",
        status: RecordStatus.PENDING,
      });
      setShowNewForm(false);
    } catch (error: any) {
      const errorMessage = error?.message || "Error al crear directriz";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      alert.showError(errorMessage + (errorDetail ? `: ${errorDetail}` : ""));
    } finally {
      setSaving(false);
    }
  };

  const handleTitleClick = (guideline: InteractionGuideline) => {
    if (editingGuidelineId === guideline.id) return; // Ya está en edición

    setEditingGuidelineId(guideline.id);
    setEditingFormData({
      [guideline.id]: {
        title: guideline.title,
        description: guideline.description,
        status: guideline.status,
      },
    });
  };

  /**
   * Muestra confirmación y, si el usuario acepta, elimina la directriz.
   */
  const confirmDeleteGuideline = (guideline: InteractionGuideline) => {
    const title = "Eliminar directriz";
    const name = guideline.title || "esta directriz";
    const message = `¿Seguro que deseas eliminar la directriz "${name}"? Esta acción no se puede deshacer.`;
    alert.showConfirm(title, message, () => handleDelete(guideline.id));
  };

  const handleDelete = async (guidelineId: string) => {
    setSaving(true);

    try {
      await CommercialService.deleteInteractionGuideline(guidelineId);
      alert.showSuccess("Directriz eliminada correctamente");
      // Recargar directrices después de eliminar
      hasLoadedRef.current = false; // Reset flag para permitir recarga
      setIsLoadingData(false); // Reset flag de carga
      await loadGuidelines();
    } catch (error: any) {
      // Extraer mensaje de error de diferentes estructuras posibles
      const errorMessage =
        error?.message ||
        error?.result?.description ||
        error?.description ||
        "Error al eliminar directriz";

      // Extraer detalles del error
      let errorDetail = "";
      if (error?.details) {
        errorDetail =
          typeof error.details === "object"
            ? JSON.stringify(error.details)
            : String(error.details);
      } else if (error?.result?.details) {
        errorDetail =
          typeof error.result.details === "object"
            ? JSON.stringify(error.result.details)
            : String(error.result.details);
      }

      const fullMessage = errorDetail
        ? `${errorMessage}: ${errorDetail}`
        : errorMessage;

      alert.showError(fullMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (guidelineId: string) => {
    setEditingGuidelineId(null);
    setEditingFormData({});
    setShowStatusOptions(null);
  };

  // Mostrar loading solo si está cargando inicialmente
  if (loading && !company?.id && isLoadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          type="body2"
          style={{ marginTop: 16, color: colors.textSecondary }}
        >
          Cargando directrices de interacción...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {/* Lista de directrices */}
        {guidelines.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={24} color={colors.primary} />
              <ThemedText type="h4" style={styles.sectionTitle}>
                Directrices Configuradas (
                {(() => {
                  const filteredGuidelines = searchFilter.trim()
                    ? guidelines.filter((g) => {
                        const searchLower = searchFilter.toLowerCase().trim();
                        const title = (g.title || "").toLowerCase();
                        const description = (g.description || "").toLowerCase();
                        return (
                          title.includes(searchLower) ||
                          description.includes(searchLower)
                        );
                      })
                    : guidelines;
                  return filteredGuidelines.length;
                })()}
                )
              </ThemedText>
            </View>

            <View style={styles.listContainer}>
              {(() => {
                // Filtrar directrices según el término de búsqueda
                const filteredGuidelines = searchFilter.trim()
                  ? guidelines.filter((g) => {
                      const searchLower = searchFilter.toLowerCase().trim();
                      const title = (g.title || "").toLowerCase();
                      const description = (g.description || "").toLowerCase();
                      return (
                        title.includes(searchLower) ||
                        description.includes(searchLower)
                      );
                    })
                  : guidelines;

                return filteredGuidelines.map((guideline) => {
                  const isEditing = editingGuidelineId === guideline.id;
                  const formData = isEditing
                    ? editingFormData[guideline.id]
                    : null;
                  const currentStatus = formData?.status ?? guideline.status;

                  return (
                    <Card
                      key={guideline.id}
                      variant="outlined"
                      style={[
                        styles.guidelineCard,
                        {
                          backgroundColor: colors.filterInputBackground,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.guidelineHeader}>
                        <View
                          style={[
                            styles.guidelineTitleRow,
                            isMobile && {
                              flexDirection: "column",
                              alignItems: "flex-start",
                              gap: 12,
                            },
                          ]}
                        >
                          {isEditing ? (
                            <InputWithFocus
                              containerStyle={[
                                styles.titleInputContainer,
                                {
                                  backgroundColor: colors.filterInputBackground,
                                  borderColor: colors.border,
                                  flex: 1,
                                  width: isMobile ? "100%" : undefined,
                                },
                              ]}
                              primaryColor={colors.primary}
                            >
                              <TextInput
                                style={[
                                  styles.titleInput,
                                  { color: colors.text },
                                ]}
                                placeholder="Título de la directriz"
                                placeholderTextColor={colors.textSecondary}
                                value={formData?.title || ""}
                                onChangeText={(text) =>
                                  setEditingFormData((prev) => ({
                                    ...prev,
                                    [guideline.id]: {
                                      ...(prev[guideline.id] || {
                                        title: guideline.title,
                                        description: guideline.description,
                                        status: guideline.status,
                                      }),
                                      title: text,
                                    },
                                  }))
                                }
                                editable={!saving}
                              />
                            </InputWithFocus>
                          ) : (
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                width: isMobile ? "100%" : undefined,
                              }}
                              onPress={() => handleTitleClick(guideline)}
                              activeOpacity={0.7}
                            >
                              <ThemedText
                                type="h4"
                                style={{ fontWeight: "700", flex: 1 }}
                              >
                                {guideline.title}
                              </ThemedText>
                            </TouchableOpacity>
                          )}
                          <View
                            style={[
                              styles.badgeActionsContainer,
                              isMobile && { width: "100%" },
                            ]}
                          >
                            {isEditing ? (
                              <>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                >
                                  <View style={styles.statusOptionsContainer}>
                                    {/* Activo */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus ===
                                          RecordStatus.ACTIVE && {
                                          backgroundColor: colors.success,
                                          borderColor: colors.success,
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingFormData((prev) => ({
                                          ...prev,
                                          [guideline.id]: {
                                            ...(prev[guideline.id] || {
                                              title: guideline.title,
                                              description:
                                                guideline.description,
                                              status: guideline.status,
                                            }),
                                            status: RecordStatus.ACTIVE,
                                          },
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={
                                          currentStatus === RecordStatus.ACTIVE
                                            ? { color: colors.contrastText }
                                            : { color: colors.text }
                                        }
                                      >
                                        {t.security?.users?.active || "Activo"}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Inactivo */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus ===
                                          RecordStatus.INACTIVE && {
                                          backgroundColor: colors.error,
                                          borderColor: colors.error,
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingFormData((prev) => ({
                                          ...prev,
                                          [guideline.id]: {
                                            ...(prev[guideline.id] || {
                                              title: guideline.title,
                                              description:
                                                guideline.description,
                                              status: guideline.status,
                                            }),
                                            status: RecordStatus.INACTIVE,
                                          },
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={
                                          currentStatus ===
                                          RecordStatus.INACTIVE
                                            ? { color: colors.contrastText }
                                            : { color: colors.text }
                                        }
                                      >
                                        {t.security?.users?.inactive ||
                                          "Inactivo"}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Pendiente */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus ===
                                          RecordStatus.PENDING && {
                                          backgroundColor: colors.warning,
                                          borderColor: colors.warning,
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingFormData((prev) => ({
                                          ...prev,
                                          [guideline.id]: {
                                            ...(prev[guideline.id] || {
                                              title: guideline.title,
                                              description:
                                                guideline.description,
                                              status: guideline.status,
                                            }),
                                            status: RecordStatus.PENDING,
                                          },
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={
                                          currentStatus === RecordStatus.PENDING
                                            ? { color: "#FFFFFF" }
                                            : { color: colors.text }
                                        }
                                      >
                                        {t.security?.users?.pending ||
                                          "Pendiente"}
                                      </ThemedText>
                                    </TouchableOpacity>

                                    {/* Suspendido */}
                                    <TouchableOpacity
                                      style={[
                                        styles.statusOption,
                                        { borderColor: colors.border },
                                        currentStatus ===
                                          RecordStatus.SUSPENDED && {
                                          backgroundColor: colors.suspended,
                                          borderColor: colors.suspended,
                                        },
                                      ]}
                                      onPress={() => {
                                        setEditingFormData((prev) => ({
                                          ...prev,
                                          [guideline.id]: {
                                            ...(prev[guideline.id] || {
                                              title: guideline.title,
                                              description:
                                                guideline.description,
                                              status: guideline.status,
                                            }),
                                            status: RecordStatus.SUSPENDED,
                                          },
                                        }));
                                      }}
                                      disabled={saving}
                                    >
                                      <ThemedText
                                        type="caption"
                                        style={
                                          currentStatus ===
                                          RecordStatus.SUSPENDED
                                            ? { color: colors.contrastText }
                                            : { color: colors.text }
                                        }
                                      >
                                        {t.security?.users?.suspended ||
                                          "Suspendido"}
                                      </ThemedText>
                                    </TouchableOpacity>
                                  </View>
                                </ScrollView>
                                <TouchableOpacity
                                  style={styles.cancelButton}
                                  onPress={() => handleCancel(guideline.id)}
                                  disabled={saving}
                                >
                                  <Ionicons
                                    name="close"
                                    size={20}
                                    color={colors.textSecondary}
                                  />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                <StatusBadge
                                  status={
                                    typeof guideline.status === "number"
                                      ? guideline.status
                                      : RecordStatus.ACTIVE
                                  }
                                  statusDescription={
                                    typeof guideline.statusDescription ===
                                      "string" &&
                                    guideline.statusDescription.trim() !== ""
                                      ? guideline.statusDescription
                                      : guideline.status === RecordStatus.ACTIVE
                                        ? "Activo"
                                        : guideline.status ===
                                            RecordStatus.INACTIVE
                                          ? "Inactivo"
                                          : guideline.status ===
                                              RecordStatus.PENDING
                                            ? "Pendiente"
                                            : guideline.status ===
                                                RecordStatus.SUSPENDED
                                              ? "Suspendido"
                                              : "Activo"
                                  }
                                  size="small"
                                />
                                <View style={styles.actionIconsContainer}>
                                  <Tooltip text="Editar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() =>
                                        handleTitleClick(guideline)
                                      }
                                      disabled={saving}
                                    >
                                      <Ionicons
                                        name="pencil"
                                        size={18}
                                        color={actionIconColor}
                                      />
                                    </TouchableOpacity>
                                  </Tooltip>
                                  <Tooltip text="Eliminar" position="top">
                                    <TouchableOpacity
                                      style={styles.actionIconButton}
                                      onPress={() =>
                                        confirmDeleteGuideline(guideline)
                                      }
                                      disabled={saving}
                                    >
                                      <Ionicons
                                        name="trash"
                                        size={18}
                                        color={actionIconColor}
                                      />
                                    </TouchableOpacity>
                                  </Tooltip>
                                </View>
                              </>
                            )}
                          </View>
                        </View>
                      </View>

                      {isEditing ? (
                        <>
                          <InputWithFocus
                            containerStyle={[
                              styles.textAreaContainer,
                              {
                                backgroundColor: colors.filterInputBackground,
                                borderColor: colors.border,
                              },
                            ]}
                            primaryColor={colors.primary}
                          >
                            <TextInput
                              style={[styles.textArea, { color: colors.text }]}
                              placeholder="Describe la regla o comportamiento que la IA debe seguir..."
                              placeholderTextColor={colors.textSecondary}
                              value={formData?.description || ""}
                              onChangeText={(text) =>
                                setEditingFormData((prev) => ({
                                  ...prev,
                                  [guideline.id]: {
                                    ...(prev[guideline.id] || {
                                      title: guideline.title,
                                      description: guideline.description,
                                      status: guideline.status,
                                    }),
                                    description: text,
                                  },
                                }))
                              }
                              multiline
                              numberOfLines={6}
                              textAlignVertical="top"
                              editable={!saving}
                            />
                          </InputWithFocus>
                          <View style={styles.formActions}>
                            <View style={{ flex: 1 }} />
                            <Button
                              title="Cancelar"
                              onPress={() => handleCancel(guideline.id)}
                              variant="outlined"
                              size="md"
                              disabled={saving}
                            />
                            <Button
                              title="Aceptar"
                              onPress={() => handleSave(guideline.id)}
                              variant="primary"
                              size="md"
                              disabled={saving}
                            />
                          </View>
                        </>
                      ) : (
                        <ThemedText
                          type="body2"
                          style={{ color: colors.text, marginTop: 12 }}
                        >
                          {guideline.description}
                        </ThemedText>
                      )}
                    </Card>
                  );
                });
              })()}
            </View>
          </Card>
        )}

        {/* Formulario de nueva directriz */}
        {showNewForm ? (
          <Card variant="outlined" style={styles.accordionCard}>
            <View style={styles.guidelineHeader}>
              <View
                style={[
                  styles.guidelineTitleRow,
                  isMobile && {
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 12,
                  },
                ]}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <InputWithFocus
                  containerStyle={[
                    styles.titleInputContainer,
                    {
                      backgroundColor: colors.filterInputBackground,
                      borderColor: colors.border,
                      flex: 1,
                      width: isMobile ? "100%" : undefined,
                    },
                  ]}
                  primaryColor={colors.primary}
                >
                  <TextInput
                    style={[styles.titleInput, { color: colors.text }]}
                    placeholder="Nueva Directriz"
                    placeholderTextColor={colors.textSecondary}
                    value={newFormData.title}
                    onChangeText={(text) =>
                      setNewFormData((prev) => ({ ...prev, title: text }))
                    }
                    editable={!saving}
                  />
                </InputWithFocus>
                <View
                  style={[
                    styles.badgeActionsContainer,
                    isMobile && { width: "100%" },
                  ]}
                >
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.statusOptionsContainer}>
                      {/* Activo */}
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          { borderColor: colors.border },
                          newFormData.status === RecordStatus.ACTIVE && {
                            backgroundColor: colors.success,
                            borderColor: colors.success,
                          },
                        ]}
                        onPress={() =>
                          setNewFormData((prev) => ({
                            ...prev,
                            status: RecordStatus.ACTIVE,
                          }))
                        }
                        disabled={saving}
                      >
                        <ThemedText
                          type="caption"
                          style={
                            newFormData.status === RecordStatus.ACTIVE
                              ? { color: colors.contrastText }
                              : { color: colors.text }
                          }
                        >
                          {t.security?.users?.active || "Activo"}
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Inactivo */}
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          { borderColor: colors.border },
                          newFormData.status === RecordStatus.INACTIVE && {
                            backgroundColor: colors.error,
                            borderColor: colors.error,
                          },
                        ]}
                        onPress={() =>
                          setNewFormData((prev) => ({
                            ...prev,
                            status: RecordStatus.INACTIVE,
                          }))
                        }
                        disabled={saving}
                      >
                        <ThemedText
                          type="caption"
                          style={
                            newFormData.status === RecordStatus.INACTIVE
                              ? { color: colors.contrastText }
                              : { color: colors.text }
                          }
                        >
                          {t.security?.users?.inactive || "Inactivo"}
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Pendiente */}
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          { borderColor: colors.border },
                          newFormData.status === RecordStatus.PENDING && {
                            backgroundColor: colors.warning,
                            borderColor: colors.warning,
                          },
                        ]}
                        onPress={() =>
                          setNewFormData((prev) => ({
                            ...prev,
                            status: RecordStatus.PENDING,
                          }))
                        }
                        disabled={saving}
                      >
                        <ThemedText
                          type="caption"
                          style={
                            newFormData.status === RecordStatus.PENDING
                              ? { color: colors.contrastText }
                              : { color: colors.text }
                          }
                        >
                          {t.security?.users?.pending || "Pendiente"}
                        </ThemedText>
                      </TouchableOpacity>

                      {/* Suspendido */}
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          { borderColor: colors.border },
                          newFormData.status === RecordStatus.SUSPENDED && {
                            backgroundColor: colors.suspended,
                            borderColor: colors.suspended,
                          },
                        ]}
                        onPress={() =>
                          setNewFormData((prev) => ({
                            ...prev,
                            status: RecordStatus.SUSPENDED,
                          }))
                        }
                        disabled={saving}
                      >
                        <ThemedText
                          type="caption"
                          style={
                            newFormData.status === RecordStatus.SUSPENDED
                              ? { color: colors.contrastText }
                              : { color: colors.text }
                          }
                        >
                          {t.security?.users?.suspended || "Suspendido"}
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowNewForm(false);
                      setNewFormData({
                        title: "",
                        description: "",
                        status: RecordStatus.PENDING,
                      });
                    }}
                    disabled={saving}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <InputWithFocus
              containerStyle={[
                styles.textAreaContainer,
                {
                  backgroundColor: colors.filterInputBackground,
                  borderColor: colors.border,
                },
              ]}
              primaryColor={colors.primary}
            >
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
                placeholder="Describe la regla o comportamiento que la IA debe seguir..."
                placeholderTextColor={colors.textSecondary}
                value={newFormData.description}
                onChangeText={(text) =>
                  setNewFormData((prev) => ({ ...prev, description: text }))
                }
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                editable={!saving}
              />
            </InputWithFocus>

            <View style={styles.formActions}>
              <View style={{ flex: 1 }} />
              <Button
                title="Cancelar"
                onPress={() => {
                  setShowNewForm(false);
                  setNewFormData({
                    title: "",
                    description: "",
                    status: RecordStatus.PENDING,
                  });
                }}
                variant="outlined"
                size="md"
                disabled={saving}
              />
              <Button
                title="Aceptar"
                onPress={handleCreateNew}
                variant="primary"
                size="md"
                disabled={saving}
              />
            </View>
          </Card>
        ) : (
          <Card variant="elevated" style={styles.addCard}>
            <Button
              title="Agregar Directriz"
              onPress={() => setShowNewForm(true)}
              variant="primary"
              size="lg"
              style={styles.addButton}
              disabled={saving}
            >
              <Ionicons
                name="add-outline"
                size={20}
                color={colors.contrastText}
                style={{ marginRight: 8 }}
              />
            </Button>
            <ThemedText
              type="body2"
              style={{
                color: colors.textSecondary,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              Agrega directrices para definir cómo debe comportarse la IA al
              interactuar con los clientes
            </ThemedText>
          </Card>
        )}

        {/* Botones Continuar y Omitir - siempre visibles */}
        <View style={styles.continueButtons}>
          <Button
            title={
              guidelines.length > 0 || isCompleted ? "Continuar" : "Omitir"
            }
            onPress={() => {
              if (guidelines.length > 0 || isCompleted) {
                onComplete?.(true);
              } else {
                onSkip?.();
              }
            }}
            variant="primary"
            size="lg"
            disabled={saving || showNewForm || editingGuidelineId !== null}
            style={styles.continueButton}
          >
            {guidelines.length > 0 || isCompleted ? (
              <Ionicons
                name="arrow-forward-outline"
                size={20}
                color={colors.contrastText}
                style={{ marginRight: 8 }}
              />
            ) : (
              <DynamicIcon
                name="MaterialCommunityIcons.skip-forward-outline"
                size={20}
                color={colors.contrastText}
                style={{ marginRight: 8 }}
              />
            )}
          </Button>
          {guidelines.length > 0 && onSkip && !isCompleted && (
            <Button
              title="Omitir"
              onPress={() => {
                onSkip?.();
              }}
              variant="outlined"
              size="lg"
              disabled={saving || showNewForm || editingGuidelineId !== null}
              style={styles.skipButton}
            >
              <DynamicIcon
                name="MaterialCommunityIcons.skip-forward-outline"
                size={20}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
            </Button>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  formContainer: {
    gap: 8,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
  },
  sectionCard: {
    padding: 16,
    paddingTop: 20,
    paddingLeft: 0,
    paddingRight: 0,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontWeight: "700",
  },
  titleHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  titleInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    padding: 0,
  },
  listContainer: {
    gap: 12,
  },
  guidelineCard: {
    padding: 16,
    gap: 12,
  },
  guidelineHeader: {
    marginBottom: 8,
  },
  guidelineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
    borderRadius: 4,
  },
  cancelButton: {
    padding: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusOptionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectOptions: {
    flexDirection: "row",
    gap: 8,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  formCard: {
    padding: 16,
    gap: 16,
  },
  formWrapper: {
    width: "100%",
  },
  accordionCard: {
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    gap: 16,
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
  },
  textArea: {
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    alignItems: "center",
  },
  addCard: {
    padding: 20,
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
  },
  continueButtons: {
    flexDirection: "column",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  continueButton: {
    width: "100%",
  },
  skipButton: {
    width: "100%",
  },
});
