/**
 * Wizard de Contextualización Comercial para IA
 * Guía al usuario a través de las capas de información necesarias
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CommercialService } from "@/src/domains/commercial";
import {
    CommercialCapabilities,
    LayerProgress,
} from "@/src/domains/commercial/types";
import { useCompany } from "@/src/domains/shared";
import { DynamicIcon, SearchFilterBar } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { CompanySetupLayer } from "../components/company-setup-layer/company-setup-layer";
import { InstitutionalLayer } from "../components/institutional-layer/institutional-layer";
import { InteractionGuidelinesLayer } from "../components/interaction-guidelines-layer";
import { OperationalLayer } from "../components/operational-layer/operational-layer";
import { PaymentsLayer } from "../components/payments-layer/payments-layer";
import { RecommendationsLayer } from "../components/recommendations-layer/recommendations-layer";
import {
    WhatsAppConnectionLayer,
    WhatsAppConnectionLayerRef,
} from "../components/whatsapp-connection-layer";
import { WizardStep, WizardStepper } from "../components/wizard-stepper";
import { createCommercialSetupScreenStyles } from "./commercial-setup.screen.styles";

export function CommercialSetupScreen() {
  const { colors, spacing, typography, pageLayout, borderRadius } = useTheme();
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const router = useRouter();

  const styles = useMemo(
    () =>
      createCommercialSetupScreenStyles(
        {
          colors,
          spacing,
          typography,
          pageLayout,
          borderRadius,
        },
        isMobile,
      ),
    [colors, spacing, typography, pageLayout, borderRadius, isMobile],
  );
  const alert = useAlert();
  const params = useLocalSearchParams<{ product?: string; layer?: string }>();
  const { company, user, branch } = useCompany();

  const [loading, setLoading] = useState(true);
  const [layerProgress, setLayerProgress] = useState<LayerProgress[]>([]);
  const [currentLayer, setCurrentLayer] = useState<string>("institutional");
  const [showLayer0, setShowLayer0] = useState(false);
  const [recommendationsFilter, setRecommendationsFilter] = useState("");
  const [interactionGuidelinesFilter, setInteractionGuidelinesFilter] =
    useState("");
  const [offeringsFilter, setOfferingsFilter] = useState("");
  const whatsappConnectionRef = useRef<WhatsAppConnectionLayerRef | null>(null);

  // Detectar si necesita Capa 0 (crear empresa/sucursal)
  const needsCompanySetup = (): boolean => {
    if (!user) return true;
    if (!company) return true;

    // Detectar empresa de invitado
    const code = (company.code || "").toUpperCase();
    const name = (company.name || "").toUpperCase();
    const isGuest =
      code.includes("GUEST") ||
      code.includes("INVITADO") ||
      name.includes("GUEST") ||
      name.includes("INVITADO") ||
      code === "DEFAULT" ||
      name === "EMPRESA POR DEFECTO";

    if (isGuest) return true;
    if (!branch) return true;

    return false;
  };

  // Inicializar según parámetros y estado del usuario
  useEffect(() => {
    // Si no está logueado, redirigir a login
    if (!user) {
      router.replace(
        "/auth/login?redirect=" +
          encodeURIComponent(
            "/commercial/setup?product=" + (params.product || "chat-ia"),
          ),
      );
      return;
    }

    // Si viene con layer=0, mostrar Capa 0
    if (params.layer === "0") {
      setShowLayer0(true);
      setCurrentLayer("institutional"); // Por defecto, pero no se mostrará hasta completar Capa 0
      return;
    }

    // Si necesita setup de empresa (Capa 0), mostrarla
    if (needsCompanySetup()) {
      setShowLayer0(true);
      return;
    }

    // Si tiene empresa real, cargar progreso normal
    if (company?.id) {
      setShowLayer0(false);
      // Si viene con layer específico, usarlo
      if (params.layer) {
        setCurrentLayer(params.layer);
      }
    }
  }, [user, company, branch, params.layer, params.product, router]);

  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  // Función helper para marcar una capa como completada u omitida
  // NO llama a updateCapabilities para evitar bucles infinitos
  // El GET en getLayerProgress se encargará de crear/actualizar el recurso cuando sea necesario
  const markLayerAsCompleted = useCallback(
    async (layer: string, hasData: boolean = false) => {
      if (!company?.id) return;

      try {
        // Mapear capa a capacidad correspondiente
        const capabilityMap: Record<string, keyof CommercialCapabilities> = {
          institutional: "canAnswerAboutBusiness", // También puede activar canAnswerAboutLocation
          offerings: "canAnswerAboutPrices",
          interactionGuidelines: "canAnswerAboutBusiness", // Las directrices mejoran la interacción general
          payments: "canAnswerAboutPayment",
          recommendations: "canRecommend", // También puede activar canSuggestProducts
        };

        const capabilityKey = capabilityMap[layer];

        // NO llamar a updateCapabilities aquí para evitar bucles infinitos
        // Solo actualizar el estado local
        // El GET en getLayerProgress se encargará de crear/actualizar el recurso cuando sea necesario

        // Actualizar el progreso local
        // Cuando se completa u omite una capa, siempre se marca como completada al 100%
        // (completada con datos = 100%, completada sin datos/omitida = 100% también)
        setLayerProgress((prev) => {
          const updated = prev.map((l) =>
            l.layer === layer
              ? {
                  ...l,
                  completed: true,
                  completionPercentage: 100,
                  skipped: !hasData,
                }
              : l,
          );
          // Si no existe la capa en el progreso, agregarla
          if (!updated.find((l) => l.layer === layer)) {
            updated.push({
              layer: layer as any,
              completed: true,
              completionPercentage: 100, // Siempre 100% cuando se completa u omite
              enabledCapabilities: capabilityKey ? [capabilityKey] : [],
              missingFields: hasData ? [] : [layer],
              skipped: !hasData,
            });
          }
          return updated;
        });
      } catch (error: any) {
        console.error("Error al marcar capa como completada:", error);
        // No mostrar error al usuario - solo log
      }
    },
    [company?.id],
  );

  // Cargar progreso de capas - evitar llamados repetitivos
  const loadProgress = useCallback(async () => {
    if (!company?.id || isLoadingProgress) return;

    setIsLoadingProgress(true);
    setLoading(true);

    try {
      const progress = await CommercialService.getLayerProgress(company.id);

      // Definir el orden de las capas
      const layerOrder = [
        "institutional",
        "offerings",
        "interactionGuidelines",
        "payments",
        "recommendations",
        "whatsappConnection",
      ];

      // Filtrar capa 'operational' del progreso
      const filteredProgress = progress.filter(
        (p) => p.layer !== "operational",
      );

      // Encontrar la última etapa completada
      let lastCompletedIndex = -1;
      for (let i = layerOrder.length - 1; i >= 0; i--) {
        const layerId = layerOrder[i];
        const layerProgress = filteredProgress.find((p) => p.layer === layerId);
        if (layerProgress?.completed) {
          lastCompletedIndex = i;
          break;
        }
      }

      // Si no hay capas completadas, buscar la última capa con datos (completionPercentage > 0)
      let lastWithDataIndex = -1;
      if (lastCompletedIndex < 0) {
        for (let i = layerOrder.length - 1; i >= 0; i--) {
          const layerId = layerOrder[i];
          const layerProgress = filteredProgress.find(
            (p) => p.layer === layerId,
          );
          if (layerProgress && layerProgress.completionPercentage > 0) {
            lastWithDataIndex = i;
            break;
          }
        }
      }

      // Determinar qué capa mostrar:
      // 1. Si hay etapas completadas, mostrar la última completada
      // 2. Si no hay etapas completadas pero hay capas con datos, mostrar la última con datos
      // 3. Si no hay ninguna con datos, mostrar la primera (institutional)
      let targetLayer = "institutional";
      if (lastCompletedIndex >= 0) {
        targetLayer = layerOrder[lastCompletedIndex];
      } else if (lastWithDataIndex >= 0) {
        targetLayer = layerOrder[lastWithDataIndex];
      }

      setCurrentLayer(targetLayer);

      // IMPORTANTE: Cuando cambia la empresa, reemplazar completamente el progreso
      // No preservar el progreso de la empresa anterior
      setLayerProgress(filteredProgress);
    } catch (error: any) {
      // Error silencioso - solo log (no mostrar toast en pantalla)
      console.error("Error al cargar el progreso:", error);
      // En caso de error, limpiar el progreso para evitar mostrar datos de otra empresa
      setLayerProgress([]);
    } finally {
      setLoading(false);
      setIsLoadingProgress(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id para evitar loops

  // Limpiar progreso cuando cambia la empresa
  useEffect(() => {
    // Cuando cambia company.id, limpiar el progreso anterior para evitar mostrar datos de otra empresa
    setLayerProgress([]);
    setCurrentLayer("institutional"); // Resetear a la primera capa
  }, [company?.id]);

  useEffect(() => {
    if (company?.id) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]); // Solo depender de company.id

  // Paso labels desde traducciones (sin hardcode)
  const stepLabels: Record<string, string> = useMemo(
    () => ({
      institutional: t.wizard.steps.institutional,
      offerings: t.wizard.steps.offerings,
      interactionGuidelines: t.wizard.steps.interactionGuidelines,
      payments: t.wizard.steps.payments,
      recommendations: t.wizard.steps.recommendations,
      whatsappConnection: t.wizard.steps.whatsappConnection,
    }),
    [t.wizard.steps],
  );

  // Definir pasos por defecto (sin capa 'operational' - se unificó con recomendaciones)
  const defaultSteps: WizardStep[] = useMemo(
    () => [
      {
        id: "institutional",
        label: stepLabels.institutional,
        layer: "institutional",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
      {
        id: "offerings",
        label: stepLabels.offerings,
        layer: "offerings",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
      {
        id: "interactionGuidelines",
        label: stepLabels.interactionGuidelines,
        layer: "interactionGuidelines",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
      {
        id: "payments",
        label: stepLabels.payments,
        layer: "payments",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
      {
        id: "recommendations",
        label: stepLabels.recommendations,
        layer: "recommendations",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
      {
        id: "whatsappConnection",
        label: stepLabels.whatsappConnection,
        layer: "whatsappConnection",
        completed: false,
        enabled: true,
        completionPercentage: 0,
      },
    ],
    [stepLabels],
  );

  // Convertir LayerProgress a WizardStep (sin capa 'operational')
  // Si layerProgress está vacío, usar pasos por defecto
  const wizardSteps: WizardStep[] =
    layerProgress.length > 0
      ? layerProgress
          .filter((layer) => layer.layer !== "operational") // Filtrar capa 'operational'
          .map((layer) => ({
            id: layer.layer,
            label: stepLabels[layer.layer] ?? t.wizard.layerFallback,
            layer: layer.layer,
            completed: layer.completed,
            enabled: true,
            completionPercentage: layer.completionPercentage,
            skipped: layer.skipped,
          }))
      : defaultSteps;

  const handleStepPress = (step: WizardStep) => {
    // Definir el orden de las capas
    const layerOrder = [
      "institutional",
      "offerings",
      "interactionGuidelines",
      "payments",
      "recommendations",
      "whatsappConnection",
    ];

    const currentIndex = layerOrder.indexOf(currentLayer);
    const targetIndex = layerOrder.indexOf(step.layer);

    // Obtener el estado de la etapa actual
    const currentStep = wizardSteps.find((s) => s.layer === currentLayer);
    const isCurrentCompleted = currentStep?.completed || false;

    // Permitir navegación si:
    // 1. Es una etapa anterior (targetIndex < currentIndex) - siempre permitido
    // 2. Es la etapa actual (targetIndex === currentIndex) - siempre permitido
    // 3. Es una etapa futura (targetIndex > currentIndex) - solo si la actual está completada
    if (targetIndex <= currentIndex || isCurrentCompleted) {
      setCurrentLayer(step.layer);
    }
    // Si es una etapa futura y la actual no está completada, no hacer nada (no permitir navegación)
  };

  const handleBack = () => {
    router.back();
  };

  if (!company) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={pageLayout.iconSubtitle}
              color={colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.titleRow}>
              <View style={styles.titleIconContainer}>
                <DynamicIcon
                  name="MaterialCommunityIcons:cellphone-cog"
                  size={
                    isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle
                  }
                  color={colors.primary}
                  style={styles.titleIcon}
                />
              </View>
              <ThemedText
                type="h2"
                style={isMobile ? styles.titleMobile : styles.title}
              >
                {t.wizard.title}
              </ThemedText>
            </View>
            <ThemedText type="body1" style={styles.subtitle}>
              {t.wizard.subtitle}
            </ThemedText>
          </View>
        </View>

        {/* Stepper Visual (solo si no está en Capa 0) */}
        {!showLayer0 && (
          <Card variant="elevated" style={styles.stepperCard}>
            <WizardStepper
              steps={wizardSteps}
              currentStep={currentLayer}
              onStepPress={handleStepPress}
            />
          </Card>
        )}

        {/* Capa 0: Configuración de Empresa/Sucursal */}
        {showLayer0 ? (
          <Card variant="elevated" style={styles.contentCard}>
            <CompanySetupLayer
              onComplete={() => {
                setShowLayer0(false);
                setCurrentLayer("institutional");
                // Recargar progreso después de crear empresa
                if (company?.id) {
                  loadProgress();
                }
              }}
            />
          </Card>
        ) : (
          <>
            {/* Contenido de la Capa Actual */}
            <Card
              variant="elevated"
              style={[
                styles.contentCard,
                currentLayer === "interactionGuidelines" && { gap: 0 },
                currentLayer === "offerings" && isMobile && styles.contentCardOfferingsMobile,
              ]}
            >
              <View
                style={[
                  isMobile
                    ? styles.contentHeaderRowMobile
                    : styles.contentHeaderRow,
                  currentLayer === "interactionGuidelines" &&
                    styles.contentHeaderRowNoMargin,
                ]}
              >
                <View
                  style={[
                    styles.contentHeaderCol,
                    isMobile && { width: "100%" },
                  ]}
                >
                  {/* Subtítulo del wizard: ej. Contexto Institucional, Ofertas, Directrices de Interacción, etc. */}
                  <ThemedText
                    type="body1"
                    style={
                      isMobile
                        ? styles.layerSubtitleMobile
                        : styles.layerSubtitle
                    }
                  >
                    {wizardSteps.find((s) => s.id === currentLayer)?.label ||
                      t.wizard.layerFallback}
                  </ThemedText>
                  {currentLayer === "recommendations" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.recommendations}
                    </ThemedText>
                  )}
                  {currentLayer === "interactionGuidelines" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.interactionGuidelines}
                    </ThemedText>
                  )}
                  {currentLayer === "institutional" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.institutional}
                    </ThemedText>
                  )}
                  {currentLayer === "offerings" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.offerings}
                    </ThemedText>
                  )}
                  {currentLayer === "payments" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.payments}
                    </ThemedText>
                  )}
                  {currentLayer === "whatsappConnection" && (
                    <ThemedText type="body2" style={styles.contentDescription}>
                      {t.wizard.descriptions.whatsappConnection}
                    </ThemedText>
                  )}
                </View>
                {currentLayer === "offerings" && (
                  <View
                    style={[
                      styles.filterWrapper,
                      isMobile && styles.filterWrapperMobile,
                    ]}
                  >
                    <SearchFilterBar
                      filterValue={offeringsFilter}
                      onFilterChange={setOfferingsFilter}
                      onSearchSubmit={(search) => setOfferingsFilter(search)}
                      filterPlaceholder={t.wizard.filters.filterByNameOrCode}
                      searchPlaceholder={t.wizard.filters.searchOfferings}
                      filters={[]}
                      showClearButton={false}
                      showSearchHint={false}
                    />
                  </View>
                )}
                {currentLayer === "whatsappConnection" && (
                  <View
                    style={[
                      styles.buttonWrapper,
                      isMobile && styles.buttonWrapperMobile,
                    ]}
                  >
                    <Button
                      title={isMobile ? "" : t.wizard.createConnection}
                      onPress={() => {
                        whatsappConnectionRef.current?.handleCreate();
                      }}
                      variant="primary"
                      size="md"
                      style={{ width: isMobile ? "100%" : 220 }}
                    >
                      <Ionicons
                        name="add"
                        size={pageLayout.iconSubtitle}
                        color={colors.contrastText}
                        style={
                          !isMobile ? { marginRight: spacing.sm } : undefined
                        }
                      />
                    </Button>
                  </View>
                )}
                {currentLayer === "recommendations" && (
                  <View
                    style={[
                      styles.filterWrapper,
                      isMobile && styles.filterWrapperMobile,
                    ]}
                  >
                    <SearchFilterBar
                      filterValue={recommendationsFilter}
                      onFilterChange={setRecommendationsFilter}
                      onSearchSubmit={(search) =>
                        setRecommendationsFilter(search)
                      }
                      filterPlaceholder={t.wizard.filters.filterByMessage}
                      searchPlaceholder={t.wizard.filters.searchRecommendations}
                      filters={[]}
                      showClearButton={false}
                      showSearchHint={false}
                    />
                  </View>
                )}
                {currentLayer === "interactionGuidelines" && (
                  <View
                    style={[
                      styles.filterWrapper,
                      isMobile && styles.filterWrapperMobile,
                    ]}
                  >
                    <SearchFilterBar
                      filterValue={interactionGuidelinesFilter}
                      onFilterChange={setInteractionGuidelinesFilter}
                      onSearchSubmit={(search) =>
                        setInteractionGuidelinesFilter(search)
                      }
                      filterPlaceholder={
                        t.wizard.filters.filterByTitleOrDescription
                      }
                      searchPlaceholder={t.wizard.filters.searchGuidelines}
                      filters={[]}
                      showClearButton={false}
                      showSearchHint={false}
                    />
                  </View>
                )}
              </View>

              {/* Renderizar componente de la capa actual */}
              <View
                style={[
                  styles.layerContent,
                  currentLayer === "interactionGuidelines" &&
                    styles.layerContentNoPadding,
                ]}
              >
                {currentLayer === "institutional" && (
                  <InstitutionalLayer
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const updated = prev.map((l) =>
                          l.layer === "institutional"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find((l) => l.layer === "institutional")) {
                          updated.push({
                            layer: "institutional",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields:
                              progress === 100 ? [] : ["institutional"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async () => {
                      // Recargar progreso para obtener datos actualizados
                      await loadProgress();
                      // NO navegar automáticamente - el usuario puede navegar manualmente haciendo clic en las etapas
                      // Solo navegar automáticamente cuando se carga el wizard inicialmente (en loadProgress)
                    }}
                  />
                )}
                {currentLayer === "offerings" && (
                  <OperationalLayer
                    searchFilter={offeringsFilter}
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const updated = prev.map((l) =>
                          l.layer === "offerings"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find((l) => l.layer === "offerings")) {
                          updated.push({
                            layer: "offerings",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields:
                              progress === 100 ? [] : ["offerings"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async () => {
                      // No recargar progreso aquí para evitar sobrescribir el progreso al 100%
                      // que se estableció después de guardar exitosamente
                      // NO navegar automáticamente - el usuario puede navegar manualmente haciendo clic en las etapas
                      // Solo navegar automáticamente cuando se carga el wizard inicialmente (en loadProgress)
                    }}
                  />
                )}
                {currentLayer === "interactionGuidelines" && (
                  <InteractionGuidelinesLayer
                    searchFilter={interactionGuidelinesFilter}
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const existingLayer = prev.find(
                          (l) => l.layer === "interactionGuidelines",
                        );
                        // Si la capa ya está marcada como completada, no sobrescribir el estado
                        if (existingLayer && existingLayer.completed) {
                          return prev; // Mantener el estado de completado
                        }
                        // Solo actualizar el progreso si no está completada
                        const updated = prev.map((l) =>
                          l.layer === "interactionGuidelines"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        if (
                          !updated.find(
                            (l) => l.layer === "interactionGuidelines",
                          )
                        ) {
                          updated.push({
                            layer: "interactionGuidelines",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields:
                              progress === 100 ? [] : ["interactionGuidelines"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async (hasData) => {
                      await markLayerAsCompleted(
                        "interactionGuidelines",
                        hasData || false,
                      );
                      // NO navegar automáticamente - el usuario puede navegar manualmente haciendo clic en las etapas
                      // Solo navegar automáticamente cuando se carga el wizard inicialmente (en loadProgress)
                    }}
                    onSkip={async () => {
                      await markLayerAsCompleted(
                        "interactionGuidelines",
                        false,
                      );
                      setCurrentLayer((prevLayer) => {
                        const layerOrder = [
                          "institutional",
                          "offerings",
                          "interactionGuidelines",
                          "payments",
                          "recommendations",
                          "whatsappConnection",
                        ];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (
                          currentIndex >= 0 &&
                          currentIndex < layerOrder.length - 1
                        ) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
                {currentLayer === "payments" && (
                  <PaymentsLayer
                    isCompleted={
                      layerProgress.find((l) => l.layer === "payments")
                        ?.completed || false
                    }
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const existingLayer = prev.find(
                          (l) => l.layer === "payments",
                        );
                        // Si la capa ya está marcada como completada, no sobrescribir el estado
                        if (existingLayer && existingLayer.completed) {
                          return prev; // Mantener el estado de completado
                        }
                        // Solo actualizar el progreso si no está completada
                        const updated = prev.map((l) =>
                          l.layer === "payments"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (!updated.find((l) => l.layer === "payments")) {
                          updated.push({
                            layer: "payments",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields: progress === 100 ? [] : ["payments"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async (hasData: boolean = false) => {
                      // Marcar como completada con los datos proporcionados
                      await markLayerAsCompleted("payments", hasData);
                      // NO navegar automáticamente - el usuario puede navegar manualmente haciendo clic en las etapas
                      // Solo navegar automáticamente cuando se carga el wizard inicialmente (en loadProgress)
                    }}
                    onSkip={async () => {
                      // Marcar como omitida sin datos
                      await markLayerAsCompleted("payments", false);
                      setCurrentLayer((prevLayer) => {
                        const layerOrder = [
                          "institutional",
                          "offerings",
                          "interactionGuidelines",
                          "payments",
                          "recommendations",
                          "whatsappConnection",
                        ];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (
                          currentIndex >= 0 &&
                          currentIndex < layerOrder.length - 1
                        ) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
                {currentLayer === "recommendations" && (
                  <RecommendationsLayer
                    searchFilter={recommendationsFilter}
                    isCompleted={
                      layerProgress.find((l) => l.layer === "recommendations")
                        ?.completed || false
                    }
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const existingLayer = prev.find(
                          (l) => l.layer === "recommendations",
                        );
                        // Si la capa ya está marcada como completada, no sobrescribir el estado
                        if (existingLayer && existingLayer.completed) {
                          return prev; // Mantener el estado de completado
                        }
                        // Solo actualizar el progreso si no está completada
                        const updated = prev.map((l) =>
                          l.layer === "recommendations"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        // Si no existe la capa en el progreso, agregarla
                        if (
                          !updated.find((l) => l.layer === "recommendations")
                        ) {
                          updated.push({
                            layer: "recommendations",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields:
                              progress === 100 ? [] : ["recommendations"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar capacidades cuando hay datos
                    }}
                    onComplete={async (hasData: boolean = false) => {
                      // Marcar como completada con los datos proporcionados
                      await markLayerAsCompleted("recommendations", hasData);
                      // Navegar automáticamente a la siguiente etapa (whatsappConnection)
                      setCurrentLayer((prevLayer) => {
                        const layerOrder = [
                          "institutional",
                          "offerings",
                          "interactionGuidelines",
                          "payments",
                          "recommendations",
                          "whatsappConnection",
                        ];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (
                          currentIndex >= 0 &&
                          currentIndex < layerOrder.length - 1
                        ) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                    onSkip={async () => {
                      // Marcar como omitida sin datos
                      await markLayerAsCompleted("recommendations", false);
                      // Navegar automáticamente a la siguiente etapa (whatsappConnection)
                      setCurrentLayer((prevLayer) => {
                        const layerOrder = [
                          "institutional",
                          "offerings",
                          "interactionGuidelines",
                          "payments",
                          "recommendations",
                          "whatsappConnection",
                        ];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (
                          currentIndex >= 0 &&
                          currentIndex < layerOrder.length - 1
                        ) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                    // Mostrar todos los tipos de recomendaciones (sin filtro)
                    layerTitle="Recomendaciones"
                    layerDescription="Crea recomendaciones informativas, de orientación, sugerencias y upsell que la IA puede ofrecer durante las conversaciones"
                  />
                )}
                {currentLayer === "whatsappConnection" && (
                  <WhatsAppConnectionLayer
                    ref={whatsappConnectionRef}
                    isCompleted={
                      layerProgress.find(
                        (l) => l.layer === "whatsappConnection",
                      )?.completed || false
                    }
                    onProgressUpdate={(progress) => {
                      setLayerProgress((prev) => {
                        const updated = prev.map((l) =>
                          l.layer === "whatsappConnection"
                            ? {
                                ...l,
                                completionPercentage: progress,
                                completed: progress === 100,
                              }
                            : l,
                        );
                        if (
                          !updated.find((l) => l.layer === "whatsappConnection")
                        ) {
                          updated.push({
                            layer: "whatsappConnection",
                            completed: progress === 100,
                            completionPercentage: progress,
                            enabledCapabilities: [],
                            missingFields:
                              progress === 100 ? [] : ["whatsappConnection"],
                          });
                        }
                        return updated;
                      });
                    }}
                    onDataChange={(hasData) => {
                      // Actualizar cuando hay datos
                    }}
                    onComplete={async () => {
                      await markLayerAsCompleted("whatsappConnection", true);
                      alert.showSuccess(
                        "¡Configuración completada! Tu Chat IA está listo para usar.",
                      );
                    }}
                    onSkip={async () => {
                      await markLayerAsCompleted("whatsappConnection", false);
                      setCurrentLayer((prevLayer) => {
                        const layerOrder = [
                          "institutional",
                          "offerings",
                          "interactionGuidelines",
                          "payments",
                          "recommendations",
                          "whatsappConnection",
                        ];
                        const currentIndex = layerOrder.indexOf(prevLayer);
                        if (
                          currentIndex >= 0 &&
                          currentIndex < layerOrder.length - 1
                        ) {
                          return layerOrder[currentIndex + 1];
                        }
                        return prevLayer;
                      });
                    }}
                  />
                )}
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}
