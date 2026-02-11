/**
 * Componente reutilizable para formulario de sucursal (editar)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useCompanyOptions } from "@/src/domains/security/hooks";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useBranchTypeOptions } from "../../hooks";
import { BranchesService } from "../../services";
import { createBranchFormStyles } from "./branch-edit-form.styles";
import { BranchEditFormProps, BranchFormData } from "./branch-edit-form.types";

export function BranchEditForm({
  branchId,
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: BranchEditFormProps) {
  const { colors, spacing, modalLayout, borderRadius } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = useMemo(
    () =>
      createBranchFormStyles({
        spacing,
        modalLayout,
        borderRadius,
      }),
    [spacing, modalLayout, borderRadius],
  );

  const { companies, loading: companiesLoading } = useCompanyOptions();
  const { options: branchTypeOptions } = useBranchTypeOptions();

  const [formData, setFormData] = useState<BranchFormData>({
    companyId: "",
    code: "",
    name: "",
    type: "branch",
    description: "",
    status: 1,
  });
  const formDataRef = useRef<BranchFormData>({
    companyId: "",
    code: "",
    name: "",
    type: "branch",
    description: "",
    status: 1,
  });
  const statusRef = useRef<number>(1);
  const [errors, setErrors] = useState<
    Record<keyof BranchFormData | string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const resetError = useCallback(
    (field: keyof BranchFormData) => {
      setErrors((prev) => {
        if (!prev[field]) {
          return prev;
        }
        const next = { ...prev };
        delete next[field];
        return next;
      });
      // Limpiar error general cuando el usuario empieza a editar
      if (generalError) {
        setGeneralError(null);
      }
    },
    [generalError],
  );

  const handleChange = useCallback(
    (field: keyof BranchFormData, value: string | number) => {
      setFormData((prev) => {
        let updated = { ...prev, [field]: value };

        // Si se está cambiando el código, aplicar transformaciones
        if (field === "code" && typeof value === "string") {
          // Convertir a mayúsculas y reemplazar espacios con guiones bajos
          const processedCode = value.toUpperCase().replace(/\s+/g, "_");
          updated.code = processedCode;

          // Generar nombre automáticamente solo si está vacío o coincide con el nombre generado anteriormente
          const previousCode = prev.code || "";
          const previousName = prev.name || "";

          // Calcular el nombre que se generaría a partir del código anterior
          const previousGeneratedName = previousCode
            .toLowerCase()
            .replace(/_/g, " ")
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          // Solo generar nombre si está vacío o si coincide exactamente con el nombre generado anteriormente
          if (!previousName || previousName === previousGeneratedName) {
            // Generar nombre: convertir guiones bajos a espacios y capitalizar primera letra de cada palabra
            const generatedName = processedCode
              .toLowerCase()
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            updated.name = generatedName;
          }
        }

        // Sincronizar ref inmediatamente
        formDataRef.current = updated;
        return updated;
      });
      if (errors[field]) {
        resetError(field);
      }
      // Actualizar ref para status
      if (field === "status") {
        statusRef.current = value as number;
      }
    },
    [errors, resetError],
  );

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const currentFormData = formDataRef.current;

    if (!currentFormData.companyId) {
      newErrors.companyId = "La empresa es requerida";
    }
    if (!currentFormData.code.trim()) {
      newErrors.code = "El código es requerido";
    }
    if (!currentFormData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const loadBranch = useCallback(async () => {
    if (!branchId) {
      alert.showError("ID de sucursal no válido");
      return;
    }

    try {
      setLoadingBranch(true);
      const branch = await BranchesService.getBranchById(branchId);
      const branchStatus = branch.status ?? 1;
      statusRef.current = branchStatus;
      const loadedData = {
        companyId: branch.companyId,
        code: branch.code,
        name: branch.name,
        type: branch.type || "branch",
        description: branch.description || "",
        status: branchStatus,
      };
      formDataRef.current = loadedData;
      setFormData(loadedData);
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(
        error,
        "Error al cargar la sucursal",
      );
      alert.showError(errorMessage, false, undefined, detailString, error);
    } finally {
      setLoadingBranch(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadBranch();
  }, [loadBranch]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    if (!branchId) {
      alert.showError("ID de sucursal no válido");
      return;
    }

    setIsSubmitting(true);
    try {
      const currentFormData = formDataRef.current;
      await BranchesService.updateBranch(branchId, {
        companyId: currentFormData.companyId,
        code: currentFormData.code.trim(),
        name: currentFormData.name.trim(),
        type: currentFormData.type,
        description: currentFormData.description.trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
      });
      alert.showSuccess(
        t.security?.branches?.editSuccess ||
          "Sucursal actualizada exitosamente",
      );
      onSuccess?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(
        error,
        "Error al actualizar la sucursal",
      );

      // Mostrar error en Toast con detalle si existe
      alert.showError(errorMessage, false, undefined, detailString, error);

      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    alert,
    branchId,
    onSuccess,
    t.security?.branches?.editSuccess,
    validateForm,
  ]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // ⚠️ IMPORTANTE: useMemo debe estar ANTES del early return para evitar "Rendered more hooks than during the previous render"
  const companyOptions = useMemo(() => companies, [companies]);

  useEffect(() => {
    if (onFormReady && !loadingBranch && !companiesLoading) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isSubmitting, loadingBranch, companiesLoading y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, loadingBranch, companiesLoading, generalError]);

  if (loadingBranch || companiesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || "Cargando información..."}
        </ThemedText>
      </View>
    );
  }

  const header = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.branches?.editTitle || "Editar sucursal"}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.branches?.editSubtitle ||
            "Actualiza la información de la sucursal seleccionada"}
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footer = showFooter ? (
    <View style={styles.formFooter}>
      <Button
        title={t.common.cancel}
        onPress={handleCancel}
        variant="outlined"
        size="md"
        disabled={isSubmitting}
        style={styles.cancelButton}
      />
      <Button
        title={t.common.save}
        onPress={handleSubmit}
        variant="primary"
        size="md"
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </View>
  ) : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: showFooter ? 0 : 16 }}
    >
      {header}
      <Card variant="flat" style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Select
            label={t.security?.branches?.company || "Empresa"}
            placeholder={
              companiesLoading
                ? t.common?.loading || "Cargando..."
                : t.security?.branches?.selectCompany ||
                  "Selecciona una empresa"
            }
            value={formData.companyId || undefined}
            options={companyOptions.map((company) => ({
              value: company.id,
              label: company.name,
            }))}
            onSelect={(value) => handleChange("companyId", value as string)}
            error={!!errors.companyId}
            errorMessage={errors.companyId}
            required
            disabled={
              isSubmitting || companiesLoading || companyOptions.length === 0
            }
            searchable
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            Código *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.code ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.code}
          >
            <Ionicons
              name="barcode-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Código de la sucursal"
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => handleChange("code", value)}
              autoCapitalize="characters"
              editable={!isSubmitting}
            />
          </InputWithFocus>
          {errors.code ? (
            <ThemedText
              type="caption"
              style={[styles.errorText, { color: colors.error }]}
            >
              {errors.code}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            Nombre *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.name ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.name}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Nombre de la sucursal"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleChange("name", value)}
              editable={!isSubmitting}
            />
          </InputWithFocus>
          {errors.name ? (
            <ThemedText
              type="caption"
              style={[styles.errorText, { color: colors.error }]}
            >
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            Tipo
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              {branchTypeOptions.map((option) => {
                const isSelected = formData.type === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.selectOption,
                      isSelected && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange("type", option.value)}
                    disabled={isSubmitting}
                  >
                    <ThemedText
                      type="body2"
                      style={
                        isSelected
                          ? { color: colors.contrastText }
                          : { color: colors.text }
                      }
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            Descripción
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                alignItems: "flex-start",
              },
            ]}
            primaryColor={colors.primary}
          >
            <TextInput
              style={[styles.input, { color: colors.text, height: 96 }]}
              placeholder="Descripción de la sucursal"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange("description", value)}
              multiline
              editable={!isSubmitting}
            />
          </InputWithFocus>
        </View>

        {/* Estado */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.users?.status || "Estado"} *
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              {/* Activo */}
              <TouchableOpacity
                style={[
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 1 && {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                  },
                ]}
                onPress={() => handleChange("status", 1)}
                disabled={isSubmitting}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 1
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
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 0 && {
                    backgroundColor: colors.error,
                    borderColor: colors.error,
                  },
                ]}
                onPress={() => handleChange("status", 0)}
                disabled={isSubmitting}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 0
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
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 2 && {
                    backgroundColor: colors.warning,
                    borderColor: colors.warning,
                  },
                ]}
                onPress={() => handleChange("status", 2)}
                disabled={isSubmitting}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 2
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
                  styles.selectOption,
                  { borderColor: colors.border },
                  formData.status === 3 && {
                    backgroundColor: colors.suspended,
                    borderColor: colors.suspended,
                  },
                ]}
                onPress={() => handleChange("status", 3)}
                disabled={isSubmitting}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 3
                      ? { color: colors.contrastText }
                      : { color: colors.text }
                  }
                >
                  {t.security?.users?.suspended || "Suspendido"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Card>
      {footer}
    </ScrollView>
  );
}
