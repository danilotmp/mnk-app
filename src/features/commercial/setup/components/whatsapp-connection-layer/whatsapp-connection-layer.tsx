/**
 * Componente para Capa de Conexión WhatsApp
 * Gestiona las instancias de WhatsApp con tabla CRUD
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SideModal } from "@/components/ui/side-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { CommercialService } from "@/src/domains/commercial";
import type { WhatsAppInstance } from "@/src/domains/commercial/types";
import { InteraccionesService } from "@/src/domains/interacciones";
import { useCompany } from "@/src/domains/shared";
import { PhoneInput } from "@/src/domains/shared/components";
import { CustomSwitch } from "@/src/domains/shared/components/custom-switch/custom-switch";
import { DataTable } from "@/src/domains/shared/components/data-table/data-table";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorDetail } from "@/src/infrastructure/messages/error-utils";
import { formatCode } from "@/src/infrastructure/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Share,
  TouchableOpacity,
  View,
} from "react-native";

import { styles } from "./whatsapp-connection-layer.styles";

interface WhatsAppConnectionLayerProps {
  onProgressUpdate?: (progress: number) => void;
  onDataChange?: (hasData: boolean) => void;
  onComplete?: () => void;
  onSkip?: () => void;
  isCompleted?: boolean;
}

export interface WhatsAppConnectionLayerRef {
  handleCreate: () => void;
}

interface WhatsAppInstanceFormData {
  whatsapp: string;
  isActive?: boolean;
}

export const WhatsAppConnectionLayer = forwardRef<
  WhatsAppConnectionLayerRef,
  WhatsAppConnectionLayerProps
>(({ onProgressUpdate, onDataChange }, ref) => {
  const { colors, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t, language } = useTranslation();
  const L = t.wizard?.layers?.whatsappConnection;
  const alert = useAlert();
  const { company } = useCompany();
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<
    "create" | "edit" | "view-qr" | null
  >(null);
  const [selectedInstance, setSelectedInstance] =
    useState<WhatsAppInstance | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [reconnectingWhatsapp, setReconnectingWhatsapp] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState<WhatsAppInstanceFormData>({
    whatsapp: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [modalAlert, setModalAlert] = useState<{
    message: string;
    detail?: string;
    type: "error" | "info";
  } | null>(null);
  const createModalScrollRef = useRef<ScrollView | null>(null);

  // Cargar instancias al montar
  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }
    loadInstances();
  }, [company?.id]);

  const loadInstances = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const profile = await CommercialService.getProfile(company.id, true);
      let loadedInstances = profile.whatsappInstances || [];

      // Si hay commercialProfileId, obtener contexto (incluye chatIAFlow para super admin, instancias inactivas con admin)
      if (profile.id) {
        try {
          const { whatsappInstances: contextInstances } =
            await CommercialService.getProfileContext(profile.id, true);
          if (contextInstances.length > 0) {
            loadedInstances = loadedInstances.map((inst) => {
              const enriched = contextInstances.find(
                (c) => c.id === inst.id || c.whatsapp === inst.whatsapp,
              );
              if (!enriched) return inst;
              return {
                ...inst,
                ...(enriched.chatIAFlow && enriched.chatIAFlowFilename
                  ? {
                      chatIAFlow: enriched.chatIAFlow,
                      chatIAFlowFilename: enriched.chatIAFlowFilename,
                    }
                  : {}),
              };
            });
          }
        } catch {
          // Si falla el contexto (ej. no super admin), usar instancias base
        }
      }

      const companyId = company.id;
      type MonthMetrics = {
        tx: number;
        docs: number;
        ops: number;
        pay: number;
        exec: number;
      };
      let metricsByChannel = new Map<string, MonthMetrics>();
      try {
        const period = await InteraccionesService.getDashboardPeriod({
          companyId,
        });
        metricsByChannel = new Map(
          period.instances.map((row) => [
            row.channelInstance,
            {
              tx: row.transactionsCount,
              docs: row.countDocuments,
              ops: row.operationsCount,
              pay: row.paymentsCount,
              exec: row.executionsCount,
            },
          ]),
        );
      } catch {
        metricsByChannel = new Map();
      }
      loadedInstances = loadedInstances.map((inst) => {
        const ch = inst.whatsapp?.trim() ?? "";
        const m = metricsByChannel.get(ch);
        return {
          ...inst,
          monthTransactionsCount: m?.tx ?? 0,
          monthDocumentsCount: m?.docs ?? 0,
          monthOperationsCount: m?.ops ?? 0,
          monthPaymentsCount: m?.pay ?? 0,
          monthExecutionsCount: m?.exec ?? 0,
        };
      });

      setInstances(loadedInstances);

      // Actualizar progreso basado en si hay instancias activas
      const hasActiveInstances = loadedInstances.some((inst) => inst.isActive);
      onProgressUpdate?.(hasActiveInstances ? 100 : 0);
      onDataChange?.(hasActiveInstances);
    } catch (error: any) {
      console.error("Error al cargar instancias de WhatsApp:", error);
      alert.showError("Error al cargar instancias de WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  /** URI válida para mostrar imagen QR (data URL); normaliza base64 sin newlines. */
  const toQRImageUri = (value: string | null | undefined): string | null => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("data:")) {
      const base64Part = trimmed.split(",", 2)[1];
      if (!base64Part) return trimmed;
      return `data:image/png;base64,${base64Part.replace(/\s/g, "")}`;
    }
    return `data:image/png;base64,${trimmed.replace(/\s/g, "")}`;
  };

  /** Decodifica base64 a string UTF-8 (web y native). */
  const base64ToUtf8 = (base64: string): string => {
    if (typeof globalThis !== "undefined" && "Buffer" in globalThis) {
      return (globalThis as any).Buffer.from(base64, "base64").toString(
        "utf-8",
      );
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  };

  /** Descargar o compartir el archivo de flujo ChatIA (super admin). chatIAFlow viene en base64. */
  const handleDownloadFlow = async (instance: WhatsAppInstance) => {
    const base64 = instance.chatIAFlow;
    const filename = instance.chatIAFlowFilename || "chat-ia-flow.json";
    if (!base64) return;
    try {
      const content = base64ToUtf8(base64);
      if (Platform.OS === "web") {
        const blob = new Blob([content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          message: content,
          title: filename,
        });
      }
    } catch (e) {
      alert.showError("Error al descargar el flujo");
    }
  };

  const handleCreate = () => {
    setFormData({ whatsapp: "", isActive: true });
    setFormErrors({});
    setSelectedInstance(null);
    setModalAlert(null);
    setModalMode("create");
    setIsModalVisible(true);
  };

  // Exponer handleCreate a través de la ref
  useImperativeHandle(ref, () => ({
    handleCreate,
  }));

  const handleEdit = (instance: WhatsAppInstance) => {
    setFormData({ whatsapp: instance.whatsapp, isActive: instance.isActive });
    setFormErrors({});
    setSelectedInstance(instance);
    setModalAlert(null);
    setModalMode("edit");
    setIsModalVisible(true);
  };

  const handleViewQR = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setModalAlert(null);
    setModalMode("view-qr");
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedInstance(null);
    setFormData({ whatsapp: "" });
    setFormErrors({});
    setGeneratedQR(null);
    setModalAlert(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.whatsapp.trim()) {
      errors.whatsapp =
        L?.whatsappRequired ?? "El número de WhatsApp es requerido";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerateQR = async () => {
    if (!company?.id || !selectedInstance) return;

    setGeneratingQR(true);
    try {
      // Regenerar QR para la instancia seleccionada
      const updatedInstance = await CommercialService.regenerateWhatsAppQR(
        company.id,
        selectedInstance.id,
      );

      // Actualizar en la lista local
      const updatedInstances = instances.map((inst) =>
        inst.id === updatedInstance.id ? updatedInstance : inst,
      );
      setInstances(updatedInstances);

      // Actualizar instancia seleccionada para mostrar nuevo QR
      setSelectedInstance(updatedInstance);

      alert.showSuccess(
        L?.qrRegenerated ?? "Código QR regenerado correctamente",
      );
    } catch (error: any) {
      const message =
        error?.message ||
        (L?.errorRegeneratingQR ?? "Error al regenerar el código QR");
      const detail = extractErrorDetail(error);
      const type =
        (error?.resultType ?? "").toString().toLowerCase() === "info"
          ? "info"
          : "error";
      setModalAlert({ message, detail, type });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleGenerateFromInput = async () => {
    if (!company?.id) return;

    if (!formData.whatsapp.trim()) {
      setFormErrors({
        whatsapp: L?.whatsappRequired ?? "El número de WhatsApp es requerido",
      });
      return;
    }

    setGeneratingQR(true);
    setModalAlert(null);
    try {
      const whatsappValue = formatCode(formData.whatsapp.trim());

      // Crear instancia de WhatsApp (la respuesta puede incluir data.qrcode.base64 y así evitamos 2ª llamada)
      const createResponse =
        await CommercialService.createWhatsAppInstance(whatsappValue);

      if (!createResponse.success) {
        setModalAlert({
          message:
            L?.errorCreatingInstance ??
            "Error al crear la instancia de WhatsApp",
          type: "error",
        });
        return;
      }

      let qrImage: string | null = createResponse.data?.qrcode?.base64 ?? null;
      if (!qrImage) {
        const qrResponse =
          await CommercialService.getWhatsAppQRCode(whatsappValue);
        qrImage = qrResponse.qrcode || null;
      }

      if (!qrImage) {
        setModalAlert({
          message: L?.errorGettingQR ?? "Error al obtener el código QR",
          type: "error",
        });
        return;
      }

      setGeneratedQR(qrImage);
      // Hacer scroll al final del modal para que el QR sea visible
      setTimeout(() => {
        createModalScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
      alert.showSuccess(L?.qrGenerated ?? "Código QR generado correctamente");
    } catch (error: any) {
      const message =
        error?.message ||
        (L?.errorGettingQR ?? "Error al generar el código QR");
      const detail = extractErrorDetail(error);
      const type =
        (error?.resultType ?? "").toString().toLowerCase() === "info"
          ? "info"
          : "error";
      setModalAlert({ message, detail, type });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id) return;

    if (!validateForm()) return;

    setSaving(true);
    try {
      const whatsappValue = formatCode(formData.whatsapp.trim());

      if (modalMode === "create") {
        // Crear nueva instancia con el QR generado si existe
        const newInstance =
          await CommercialService.createWhatsAppInstanceInProfile(company.id, {
            whatsapp: whatsappValue,
            whatsappQR: generatedQR,
            isActive: true,
          });

        setInstances((prev) => [...prev, newInstance]);

        // Actualizar progreso con la nueva lista
        const updatedInstances = [...instances, newInstance];
        const hasActiveInstances = updatedInstances.some(
          (inst) => inst.isActive,
        );
        onProgressUpdate?.(hasActiveInstances ? 100 : 0);
        onDataChange?.(hasActiveInstances);

        handleCloseModal();
        alert.showSuccess(
          L?.instanceCreated ?? "Instancia de WhatsApp creada correctamente",
        );
      } else if (modalMode === "edit" && selectedInstance) {
        // Actualizar instancia existente
        const updatedInstance = await CommercialService.updateWhatsAppInstance(
          company.id,
          selectedInstance.id,
          {
            whatsapp: whatsappValue,
            isActive: formData.isActive,
          },
        );

        setInstances((prev) =>
          prev.map((inst) =>
            inst.id === updatedInstance.id ? updatedInstance : inst,
          ),
        );

        // Si se actualizó el WhatsApp y tiene QR, actualizar la instancia seleccionada
        if (updatedInstance.whatsappQR && selectedInstance) {
          setSelectedInstance(updatedInstance);
        }

        // Actualizar progreso con la lista actualizada
        const updatedInstances = instances.map((inst) =>
          inst.id === updatedInstance.id ? updatedInstance : inst,
        );
        const hasActiveInstances = updatedInstances.some(
          (inst) => inst.isActive,
        );
        onProgressUpdate?.(hasActiveInstances ? 100 : 0);
        onDataChange?.(hasActiveInstances);

        alert.showSuccess(
          L?.instanceUpdated ??
            "Instancia de WhatsApp actualizada correctamente",
        );
        handleCloseModal();
      }
    } catch (error: any) {
      const message = error?.message || "Error al guardar la instancia";
      const detail = extractErrorDetail(error);
      const type =
        (error?.resultType ?? "").toString().toLowerCase() === "info"
          ? "info"
          : "error";
      setModalAlert({ message, detail, type });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (instance: WhatsAppInstance) => {
    if (!company?.id) return;

    alert.showConfirm(
      "Eliminar instancia",
      `¿Seguro que deseas eliminar la instancia de WhatsApp ${instance.whatsapp}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await CommercialService.deleteWhatsAppInstance(
            company.id,
            instance.id,
          );
          const remainingInstances = instances.filter(
            (inst) => inst.id !== instance.id,
          );
          setInstances(remainingInstances);

          // Actualizar progreso con la lista actualizada
          const hasActiveInstances = remainingInstances.some(
            (inst) => inst.isActive,
          );
          onProgressUpdate?.(hasActiveInstances ? 100 : 0);
          onDataChange?.(hasActiveInstances);

          alert.showSuccess(
            L?.instanceDeleted ?? "Instancia eliminada correctamente",
          );
        } catch (error: any) {
          const errorMessage =
            error?.message ||
            (L?.errorDeletingInstance ?? "Error al eliminar la instancia");
          alert.showError(errorMessage);
        }
      },
    );
  };

  const handleReconnect = (instance: WhatsAppInstance) => {
    if (!company?.id) return;

    alert.showConfirm(
      L?.reconnectConfirmTitle ?? "Reconectar",
      L?.reconnectConfirmMessage ??
        "Se generará una nueva instancia de conexión. Los dispositivos actualmente conectados se desconectarán.\n\nPara reconectarlos deberás escanear el nuevo código QR generado.\n\n¿Deseas continuar?",
      async () => {
        try {
          setReconnectingWhatsapp(instance.whatsapp);
          setModalAlert(null);
          const profile = await CommercialService.getProfile(company.id, true);
          const commercialProfileId = profile.id;
          if (!commercialProfileId) {
            throw new Error(
              L?.errorReconnecting ??
                "No se pudo obtener el perfil comercial. El backend debe exponer data.commercial.id en GET /api/interacciones/profile/:companyId.",
            );
          }
          const { qrcode } = await CommercialService.reconnectWhatsApp(
            commercialProfileId,
            { whatsappNumber: instance.whatsapp },
          );
          const newQR = qrcode?.base64 ?? null;
          if (!newQR) {
            throw new Error(
              L?.errorReconnecting ?? "Error al reconectar la instancia",
            );
          }
          const updatedInstances = instances.map((inst) =>
            inst.whatsapp === instance.whatsapp
              ? { ...inst, whatsappQR: newQR }
              : inst,
          );
          setInstances(updatedInstances);
          if (selectedInstance?.whatsapp === instance.whatsapp) {
            setSelectedInstance((prev) =>
              prev ? { ...prev, whatsappQR: newQR } : null,
            );
          }
          setModalAlert({
            message:
              L?.reconnectSuccess ??
              "Reconexión correcta. Escanea el nuevo código QR.",
            type: "info",
          });
          alert.showSuccess(
            L?.reconnectSuccess ??
              "Reconexión correcta. Escanea el nuevo código QR.",
          );
        } catch (error: any) {
          const description =
            error?.result?.description ??
            error?.message ??
            L?.errorReconnecting ??
            "Error al reconectar la instancia";
          const detail =
            error?.details != null
              ? typeof error.details === "object"
                ? JSON.stringify(error.details)
                : String(error.details)
              : error?.result?.details != null
                ? String(error.result.details)
                : undefined;
          setModalAlert({
            message: description,
            detail,
            type: "error",
          });
          alert.showError(description);
        } finally {
          setReconnectingWhatsapp(null);
        }
      },
    );
  };

  const handleToggleStatus = async (instance: WhatsAppInstance) => {
    if (!company?.id) return;

    try {
      const updatedInstance =
        await CommercialService.toggleWhatsAppInstanceStatus(
          company.id,
          instance.id,
          !instance.isActive,
        );

      const updatedInstances = instances.map((inst) =>
        inst.id === updatedInstance.id ? updatedInstance : inst,
      );
      setInstances(updatedInstances);

      // Actualizar progreso con la lista actualizada
      const hasActiveInstances = updatedInstances.some((inst) => inst.isActive);
      onProgressUpdate?.(hasActiveInstances ? 100 : 0);
      onDataChange?.(hasActiveInstances);

      alert.showSuccess(
        updatedInstance.isActive
          ? (L?.instanceActivated ?? "Instancia activada correctamente")
          : (L?.instanceDeactivated ?? "Instancia desactivada correctamente"),
      );
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        (L?.errorTogglingStatus ??
          "Error al cambiar el estado de la instancia");
      alert.showError(errorMessage);
    }
  };

  const statsTotals = useMemo(
    () => ({
      transactions: instances.reduce(
        (s, i) => s + (i.monthTransactionsCount ?? 0),
        0,
      ),
      documents: instances.reduce(
        (s, i) => s + (i.monthDocumentsCount ?? 0),
        0,
      ),
      operations: instances.reduce(
        (s, i) => s + (i.monthOperationsCount ?? 0),
        0,
      ),
      payments: instances.reduce((s, i) => s + (i.monthPaymentsCount ?? 0), 0),
      executions: instances.reduce(
        (s, i) => s + (i.monthExecutionsCount ?? 0),
        0,
      ),
    }),
    [instances],
  );

  /** Pie primera celda: periodo del mes, p. ej. "mar - 2026" (UTC, alineado con métricas). */
  const footerMonthYearLabel = useMemo(() => {
    const locale = language === "en" ? "en-US" : "es-ES";
    const now = new Date();
    const shortMonth = new Intl.DateTimeFormat(locale, {
      month: "short",
      timeZone: "UTC",
    })
      .format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15)))
      .replaceAll(".", "")
      .trim()
      .toLowerCase();
    const year = now.getUTCFullYear();
    return `${shortMonth} - ${year}`;
  }, [language]);

  const tableFooterSpannedRow = useMemo(() => {
    if (instances.length === 0) return undefined;
    const footMetric = (n: number) => (
      <ThemedText
        type="defaultSemiBold"
        style={{
          color: colors.text,
          fontVariant: ["tabular-nums" as const],
          textAlign: "right",
          width: "100%",
        }}
      >
        {n}
      </ThemedText>
    );
    const footEmpty = (
      <ThemedText type="caption" style={{ color: colors.text }}>
        {" "}
      </ThemedText>
    );
    /** Una celda por columna: WhatsApp + 5 métricas + N8N + estado + acciones = 9 */
    return [
      {
        colSpan: 1,
        content: (
          <ThemedText type="defaultSemiBold" style={{ color: colors.text }}>
            {footerMonthYearLabel}
          </ThemedText>
        ),
      },
      {
        colSpan: 1,
        align: "right" as const,
        content: footMetric(statsTotals.transactions),
      },
      {
        colSpan: 1,
        align: "right" as const,
        content: footMetric(statsTotals.documents),
      },
      {
        colSpan: 1,
        align: "right" as const,
        content: footMetric(statsTotals.operations),
      },
      {
        colSpan: 1,
        align: "right" as const,
        content: footMetric(statsTotals.payments),
      },
      {
        colSpan: 1,
        align: "right" as const,
        content: footMetric(statsTotals.executions),
      },
      { colSpan: 1, content: footEmpty },
      { colSpan: 1, content: footEmpty },
      { colSpan: 1, content: footEmpty },
    ];
  }, [colors.text, footerMonthYearLabel, instances.length, statsTotals]);

  const metricCellTextStyle = useMemo(
    () => ({
      color: colors.text,
      fontVariant: ["tabular-nums" as const],
      textAlign: "right" as const,
      width: "100%" as const,
    }),
    [colors.text],
  );

  // Columnas de la tabla
  const columns: TableColumn<WhatsAppInstance>[] = [
    {
      key: "whatsapp",
      label: L?.columnWhatsApp ?? "WhatsApp",
      width: "25px",
    },
    {
      key: "monthTransactionsCount",
      label: L?.columnMonthTransactions ?? "Transacciones",
      width: "7%",
      align: "right",
      render: (instance) => (
        <ThemedText type="body2" style={metricCellTextStyle}>
          {instance.monthTransactionsCount ?? 0}
        </ThemedText>
      ),
    },
    {
      key: "monthDocumentsCount",
      label: L?.columnMonthDocuments ?? "Documentos",
      width: "7%",
      align: "right",
      render: (instance) => (
        <ThemedText type="body2" style={metricCellTextStyle}>
          {instance.monthDocumentsCount ?? 0}
        </ThemedText>
      ),
    },
    {
      key: "monthOperationsCount",
      label: L?.columnMonthOperations ?? "Órdenes",
      width: "7%",
      align: "right",
      render: (instance) => (
        <ThemedText type="body2" style={metricCellTextStyle}>
          {instance.monthOperationsCount ?? 0}
        </ThemedText>
      ),
    },
    {
      key: "monthPaymentsCount",
      label: L?.columnMonthPayments ?? "Pagos",
      width: "7%",
      align: "right",
      render: (instance) => (
        <ThemedText type="body2" style={metricCellTextStyle}>
          {instance.monthPaymentsCount ?? 0}
        </ThemedText>
      ),
    },
    {
      key: "monthExecutionsCount",
      label: L?.columnMonthExecutions ?? "Ejecuciones",
      width: "7%",
      align: "right",
      render: (instance) => (
        <ThemedText type="body2" style={metricCellTextStyle}>
          {instance.monthExecutionsCount ?? 0}
        </ThemedText>
      ),
    },
    {
      key: "chatIAFlow",
      label: L?.columnChatIAFlow ?? "N8N",
      width: "12%",
      align: "center",
      render: (instance: WhatsAppInstance) =>
        instance.chatIAFlow && instance.chatIAFlowFilename ? (
          <View style={styles.n8nCell}>
            <Tooltip
              text={L?.downloadChatIAFlowTooltip ?? "Descargar flujo ChatIA"}
              position="left"
            >
              <TouchableOpacity
                onPress={() => handleDownloadFlow(instance)}
                style={[
                  styles.flowDownloadButton,
                  {
                    backgroundColor: colors.primary + "20",
                    borderColor: colors.primary,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  L?.downloadChatIAFlowTooltip ?? "Descargar flujo ChatIA"
                }
              >
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={colors.primary}
                />
                <ThemedText
                  type="defaultSemiBold"
                  style={[
                    styles.flowDownloadButtonLabel,
                    { color: colors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {L?.downloadChatIAFlowButton ?? "Descargar"}
                </ThemedText>
              </TouchableOpacity>
            </Tooltip>
          </View>
        ) : (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            —
          </ThemedText>
        ),
    },
    {
      key: "isActive",
      label: L?.columnStatus ?? "Estado",
      width: "9%",
      align: "center",
      render: (instance) => (
        <StatusBadge
          status={instance.isActive ? 1 : 0}
          statusDescription={
            instance.isActive
              ? (L?.activeStatus ?? "Activa")
              : (L?.inactiveStatus ?? "Inactiva")
          }
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: L?.columnActions ?? "Acciones",
      width: "23%",
      align: "center",
      render: (instance) => (
        <View style={styles.actionsContainer}>
          {instance.whatsappQR && (
            <Tooltip text="Ver QR" position="left">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleViewQR(instance)}
              >
                <Ionicons name="qr-code" size={18} color={actionIconColor} />
              </TouchableOpacity>
            </Tooltip>
          )}
          <Tooltip
            text={
              instance.isActive
                ? (L?.deactivate ?? "Desactivar")
                : (L?.activate ?? "Activar")
            }
            position="left"
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleStatus(instance)}
            >
              <Ionicons
                name={instance.isActive ? "eye-off" : "eye"}
                size={18}
                color={actionIconColor}
              />
            </TouchableOpacity>
          </Tooltip>
          {/* Orden: Reconectar, Editar, Eliminar. Icono: ver docs/ICON_REFERENCE.md (icons.expo.fyi) */}
          <Tooltip text={L?.reconnect ?? "Reconectar"} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleReconnect(instance)}
              disabled={reconnectingWhatsapp !== null}
            >
              {reconnectingWhatsapp === instance.whatsapp ? (
                <ActivityIndicator size="small" color={actionIconColor} />
              ) : (
                <Ionicons name="link" size={18} color={actionIconColor} />
              )}
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text="Editar" position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(instance)}
            >
              <Ionicons name="pencil" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text="Eliminar" position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(instance)}
            >
              <Ionicons name="trash" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
        </View>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* Tabla de instancias — sin ScrollView propio: el wizard ya hace scroll; evita doble scroll */}
        <View style={styles.tableContainer}>
          <DataTable
            data={instances}
            columns={columns}
            loading={loading}
            emptyMessage={
              L?.emptyMessage ??
              "No hay instancias de WhatsApp. Crea una para comenzar."
            }
            keyExtractor={(instance) => instance.id}
            showPagination={false}
            showRowNumber={false}
            footerSpannedRow={tableFooterSpannedRow}
            embeddedInWizard
          />
        </View>

        {/* Modal de crear/editar */}
        {(modalMode === "create" || modalMode === "edit") && (
          <SideModal
            contentScrollRef={createModalScrollRef}
            visible={isModalVisible}
            onClose={handleCloseModal}
            topAlert={
              modalAlert ? (
                <InlineAlert
                  type={modalAlert.type}
                  message={modalAlert.message}
                  detail={modalAlert.detail}
                  onDismiss={() => setModalAlert(null)}
                  autoClose={false}
                />
              ) : undefined
            }
            title={
              modalMode === "edit"
                ? (L?.editInstance ?? "Editar Instancia")
                : (L?.createInstance ?? "Crear Instancia")
            }
            subtitle={
              modalMode === "edit"
                ? (L?.editSubtitle ?? "Modifica los datos de la instancia")
                : (L?.createSubtitle ??
                  "Completa los datos para crear una nueva instancia")
            }
            footer={
              <View style={styles.modalFooter}>
                <View style={styles.modalFooterActions}>
                  {modalMode === "edit" &&
                    selectedInstance?.chatIAFlow &&
                    selectedInstance?.chatIAFlowFilename && (
                      <Button
                        onPress={() =>
                          selectedInstance &&
                          handleDownloadFlow(selectedInstance)
                        }
                        variant="ghost"
                        size="md"
                      >
                        <Ionicons
                          name="download-outline"
                          size={18}
                          color={colors.primary}
                          style={{ marginRight: 6 }}
                        />
                        <ThemedText
                          type="body2"
                          style={{ color: colors.primary, fontWeight: "500" }}
                        >
                          N8N
                        </ThemedText>
                      </Button>
                    )}
                  <Button
                    title={L?.cancel ?? "Cancelar"}
                    onPress={handleCloseModal}
                    variant="outlined"
                    size="md"
                    disabled={saving || generatingQR}
                  />
                  {/* En creación: un solo botón principal; primero "Generar", luego "Guardar" */}
                  {modalMode === "create" && !generatedQR && (
                    <Button
                      title={
                        generatingQR
                          ? (L?.generating ?? "Generando...")
                          : (L?.generateQR ?? "Generar")
                      }
                      onPress={handleGenerateFromInput}
                      variant="primary"
                      size="md"
                      disabled={generatingQR || !formData.whatsapp.trim()}
                    >
                      {generatingQR ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.contrastText}
                          style={{ marginRight: 8 }}
                        />
                      ) : (
                        <Ionicons
                          name="qr-code-outline"
                          size={18}
                          color={colors.contrastText}
                          style={{ marginRight: 8 }}
                        />
                      )}
                    </Button>
                  )}
                  {(modalMode === "edit" ||
                    (modalMode === "create" && generatedQR)) && (
                    <Button
                      title={
                        saving
                          ? (L?.saving ?? "Guardando...")
                          : (L?.save ?? "Guardar")
                      }
                      onPress={handleSave}
                      variant="primary"
                      size="md"
                      disabled={saving || generatingQR}
                    >
                      {saving && (
                        <ActivityIndicator
                          size="small"
                          color={colors.contrastText}
                          style={{ marginRight: 8 }}
                        />
                      )}
                    </Button>
                  )}
                </View>
              </View>
            }
          >
            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <ThemedText
                  type="body2"
                  style={[styles.label, { color: colors.text }]}
                >
                  {L?.whatsappNumberLabel ?? "Número de WhatsApp"}
                </ThemedText>
                <PhoneInput
                  value={formData.whatsapp}
                  onChangeText={(val) => {
                    const formatted = formatCode(val);
                    setFormData((prev) => ({ ...prev, whatsapp: formatted }));
                    if (formErrors.whatsapp) {
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.whatsapp;
                        return next;
                      });
                    }
                  }}
                  placeholder={
                    L?.whatsappPlaceholder ?? "Ej: 593996294267 o MI_CODIGO"
                  }
                  error={!!formErrors.whatsapp}
                  errorMessage={formErrors.whatsapp}
                  maxLength={15}
                />
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, marginTop: 4 }}
                >
                  {L?.whatsappCaption ??
                    "Número de WhatsApp o identificador IA"}
                </ThemedText>

                {/* Estado activo/inactivo - Solo en modo edición: etiqueta izquierda, switch derecha */}
                {modalMode === "edit" && (
                  <View style={styles.estadoRow}>
                    <ThemedText
                      type="body2"
                      style={[styles.estadoLabel, { color: colors.text }]}
                    >
                      {L?.columnStatus ?? "Estado"}
                    </ThemedText>
                    <CustomSwitch
                      value={formData.isActive ?? false}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, isActive: value }));
                      }}
                      label=""
                    />
                  </View>
                )}
                {modalMode === "edit" && (
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                      marginTop: -8,
                      marginBottom: 8,
                    }}
                  >
                    {formData.isActive
                      ? (L?.instanceActiveCaption ??
                        "La instancia está activa y disponible para uso")
                      : (L?.instanceInactiveCaption ??
                        "La instancia está inactiva y no estará disponible")}
                  </ThemedText>
                )}

                {/* Mostrar QR generado + pasos de conexión (solo en creación); el botón Generar está en el footer */}
                {modalMode === "create" &&
                  generatedQR &&
                  toQRImageUri(generatedQR) && (
                    <View style={styles.inputGroup}>
                      <ThemedText
                        type="body2"
                        style={[styles.label, { color: colors.text }]}
                      >
                        {L?.qrGeneratedLabel ?? "Código QR Generado"}
                      </ThemedText>
                      <View
                        style={[
                          styles.qrImageContainer,
                          {
                            backgroundColor: colors.filterInputBackground,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Image
                          source={{ uri: toQRImageUri(generatedQR)! }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      </View>
                      {/* Pasos de conexión debajo del QR (mismo contenido que en el modal ver QR) */}
                      <ThemedText
                        type="body2"
                        style={[
                          styles.label,
                          {
                            color: colors.text,
                            marginTop: 16,
                            marginBottom: 8,
                          },
                        ]}
                      >
                        {L?.qrModalSubtitle ??
                          "Escanea este código con WhatsApp para conectar"}
                      </ThemedText>
                      <ThemedText
                        type="body2"
                        style={[
                          styles.qrInstructions,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {L?.qrInstructions ??
                          '1. Abre WhatsApp en tu teléfono\n2. Ve a Configuración → Dispositivos vinculados\n3. Toca "Vincular un dispositivo"\n4. Escanea este código QR'}
                      </ThemedText>
                    </View>
                  )}
              </View>

              {/* En modo edición: sin QR → solo Regenerar; con QR → mostrar imagen y solo Reconectar */}
              {modalMode === "edit" && selectedInstance && (
                <View style={styles.inputGroup}>
                  {selectedInstance.whatsappQR &&
                  toQRImageUri(selectedInstance.whatsappQR) ? (
                    <>
                      <ThemedText
                        type="body2"
                        style={[styles.label, { color: colors.text }]}
                      >
                        Código QR Actual
                      </ThemedText>
                      <View
                        style={[
                          styles.qrImageContainer,
                          {
                            backgroundColor: colors.filterInputBackground,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Image
                          source={{
                            uri: toQRImageUri(selectedInstance.whatsappQR)!,
                          }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={{ marginTop: 12 }}>
                        <Button
                          title={
                            reconnectingWhatsapp === selectedInstance.whatsapp
                              ? (L?.reconnecting ?? "Reconectando...")
                              : (L?.reconnect ?? "Reconectar")
                          }
                          onPress={() => handleReconnect(selectedInstance)}
                          variant="outlined"
                          size="md"
                          disabled={reconnectingWhatsapp !== null}
                        >
                          {reconnectingWhatsapp ===
                          selectedInstance.whatsapp ? (
                            <ActivityIndicator
                              size="small"
                              color={colors.primary}
                              style={{ marginRight: 8 }}
                            />
                          ) : (
                            <Ionicons
                              name="link"
                              size={18}
                              color={colors.primary}
                              style={{ marginRight: 8 }}
                            />
                          )}
                        </Button>
                      </View>
                    </>
                  ) : (
                    <View style={{ marginTop: 12 }}>
                      <Button
                        title={
                          generatingQR
                            ? (L?.regenerating ?? "Regenerando...")
                            : (L?.regenerateQR ?? "Regenerar QR")
                        }
                        onPress={handleGenerateQR}
                        variant="outlined"
                        size="md"
                        disabled={generatingQR}
                      >
                        {generatingQR ? (
                          <ActivityIndicator
                            size="small"
                            color={colors.primary}
                            style={{ marginRight: 8 }}
                          />
                        ) : (
                          <Ionicons
                            name="refresh-outline"
                            size={18}
                            color={colors.primary}
                            style={{ marginRight: 8 }}
                          />
                        )}
                      </Button>
                    </View>
                  )}
                </View>
              )}
            </View>
          </SideModal>
        )}

        {/* Modal de ver QR */}
        {modalMode === "view-qr" && selectedInstance?.whatsappQR && (
          <SideModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            topAlert={
              modalAlert ? (
                <InlineAlert
                  type={modalAlert.type}
                  message={modalAlert.message}
                  detail={modalAlert.detail}
                  onDismiss={() => setModalAlert(null)}
                  autoClose={false}
                />
              ) : undefined
            }
            title={L?.qrModalTitle ?? "Código QR de WhatsApp"}
            subtitle={
              L?.qrModalSubtitle ??
              "Escanea este código con WhatsApp para conectar"
            }
            footer={
              <>
                <Button
                  title={L?.close ?? "Cerrar"}
                  onPress={handleCloseModal}
                  variant="outlined"
                  size="md"
                />
                {selectedInstance?.chatIAFlow &&
                  selectedInstance?.chatIAFlowFilename && (
                    <Button
                      title="Descargar flujo"
                      onPress={() => handleDownloadFlow(selectedInstance)}
                      variant="outlined"
                      size="md"
                    >
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color={colors.contrastText}
                        style={{ marginRight: 8 }}
                      />
                    </Button>
                  )}
                <Button
                  title={
                    generatingQR
                      ? (L?.regenerating ?? "Regenerando...")
                      : (L?.regenerateQR ?? "Regenerar QR")
                  }
                  onPress={handleGenerateQR}
                  variant="primary"
                  size="md"
                  disabled={generatingQR}
                >
                  {generatingQR ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.contrastText}
                      style={{ marginRight: 8 }}
                    />
                  ) : (
                    <Ionicons
                      name="refresh-outline"
                      size={18}
                      color={colors.contrastText}
                      style={{ marginRight: 8 }}
                    />
                  )}
                </Button>
              </>
            }
          >
            <View style={styles.modalContent}>
              <ThemedText
                type="body2"
                style={[
                  styles.qrInstructions,
                  { color: colors.textSecondary, marginBottom: 16 },
                ]}
              >
                {L?.qrInstructions ??
                  '1. Abre WhatsApp en tu teléfono\n2. Ve a Configuración → Dispositivos vinculados\n3. Toca "Vincular un dispositivo"\n4. Escanea este código QR'}
              </ThemedText>

              <View
                style={[
                  styles.qrImageContainer,
                  {
                    backgroundColor: colors.filterInputBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Image
                  source={{
                    uri: toQRImageUri(selectedInstance.whatsappQR) ?? "",
                  }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </SideModal>
        )}
      </View>
    </View>
  );
});

WhatsAppConnectionLayer.displayName = "WhatsAppConnectionLayer";
