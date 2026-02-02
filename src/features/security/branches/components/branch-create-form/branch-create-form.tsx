/**
 * Componente reutilizable para formulario de sucursal (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
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
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { BranchesService } from "../../services";
import { createBranchFormStyles } from "./branch-create-form.styles";
import {
    BRANCH_TYPES,
    BranchCreateFormProps,
    BranchFormData,
} from "./branch-create-form.types";

export function BranchCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: BranchCreateFormProps) {
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
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  useEffect(() => {
    if (!formData.companyId && companies.length > 0 && !companiesLoading) {
      setFormData((prev) => ({ ...prev, companyId: companies[0].id }));
    }
  }, [companies, companiesLoading, formData.companyId]);

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

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const currentFormData = formDataRef.current;
      await BranchesService.createBranch({
        companyId: currentFormData.companyId,
        code: currentFormData.code.trim(),
        name: currentFormData.name.trim(),
        type: currentFormData.type,
        description: currentFormData.description.trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
      });
      alert.showSuccess(
        t.security?.branches?.createSuccess || "Sucursal creada exitosamente",
      );
      onSuccess?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(
        error,
        "Error al crear la sucursal",
      );

      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsSubmitting(false);
    }
  }, [alert, onSuccess, t.security?.branches?.createSuccess, validateForm]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !companiesLoading) {
      onFormReady({
        isLoading: isSubmitting,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isSubmitting, companiesLoading y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, companiesLoading, generalError]);

  const companyOptions = useMemo(() => companies, [companies]);

  if (companiesLoading) {
    return (
      <View style={styles.loadingContainer}>
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
          {t.security?.branches?.createTitle || "Crear sucursal"}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          {t.security?.branches?.createSubtitle ||
            "Completa la información para registrar una nueva sucursal"}
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
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            Empresa *
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
              {companyOptions.map((company) => {
                const isSelected = formData.companyId === company.id;
                return (
                  <TouchableOpacity
                    key={company.id}
                    style={[
                      styles.selectOption,
                      isSelected && { backgroundColor: colors.primary },
                      { borderColor: colors.border },
                    ]}
                    onPress={() => handleChange("companyId", company.id)}
                  >
                    <ThemedText
                      type="body2"
                      style={
                        isSelected
                          ? { color: "#FFFFFF" }
                          : { color: colors.text }
                      }
                    >
                      {company.name}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {errors.companyId ? (
            <ThemedText
              type="caption"
              style={[styles.errorText, { color: colors.error }]}
            >
              {errors.companyId}
            </ThemedText>
          ) : null}
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
              {BRANCH_TYPES.map((option) => {
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
                  >
                    <ThemedText
                      type="body2"
                      style={
                        isSelected
                          ? { color: "#FFFFFF" }
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
                    backgroundColor: "#10b981",
                    borderColor: "#10b981",
                  },
                ]}
                onPress={() => handleChange("status", 1)}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 1
                      ? { color: "#FFFFFF" }
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
                    backgroundColor: "#ef4444",
                    borderColor: "#ef4444",
                  },
                ]}
                onPress={() => handleChange("status", 0)}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 0
                      ? { color: "#FFFFFF" }
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
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                  },
                ]}
                onPress={() => handleChange("status", 2)}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 2
                      ? { color: "#FFFFFF" }
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
                    backgroundColor: "#f97316",
                    borderColor: "#f97316",
                  },
                ]}
                onPress={() => handleChange("status", 3)}
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 3
                      ? { color: "#FFFFFF" }
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
