/**
 * Componente para Capa 4: Recomendaciones
 * Gestiona recomendaciones generales y sugerencias de productos/servicios
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CommercialService } from "@/src/domains/commercial";
import {
    Offering,
    Recommendation,
    RecommendationPayload,
    RecommendationType,
} from "@/src/domains/commercial/types";
import { useCompany } from "@/src/domains/shared";
import { DynamicIcon, NumericInput } from "@/src/domains/shared/components";
import { RecordStatus } from "@/src/domains/shared/types/status.types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface RecommendationsLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: (hasData?: boolean) => void; // Callback cuando la capa se completa al 100%
  onSkip?: () => void; // Callback cuando se omite la capa
  allowedTypes?: RecommendationType[]; // Filtrar tipos de recomendación según la capa
  layerTitle?: string; // Título personalizado para la capa
  layerDescription?: string; // Descripción personalizada para la capa
  searchFilter?: string; // Filtro de búsqueda
  isCompleted?: boolean; // Indica si la capa ya está completada
}

// Las listas de RECOMMENDATION_TYPE_OPTIONS ahora se cargan desde catálogos

export function RecommendationsLayer({
  onProgressUpdate,
  onDataChange,
  onComplete,
  onSkip,
  allowedTypes,
  layerTitle,
  layerDescription,
  searchFilter = "",
  isCompleted = false,
}: RecommendationsLayerProps) {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const R = t.wizard?.layers?.recommendations;
  const alert = useAlert();
  const { company } = useCompany();

  // Color para iconos de acción: primaryDark en dark theme, primary en light theme
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;
  // Tamaño del thumbnail de imagen: más grande en smartphone para mejor usabilidad
  const recommendationImageSize = isMobile ? 96 : 72;

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageViewerUri, setImageViewerUri] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false); // Flag para evitar llamados repetitivos

  // Opciones locales de tipo de recomendación (temporal, hasta implementar en BDD)
  type LocalRecommendationType = "general" | "offer_specific" | "warning";
  const localRecommendationTypeOptions: Array<{
    value: LocalRecommendationType;
    label: string;
    description: string;
  }> = [
    {
      value: "general",
      label: R?.typeGeneral ?? "General",
      description: R?.typeGeneralDescription ?? "",
    },
    {
      value: "offer_specific",
      label: R?.typeOfferSpecific ?? "Por Oferta",
      description: R?.typeOfferSpecificDescription ?? "",
    },
    {
      value: "warning",
      label: R?.typeWarning ?? "Advertencia",
      description: R?.typeWarningDescription ?? "",
    },
  ];

  // Mapeo de tipos locales a tipos de recomendación del backend
  const mapLocalTypeToBackendType = (
    localType: LocalRecommendationType,
  ): RecommendationType => {
    // Por ahora, mapear todos a 'informational' hasta que el backend esté listo
    // TODO: Actualizar cuando el backend implemente los nuevos tipos
    return "informational";
  };

  const [localRecommendationType, setLocalRecommendationType] =
    useState<LocalRecommendationType>("general");

  const [formData, setFormData] = useState({
    type: (allowedTypes && allowedTypes.length > 0
      ? allowedTypes[0]
      : "informational") as RecommendationType,
    message: "",
    offeringId: "",
    order: 0, // Cambiado de priority a order, default: 0
    image: null as string | null,
  });
  const [previousRecommendationType, setPreviousRecommendationType] =
    useState<RecommendationType | null>(null); // Guarda el tipo anterior antes de seleccionar una oferta
  const [editingRecommendationId, setEditingRecommendationId] = useState<
    string | null
  >(null); // ID de la recomendación en edición
  const [editingRecommendationData, setEditingRecommendationData] = useState<
    Record<
      string,
      {
        type: RecommendationType;
        message: string;
        order: number;
        status: number;
        offeringId?: string | null;
        image?: string | null;
      }
    >
  >({}); // Datos de edición
  const [editingLocalRecommendationType, setEditingLocalRecommendationType] =
    useState<Record<string, LocalRecommendationType>>({}); // Tipo local de recomendación en edición
  const [
    editingPreviousRecommendationType,
    setEditingPreviousRecommendationType,
  ] = useState<Record<string, LocalRecommendationType | null>>({}); // Tipo anterior guardado en edición

  // Cargar recomendaciones - evitar llamados repetitivos
  const loadRecommendations = useCallback(async () => {
    if (!company?.id || isLoadingData) return;

    setIsLoadingData(true);
    setLoading(true);
    setGeneralError(null);

    try {
      const data = await CommercialService.getRecommendations(company.id);
      // Filtrar por tipos permitidos si se especifica
      const filteredData =
        allowedTypes && allowedTypes.length > 0
          ? data.filter((r) => allowedTypes.includes(r.type))
          : data;
      setRecommendations(filteredData);
      setGeneralError(null); // Limpiar errores si se carga correctamente
    } catch (error: any) {
      const errorMessage = error?.message || R?.errorLoadingRecommendations || "Error al cargar recomendaciones";
      setGeneralError({ message: errorMessage });
      // No mostrar toast - solo InlineAlert en la pantalla
    } finally {
      setLoading(false);
      setIsLoadingData(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Cargar ofertas para el selector - evitar llamados repetitivos
  const loadOfferings = useCallback(async () => {
    if (!company?.id) return;

    try {
      const data = await CommercialService.getOfferings(company.id);
      setOfferings(data);
    } catch (error: any) {
      // Si no hay ofertas, está bien, las recomendaciones pueden ser generales
      // Error silencioso - solo log
      console.log("No hay ofertas disponibles");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  // Cargar datos solo una vez cuando cambia company.id
  useEffect(() => {
    if (company?.id) {
      loadRecommendations();
      loadOfferings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    // Filtrar recomendaciones por tipos permitidos si se especifica
    const relevantRecommendations =
      allowedTypes && allowedTypes.length > 0
        ? recommendations.filter((r) => allowedTypes.includes(r.type))
        : recommendations;

    const hasRecommendations = relevantRecommendations.length > 0;
    const progress = hasRecommendations ? 100 : 0;

    onProgressUpdate?.(progress);
    onDataChange?.(hasRecommendations);

    // Si se completa al 100% Y no estaba completada antes, notificar después de un breve delay
    // No ejecutar onComplete si isCompleted es true (ya estaba completada al cargar)
    if (progress === 100 && !isCompleted) {
      setTimeout(() => {
        onComplete?.();
      }, 500);
    }
  }, [
    recommendations,
    company?.id,
    onProgressUpdate,
    onDataChange,
    onComplete,
    allowedTypes,
    isCompleted,
  ]);

  const handleCreate = async () => {
    if (!company?.id) return;

    if (!formData.message.trim()) {
      setGeneralError({ message: R?.messageRequired ?? "El mensaje de recomendación es requerido" });
      return;
    }

    setSaving(true);
    setGeneralError(null);

    try {
      // Mapear el tipo local al tipo del backend
      const backendType = mapLocalTypeToBackendType(localRecommendationType);

      const payload: RecommendationPayload = {
        companyId: company.id,
        offeringId:
          formData.offeringId && formData.offeringId.trim() !== ""
            ? formData.offeringId
            : null,
        type: backendType,
        message: formData.message.trim(),
        order: formData.order ?? 0, // Cambiado de priority a order
        image: formData.image ?? null,
        // status no se envía - se asigna automáticamente como ACTIVE en el backend
      };

      await CommercialService.createRecommendation(payload);
      alert.showSuccess(R?.recommendationCreated ?? "Recomendación creada correctamente");
      setShowForm(false);
      setFormData({
        type: (allowedTypes && allowedTypes.length > 0
          ? allowedTypes[0]
          : "informational") as RecommendationType,
        message: "",
        offeringId: "",
        order: 0, // Cambiado de priority a order
        image: null,
      });
      setLocalRecommendationType("general"); // Resetear al tipo por defecto
      setPreviousRecommendationType(null); // Limpiar el tipo guardado
      // Recargar recomendaciones sin mostrar toast de error si falla
      try {
        await loadRecommendations();
      } catch (error) {
        // Error ya manejado en loadRecommendations con InlineAlert
        console.error("Error al recargar recomendaciones:", error);
      }
    } catch (error: any) {
      const errorMessage = error?.message || R?.errorCreatingRecommendation || "Error al crear recomendación";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      setGeneralError({ message: errorMessage, detail: errorDetail });
    } finally {
      setSaving(false);
    }
  };

  // Elegir imagen para recomendación (crear/editar)
  const pickRecommendationImage = async (forEditingId: string | null) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert.showError(R?.photoPermissionRequired ?? "Se necesita permiso para acceder a las fotos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = asset.base64;
        const dataUri = base64 ? `data:image/jpeg;base64,${base64}` : (asset.uri || null);
        if (forEditingId) {
          setEditingRecommendationData((prev) => ({
            ...prev,
            [forEditingId]: {
              ...(prev[forEditingId] || {}),
              image: dataUri,
            } as any,
          }));
        } else {
          setFormData((prev) => ({ ...prev, image: dataUri }));
        }
      }
    } catch (e) {
      alert.showError(R?.errorSelectingImage ?? "Error al seleccionar la imagen");
    }
  };

  // Guardar una recomendación editada
  const handleSaveRecommendation = async (recommendationId: string) => {
    if (!company?.id) {
      alert.showError(R?.infoRequired ?? "No se pudo obtener la información necesaria");
      return;
    }

    const formData = editingRecommendationData[recommendationId];
    if (!formData) return;

    if (!formData.message.trim()) {
      alert.showError(R?.messageRequired ?? "El mensaje de recomendación es requerido");
      return;
    }

    setSaving(true);

    try {
      // Mapear el tipo local al tipo del backend
      const editingLocalType =
        editingLocalRecommendationType[recommendationId] || "general";
      const backendType = mapLocalTypeToBackendType(editingLocalType);

      const payload: Partial<RecommendationPayload> = {
        type: backendType,
        message: formData.message.trim(),
        order: formData.order ?? 0, // Cambiado de priority a order
        status: formData.status,
        offeringId: formData.offeringId || null,
        image: formData.image !== undefined ? formData.image : undefined,
      };

      await CommercialService.updateRecommendation(recommendationId, payload);
      alert.showSuccess(R?.recommendationUpdated ?? "Recomendación actualizada correctamente");
      setEditingRecommendationId(null);
      setEditingRecommendationData({});
      setEditingLocalRecommendationType({});
      setEditingPreviousRecommendationType({});
      // Recargar recomendaciones
      await loadRecommendations();
    } catch (error: any) {
      const errorMessage =
        error?.message || R?.errorUpdatingRecommendation || "Error al actualizar recomendación";
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details ||
            error?.result?.description ||
            error?.result?.details;

      alert.showError(errorMessage, errorDetail);
    } finally {
      setSaving(false);
    }
  };

  // Eliminar una recomendación (onSuccess opcional: p. ej. cerrar edición)
  const handleDeleteRecommendation = async (
    recommendationId: string,
    onSuccess?: () => void,
  ) => {
    if (!company?.id) {
      alert.showError(R?.infoRequired ?? "No se pudo obtener la información necesaria");
      return;
    }

    // Confirmar eliminación
    alert.showConfirm(
      R?.confirmDeleteTitle ?? "¿Estás seguro?",
      R?.deleteConfirmMessage ?? "Esta acción no se puede deshacer",
      async () => {
        setSaving(true);
        try {
          await CommercialService.deleteRecommendation(recommendationId);
          onSuccess?.();
          alert.showSuccess(R?.recommendationDeleted ?? "Recomendación eliminada correctamente");
          await loadRecommendations();
        } catch (error: any) {
          const errorMessage =
            error?.message || R?.errorDeletingRecommendation || "Error al eliminar recomendación";
          const errorDetail =
            typeof error?.details === "object"
              ? JSON.stringify(error.details)
              : error?.details ||
                error?.result?.description ||
                error?.result?.details;

          alert.showError(errorMessage, errorDetail);
        } finally {
          setSaving(false);
        }
      },
    );
  };

  if (loading && recommendations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          type="body2"
          style={{ marginTop: 16, color: colors.textSecondary }}
        >
          {R?.loadingRecommendations ?? "Cargando recomendaciones..."}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {generalError && (
        <InlineAlert
          type="error"
          message={generalError.message}
          detail={generalError.detail}
          style={styles.alert}
          autoClose={false}
        />
      )}

      <View style={styles.formContainer}>
        {/* Lista de recomendaciones */}
        {recommendations.length > 0 && (
          <Card variant="elevated" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="chatbubbles-outline"
                size={24}
                color={colors.primary}
              />
              <ThemedText type="h4" style={styles.sectionTitle}>
                {R?.sectionTitleConfigured ?? "Recomendaciones Configuradas"}
              </ThemedText>
            </View>

            <View style={styles.listContainer}>
              {/* Separar recomendaciones generales de las que tienen oferta */}
              {(() => {
                // Filtrar recomendaciones según el término de búsqueda
                const filteredRecommendations = searchFilter.trim()
                  ? recommendations.filter((r) => {
                      const searchLower = searchFilter.toLowerCase().trim();
                      const message = (r.message || "").toLowerCase();
                      const offeringName = r.offeringId
                        ? (
                            offerings.find((o) => o.id === r.offeringId)
                              ?.name || ""
                          ).toLowerCase()
                        : "";
                      return (
                        message.includes(searchLower) ||
                        offeringName.includes(searchLower)
                      );
                    })
                  : recommendations;

                const generalRecommendations = filteredRecommendations.filter(
                  (r) => !r.offeringId,
                );
                const offerRecommendations = filteredRecommendations.filter(
                  (r) => r.offeringId,
                );

                // Agrupar recomendaciones por offeringId
                const groupedByOffering = offerRecommendations.reduce(
                  (acc, rec) => {
                    const offeringId = rec.offeringId || "unknown";
                    if (!acc[offeringId]) {
                      acc[offeringId] = [];
                    }
                    acc[offeringId].push(rec);
                    return acc;
                  },
                  {} as Record<string, Recommendation[]>,
                );

                return (
                  <>
                    {/* Recomendaciones generales */}
                    {generalRecommendations.map((recommendation) => {
                      const isEditing =
                        editingRecommendationId === recommendation.id;
                      const formData = isEditing
                        ? editingRecommendationData[recommendation.id]
                        : null;
                      const currentStatus =
                        formData?.status ??
                        (recommendation as any).status ??
                        RecordStatus.ACTIVE;
                      const currentStatusDescription =
                        recommendation.statusDescription || (R?.statusActive ?? "Activo"); // Fallback si no viene del backend

                      // Mapear el tipo del backend a tipo local para mostrar
                      const getLocalTypeFromBackend = (
                        backendType: RecommendationType,
                      ): LocalRecommendationType => {
                        // Por ahora, todos los tipos del backend se mapean a 'general'
                        // TODO: Actualizar cuando el backend implemente los nuevos tipos
                        return "general";
                      };
                      const localType = getLocalTypeFromBackend(
                        recommendation.type,
                      );
                      const typeOption = localRecommendationTypeOptions.find(
                        (opt) => opt.value === localType,
                      );
                      const relatedOffering = recommendation.offeringId
                        ? offerings.find(
                            (o) => o.id === recommendation.offeringId,
                          )
                        : null;

                      // Obtener el tipo local en edición (o el tipo actual si no está en edición)
                      const editingLocalType = isEditing
                        ? (editingLocalRecommendationType[recommendation.id] ??
                          (recommendation.offeringId
                            ? "offer_specific"
                            : localType))
                        : recommendation.offeringId
                          ? "offer_specific"
                          : localType;

                      return (
                        <View
                          key={recommendation.id}
                          style={[
                            styles.recommendationCard,
                            {
                              backgroundColor: colors.filterInputBackground,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.recommendationHeader,
                              isMobile &&
                                isEditing && {
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  gap: 12,
                                },
                            ]}
                          >
                            <View
                              style={[
                                styles.recommendationType,
                                isMobile && isEditing && { width: "100%" },
                              ]}
                            >
                              <Ionicons
                                name={
                                  typeOption?.icon ||
                                  "information-circle-outline"
                                }
                                size={20}
                                color={colors.primary}
                              />
                              <ThemedText
                                type="body2"
                                style={{ fontWeight: "600", marginLeft: 8 }}
                              >
                                {typeOption?.label || recommendation.type}
                              </ThemedText>
                            </View>
                            <View
                              style={[
                                styles.badgeActionsContainer,
                                isMobile && isEditing && { width: "100%" },
                              ]}
                            >
                              {isEditing ? (
                                <>
                                  {isMobile ? (
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
                                          setEditingRecommendationData(
                                            (prev) => ({
                                              ...prev,
                                              [recommendation.id]: {
                                                ...(prev[recommendation.id] || {
                                                  type: recommendation.type,
                                                  message:
                                                    recommendation.message,
                                                  order:
                                                    recommendation.order ?? 0,
                                                  status: currentStatus,
                                                  offeringId:
                                                    recommendation.offeringId ||
                                                    null,
                                                }),
                                                status: RecordStatus.ACTIVE,
                                              },
                                            }),
                                          );
                                        }}
                                        disabled={saving}
                                      >
                                        <ThemedText
                                          type="caption"
                                          style={
                                            currentStatus ===
                                            RecordStatus.ACTIVE
                                              ? { color: colors.contrastText }
                                              : { color: colors.text }
                                          }
                                        >
                                          {t.security?.users?.active || (R?.statusActive ?? "Activo")}
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
                                          setEditingRecommendationData(
                                            (prev) => ({
                                              ...prev,
                                              [recommendation.id]: {
                                                ...(prev[recommendation.id] || {
                                                  type: recommendation.type,
                                                  message:
                                                    recommendation.message,
                                                  order:
                                                    recommendation.order ?? 0,
                                                  status: currentStatus,
                                                  offeringId:
                                                    recommendation.offeringId ||
                                                    null,
                                                }),
                                                status: RecordStatus.INACTIVE,
                                              },
                                            }),
                                          );
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
                                          {t.security?.users?.inactive || (R?.statusInactive ?? "Inactivo")}
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
                                          setEditingRecommendationData(
                                            (prev) => ({
                                              ...prev,
                                              [recommendation.id]: {
                                                ...(prev[recommendation.id] || {
                                                  type: recommendation.type,
                                                  message:
                                                    recommendation.message,
                                                  order:
                                                    recommendation.order ?? 0,
                                                  status: currentStatus,
                                                  offeringId:
                                                    recommendation.offeringId ||
                                                    null,
                                                }),
                                                status: RecordStatus.PENDING,
                                              },
                                            }),
                                          );
                                        }}
                                        disabled={saving}
                                      >
                                        <ThemedText
                                          type="caption"
                                          style={
                                            currentStatus ===
                                            RecordStatus.PENDING
                                              ? { color: colors.contrastText }
                                              : { color: colors.text }
                                          }
                                        >
                                          {t.security?.users?.pending || (R?.statusPending ?? "Pendiente")}
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
                                          setEditingRecommendationData(
                                            (prev) => ({
                                              ...prev,
                                              [recommendation.id]: {
                                                ...(prev[recommendation.id] || {
                                                  type: recommendation.type,
                                                  message:
                                                    recommendation.message,
                                                  order:
                                                    recommendation.order ?? 0,
                                                  status: currentStatus,
                                                  offeringId:
                                                    recommendation.offeringId ||
                                                    null,
                                                }),
                                                status: RecordStatus.SUSPENDED,
                                              },
                                            }),
                                          );
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
                                          {t.security?.users?.suspended || (R?.statusSuspended ?? "Suspendido")}
                                        </ThemedText>
                                      </TouchableOpacity>
                                    </View>
                                  ) : (
                                    <ScrollView
                                      horizontal
                                      showsHorizontalScrollIndicator={false}
                                    >
                                      <View
                                        style={styles.statusOptionsContainer}
                                      >
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
                                            setEditingRecommendationData(
                                              (prev) => ({
                                                ...prev,
                                                [recommendation.id]: {
                                                  ...(prev[
                                                    recommendation.id
                                                  ] || {
                                                    type: recommendation.type,
                                                    message:
                                                      recommendation.message,
                                                    order:
                                                      recommendation.order ?? 0,
                                                    status: currentStatus,
                                                    offeringId:
                                                      recommendation.offeringId ||
                                                      null,
                                                  }),
                                                  status: RecordStatus.ACTIVE,
                                                },
                                              }),
                                            );
                                          }}
                                          disabled={saving}
                                        >
                                          <ThemedText
                                            type="caption"
                                            style={
                                              currentStatus ===
                                              RecordStatus.ACTIVE
                                                ? { color: colors.contrastText }
                                                : { color: colors.text }
                                            }
                                          >
                                            {t.security?.users?.active ||
                                              (R?.statusActive ?? "Activo")}
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
                                            setEditingRecommendationData(
                                              (prev) => ({
                                                ...prev,
                                                [recommendation.id]: {
                                                  ...(prev[
                                                    recommendation.id
                                                  ] || {
                                                    type: recommendation.type,
                                                    message:
                                                      recommendation.message,
                                                    order:
                                                      recommendation.order ?? 0,
                                                    status: currentStatus,
                                                    offeringId:
                                                      recommendation.offeringId ||
                                                      null,
                                                  }),
                                                  status: RecordStatus.INACTIVE,
                                                },
                                              }),
                                            );
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
                                              (R?.statusInactive ?? "Inactivo")}
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
                                            setEditingRecommendationData(
                                              (prev) => ({
                                                ...prev,
                                                [recommendation.id]: {
                                                  ...(prev[
                                                    recommendation.id
                                                  ] || {
                                                    type: recommendation.type,
                                                    message:
                                                      recommendation.message,
                                                    order:
                                                      recommendation.order ?? 0,
                                                    status: currentStatus,
                                                    offeringId:
                                                      recommendation.offeringId ||
                                                      null,
                                                  }),
                                                  status: RecordStatus.PENDING,
                                                },
                                              }),
                                            );
                                          }}
                                          disabled={saving}
                                        >
                                          <ThemedText
                                            type="caption"
                                            style={
                                              currentStatus ===
                                              RecordStatus.PENDING
                                                ? { color: colors.contrastText }
                                                : { color: colors.text }
                                            }
                                          >
                                            {t.security?.users?.pending ||
                                              (R?.statusPending ?? "Pendiente")}
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
                                            setEditingRecommendationData(
                                              (prev) => ({
                                                ...prev,
                                                [recommendation.id]: {
                                                  ...(prev[
                                                    recommendation.id
                                                  ] || {
                                                    type: recommendation.type,
                                                    message:
                                                      recommendation.message,
                                                    order:
                                                      recommendation.order ?? 0,
                                                    status: currentStatus,
                                                    offeringId:
                                                      recommendation.offeringId ||
                                                      null,
                                                  }),
                                                  status:
                                                    RecordStatus.SUSPENDED,
                                                },
                                              }),
                                            );
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
                                              (R?.statusSuspended ?? "Suspendido")}
                                          </ThemedText>
                                        </TouchableOpacity>
                                      </View>
                                    </ScrollView>
                                  )}
                                  <TouchableOpacity
                                    style={[
                                      styles.cancelButton,
                                      isMobile && { alignSelf: "flex-end" },
                                    ]}
                                    onPress={() => {
                                      setEditingRecommendationId(null);
                                      setEditingRecommendationData((prev) => {
                                        const next = { ...prev };
                                        delete next[recommendation.id];
                                        return next;
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
                                </>
                              ) : (
                                <>
                                  <StatusBadge
                                    status={currentStatus}
                                    statusDescription={currentStatusDescription}
                                  />
                                  <TouchableOpacity
                                    onPress={() => {
                                      setEditingRecommendationId(
                                        recommendation.id,
                                      );
                                      // Inicializar el tipo local en edición
                                      const initialLocalType: LocalRecommendationType =
                                        recommendation.offeringId
                                          ? "offer_specific"
                                          : localType;
                                      setEditingLocalRecommendationType(
                                        (prev) => ({
                                          ...prev,
                                          [recommendation.id]: initialLocalType,
                                        }),
                                      );
                                      setEditingRecommendationData((prev) => ({
                                        ...prev,
                                        [recommendation.id]: {
                                          type: recommendation.type,
                                          message: recommendation.message,
                                          order: recommendation.order ?? 0,
                                          status: currentStatus,
                                          offeringId:
                                            recommendation.offeringId || null,
                                          image: recommendation.image ?? null,
                                        },
                                      }));
                                    }}
                                    style={{ marginLeft: 8 }}
                                  >
                                    <Ionicons
                                      name="chevron-down"
                                      size={20}
                                      color={actionIconColor}
                                    />
                                  </TouchableOpacity>
                                </>
                              )}
                            </View>
                          </View>

                          {isEditing ? (
                            <View style={{ flex: 1 }}>
                              {/* {R?.recommendationTypeLabel ?? "Tipo de recomendación"} en edición + imagen pequeña */}
                              <ThemedText
                                type="body2"
                                style={[
                                  styles.label,
                                  { color: colors.text, marginTop: 12 },
                                ]}
                              >
                                {R?.recommendationTypeLabel ?? "Tipo de recomendación"}
                              </ThemedText>
                              <View style={[styles.radioGroupContainer, { flex: 1, minWidth: 0, marginTop: 8 }]}>
                                <View
                                  style={[
                                    styles.radioGroupRow,
                                    isMobile && {
                                      flexDirection: "column",
                                      gap: 12,
                                    },
                                  ]}
                                >
                                  {localRecommendationTypeOptions.map(
                                    (option) => {
                                      const isOfferSpecific =
                                        option.value === "offer_specific";
                                      const isSelected =
                                        editingLocalType === option.value;
                                      return (
                                        <TouchableOpacity
                                          key={option.value}
                                          style={[
                                            styles.radioOptionHorizontal,
                                            {
                                              borderColor: isSelected
                                                ? colors.primary
                                                : colors.border,
                                              backgroundColor: isSelected
                                                ? colors.primary + "20"
                                                : colors.filterInputBackground,
                                              flex: isMobile ? undefined : 1,
                                              width: isMobile
                                                ? "100%"
                                                : undefined,
                                              opacity:
                                                isOfferSpecific && !isSelected
                                                  ? 0.5
                                                  : 1,
                                            },
                                          ]}
                                          onPress={() => {
                                            if (!isOfferSpecific) {
                                              setEditingLocalRecommendationType(
                                                (prev) => ({
                                                  ...prev,
                                                  [recommendation.id]:
                                                    option.value,
                                                }),
                                              );
                                              // Si se cambia a General o Advertencia y hay una oferta seleccionada, limpiar la oferta
                                              if (formData?.offeringId) {
                                                setEditingRecommendationData(
                                                  (prev) => ({
                                                    ...prev,
                                                    [recommendation.id]: {
                                                      ...(prev[
                                                        recommendation.id
                                                      ] || {
                                                        type: recommendation.type,
                                                        message:
                                                          recommendation.message,
                                                        order:
                                                          recommendation.order ??
                                                          0,
                                                        status: currentStatus,
                                                        offeringId:
                                                          recommendation.offeringId ||
                                                          null,
                                                      }),
                                                      offeringId: null,
                                                    },
                                                  }),
                                                );
                                                setEditingPreviousRecommendationType(
                                                  (prev) => {
                                                    const next = { ...prev };
                                                    delete next[
                                                      recommendation.id
                                                    ];
                                                    return next;
                                                  },
                                                );
                                              }
                                            }
                                          }}
                                          disabled={isOfferSpecific || saving}
                                        >
                                          <View
                                            style={[
                                              styles.radioCircle,
                                              {
                                                borderColor: isSelected
                                                  ? colors.primary
                                                  : isDark
                                                    ? colors.text
                                                    : colors.border,
                                              },
                                            ]}
                                          >
                                            {isSelected && (
                                              <View
                                                style={[
                                                  styles.radioDot,
                                                  {
                                                    backgroundColor:
                                                      colors.primary,
                                                  },
                                                ]}
                                              />
                                            )}
                                          </View>
                                          <View
                                            style={styles.radioLabelHorizontal}
                                          >
                                            <ThemedText
                                              type="body2"
                                              style={{
                                                color: colors.text,
                                                fontWeight: "600",
                                              }}
                                            >
                                              {option.label}
                                            </ThemedText>
                                            <ThemedText
                                              type="caption"
                                              style={{
                                                color: colors.textSecondary,
                                              }}
                                              numberOfLines={2}
                                            >
                                              {option.description}
                                            </ThemedText>
                                          </View>
                                        </TouchableOpacity>
                                      );
                                    },
                                  )}
                                </View>
                              </View>

                              {/* Imagen y Order siempre en la misma fila (sobre todo en móvil); Offerings puede bajar de fila */}
                              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 20, marginTop: 20 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, ...(isMobile ? { flexShrink: 0 } : { flex: 1, minWidth: 200 }) }}>
                                <View style={{ position: "relative", width: recommendationImageSize, height: recommendationImageSize, flexShrink: 0 }}>
                                    {formData?.image ? (
                                    <>
                                      <Image
                                        source={{
                                          uri: (formData.image || "").startsWith("data:")
                                            ? formData.image!
                                            : `data:image/jpeg;base64,${formData.image}`,
                                        }}
                                        style={{
                                          position: "absolute",
                                          top: 0,
                                          left: 0,
                                          width: recommendationImageSize,
                                          height: recommendationImageSize,
                                          borderRadius: 8,
                                          backgroundColor: colors.border,
                                        }}
                                        resizeMode="cover"
                                      />
                                      <View style={{ position: "absolute", top: 4, left: 4, right: 4, flexDirection: "row", justifyContent: "space-between", zIndex: 10 }}>
                                        <Tooltip text={R?.removeImage ?? "Quitar imagen"} position="top">
                                          <TouchableOpacity
                                            onPress={() => setEditingRecommendationData((prev) => ({ ...prev, [recommendation.id]: { ...(prev[recommendation.id] || {}), image: null } as any }))}
                                            style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#fff" />
                                          </TouchableOpacity>
                                        </Tooltip>
                                        <Tooltip text={R?.enlarge ?? "Ampliar"} position="top">
                                          <TouchableOpacity
                                            onPress={() => setImageViewerUri((formData.image || "").startsWith("data:") ? formData.image! : `data:image/jpeg;base64,${formData.image}`)}
                                            style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                                          >
                                            <Ionicons name="expand-outline" size={14} color="#fff" />
                                          </TouchableOpacity>
                                        </Tooltip>
                                      </View>
                                    </>
                                  ) : (
                                    <TouchableOpacity
                                      onPress={() => pickRecommendationImage(recommendation.id)}
                                      style={{ width: recommendationImageSize, height: recommendationImageSize, borderRadius: 8, backgroundColor: colors.border + "60", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.textSecondary + "60" }}
                                    >
                                      <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                  )}
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                    <ThemedText
                                      type="body2"
                                      style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}
                                    >
                                      {R?.orderLabel ?? "Orden"}
                                    </ThemedText>
                                    <ThemedText
                                      type="caption"
                                      style={{
                                        color: colors.textSecondary,
                                        marginBottom: 0,
                                        flex: 1,
                                        minWidth: 0,
                                        ...(isMobile && { fontSize: 11 }),
                                      }}
                                    >
                                      {R?.orderHint ?? "Menor número = más importante (default: 0)"}
                                    </ThemedText>
                                  </View>
                                  <NumericInput
                                  value={formData?.order?.toString() || "0"}
                                  onChangeText={(val) => {
                                    const num = parseInt(val, 10);
                                    if (!isNaN(num) && num >= 0) {
                                      setEditingRecommendationData((prev) => ({
                                        ...prev,
                                        [recommendation.id]: {
                                          ...(prev[recommendation.id] || {
                                            type: recommendation.type,
                                            message: recommendation.message,
                                            order: recommendation.order ?? 0,
                                            status: currentStatus,
                                            offeringId:
                                              recommendation.offeringId || null,
                                          }),
                                          order: num,
                                        },
                                      }));
                                    } else if (val === "") {
                                      setEditingRecommendationData((prev) => ({
                                        ...prev,
                                        [recommendation.id]: {
                                          ...(prev[recommendation.id] || {
                                            type: recommendation.type,
                                            message: recommendation.message,
                                            order: recommendation.order ?? 0,
                                            status: currentStatus,
                                            offeringId:
                                              recommendation.offeringId || null,
                                          }),
                                          order: 0,
                                        },
                                      }));
                                    }
                                  }}
                                  placeholder="0"
                                  disabled={saving}
                                  containerStyle={[
                                    styles.inputContainer,
                                    {
                                      backgroundColor: colors.filterInputBackground,
                                      borderColor: colors.border,
                                    },
                                  ]}
                                  inputStyle={styles.input}
                                  min={0}
                                />
                                </View>
                                </View>
                                {offerings.length > 0 && (
                                  <View style={{ flex: 1, minWidth: 220 }}>
                                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                      <ThemedText
                                        type="body2"
                                        style={[
                                          styles.label,
                                          {
                                            color: colors.text,
                                            marginTop: 0,
                                            marginBottom: 0,
                                          },
                                        ]}
                                      >
                                        {R?.offersLabel ?? "Ofertas"}
                                      </ThemedText>
                                      <ThemedText
                                        type="caption"
                                        style={{
                                          color: colors.textSecondary,
                                          marginBottom: 0,
                                          flex: 1,
                                          minWidth: 0,
                                          ...(isMobile && { fontSize: 11 }),
                                        }}
                                      >
                                        {R?.offerSelectorCaption ?? "Selecciona una oferta para una recomendación específica."}
                                      </ThemedText>
                                    </View>
                                    <Select
                                    value={formData?.offeringId || ""}
                                    options={[
                                      {
                                        value: "",
                                        label: (() => {
                                          const currentType =
                                            editingPreviousRecommendationType[
                                              recommendation.id
                                            ] || editingLocalType;
                                          if (currentType === "general")
                                            return R?.generalRecommendation ?? "Recomendación General";
                                          if (currentType === "warning")
                                            return R?.warningGeneral ?? "Advertencia General";
                                          return R?.generalRecommendation ?? "Recomendación General";
                                        })(),
                                      },
                                      ...offerings.map((offering) => ({
                                        value: offering.id,
                                        label: offering.name,
                                      })),
                                    ]}
                                    onSelect={(val) => {
                                      if (val === "") {
                                        // Restaurar el tipo de recomendación anterior cuando se selecciona la opción 0
                                        const restoredType =
                                          editingPreviousRecommendationType[
                                            recommendation.id
                                          ] || editingLocalType;
                                        setEditingLocalRecommendationType(
                                          (prev) => ({
                                            ...prev,
                                            [recommendation.id]:
                                              restoredType === "offer_specific"
                                                ? "general"
                                                : restoredType,
                                          }),
                                        );
                                        setEditingRecommendationData(
                                          (prev) => ({
                                            ...prev,
                                            [recommendation.id]: {
                                              ...(prev[recommendation.id] || {
                                                type: recommendation.type,
                                                message: recommendation.message,
                                                order:
                                                  recommendation.order ?? 0,
                                                status: currentStatus,
                                                offeringId:
                                                  recommendation.offeringId ||
                                                  null,
                                              }),
                                              offeringId: null,
                                            },
                                          }),
                                        );
                                        setEditingPreviousRecommendationType(
                                          (prev) => {
                                            const next = { ...prev };
                                            delete next[recommendation.id];
                                            return next;
                                          },
                                        );
                                      } else {
                                        // Si se selecciona una oferta específica, guardar el tipo actual y cambiar a "Por Oferta"
                                        if (!formData?.offeringId) {
                                          setEditingPreviousRecommendationType(
                                            (prev) => ({
                                              ...prev,
                                              [recommendation.id]:
                                                editingLocalType,
                                            }),
                                          );
                                        }
                                        setEditingLocalRecommendationType(
                                          (prev) => ({
                                            ...prev,
                                            [recommendation.id]:
                                              "offer_specific",
                                          }),
                                        );
                                        setEditingRecommendationData(
                                          (prev) => ({
                                            ...prev,
                                            [recommendation.id]: {
                                              ...(prev[recommendation.id] || {
                                                type: recommendation.type,
                                                message: recommendation.message,
                                                order:
                                                  recommendation.order ?? 0,
                                                status: currentStatus,
                                                offeringId:
                                                  recommendation.offeringId ||
                                                  null,
                                              }),
                                              offeringId: val as string,
                                            },
                                          }),
                                        );
                                      }
                                    }}
                                    placeholder={R?.selectOfferPlaceholder ?? "Selecciona una oferta"}
                                    searchable={true}
                                  />
                                </View>
                              )}
                              </View>

                              <ThemedText
                                type="body2"
                                style={[
                                  styles.label,
                                  { color: colors.text, marginTop: 16 },
                                ]}
                              >
                                {R?.messageLabel ?? "Mensaje de recomendación *"}
                              </ThemedText>
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
                                  style={[
                                    styles.textArea,
                                    { color: colors.text },
                                  ]}
                                  placeholder={R?.messagePlaceholder ?? "Describe el mensaje de recomendación..."}
                                  placeholderTextColor={colors.textSecondary}
                                  value={formData?.message || ""}
                                  onChangeText={(text) => {
                                    setEditingRecommendationData((prev) => ({
                                      ...prev,
                                      [recommendation.id]: {
                                        ...(prev[recommendation.id] || {
                                          type: recommendation.type,
                                          message: recommendation.message,
                                          order: recommendation.order ?? 0,
                                          status: currentStatus,
                                          offeringId:
                                            recommendation.offeringId || null,
                                        }),
                                        message: text,
                                      },
                                    }));
                                  }}
                                  multiline
                                  numberOfLines={6}
                                  textAlignVertical="top"
                                  editable={!saving}
                                />
                              </InputWithFocus>

                            </View>
                          ) : (
                            <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: 12, gap: 12 }}>
                              {recommendation.image ? (
                                <Image
                                  source={{
                                    uri: recommendation.image.startsWith("data:")
                                      ? recommendation.image
                                      : `data:image/jpeg;base64,${recommendation.image}`,
                                  }}
                                  style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 8,
                                    backgroundColor: colors.border,
                                  }}
                                  resizeMode="cover"
                                />
                              ) : null}
                              <ThemedText
                                type="body2"
                                numberOfLines={3}
                                style={{ color: colors.textSecondary, flex: 1, fontSize: 13 }}
                              >
                                {recommendation.message}
                              </ThemedText>
                            </View>
                          )}

                          {isEditing && (
                            <View style={styles.formActions}>
                              <Button
                                title={t.common.delete}
                                onPress={() =>
                                  handleDeleteRecommendation(recommendation.id, () => {
                                    setEditingRecommendationId(null);
                                    setEditingRecommendationData((prev) => {
                                      const next = { ...prev };
                                      delete next[recommendation.id];
                                      return next;
                                    });
                                    setEditingLocalRecommendationType((prev) => {
                                      const next = { ...prev };
                                      delete next[recommendation.id];
                                      return next;
                                    });
                                    setEditingPreviousRecommendationType((prev) => {
                                      const next = { ...prev };
                                      delete next[recommendation.id];
                                      return next;
                                    });
                                  })
                                }
                                variant="ghost"
                                size="md"
                                disabled={saving}
                              />
                              <Button
                                title={t.common.cancel}
                                onPress={() => {
                                  setEditingRecommendationId(null);
                                  setEditingRecommendationData((prev) => {
                                    const next = { ...prev };
                                    delete next[recommendation.id];
                                    return next;
                                  });
                                  setEditingLocalRecommendationType((prev) => {
                                    const next = { ...prev };
                                    delete next[recommendation.id];
                                    return next;
                                  });
                                  setEditingPreviousRecommendationType(
                                    (prev) => {
                                      const next = { ...prev };
                                      delete next[recommendation.id];
                                      return next;
                                    },
                                  );
                                }}
                                variant="outlined"
                                size="md"
                                disabled={saving}
                              />
                              <Button
                                title={R?.accept ?? t.common.save}
                                onPress={() =>
                                  handleSaveRecommendation(recommendation.id)
                                }
                                variant="primary"
                                size="md"
                                disabled={saving}
                              />
                            </View>
                          )}
                        </View>
                      );
                    })}

                    {/* Título para recomendaciones por oferta */}
                    {Object.keys(groupedByOffering).length > 0 && (
                      <View
                        style={[
                          styles.sectionHeader,
                          {
                            marginTop:
                              generalRecommendations.length > 0 ? 24 : 0,
                            marginBottom: 16,
                          },
                        ]}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={24}
                          color={colors.primary}
                        />
                        <ThemedText type="h4" style={styles.sectionTitle}>
                          Recomendaciones por Oferta
                        </ThemedText>
                      </View>
                    )}

                    {/* Recomendaciones agrupadas por oferta */}
                    {Object.entries(groupedByOffering).map(
                      ([offeringId, offeringRecommendations]) => {
                        const offering = offerings.find(
                          (o) => o.id === offeringId,
                        );
                        if (!offering) return null;

                        return (
                          <View
                            key={offeringId}
                            style={[
                              styles.recommendationCard,
                              {
                                backgroundColor: colors.filterInputBackground,
                                borderColor: colors.border,
                                marginTop: 16,
                              },
                            ]}
                          >
                            {/* Header con nombre de la oferta */}
                            <View style={styles.recommendationHeader}>
                              <View style={styles.recommendationType}>
                                <Ionicons
                                  name="cube-outline"
                                  size={20}
                                  color={colors.primary}
                                />
                                <ThemedText
                                  type="body2"
                                  style={{ fontWeight: "600", marginLeft: 8 }}
                                >
                                  {offering.name}
                                </ThemedText>
                              </View>
                            </View>

                            {/* Lista de mensajes de recomendaciones para esta oferta */}
                            {offeringRecommendations.map(
                              (recommendation, index) => {
                                const isEditing =
                                  editingRecommendationId === recommendation.id;
                                const formData = isEditing
                                  ? editingRecommendationData[recommendation.id]
                                  : null;
                                const currentStatus =
                                  formData?.status ??
                                  (recommendation as any).status ??
                                  RecordStatus.ACTIVE;
                                const currentStatusDescription =
                                  recommendation.statusDescription || (R?.statusActive ?? "Activo");

                                const getLocalTypeFromBackend = (
                                  backendType: RecommendationType,
                                ): LocalRecommendationType => {
                                  return "general";
                                };
                                const localType = getLocalTypeFromBackend(
                                  recommendation.type,
                                );
                                const editingLocalType = isEditing
                                  ? (editingLocalRecommendationType[
                                      recommendation.id
                                    ] ?? "offer_specific")
                                  : "offer_specific";

                                return (
                                  <View
                                    key={recommendation.id}
                                    style={{ marginTop: index > 0 ? 16 : 12 }}
                                  >
                                    {!isEditing ? (
                                      /* Vista colapsada: imagen (opcional) + mensaje con estado e iconos */
                                      <View
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          justifyContent: "space-between",
                                        }}
                                      >
                                        {recommendation.image ? (
                                          <Image
                                            source={{
                                              uri: recommendation.image.startsWith("data:")
                                                ? recommendation.image
                                                : `data:image/jpeg;base64,${recommendation.image}`,
                                            }}
                                            style={{
                                              width: 56,
                                              height: 56,
                                              borderRadius: 8,
                                              marginRight: 12,
                                              backgroundColor: colors.border,
                                            }}
                                            resizeMode="cover"
                                          />
                                        ) : null}
                                        <View
                                          style={{ flex: 1, marginRight: 8, minWidth: 0 }}
                                        >
                                          <ThemedText
                                            type="body2"
                                            numberOfLines={3}
                                            style={{ color: colors.textSecondary, fontSize: 13 }}
                                          >
                                            {recommendation.message}
                                          </ThemedText>
                                        </View>
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <StatusBadge
                                            status={currentStatus}
                                            statusDescription={
                                              currentStatusDescription
                                            }
                                          />
                                          <TouchableOpacity
                                            onPress={() => {
                                              setEditingRecommendationId(
                                                recommendation.id,
                                              );
                                              const initialLocalType: LocalRecommendationType =
                                                "offer_specific";
                                              setEditingLocalRecommendationType(
                                                (prev) => ({
                                                  ...prev,
                                                  [recommendation.id]:
                                                    initialLocalType,
                                                }),
                                              );
                                              setEditingRecommendationData(
                                                (prev) => ({
                                                  ...prev,
                                                  [recommendation.id]: {
                                                    type: recommendation.type,
                                                    message:
                                                      recommendation.message,
                                                    order:
                                                      recommendation.order ?? 0,
                                                    status: currentStatus,
                                                    offeringId:
                                                      recommendation.offeringId ||
                                                      null,
                                                    image: recommendation.image ?? null,
                                                  },
                                                }),
                                              );
                                            }}
                                          >
                                            <Ionicons
                                              name="chevron-down"
                                              size={20}
                                              color={actionIconColor}
                                            />
                                          </TouchableOpacity>
                                        </View>
                                      </View>
                                    ) : (
                                      /* Vista de edición completa */
                                      <View style={{ flex: 1 }}>
                                        {/* {R?.recommendationTypeLabel ?? "Tipo de recomendación"} en edición + imagen pequeña */}
                                        <ThemedText
                                          type="body2"
                                          style={[
                                            styles.label,
                                            {
                                              color: colors.text,
                                              marginTop: 0,
                                            },
                                          ]}
                                        >
                                          {R?.recommendationTypeLabel ?? "Tipo de recomendación"}
                                        </ThemedText>
                                        <View style={[styles.radioGroupContainer, { flex: 1, minWidth: 0, marginTop: 8 }]}>
                                          <View
                                            style={[
                                              styles.radioGroupRow,
                                              isMobile && {
                                                flexDirection: "column",
                                                gap: 12,
                                              },
                                            ]}
                                          >
                                            {localRecommendationTypeOptions.map(
                                              (option) => {
                                                const isOfferSpecific =
                                                  option.value ===
                                                  "offer_specific";
                                                const isSelected =
                                                  editingLocalType ===
                                                  option.value;
                                                return (
                                                  <TouchableOpacity
                                                    key={option.value}
                                                    style={[
                                                      styles.radioOptionHorizontal,
                                                      {
                                                        borderColor: isSelected
                                                          ? colors.primary
                                                          : colors.border,
                                                        backgroundColor:
                                                          isSelected
                                                            ? colors.primary +
                                                              "20"
                                                            : colors.filterInputBackground,
                                                        flex: isMobile
                                                          ? undefined
                                                          : 1,
                                                        width: isMobile
                                                          ? "100%"
                                                          : undefined,
                                                        opacity:
                                                          isOfferSpecific &&
                                                          !isSelected
                                                            ? 0.5
                                                            : 1,
                                                      },
                                                    ]}
                                                    onPress={() => {
                                                      if (!isOfferSpecific) {
                                                        setEditingLocalRecommendationType(
                                                          (prev) => ({
                                                            ...prev,
                                                            [recommendation.id]:
                                                              option.value,
                                                          }),
                                                        );
                                                        if (
                                                          formData?.offeringId
                                                        ) {
                                                          setEditingRecommendationData(
                                                            (prev) => ({
                                                              ...prev,
                                                              [recommendation.id]:
                                                                {
                                                                  ...(prev[
                                                                    recommendation
                                                                      .id
                                                                  ] || {
                                                                    type: recommendation.type,
                                                                    message:
                                                                      recommendation.message,
                                                                    order:
                                                                      recommendation.order ??
                                                                      0,
                                                                    status:
                                                                      currentStatus,
                                                                    offeringId:
                                                                      recommendation.offeringId ||
                                                                      null,
                                                                  }),
                                                                  offeringId:
                                                                    null,
                                                                },
                                                            }),
                                                          );
                                                          setEditingPreviousRecommendationType(
                                                            (prev) => {
                                                              const next = {
                                                                ...prev,
                                                              };
                                                              delete next[
                                                                recommendation
                                                                  .id
                                                              ];
                                                              return next;
                                                            },
                                                          );
                                                        }
                                                      }
                                                    }}
                                                    disabled={
                                                      isOfferSpecific || saving
                                                    }
                                                  >
                                                    <View
                                                      style={[
                                                        styles.radioCircle,
                                                        {
                                                          borderColor:
                                                            isSelected
                                                              ? colors.primary
                                                              : isDark
                                                                ? colors.text
                                                                : colors.border,
                                                        },
                                                      ]}
                                                    >
                                                      {isSelected && (
                                                        <View
                                                          style={[
                                                            styles.radioDot,
                                                            {
                                                              backgroundColor:
                                                                colors.primary,
                                                            },
                                                          ]}
                                                        />
                                                      )}
                                                    </View>
                                                    <View
                                                      style={
                                                        styles.radioLabelHorizontal
                                                      }
                                                    >
                                                      <ThemedText
                                                        type="body2"
                                                        style={{
                                                          color: colors.text,
                                                          fontWeight: "600",
                                                        }}
                                                      >
                                                        {option.label}
                                                      </ThemedText>
                                                      <ThemedText
                                                        type="caption"
                                                        style={{
                                                          color:
                                                            colors.textSecondary,
                                                        }}
                                                        numberOfLines={2}
                                                      >
                                                        {option.description}
                                                      </ThemedText>
                                                    </View>
                                                  </TouchableOpacity>
                                                );
                                              },
                                            )}
                                          </View>
                                        </View>

                                        {/* Imagen y Order siempre en la misma fila (sobre todo en móvil); Offerings puede bajar de fila */}
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 20, marginTop: 20 }}>
                                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, ...(isMobile ? { flexShrink: 0 } : { flex: 1, minWidth: 200 }) }}>
                                          <View style={{ position: "relative", width: recommendationImageSize, height: recommendationImageSize, flexShrink: 0 }}>
                                            {formData?.image ? (
                                              <>
                                                <Image
                                                  source={{
                                                    uri: (formData.image || "").startsWith("data:")
                                                      ? formData.image!
                                                      : `data:image/jpeg;base64,${formData.image}`,
                                                  }}
                                                  style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    width: recommendationImageSize,
                                                    height: recommendationImageSize,
                                                    borderRadius: 8,
                                                    backgroundColor: colors.border,
                                                  }}
                                                  resizeMode="cover"
                                                />
                                                <View style={{ position: "absolute", top: 4, left: 4, right: 4, flexDirection: "row", justifyContent: "space-between", zIndex: 10 }}>
                                                  <Tooltip text={R?.removeImage ?? "Quitar imagen"} position="top">
                                                    <TouchableOpacity
                                                      onPress={() => setEditingRecommendationData((prev) => ({ ...prev, [recommendation.id]: { ...(prev[recommendation.id] || {}), image: null } as any }))}
                                                      style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                                                    >
                                                      <Ionicons name="trash-outline" size={14} color="#fff" />
                                                    </TouchableOpacity>
                                                  </Tooltip>
                                                  <Tooltip text={R?.enlarge ?? "Ampliar"} position="top">
                                                    <TouchableOpacity
                                                      onPress={() => setImageViewerUri((formData.image || "").startsWith("data:") ? formData.image! : `data:image/jpeg;base64,${formData.image}`)}
                                                      style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                                                    >
                                                      <Ionicons name="expand-outline" size={14} color="#fff" />
                                                    </TouchableOpacity>
                                                  </Tooltip>
                                                </View>
                                              </>
                                            ) : (
                                              <TouchableOpacity
                                                onPress={() => pickRecommendationImage(recommendation.id)}
                                                style={{ width: recommendationImageSize, height: recommendationImageSize, borderRadius: 8, backgroundColor: colors.border + "60", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.textSecondary + "60" }}
                                              >
                                                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                          <View style={{ flex: 1, minWidth: 0 }}>
                                            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                              <ThemedText
                                                type="body2"
                                                style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}
                                              >
                                                {R?.orderLabel ?? "Orden"}
                                              </ThemedText>
                                              <ThemedText
                                                type="caption"
                                                style={{
                                                  color: colors.textSecondary,
                                                  marginBottom: 0,
                                                  flex: 1,
                                                  minWidth: 0,
                                                  ...(isMobile && { fontSize: 11 }),
                                                }}
                                              >
                                                {R?.orderHint ?? "Menor número = más importante (default: 0)"}
                                              </ThemedText>
                                            </View>
                                            <NumericInput
                                              value={
                                                formData?.order?.toString() || "0"
                                              }
                                              onChangeText={(val) => {
                                                const num = parseInt(val, 10);
                                                if (!isNaN(num) && num >= 0) {
                                                  setEditingRecommendationData(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]: {
                                                        ...(prev[
                                                          recommendation.id
                                                        ] || {
                                                          type: recommendation.type,
                                                          message:
                                                            recommendation.message,
                                                          order:
                                                            recommendation.order ??
                                                            0,
                                                          status: currentStatus,
                                                          offeringId:
                                                            recommendation.offeringId ??
                                                            null,
                                                        }),
                                                        order: num,
                                                      },
                                                    }),
                                                  );
                                                } else if (val === "") {
                                                  setEditingRecommendationData(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]: {
                                                        ...(prev[
                                                          recommendation.id
                                                        ] || {
                                                          type: recommendation.type,
                                                          message:
                                                            recommendation.message,
                                                          order:
                                                            recommendation.order ??
                                                            0,
                                                          status: currentStatus,
                                                          offeringId:
                                                            recommendation.offeringId ??
                                                            null,
                                                        }),
                                                        order: 0,
                                                      },
                                                    }),
                                                  );
                                                }
                                              }}
                                              placeholder="0"
                                              disabled={saving}
                                              containerStyle={[
                                                styles.inputContainer,
                                                {
                                                  backgroundColor: colors.filterInputBackground,
                                                  borderColor: colors.border,
                                                },
                                              ]}
                                              inputStyle={styles.input}
                                              min={0}
                                            />
                                          </View>
                                          </View>
                                          {offerings.length > 0 && (
                                            <View style={{ flex: 1, minWidth: 220 }}>
                                              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                                                <ThemedText
                                                  type="body2"
                                                  style={[
                                                    styles.label,
                                                    {
                                                      color: colors.text,
                                                      marginTop: 0,
                                                      marginBottom: 0,
                                                    },
                                                  ]}
                                                >
                                                  {R?.offersLabel ?? "Ofertas"}
                                                </ThemedText>
                                                <ThemedText
                                                  type="caption"
                                                  style={{
                                                    color: colors.textSecondary,
                                                    marginBottom: 0,
                                                    flex: 1,
                                                    minWidth: 0,
                                                    ...(isMobile && { fontSize: 11 }),
                                                  }}
                                                >
                                                  {R?.offerSelectorCaption ?? "Selecciona una oferta para una recomendación específica."}
                                                </ThemedText>
                                              </View>
                                              <Select
                                              value={formData?.offeringId || ""}
                                              options={[
                                                {
                                                  value: "",
                                                  label: (() => {
                                                    const currentType =
                                                      editingPreviousRecommendationType[
                                                        recommendation.id
                                                      ] || editingLocalType;
                                                    if (
                                                      currentType === "general"
                                                    )
                                                      return R?.generalRecommendation ?? "Recomendación General";
                                                    if (
                                                      currentType === "warning"
                                                    )
                                                      return R?.warningGeneral ?? "Advertencia General";
                                                    return R?.generalRecommendation ?? "Recomendación General";
                                                  })(),
                                                },
                                                ...offerings.map((off) => ({
                                                  value: off.id,
                                                  label: off.name,
                                                })),
                                              ]}
                                              onSelect={(val) => {
                                                if (val === "") {
                                                  const restoredType =
                                                    editingPreviousRecommendationType[
                                                      recommendation.id
                                                    ] || editingLocalType;
                                                  setEditingLocalRecommendationType(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]:
                                                        restoredType ===
                                                        "offer_specific"
                                                          ? "general"
                                                          : restoredType,
                                                    }),
                                                  );
                                                  setEditingRecommendationData(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]: {
                                                        ...(prev[
                                                          recommendation.id
                                                        ] || {
                                                          type: recommendation.type,
                                                          message:
                                                            recommendation.message,
                                                          order:
                                                            recommendation.order ??
                                                            0,
                                                          status: currentStatus,
                                                          offeringId:
                                                            recommendation.offeringId ||
                                                            null,
                                                        }),
                                                        offeringId: null,
                                                      },
                                                    }),
                                                  );
                                                  setEditingPreviousRecommendationType(
                                                    (prev) => {
                                                      const next = { ...prev };
                                                      delete next[
                                                        recommendation.id
                                                      ];
                                                      return next;
                                                    },
                                                  );
                                                } else {
                                                  if (!formData?.offeringId) {
                                                    setEditingPreviousRecommendationType(
                                                      (prev) => ({
                                                        ...prev,
                                                        [recommendation.id]:
                                                          editingLocalType,
                                                      }),
                                                    );
                                                  }
                                                  setEditingLocalRecommendationType(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]:
                                                        "offer_specific",
                                                    }),
                                                  );
                                                  setEditingRecommendationData(
                                                    (prev) => ({
                                                      ...prev,
                                                      [recommendation.id]: {
                                                        ...(prev[
                                                          recommendation.id
                                                        ] || {
                                                          type: recommendation.type,
                                                          message:
                                                            recommendation.message,
                                                          order:
                                                            recommendation.order ??
                                                            0,
                                                          status: currentStatus,
                                                          offeringId:
                                                            recommendation.offeringId ||
                                                            null,
                                                        }),
                                                        offeringId:
                                                          val as string,
                                                      },
                                                    }),
                                                  );
                                                }
                                              }}
                                              placeholder={R?.selectOfferPlaceholder ?? "Selecciona una oferta"}
                                              searchable={true}
                                            />
                                            </View>
                                          )}
                                        </View>

                                        <ThemedText
                                          type="body2"
                                          style={[
                                            styles.label,
                                            {
                                              color: colors.text,
                                              marginTop: 16,
                                            },
                                          ]}
                                        >
                                          {R?.messageLabel ?? "Mensaje de recomendación *"}
                                        </ThemedText>
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
                                            style={[
                                              styles.textArea,
                                              { color: colors.text },
                                            ]}
                                            placeholder={R?.messagePlaceholder ?? "Describe el mensaje de recomendación..."}
                                            placeholderTextColor={
                                              colors.textSecondary
                                            }
                                            value={formData?.message || ""}
                                            onChangeText={(text) => {
                                              setEditingRecommendationData(
                                                (prev) => ({
                                                  ...prev,
                                                  [recommendation.id]: {
                                                    ...(prev[
                                                      recommendation.id
                                                    ] || {
                                                      type: recommendation.type,
                                                      message:
                                                        recommendation.message,
                                                      order:
                                                        recommendation.order ??
                                                        0,
                                                      status: currentStatus,
                                                      offeringId:
                                                        recommendation.offeringId ||
                                                        null,
                                                    }),
                                                    message: text,
                                                  },
                                                }),
                                              );
                                            }}
                                            multiline
                                            numberOfLines={6}
                                            textAlignVertical="top"
                                            editable={!saving}
                                          />
                                        </InputWithFocus>

                                        <View style={styles.formActions}>
                                          <Button
                                            title={t.common.delete}
                                            onPress={() =>
                                              handleDeleteRecommendation(
                                                recommendation.id,
                                                () => {
                                                  setEditingRecommendationId(null);
                                                  setEditingRecommendationData((prev) => {
                                                    const next = { ...prev };
                                                    delete next[recommendation.id];
                                                    return next;
                                                  });
                                                  setEditingLocalRecommendationType((prev) => {
                                                    const next = { ...prev };
                                                    delete next[recommendation.id];
                                                    return next;
                                                  });
                                                  setEditingPreviousRecommendationType((prev) => {
                                                    const next = { ...prev };
                                                    delete next[recommendation.id];
                                                    return next;
                                                  });
                                                },
                                              )
                                            }
                                            variant="ghost"
                                            size="md"
                                            disabled={saving}
                                          />
                                          <Button
                                            title={t.common.cancel}
                                            onPress={() => {
                                              setEditingRecommendationId(null);
                                              setEditingRecommendationData(
                                                (prev) => {
                                                  const next = { ...prev };
                                                  delete next[
                                                    recommendation.id
                                                  ];
                                                  return next;
                                                },
                                              );
                                              setEditingLocalRecommendationType(
                                                (prev) => {
                                                  const next = { ...prev };
                                                  delete next[
                                                    recommendation.id
                                                  ];
                                                  return next;
                                                },
                                              );
                                              setEditingPreviousRecommendationType(
                                                (prev) => {
                                                  const next = { ...prev };
                                                  delete next[
                                                    recommendation.id
                                                  ];
                                                  return next;
                                                },
                                              );
                                            }}
                                            variant="outlined"
                                            size="md"
                                            disabled={saving}
                                          />
                                          <Button
                                            title={R?.accept ?? t.common.save}
                                            onPress={() =>
                                              handleSaveRecommendation(
                                                recommendation.id,
                                              )
                                            }
                                            variant="primary"
                                            size="md"
                                            disabled={saving}
                                          />
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                );
                              },
                            )}
                          </View>
                        );
                      },
                    )}
                  </>
                );
              })()}
            </View>
          </Card>
        )}

        {/* Formulario de nueva recomendación */}
        {showForm ? (
          <Card
            variant="elevated"
            style={[styles.formCard, { backgroundColor: colors.filterInputBackground }]}
          >
            <View style={{ flex: 1 }}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.primary}
              />
              <ThemedText type="h4" style={styles.sectionTitle}>
                {R?.newRecommendation ?? "Nueva Recomendación"}
              </ThemedText>
            </View>

            <ThemedText
              type="body2"
              style={[styles.label, { color: colors.text }]}
            >
              {R?.recommendationTypeLabel ?? "Tipo de recomendación"}
            </ThemedText>
            <View style={[styles.radioGroupContainer, { flex: 1, minWidth: 0, marginTop: 8 }]}>
              <View
                style={[
                  styles.radioGroupRow,
                  isMobile && { flexDirection: "column", gap: 12 },
                ]}
              >
                {localRecommendationTypeOptions.map((option) => {
                  const isOfferSpecific = option.value === "offer_specific";
                  const isSelected = localRecommendationType === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.radioOptionHorizontal,
                        {
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                          backgroundColor: isSelected
                            ? colors.primary + "20"
                            : colors.filterInputBackground,
                          flex: isMobile ? undefined : 1,
                          width: isMobile ? "100%" : undefined,
                          opacity: isOfferSpecific && !isSelected ? 0.5 : 1, // Hacer más transparente cuando no está seleccionada
                        },
                      ]}
                      onPress={() => {
                        // "Por Oferta" no puede ser seleccionada directamente por el usuario
                        // Solo se selecciona automáticamente al elegir una oferta
                        if (!isOfferSpecific) {
                          setLocalRecommendationType(option.value);
                          // Si se cambia a General o Advertencia y hay una oferta seleccionada,
                          // limpiar la oferta (seleccionar opción 0)
                          if (formData.offeringId) {
                            setFormData((prev) => ({
                              ...prev,
                              offeringId: "",
                            }));
                            setPreviousRecommendationType(null); // Limpiar el tipo guardado
                          }
                        }
                      }}
                      disabled={isOfferSpecific} // "Por Oferta" siempre está deshabilitada para clicks directos
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : isDark
                                ? colors.text
                                : colors.border,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <View style={styles.radioLabelHorizontal}>
                        <ThemedText
                          type="body2"
                          style={{ color: colors.text, fontWeight: "600" }}
                        >
                          {option.label}
                        </ThemedText>
                        <ThemedText
                          type="caption"
                          style={{ color: colors.textSecondary }}
                          numberOfLines={2}
                        >
                          {option.description}
                        </ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Imagen y Order siempre en la misma fila (sobre todo en móvil); Offerings puede bajar de fila */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", gap: 20, marginTop: 20, width: "100%" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, ...(isMobile ? { flexShrink: 0 } : { flex: 1, minWidth: 200 }) }}>
              <View style={{ position: "relative", width: recommendationImageSize, height: recommendationImageSize, flexShrink: 0 }}>
                {formData.image ? (
                  <>
                    <Image
                      source={{
                        uri: (formData.image || "").startsWith("data:")
                          ? formData.image!
                          : `data:image/jpeg;base64,${formData.image}`,
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: recommendationImageSize,
                        height: recommendationImageSize,
                        borderRadius: 8,
                        backgroundColor: colors.border,
                      }}
                      resizeMode="cover"
                    />
                    <View style={{ position: "absolute", top: 4, left: 4, right: 4, flexDirection: "row", justifyContent: "space-between", zIndex: 10 }}>
                      <Tooltip text={R?.removeImage ?? "Quitar imagen"} position="top">
                        <TouchableOpacity
                          onPress={() => setFormData((prev) => ({ ...prev, image: null }))}
                          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                        >
                          <Ionicons name="trash-outline" size={14} color="#fff" />
                        </TouchableOpacity>
                      </Tooltip>
                      <Tooltip text={R?.enlarge ?? "Ampliar"} position="top">
                        <TouchableOpacity
                          onPress={() => setImageViewerUri((formData.image || "").startsWith("data:") ? formData.image! : `data:image/jpeg;base64,${formData.image}`)}
                          style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
                        >
                          <Ionicons name="expand-outline" size={14} color="#fff" />
                        </TouchableOpacity>
                      </Tooltip>
                    </View>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickRecommendationImage(null)}
                                                style={{ width: recommendationImageSize, height: recommendationImageSize, borderRadius: 8, backgroundColor: colors.border + "60", alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: colors.textSecondary + "60" }}
                  >
                    <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <ThemedText
                    type="body2"
                    style={[styles.label, { color: colors.text, marginTop: 0, marginBottom: 0 }]}
                  >
                    {R?.orderLabel ?? "Orden"}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                      marginBottom: 0,
                      flex: 1,
                      minWidth: 0,
                      ...(isMobile && { fontSize: 11 }),
                    }}
                  >
                    {R?.orderHint ?? "Menor número = más importante (default: 0)"}
                  </ThemedText>
                </View>
                <NumericInput
                  value={formData.order.toString()}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0) {
                      setFormData((prev) => ({ ...prev, order: num }));
                    } else if (val === "") {
                      setFormData((prev) => ({ ...prev, order: 0 }));
                    }
                  }}
                  placeholder="0"
                  containerStyle={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.filterInputBackground,
                      borderColor: colors.border,
                    },
                  ]}
                  inputStyle={styles.input}
                  min={0}
                />
              </View>
              </View>
              {offerings.length > 0 && (
                <View style={{ flex: 1, minWidth: 220 }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <ThemedText
                      type="body2"
                      style={[
                        styles.label,
                        { color: colors.text, marginTop: 0, marginBottom: 0 },
                      ]}
                    >
                      {R?.offersLabel ?? "Ofertas"}
                    </ThemedText>
                    <ThemedText
                      type="caption"
                      style={{
                        color: colors.textSecondary,
                        marginBottom: 0,
                        flex: 1,
                        minWidth: 0,
                        ...(isMobile && { fontSize: 11 }),
                      }}
                    >
                      {R?.offerSelectorCaption ?? "Selecciona una oferta para una recomendación específica."}
                    </ThemedText>
                  </View>
                  <Select
                  value={formData.offeringId || ""}
                  options={[
                    {
                      value: "",
                      label: (() => {
                        const currentType =
                          previousRecommendationType || localRecommendationType;
                        if (currentType === "general")
                          return R?.generalRecommendation ?? "Recomendación General";
                        if (currentType === "warning")
                          return R?.warningGeneral ?? "Advertencia General";
                        return R?.generalRecommendation ?? "Recomendación General";
                      })(),
                    },
                    ...offerings.map((offering) => ({
                      value: offering.id,
                      label: offering.name,
                    })),
                  ]}
                  onSelect={(val) => {
                    if (val === "") {
                      // Restaurar el tipo de recomendación anterior cuando se selecciona la opción 0
                      const restoredType =
                        previousRecommendationType || localRecommendationType;
                      setLocalRecommendationType(restoredType);
                      setFormData((prev) => ({
                        ...prev,
                        offeringId: "",
                      }));
                      setPreviousRecommendationType(null); // Limpiar el tipo guardado
                    } else {
                      // Si se selecciona una oferta específica, guardar el tipo actual y cambiar a "Por Oferta"
                      // Guardar el tipo anterior solo si no hay oferta seleccionada previamente
                      if (!formData.offeringId) {
                        setPreviousRecommendationType(localRecommendationType);
                      }
                      setLocalRecommendationType("offer_specific");
                      setFormData((prev) => ({
                        ...prev,
                        offeringId: val as string,
                      }));
                    }
                  }}
                  placeholder={R?.selectOfferPlaceholder ?? "Selecciona una oferta"}
                  searchable={true}
                />
                </View>
              )}
            </View>

            <ThemedText
              type="body2"
              style={[styles.label, { color: colors.text, marginTop: 16 }]}
            >
              {R?.messageLabel ?? "Mensaje de recomendación *"}
            </ThemedText>
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
                placeholder={
                  formData.type === "informational"
                    ? "Ej: El cajero más cercano está a 3 cuadras"
                    : formData.type === "suggestion"
                      ? "Ej: Si deseas, contamos con servicio de tour guiado"
                      : "Escribe el mensaje que la IA compartirá..."
                }
                placeholderTextColor={colors.textSecondary}
                value={formData.message}
                onChangeText={(val) =>
                  setFormData((prev) => ({ ...prev, message: val }))
                }
                multiline
                numberOfLines={4}
              />
            </InputWithFocus>

            <View style={styles.formActions}>
              <Button
                title={t.common.cancel}
                onPress={() => {
                  setShowForm(false);
                  setFormData({
                    type: "informational",
                    message: "",
                    offeringId: "",
                    order: 0, // Cambiado de priority a order
                    image: null,
                  });
                  setLocalRecommendationType("general"); // Resetear al tipo por defecto
                  setPreviousRecommendationType(null); // Limpiar el tipo guardado
                }}
                variant="outlined"
                size="md"
                disabled={saving}
              />
              <Button
                title={saving ? "Guardando..." : "Crear Recomendación"}
                onPress={handleCreate}
                variant="primary"
                size="md"
                disabled={saving}
              />
            </View>
            </View>
          </Card>
        ) : (
          <Button
            title={R?.addRecommendation ?? "Agregar Recomendación"}
            onPress={() => setShowForm(true)}
            variant="primary"
            size="lg"
            style={styles.addButton}
          >
            <Ionicons
              name="add"
              size={20}
              color={colors.contrastText}
              style={{ marginRight: 8 }}
            />
          </Button>
        )}

        {recommendations.length === 0 && !showForm && (
          <Card variant="outlined" style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />
            <ThemedText
              type="body2"
              style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}
            >
              Crea recomendaciones para que la IA pueda sugerir información útil
              o productos a tus clientes
            </ThemedText>
          </Card>
        )}

        {/* Botones Continuar y Omitir */}
        <View style={styles.continueButtonContainer}>
          <Button
            title={
              recommendations.length > 0 || isCompleted ? (R?.continue ?? "Continuar") : (R?.skip ?? "Omitir")
            }
            onPress={async () => {
              const hasData = recommendations.length > 0;
              if (hasData || isCompleted) {
                // Si hay datos o está completada, marcar como completada y avanzar
                onComplete?.(hasData);
              } else {
                // Si no hay datos, marcar como omitida y avanzar
                onSkip?.();
              }
            }}
            variant="primary"
            size="lg"
            disabled={saving}
            style={styles.continueButton}
          >
            {recommendations.length > 0 || isCompleted ? (
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
          {recommendations.length > 0 && onSkip && !isCompleted && (
            <Button
              title={R?.skip ?? "Omitir"}
              onPress={() => {
                onSkip?.();
              }}
              variant="outlined"
              size="lg"
              disabled={saving}
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

      {/* Modal ver imagen ampliada */}
      <Modal
        visible={!!imageViewerUri}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerUri(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
          onPress={() => setImageViewerUri(null)}
        >
          <Pressable style={{ maxWidth: "100%", maxHeight: "100%" }} onPress={(e) => e.stopPropagation()}>
            {imageViewerUri ? (
              <Image
                source={{ uri: imageViewerUri }}
                style={{ width: 320, height: 320, borderRadius: 12 }}
                resizeMode="contain"
              />
            ) : null}
          </Pressable>
          <TouchableOpacity
            onPress={() => setImageViewerUri(null)}
            style={{
              position: "absolute",
              top: Platform.OS === "web" ? 48 : 56,
              right: 24,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  alert: {
    marginBottom: 16,
  },
  formContainer: {
    gap: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  sectionCard: {
    padding: 20,
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
    flex: 1,
  },
  listContainer: {
    gap: 12,
    marginTop: 8,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recommendationType: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recommendationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  relatedOffering: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  badgeActionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusOptionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelButton: {
    padding: 4,
    marginLeft: 8,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  formCard: {
    padding: 20,
    gap: 16,
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
  },
  radioGroupContainer: {
    marginTop: 8,
  },
  radioGroupRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  radioOptionHorizontal: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabelHorizontal: {
    marginLeft: 12,
    flex: 1,
  },
  selectContainer: {
    gap: 8,
    marginTop: 8,
  },
  selectOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
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
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 120,
  },
  textArea: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    marginTop: 8,
  },
  addButton: {
    marginTop: 8,
  },
  continueButtonContainer: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  continueButton: {
    width: "100%",
  },
  skipButton: {
    width: "100%",
  },
});
