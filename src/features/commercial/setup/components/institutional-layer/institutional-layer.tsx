/**
 * Componente para Capa 1: Contexto Institucional
 * Recopila información básica sobre la empresa para que la IA entienda qué es y cómo opera
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select, SelectOption } from "@/components/ui/select";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import {
    CatalogService,
    catalogDetailsToSelectOptions,
} from "@/src/domains/catalog";
import {
  CommercialService,
  MAX_MESSAGES_PER_MONTH_OPTIONS,
} from "@/src/domains/commercial";
import {
    CommercialProfile,
    CommercialProfilePayload,
} from "@/src/domains/commercial/types";
import { useCompany } from "@/src/domains/shared";
import { CustomSwitch } from "@/src/domains/shared/components/custom-switch/custom-switch";
import { useLanguage, useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InstitutionalLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void;
}

// Las listas de INDUSTRIES y TIMEZONES ahora se cargan desde catálogos

// Función para obtener la zona horaria del sistema
const getSystemTimezone = (): string => {
  try {
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  } catch (error) {
    // Si falla, retornar UTC como fallback
  }
  return "UTC";
};

export function InstitutionalLayer({
  onProgressUpdate,
  onDataChange,
  onComplete,
}: InstitutionalLayerProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const L = t.wizard?.layers?.institutional;
  const { language: currentLanguage } = useLanguage();
  const alert = useAlert();
  const { company } = useCompany();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CommercialProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Flag para evitar llamados repetitivos
  const [industries, setIndustries] = useState<SelectOption[]>([]);
  const [timezones, setTimezones] = useState<SelectOption[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);
  // Obtener valores por defecto: timezone del sistema/navegador (normalizado a lowercase para coincidir con catálogo)
  const systemTimezone = getSystemTimezone().toLowerCase();
  const systemLanguage = currentLanguage || company?.settings?.language || "es";

  const [formData, setFormData] = useState({
    businessDescription: "",
    industry: "",
    language: (systemLanguage === "es" || systemLanguage === "en"
      ? systemLanguage
      : "es") as "es" | "en",
    timezone: systemTimezone, // Usar zona horaria del sistema/navegador por defecto (normalizada a lowercase)
    is24_7: false,
    defaultTaxMode: "included" as "included" | "excluded",
    allowsBranchPricing: false,
    maxMessagesPerMonth: 500,
    planIsRestrictive: false,
  });
  // Guardar los datos originales para comparar cambios
  const [originalFormData, setOriginalFormData] = useState<
    typeof formData | null
  >(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [planQuotaModalVisible, setPlanQuotaModalVisible] = useState(false);

  const formatPlanQuota = useCallback(
    (n: number) =>
      new Intl.NumberFormat(
        currentLanguage === "es" ? "es" : "en-US",
      ).format(n),
    [currentLanguage],
  );

  // Los valores de currency, timezone y language vienen del perfil, no del contexto

  // Cargar catálogos de industrias y timezones
  useEffect(() => {
    if (!company?.id || isLoadingCatalogs) return;

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        // Cargar catálogos en paralelo
        const [industriesResponse, timezonesResponse] = await Promise.all([
          CatalogService.queryCatalog("INDUSTRIES", company.id, false),
          CatalogService.queryCatalog("TIMEZONES", company.id, false),
        ]);

        setIndustries(
          catalogDetailsToSelectOptions(industriesResponse.details),
        );
        setTimezones(catalogDetailsToSelectOptions(timezonesResponse.details));
      } catch (error: any) {
        console.error("Error al cargar catálogos:", error);
        alert.showError(
          L?.errorLoadingCatalogs ?? "Error al cargar catálogos",
          error.message,
        );
        // En caso de error, mantener arrays vacíos
        setIndustries([]);
        setTimezones([]);
      } finally {
        setIsLoadingCatalogs(false);
      }
    };

    loadCatalogs();
  }, [company?.id]);

  // Función helper para convertir name a code si es necesario
  // Memoizada para evitar recreaciones innecesarias
  const normalizeIndustryValue = useCallback(
    (industryValue: string | null | undefined): string => {
      if (!industryValue) return "";

      // Si el valor ya es un code (coincide con algún code en las opciones), devolverlo
      const matchingByCode = industries.find(
        (opt) => opt.value.toLowerCase() === industryValue.toLowerCase(),
      );
      if (matchingByCode) {
        return matchingByCode.value;
      }

      // Si no coincide por code, buscar por name (label)
      const matchingByName = industries.find(
        (opt) =>
          opt.label === industryValue ||
          opt.label.toLowerCase() === industryValue.toLowerCase(),
      );
      if (matchingByName) {
        return matchingByName.value; // Devolver el code correspondiente
      }

      // Si no se encuentra, devolver el valor original (por si acaso)
      return industryValue;
    },
    [industries],
  );

  // Sincronizar timezone del formulario con las opciones del catálogo cuando se cargan
  // Normalizar el valor a lowercase para que coincida con las opciones del catálogo
  useEffect(() => {
    if (timezones.length === 0 || !formData.timezone) return;

    // Buscar si el timezone actual coincide con alguna opción (comparación case-insensitive)
    const currentTimezoneLower = formData.timezone.toLowerCase();
    const matchingTimezone = timezones.find(
      (opt) => opt.value.toLowerCase() === currentTimezoneLower,
    );

    // Si encontramos una coincidencia, asegurarnos de que el formato coincida exactamente
    if (matchingTimezone && formData.timezone !== matchingTimezone.value) {
      setFormData((prev) => ({ ...prev, timezone: matchingTimezone.value }));
    }
  }, [timezones, formData.timezone]);

  // Normalizar industry cuando se cargan las industrias O cuando se carga el perfil
  // Convertir name a code si es necesario
  // Esto asegura que el Select muestre la opción correcta preseleccionada
  // NOTA: Este efecto se ejecuta cuando cambian las industrias o el perfil, pero el efecto anterior
  // ya maneja la actualización cuando se cargan las industrias después del perfil
  useEffect(() => {
    // Solo normalizar si hay industrias cargadas y hay un valor de industry en el formulario
    if (industries.length === 0 || !formData.industry) return;

    // Normalizar el valor actual de industry
    const normalizedIndustry = normalizeIndustryValue(formData.industry);

    // Verificar si el valor normalizado existe en las opciones disponibles
    const optionExists = industries.some(
      (opt) => opt.value === normalizedIndustry,
    );

    // Si el valor normalizado es diferente del actual Y existe en las opciones,
    // actualizar el formulario para que el Select muestre la opción correcta preseleccionada
    if (
      normalizedIndustry !== formData.industry &&
      normalizedIndustry &&
      optionExists
    ) {
      setFormData((prev) => ({ ...prev, industry: normalizedIndustry }));
      // También actualizar los datos originales para mantener la consistencia
      setOriginalFormData((prev) =>
        prev ? { ...prev, industry: normalizedIndustry } : null,
      );
    }
  }, [industries, normalizeIndustryValue, formData.industry]); // Solo depender de formData.industry, no de profile?.industry

  // Cargar perfil existente - solo una vez cuando cambia company.id
  // Limpiar estado cuando cambia la empresa
  useEffect(() => {
    if (!company?.id) return;

    // Limpiar inmediatamente el estado del formulario cuando cambia la empresa
    // para evitar mostrar datos de la empresa anterior mientras se carga el nuevo perfil
    const defaultFormData = {
      businessDescription: "",
      industry: "",
      language: (systemLanguage === "es" || systemLanguage === "en"
        ? systemLanguage
        : "es") as "es" | "en",
      timezone: systemTimezone,
      is24_7: false,
      defaultTaxMode: "included" as "included" | "excluded",
      allowsBranchPricing: false,
      maxMessagesPerMonth: 500,
      planIsRestrictive: false,
    };
    setFormData(defaultFormData);
    setOriginalFormData(defaultFormData);
    setProfile(null);
    setErrors({});
    // Resetear progreso a 0 mientras se carga el nuevo perfil
    onProgressUpdate?.(0);
    onDataChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para limpiar cuando cambia la empresa

  useEffect(() => {
    if (!company?.id || isLoadingProfile) return;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setLoading(true);

      try {
        const existingProfile = await CommercialService.getProfile(company.id);
        setProfile(existingProfile);

        // Normalizar el valor de industry: convertir name a code si es necesario
        // Si las industrias ya están cargadas, normalizar ahora; si no, se normalizará cuando se carguen
        // Usar el valor del perfil directamente primero, luego el efecto de normalización lo corregirá si es necesario
        const industryValue = existingProfile.industry || "";
        const normalizedIndustry =
          industries.length > 0 && industryValue
            ? normalizeIndustryValue(industryValue)
            : industryValue;

        // Mapear los datos al formulario, asegurando que los valores estén presentes
        const profileLanguage = existingProfile.language || systemLanguage;
        const newFormData = {
          businessDescription: existingProfile.businessDescription || "",
          industry: normalizedIndustry,
          language: (profileLanguage === "es" || profileLanguage === "en"
            ? profileLanguage
            : "es") as "es" | "en",
          timezone: existingProfile.timezone || systemTimezone,
          is24_7: existingProfile.is24_7 ?? false,
          defaultTaxMode: (existingProfile.defaultTaxMode || "included") as
            | "included"
            | "excluded",
          allowsBranchPricing: existingProfile.allowsBranchPricing ?? false,
          maxMessagesPerMonth:
            existingProfile.maxMessagesPerMonth ?? 500,
          planIsRestrictive: existingProfile.planIsRestrictive ?? false,
        };

        setFormData(newFormData);
        // Guardar los datos originales para comparar cambios
        setOriginalFormData(newFormData);
      } catch (error: any) {
        // Back devuelve 404 con type "info" o 404 sin type para "no existe perfil (primera vez)"
        const isNoProfile =
          error?.resultType === "info" ||
          error?.statusCode === 404 ||
          error?.result?.statusCode === 404;
        if (isNoProfile) {
          // Perfil no existe, es la primera vez - inicializar con valores por defecto
          setProfile(null);

          // Usar valores por defecto: timezone del sistema/navegador, language del sistema o empresa
          const defaultLanguage = (
            systemLanguage === "es" || systemLanguage === "en"
              ? systemLanguage
              : "es"
          ) as "es" | "en";
          const defaultFormData = {
            businessDescription: "",
            industry: "",
            language: defaultLanguage,
            timezone: systemTimezone, // Usar zona horaria del sistema/navegador por defecto
            is24_7: false,
            defaultTaxMode: "included" as "included" | "excluded",
            allowsBranchPricing: false,
            maxMessagesPerMonth: 500,
            planIsRestrictive: false,
          };
          setFormData(defaultFormData);
          // Guardar los datos originales (vacíos en este caso)
          setOriginalFormData(defaultFormData);
          // No mostrar error para 404 - es normal cuando no existe perfil
        } else {
          // Otro tipo de error - mostrar toast
          const errorMessage =
            error?.message ||
            error?.result?.description ||
            "Error al cargar perfil";
          alert.showError(errorMessage);
        }
      } finally {
        setLoading(false);
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para cargar el perfil una vez

  // Actualizar formulario cuando se cargan las industrias y hay un perfil con industry
  // Esto asegura que el valor de industry se normalice correctamente después de cargar los catálogos
  useEffect(() => {
    if (!profile || industries.length === 0 || !profile.industry) return;

    // Si el formulario ya tiene el valor correcto, no hacer nada
    const normalizedIndustry = normalizeIndustryValue(profile.industry);
    if (formData.industry === normalizedIndustry) return;

    // Actualizar el formulario con el valor normalizado
    setFormData((prev) => ({ ...prev, industry: normalizedIndustry }));
    setOriginalFormData((prev) =>
      prev ? { ...prev, industry: normalizedIndustry } : null,
    );
  }, [industries, profile, normalizeIndustryValue, formData.industry]);

  // Calcular progreso
  useEffect(() => {
    if (!company?.id) return;

    const fields = [
      formData.businessDescription,
      formData.industry,
      formData.language,
      formData.timezone,
    ];
    const completedFields = fields.filter((f) => f && f.trim()).length;
    const progress = Math.round((completedFields / fields.length) * 100);

    onProgressUpdate?.(progress);
    onDataChange?.(completedFields > 0);
  }, [formData, company?.id, onProgressUpdate, onDataChange]);

  const handleChange = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  };

  // Función para detectar si hay cambios en el formulario
  const hasChanges = (): boolean => {
    if (!originalFormData) return true; // Si no hay datos originales, considerar que hay cambios (nuevo perfil)

    return (
      formData.businessDescription.trim() !==
        (originalFormData.businessDescription || "").trim() ||
      formData.industry.trim() !== (originalFormData.industry || "").trim() ||
      formData.language !== originalFormData.language ||
      formData.timezone.trim() !== (originalFormData.timezone || "").trim() ||
      formData.is24_7 !== originalFormData.is24_7 ||
      formData.defaultTaxMode !== originalFormData.defaultTaxMode ||
      formData.allowsBranchPricing !== originalFormData.allowsBranchPricing ||
      formData.maxMessagesPerMonth !== originalFormData.maxMessagesPerMonth ||
      formData.planIsRestrictive !== originalFormData.planIsRestrictive
    );
  };

  // Función para avanzar a la siguiente etapa
  const handleContinue = () => {
    // Si el botón dice "Continuar", significa que no hay cambios pendientes
    // y la información ya está guardada, por lo que siempre debemos avanzar
    // El backend determinará el progreso real y la siguiente capa
    onComplete?.();
  };

  const handleSave = async () => {
    if (!company?.id) return;

    setSaving(true);

    try {
      // Construir payload - asegurar que los campos se envíen correctamente
      const trimmedDescription = formData.businessDescription.trim();
      const trimmedTimezone = formData.timezone.trim();

      // Normalizar industry: asegurarse de que siempre se envíe el code, no el name
      let normalizedIndustry = formData.industry.trim();
      if (normalizedIndustry && industries.length > 0) {
        normalizedIndustry = normalizeIndustryValue(normalizedIndustry);
      }

      const payload: CommercialProfilePayload = {
        companyId: company.id,
        // Enviar campos solo si tienen contenido (no undefined para evitar eliminarlos del JSON)
        ...(trimmedDescription
          ? { businessDescription: trimmedDescription }
          : {}),
        ...(normalizedIndustry ? { industry: normalizedIndustry } : {}),
        language: formData.language,
        ...(trimmedTimezone ? { timezone: trimmedTimezone } : {}),
        is24_7: formData.is24_7,
        defaultTaxMode: formData.defaultTaxMode,
        allowsBranchPricing: formData.allowsBranchPricing,
        maxMessagesPerMonth: formData.maxMessagesPerMonth,
        planIsRestrictive: formData.planIsRestrictive,
      };

      // Usar UPSERT unificado - el backend decide si crear o actualizar
      await CommercialService.upsertProfile(payload);
      alert.showSuccess(
        profile
          ? (L?.infoUpdated ?? "Información actualizada correctamente")
          : (L?.infoSaved ?? "Información guardada correctamente"),
      );

      // Recargar perfil después de guardar (solo si no hay error)
      try {
        const updated = await CommercialService.getProfile(company.id);
        setProfile(updated);

        // Actualizar formData con los valores guardados
        const updatedLanguage = updated.language || systemLanguage;
        const newFormData = {
          businessDescription: updated.businessDescription || "",
          industry: updated.industry || "",
          language: (updatedLanguage === "es" || updatedLanguage === "en"
            ? updatedLanguage
            : "es") as "es" | "en",
          timezone: updated.timezone?.toLowerCase() || systemTimezone,
          is24_7: updated.is24_7 || false,
          defaultTaxMode: (updated.defaultTaxMode || "included") as
            | "included"
            | "excluded",
          allowsBranchPricing: updated.allowsBranchPricing || false,
          maxMessagesPerMonth: updated.maxMessagesPerMonth ?? 500,
          planIsRestrictive: updated.planIsRestrictive ?? false,
        };
        setFormData(newFormData);
        // Actualizar los datos originales después de guardar
        setOriginalFormData(newFormData);

        // Notificar que el progreso está al 100% después de guardar exitosamente
        // (si el usuario guardó, significa que la información está completa)
        onProgressUpdate?.(100);

        // No llamar automáticamente a onComplete - el usuario debe presionar "Continuar" para avanzar
      } catch (error: any) {
        // Si falla al recargar, no es crítico - el perfil ya se guardó
        console.error("Error al recargar perfil después de guardar:", error);
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || (L?.errorSaving ?? "Error al guardar información");
      const errorDetail =
        typeof error?.details === "object"
          ? JSON.stringify(error.details)
          : error?.details || error?.result?.description;

      // Mostrar error en toast
      const fullErrorMessage = errorDetail
        ? `${errorMessage}: ${errorDetail}`
        : errorMessage;
      alert.showError(fullErrorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Función unificada para el botón: guardar si hay cambios, continuar si no
  const handleButtonPress = async () => {
    if (hasChanges()) {
      await handleSave();
    } else {
      handleContinue();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText
          type="body2"
          style={{ marginTop: 16, color: colors.textSecondary }}
        >
          {L?.loadingInfo ?? "Cargando información..."}
        </ThemedText>
      </View>
    );
  }

  return (
    <>
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {/* Industria */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {L?.industryQuestion ?? "¿En qué industria está tu empresa?"}
          </ThemedText>
          <Select
            value={formData.industry}
            options={industries}
            onSelect={(val) => handleChange("industry", val as string)}
            placeholder={L?.selectIndustry ?? "Selecciona una industria"}
            searchable={true}
            error={!!errors.industry}
            errorMessage={errors.industry}
            triggerStyle={{ backgroundColor: colors.filterInputBackground }}
          />
        </View>

        {/* Descripción del Negocio */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {L?.businessQuestion ?? "¿A qué se dedica tu empresa?"}
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.textAreaContainer,
              {
                backgroundColor: colors.filterInputBackground,
                borderColor: errors.businessDescription
                  ? colors.error
                  : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.businessDescription}
          >
            <TextInput
              style={[styles.textArea, { color: colors.text }]}
              placeholder={
                L?.businessDescriptionPlaceholder ??
                "Ej: Empresa de desarrollo de software especializada en soluciones empresariales"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.businessDescription}
              onChangeText={(val) => handleChange("businessDescription", val)}
              multiline
              numberOfLines={4}
            />
          </InputWithFocus>
          {errors.businessDescription && (
            <ThemedText
              type="caption"
              style={{ color: colors.error, marginTop: 4 }}
            >
              {errors.businessDescription}
            </ThemedText>
          )}
        </View>

        {/* Atención 24/7 y Precios por sucursal - En la misma línea */}
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.rowContainer,
              isMobile && { flexDirection: "column", gap: 0 },
            ]}
          >
            {/* Atención 24/7 */}
            <View style={[styles.halfWidth, isMobile && { width: "100%" }]}>
              <CustomSwitch
                value={formData.is24_7}
                onValueChange={(val) => handleChange("is24_7", val)}
                label={
                  L?.is24_7Label ??
                  "¿Atiendes 24 horas al día, 7 días a la semana?"
                }
              />
            </View>

            {/* Precios por sucursal */}
            <View style={[styles.halfWidth, isMobile && { width: "100%" }]}>
              <CustomSwitch
                value={formData.allowsBranchPricing}
                onValueChange={(val) =>
                  handleChange("allowsBranchPricing", val)
                }
                label={L?.branchPricingLabel ?? "¿Tus ofertas tienen precios diferentes por sucursal?"}
              />
            </View>
          </View>
        </View>

        {/* Impuestos por defecto + Plan (mensajes) en la misma fila en escritorio */}
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.taxAndPlanRow,
              isMobile && styles.taxAndPlanRowMobile,
            ]}
          >
            <View
              style={[styles.taxColumn, isMobile && styles.taxColumnMobile]}
            >
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.taxQuestion ??
                  "¿Los precios incluyen impuestos por defecto?"}
              </ThemedText>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    {
                      borderColor:
                        formData.defaultTaxMode === "included"
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        formData.defaultTaxMode === "included"
                          ? colors.primary + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleChange("defaultTaxMode", "included")}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          formData.defaultTaxMode === "included"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {formData.defaultTaxMode === "included" && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <ThemedText
                    type="body2"
                    style={{ color: colors.text, marginLeft: 12 }}
                  >
                    {L?.taxIncludedLabel ??
                      "Sí, los precios incluyen impuestos"}
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioOption,
                    {
                      borderColor:
                        formData.defaultTaxMode === "excluded"
                          ? colors.primary
                          : colors.border,
                      backgroundColor:
                        formData.defaultTaxMode === "excluded"
                          ? colors.primary + "20"
                          : "transparent",
                    },
                  ]}
                  onPress={() => handleChange("defaultTaxMode", "excluded")}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          formData.defaultTaxMode === "excluded"
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    {formData.defaultTaxMode === "excluded" && (
                      <View
                        style={[
                          styles.radioDot,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </View>
                  <ThemedText
                    type="body2"
                    style={{ color: colors.text, marginLeft: 12 }}
                  >
                    {L?.taxExcludedLabel ??
                      "No, los impuestos se agregan aparte"}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[styles.planColumn, isMobile && styles.planColumnMobile]}
            >
              <ThemedText
                type="body2"
                style={[styles.planSectionTitle, { color: colors.text }]}
              >
                {L?.planSectionTitle ?? "Plan de mensajería"}
              </ThemedText>
              <View style={styles.planControlRow}>
                <ThemedText
                  type="body2"
                  style={[styles.planRowLabel, { color: colors.text }]}
                >
                  {L?.planQuotaLabel ?? "Cupo de mensajes"}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setPlanQuotaModalVisible(true)}
                  style={[
                    styles.planQuotaTrigger,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.filterInputBackground,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    L?.planPickQuotaTitle ?? "Elegir cupo de mensajes"
                  }
                >
                  <ThemedText
                    type="body2"
                    style={{ color: colors.text, fontWeight: "600" }}
                  >
                    {formatPlanQuota(formData.maxMessagesPerMonth)}
                  </ThemedText>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.planControlRow}>
                <ThemedText
                  type="body2"
                  style={[styles.planRowLabel, { color: colors.text }]}
                >
                  {L?.planRestrictiveLabel ?? "¿Modo restrictivo?"}
                </ThemedText>
                <CustomSwitch
                  value={formData.planIsRestrictive}
                  onValueChange={(val) =>
                    handleChange("planIsRestrictive", val)
                  }
                  label=""
                />
              </View>
            </View>
          </View>
        </View>

        {/* Idioma y Zona Horaria - En la misma línea */}
        <View style={styles.inputGroup}>
          <View
            style={[
              styles.rowContainer,
              isMobile && { flexDirection: "column", gap: 0 },
            ]}
          >
            {/* Idioma - Obtenido automáticamente del sistema */}
            <View
              style={[
                styles.halfWidth,
                isMobile && { width: "100%", marginBottom: 0 },
              ]}
            >
              <ThemedText
                type="body2"
                style={[styles.label, { color: colors.text }]}
              >
                {L?.primaryLanguageLabel ?? "Idioma principal"}
              </ThemedText>
              <Select
                value={formData.language}
                options={[
                  { value: "es", label: "Español" },
                  { value: "en", label: "English" },
                ]}
                onSelect={(val) => handleChange("language", val as string)}
                placeholder={L?.selectLanguage ?? "Selecciona un idioma"}
                searchable={false}
                triggerStyle={{ backgroundColor: colors.filterInputBackground }}
              />
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginTop: 4 }}
              >
                {L?.languageAutoCaption ??
                  "Se toma automáticamente del idioma configurado en el sistema"}
              </ThemedText>
            </View>

            {/* Zona Horaria - Obtenida automáticamente del sistema */}
            <View style={[styles.halfWidth, isMobile && { width: "100%" }]}>
              <ThemedText
                type="body2"
                style={[
                  styles.label,
                  { color: colors.text, marginTop: isMobile ? 16 : 0 },
                ]}
              >
                {L?.timezoneLabel ?? "Zona horaria"}
              </ThemedText>
              <Select
                value={formData.timezone}
                options={timezones}
                onSelect={(val) => handleChange("timezone", val as string)}
                placeholder={L?.selectTimezone ?? "Selecciona una zona horaria"}
                searchable={true}
                triggerStyle={{ backgroundColor: colors.filterInputBackground }}
              />
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginTop: 4 }}
              >
                {L?.timezoneAutoCaption ??
                  "Se toma automáticamente de la zona horaria del sistema/navegador"}{" "}
                ({getSystemTimezone()})
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Botón Guardar */}
        <Button
          title={
            saving
              ? (L?.saving ?? "Guardando...")
              : hasChanges()
                ? (L?.saveInfo ?? "Guardar Información")
                : (L?.continue ?? "Continuar")
          }
          onPress={handleButtonPress}
          variant="primary"
          size="lg"
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator
              size="small"
              color={colors.contrastText}
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons
              name="arrow-forward-outline"
              size={20}
              color={colors.contrastText}
              style={{ marginRight: 8 }}
            />
          )}
        </Button>

        {/* Información sobre qué se activa */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />
          <ThemedText
            type="body2"
            style={{ color: colors.textSecondary, marginLeft: 8, flex: 1 }}
          >
            {L?.infoBoxText ??
              "Con esta información, la IA podrá responder preguntas sobre tu negocio, ubicación y operación básica."}
          </ThemedText>
        </View>
      </View>
    </ScrollView>

    <Modal
      visible={planQuotaModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPlanQuotaModalVisible(false)}
    >
      {/* Mismo patrón que components/ui/select.tsx: overlay centrado + hoja acotada (no ancho completo). */}
      <Pressable
        style={styles.quotaModalOverlay}
        onPress={() => setPlanQuotaModalVisible(false)}
      >
        <Pressable
          onPress={(e) => {
            // Evitar cerrar al tocar dentro del panel (web / RN)
            e?.stopPropagation?.();
          }}
          style={[
            styles.quotaModalSheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              ...Platform.select({
                web: {
                  boxShadow: `0px 4px 16px rgba(0,0,0,0.35)`,
                },
                default: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 8,
                },
              }),
            },
          ]}
        >
          <View
            style={[
              styles.quotaModalHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <ThemedText
              type="h4"
              style={[styles.quotaModalTitle, { color: colors.text }]}
            >
              {L?.planPickQuotaTitle ?? "Elegir cupo de mensajes"}
            </ThemedText>
            <TouchableOpacity
              onPress={() => setPlanQuotaModalVisible(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.quotaModalCloseHit}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[...MAX_MESSAGES_PER_MONTH_OPTIONS]}
            keyExtractor={String}
            style={styles.quotaModalList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = item === formData.maxMessagesPerMonth;
              return (
                <TouchableOpacity
                  style={[
                    styles.quotaModalOption,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: selected
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                  onPress={() => {
                    handleChange("maxMessagesPerMonth", item);
                    setPlanQuotaModalVisible(false);
                  }}
                >
                  <ThemedText
                    type="body2"
                    style={[
                      styles.quotaModalOptionText,
                      {
                        color: selected ? "#FFFFFF" : colors.text,
                        fontWeight: selected ? "600" : "500",
                      },
                    ]}
                  >
                    {formatPlanQuota(item)}
                  </ThemedText>
                  {selected ? (
                    <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
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
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
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
    minHeight: 150,
  },
  textArea: {
    fontSize: 16,
    minHeight: 130,
    textAlignVertical: "top",
  },
  rowContainer: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    marginBottom: 20,
    flex: 1,
  },
  taxAndPlanRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
    width: "100%",
    alignSelf: "stretch",
  },
  taxAndPlanRowMobile: {
    flexDirection: "column",
    gap: 0,
    width: "100%",
  },
  /** Mitad del ancho disponible (junto con planColumn reparte ~50% / ~50%). */
  taxColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  taxColumnMobile: {
    width: "100%",
    alignSelf: "stretch",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
  },
  planColumn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    gap: 8,
    paddingTop: 0,
  },
  planColumnMobile: {
    width: "100%",
    alignSelf: "stretch",
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    marginTop: 20,
    paddingTop: 0,
  },
  planSectionTitle: {
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  planControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 40,
  },
  planRowLabel: {
    flex: 1,
    fontWeight: "600",
    paddingRight: 8,
  },
  planQuotaTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 104,
    justifyContent: "space-between",
  },
  /** Igual idea que `modalOverlay` / `modalContent` en components/ui/select.tsx */
  quotaModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  quotaModalSheet: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  quotaModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  quotaModalTitle: {
    flex: 1,
    paddingRight: 8,
  },
  quotaModalCloseHit: {
    padding: 4,
  },
  quotaModalList: {
    maxHeight: 400,
  },
  quotaModalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quotaModalOptionText: {
    flex: 1,
  },
  radioGroup: {
    gap: 12,
    marginTop: 8,
  },
  radioOption: {
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
  saveButton: {
    marginTop: 8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
