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
import { useCompany } from "@/src/domains/shared";
import { PhoneInput } from "@/src/domains/shared/components";
import { CustomSwitch } from "@/src/domains/shared/components/custom-switch/custom-switch";
import { DataTable } from "@/src/domains/shared/components/data-table/data-table";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { formatCode } from "@/src/infrastructure/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Image,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

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
  const { t } = useTranslation();
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
  const [formData, setFormData] = useState<WhatsAppInstanceFormData>({
    whatsapp: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
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
      const profile = await CommercialService.getProfile(company.id);
      const loadedInstances = profile.whatsappInstances || [];
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
    setModalMode("edit");
    setIsModalVisible(true);
  };

  const handleViewQR = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
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
    setModalError(null);
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
      const errorMessage =
        error?.message ||
        (L?.errorRegeneratingQR ?? "Error al regenerar el código QR");
      alert.showError(errorMessage);
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
    setModalError(null);
    try {
      const whatsappValue = formatCode(formData.whatsapp.trim());

      // Crear instancia de WhatsApp (la respuesta puede incluir data.qrcode.base64 y así evitamos 2ª llamada)
      const createResponse =
        await CommercialService.createWhatsAppInstance(whatsappValue);

      if (!createResponse.success) {
        setModalError(
          L?.errorCreatingInstance ?? "Error al crear la instancia de WhatsApp",
        );
        return;
      }

      let qrImage: string | null =
        createResponse.data?.qrcode?.base64 ?? null;
      if (!qrImage) {
        const qrResponse =
          await CommercialService.getWhatsAppQRCode(whatsappValue);
        qrImage = qrResponse.qrcode || null;
      }

      if (!qrImage) {
        setModalError(L?.errorGettingQR ?? "Error al obtener el código QR");
        return;
      }

      setGeneratedQR(qrImage);
      // Hacer scroll al final del modal para que el QR sea visible
      setTimeout(() => {
        createModalScrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
      alert.showSuccess(L?.qrGenerated ?? "Código QR generado correctamente");
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        (L?.errorGettingQR ?? "Error al generar el código QR");
      setModalError(errorMessage);
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

        // Si la instancia tiene QR, mostrar el modal de QR automáticamente
        if (newInstance.whatsappQR) {
          setSelectedInstance(newInstance);
          setModalMode("view-qr");
          setIsModalVisible(true);
          setGeneratedQR(null); // Limpiar QR generado
          alert.showSuccess("Instancia de WhatsApp creada correctamente");
        } else {
          handleCloseModal();
          alert.showSuccess("Instancia de WhatsApp creada correctamente");
        }
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
      const errorMessage = error?.message || "Error al guardar la instancia";
      setModalError(errorMessage);
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

  // Columnas de la tabla
  const columns: TableColumn<WhatsAppInstance>[] = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      width: "25%",
    },
    {
      key: "whatsappQR",
      label: "QR Code",
      width: "20%",
      render: (instance) =>
        instance.whatsappQR ? (
          <TouchableOpacity onPress={() => handleViewQR(instance)}>
            <View
              style={[
                styles.qrBadge,
                {
                  backgroundColor: colors.primary + "20",
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="qr-code" size={16} color={colors.primary} />
              <ThemedText
                type="caption"
                style={{ color: colors.primary, marginLeft: 4 }}
              >
                Ver QR
              </ThemedText>
            </View>
          </TouchableOpacity>
        ) : (
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            Sin QR
          </ThemedText>
        ),
    },
    ...(instances.some(
      (i) => i.chatIAFlow && i.chatIAFlowFilename,
    )
      ? [
          {
            key: "chatIAFlow",
            label: "Flujo ChatIA",
            width: "18%",
            render: (instance: WhatsAppInstance) =>
              instance.chatIAFlow && instance.chatIAFlowFilename ? (
                <TouchableOpacity
                  onPress={() => handleDownloadFlow(instance)}
                  style={[
                    styles.qrBadge,
                    {
                      backgroundColor: colors.primary + "20",
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="download-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <ThemedText
                    type="caption"
                    style={{ color: colors.primary, marginLeft: 4 }}
                  >
                    Descargar
                  </ThemedText>
                </TouchableOpacity>
              ) : (
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  —
                </ThemedText>
              ),
          } as TableColumn<WhatsAppInstance>,
        ]
      : []),
    {
      key: "isActive",
      label: "Estado",
      width: "15%",
      align: "center",
      render: (instance) => (
        <StatusBadge
          status={instance.isActive ? 1 : 0}
          statusDescription={instance.isActive ? "Activa" : "Inactiva"}
          size="small"
        />
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      width: "40%",
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
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.formContainer}>
        {/* Tabla de instancias */}
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
          />
        </View>

        {/* Modal de crear/editar */}
        {(modalMode === "create" || modalMode === "edit") && (
          <SideModal
            contentScrollRef={createModalScrollRef}
            visible={isModalVisible}
            onClose={handleCloseModal}
            topAlert={
              modalError ? (
                <InlineAlert
                  type="error"
                  message={modalError}
                  onDismiss={() => setModalError(null)}
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
              <>
                <Button
                  title={L?.cancel ?? "Cancelar"}
                  onPress={handleCloseModal}
                  variant="outline"
                  size="md"
                  disabled={saving || generatingQR}
                />
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
              </>
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

                {/* Switch de estado activo/inactivo - Solo en modo edición */}
                {modalMode === "edit" && (
                  <View style={{ marginTop: 16 }}>
                    <CustomSwitch
                      value={formData.isActive ?? false}
                      onValueChange={(value) => {
                        setFormData((prev) => ({ ...prev, isActive: value }));
                      }}
                      label={L?.instanceStatusLabel ?? "Estado de la instancia"}
                    />
                    <ThemedText
                      type="caption"
                      style={{ color: colors.textSecondary, marginTop: 4 }}
                    >
                      {formData.isActive
                        ? (L?.instanceActiveCaption ??
                          "La instancia está activa y disponible para uso")
                        : (L?.instanceInactiveCaption ??
                          "La instancia está inactiva y no estará disponible")}
                    </ThemedText>
                  </View>
                )}

                {/* Botón Generar QR - Solo mostrar si no hay QR generado y estamos en modo creación */}
                {modalMode === "create" && !generatedQR && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={
                        generatingQR
                          ? (L?.generating ?? "Generando...")
                          : (L?.generateQR ?? "Generar")
                      }
                      onPress={handleGenerateFromInput}
                      variant="outline"
                      size="md"
                      disabled={generatingQR || !formData.whatsapp.trim()}
                    >
                      {generatingQR ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.primary}
                          style={{ marginRight: 8 }}
                        />
                      ) : (
                        <Ionicons
                          name="qr-code-outline"
                          size={18}
                          color={colors.primary}
                          style={{ marginRight: 8 }}
                        />
                      )}
                    </Button>
                  </View>
                )}

                {/* Mostrar QR generado si existe (solo en creación) */}
                {modalMode === "create" && generatedQR && toQRImageUri(generatedQR) && (
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
                  </View>
                )}
              </View>

              {/* En modo edición, mostrar QR existente y botón regenerar */}
              {modalMode === "edit" && selectedInstance && (
                <View style={styles.inputGroup}>
                  {selectedInstance.whatsappQR && toQRImageUri(selectedInstance.whatsappQR) && (
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
                          source={{ uri: toQRImageUri(selectedInstance.whatsappQR)! }}
                          style={styles.qrImage}
                          resizeMode="contain"
                        />
                      </View>
                    </>
                  )}
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title={
                        generatingQR
                          ? (L?.regenerating ?? "Regenerando...")
                          : (L?.regenerateQR ?? "Regenerar QR")
                      }
                      onPress={handleGenerateQR}
                      variant="outline"
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
                {selectedInstance?.chatIAFlow &&
                  selectedInstance?.chatIAFlowFilename && (
                  <View style={{ marginTop: 12 }}>
                    <Button
                      title="Descargar flujo ChatIA"
                      onPress={() =>
                        handleDownloadFlow(selectedInstance)
                      }
                      variant="outline"
                      size="md"
                    >
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color={colors.primary}
                        style={{ marginRight: 8 }}
                      />
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
                  variant="outline"
                  size="md"
                />
                {selectedInstance?.chatIAFlow &&
                  selectedInstance?.chatIAFlowFilename && (
                  <Button
                    title="Descargar flujo"
                    onPress={() =>
                      handleDownloadFlow(selectedInstance)
                    }
                    variant="outline"
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
    </ScrollView>
  );
});

WhatsAppConnectionLayer.displayName = "WhatsAppConnectionLayer";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 16,
  },
  tableContainer: {
    marginTop: 0,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: "600",
    marginBottom: 4,
  },
  qrInstructions: {
    lineHeight: 20,
    textAlign: "left",
  },
  qrImageContainer: {
    alignSelf: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  qrImage: {
    width: 250,
    height: 250,
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
