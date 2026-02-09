/**
 * Componente reutilizable para formulario de permiso (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { useTheme } from "@/hooks/use-theme";
import { APP_CONFIG } from "@/src/config/app.config";
import { PermissionsService } from "@/src/domains/security";
import { MenuItemSelectorModal } from "@/src/domains/security/components/shared/menu-item-selector-modal/menu-item-selector-modal";
import { IconInput } from "@/src/domains/shared/components";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { processCodeAndName } from "@/src/infrastructure/utils";
import { Ionicons } from "@expo/vector-icons";
import { openBrowserAsync } from "expo-web-browser";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { createPermissionFormStyles } from "./permission-create-form.styles";
import { PermissionCreateFormProps } from "./permission-create-form.types";

export function PermissionCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: PermissionCreateFormProps) {
  const { colors, spacing, modalLayout, borderRadius } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = useMemo(
    () =>
      createPermissionFormStyles({
        spacing,
        modalLayout,
        borderRadius,
      }),
    [spacing, modalLayout, borderRadius],
  );

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    action: "",
    description: "",
    icon: "",
    status: 1, // Default: Activo
  });

  const [menuItemIds, setMenuItemIds] = useState<string[]>([]);
  const [isMenuItemSelectorVisible, setIsMenuItemSelectorVisible] =
    useState(false);

  // Ref para mantener el status actualizado y evitar stale closure
  const statusRef = useRef<number>(1);
  // Ref para mantener menuItemIds actualizado y evitar stale closure
  const menuItemIdsRef = useRef<string[]>([]);

  // Wrapper para setMenuItemIds que también actualiza el ref
  const handleMenuItemIdsChange = useCallback((newMenuItemIds: string[]) => {
    setMenuItemIds(newMenuItemIds);
    menuItemIdsRef.current = newMenuItemIds; // Actualizar ref inmediatamente
  }, []);
  // Ref para rastrear si el nombre fue editado manualmente (para no sobrescribirlo)
  const nameManuallyEditedRef = useRef<boolean>(false);
  // Ref para mantener el nombre actualizado
  const nameRef = useRef<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);

  const resetError = useCallback(
    (field: string) => {
      setErrors((prev) => ({ ...prev, [field]: "" }));
      // Limpiar error general cuando el usuario empieza a editar
      if (generalError) {
        setGeneralError(null);
      }
    },
    [generalError],
  );

  // Ref para mantener los valores actuales y evitar stale closures
  const formDataRef = useRef(formData);

  // Actualizar ref cuando cambia formData
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // El ref se actualiza directamente en handleMenuItemIdsChange, pero mantenemos este useEffect como respaldo
  useEffect(() => {
    menuItemIdsRef.current = menuItemIds;
  }, [menuItemIds]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Usar los valores actuales del ref (siempre actualizados)
    const currentFormData = formDataRef.current;
    const codeValue = (currentFormData.code || "").trim();
    const nameValue = (currentFormData.name || "").trim();
    const actionValue = (currentFormData.action || "").trim();

    // Solo agregar error si el campo está realmente vacío
    if (!codeValue || codeValue.length === 0) {
      newErrors.code = "El código es requerido";
    }

    if (!nameValue || nameValue.length === 0) {
      newErrors.name = "El nombre es requerido";
    }

    if (!actionValue || actionValue.length === 0) {
      newErrors.action = "La acción es requerida";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const handleChange = useCallback(
    (field: keyof typeof formData, value: any) => {
      setFormData((prev) => {
        const updated = { ...prev, [field]: value };

        // Limpiar error del campo si tiene valor (para strings, verificar que no esté vacío después de trim)
        const hasValue =
          value !== null &&
          value !== undefined &&
          (typeof value !== "string" || value.trim().length > 0);

        if (hasValue) {
          setErrors((prevErrors) => {
            if (prevErrors[field]) {
              const newErrors = { ...prevErrors };
              delete newErrors[field];
              return newErrors;
            }
            return prevErrors;
          });
        }

        return updated;
      });

      // Actualizar ref para status
      if (field === "status") {
        statusRef.current = value;
      }
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    // Primero limpiar errores previos
    setErrors({});

    // Luego validar con los valores actuales (usando el ref)
    const isValid = validateForm();
    if (!isValid) {
      // Si hay errores, no continuar
      return;
    }

    setIsLoading(true);
    try {
      // Usar valores del ref para asegurar que son los más recientes
      const currentFormData = formDataRef.current;

      // Asegurar que menuItems sea un array limpio
      const currentMenuItemIds = Array.isArray(menuItemIdsRef.current)
        ? [...menuItemIdsRef.current] // Crear una copia del array
        : [];

      const payload: {
        name: string;
        code: string;
        action: string;
        description?: string;
        icon?: string;
        status: number;
        menuItems: string[];
      } = {
        name: (currentFormData.name || "").trim(),
        code: (currentFormData.code || "").trim(),
        action: (currentFormData.action || "").trim(),
        description: (currentFormData.description || "").trim() || undefined,
        icon: (currentFormData.icon || "").trim() || undefined,
        status: statusRef.current, // Usar ref para evitar stale closure
        menuItems: currentMenuItemIds, // Siempre incluir menuItems (el backend espera este campo)
      };

      await PermissionsService.createPermission(payload);

      alert.showSuccess(
        t.security?.permissions?.create || "Permiso creado exitosamente",
      );
      onSuccess?.();
    } catch (error: any) {
      const backendResult = error?.result || error?.response?.data || error;
      const rawDetails = backendResult?.details ?? error?.details;
      const detailString =
        typeof rawDetails === "string"
          ? rawDetails
          : rawDetails?.message
            ? String(rawDetails.message)
            : undefined;

      const errorMessage =
        backendResult?.description ||
        error?.message ||
        "Error al crear permiso";

      // Mostrar error en InlineAlert dentro del modal
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsLoading(false);
    }
  }, [
    alert,
    formData,
    onSuccess,
    t.security?.permissions?.create,
    validateForm,
  ]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  useEffect(() => {
    if (onFormReady && !loadingInitial) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingInitial y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingInitial, generalError]);

  if (loadingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || "Cargando información..."}
        </ThemedText>
      </View>
    );
  }

  const headerContent = showHeader ? (
    <View style={styles.formHeader}>
      <View style={styles.formHeaderTexts}>
        <ThemedText type="h4" style={{ color: colors.text }}>
          {t.security?.permissions?.create || "Crear Permiso"}
        </ThemedText>
        <ThemedText type="body2" variant="secondary">
          Completa los datos del nuevo permiso
        </ThemedText>
      </View>
    </View>
  ) : null;

  const footerContent = showFooter ? (
    <View style={styles.formFooter}>
      <Button
        title={t.common.cancel}
        onPress={handleCancel}
        variant="outlined"
        size="md"
        disabled={isLoading}
      />
      <Button
        title={t.common.save}
        onPress={handleSubmit}
        variant="primary"
        size="md"
        disabled={isLoading}
      />
    </View>
  ) : null;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: showFooter ? 0 : 24 }}
    >
      {headerContent}
      <Card style={styles.formCard}>
        {/* Code */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.code || "Código"} *
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
              name="code-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={t.security?.permissions?.code || "Código"}
              placeholderTextColor={colors.textSecondary}
              value={formData.code}
              onChangeText={(value) => {
                // Usar utilidades centralizadas para formatear código y nombre
                const { code: processedCode, name: processedName } =
                  processCodeAndName(value);

                // Actualizar código con el valor procesado
                handleChange("code", processedCode);

                // Limpiar error de código si existe
                if (errors.code) {
                  resetError("code");
                }

                // Sincronizar nombre solo si no fue editado manualmente
                if (!nameManuallyEditedRef.current) {
                  nameRef.current = processedName;
                  // Usar handleChange también para el nombre para mantener consistencia y limpiar errores
                  handleChange("name", processedName);
                }
              }}
              autoCapitalize="characters"
            />
          </InputWithFocus>
          {errors.code ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.code}
            </ThemedText>
          ) : null}
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.name || "Nombre"} *
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
              name="pricetag-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={
                t.security?.permissions?.namePlaceholder || "Nombre del permiso"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => {
                // Marcar que el nombre fue editado manualmente
                nameManuallyEditedRef.current = true;
                nameRef.current = value;
                handleChange("name", value);
              }}
              autoCapitalize="sentences"
            />
          </InputWithFocus>
          {errors.name ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        {/* Action */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.action || "Acción"} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.action ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.action}
          >
            <Ionicons
              name="flash-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={
                t.security?.permissions?.actionPlaceholder ||
                "Acción (ej: view)"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.action}
              onChangeText={(value) => handleChange("action", value)}
              autoCapitalize="none"
            />
          </InputWithFocus>
          {errors.action ? (
            <ThemedText type="caption" style={{ color: colors.error }}>
              {errors.action}
            </ThemedText>
          ) : null}
        </View>

        {/* Icon */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.icon || "Icono"}
          </ThemedText>
          <View
            style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
          >
            <View style={{ flex: 1 }}>
              <IconInput
                value={formData.icon}
                onChange={(value) => handleChange("icon", value)}
                placeholder={
                  t.security?.permissions?.iconPlaceholder ||
                  "Nombre del icono (ej: payment, home-outline)"
                }
                disabled={isLoading}
                error={!!errors.icon}
              />
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
                minHeight: 48,
              }}
              onPress={async () => {
                try {
                  const iconsUrl = APP_CONFIG.EXTERNAL_URLS.ICONS_DOCUMENTATION;

                  // En web, abrir en una nueva pestaña
                  if (Platform.OS === "web") {
                    window.open(iconsUrl, "_blank", "noopener,noreferrer");
                  } else {
                    // En móviles, usar el navegador in-app
                    await openBrowserAsync(iconsUrl);
                  }
                } catch (error) {
                  console.error("Error al abrir URL de iconos:", error);
                  setGeneralError({
                    message: "No se pudo abrir la página de iconos",
                  });
                }
              }}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items Selector */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.menuItems || "Items del Menú"}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setIsMenuItemSelectorVisible(true)}
            activeOpacity={0.7}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flex: 1,
                gap: 12,
              }}
            >
              <Ionicons name="menu" size={20} color={colors.textSecondary} />
              <ThemedText
                type="body2"
                style={{
                  color:
                    menuItemIds.length > 0 ? colors.text : colors.textSecondary,
                }}
              >
                {menuItemIds.length > 0
                  ? `${menuItemIds.length} ${menuItemIds.length === 1 ? "item seleccionado" : "items seleccionados"}`
                  : t.security?.permissions?.selectMenuItems ||
                    "Seleccionar items del menú"}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.permissions?.description || "Descripción"}
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                minHeight: 100,
              },
            ]}
            primaryColor={colors.primary}
          >
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text }]}
              placeholder={
                t.security?.permissions?.descriptionPlaceholder ||
                "Descripción del permiso"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleChange("description", value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </InputWithFocus>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.users?.status || "Estado"}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectOptions}>
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
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 2
                      ? { color: colors.contrastText }
                      : { color: colors.text }
                  }
                >
                  Pendiente
                </ThemedText>
              </TouchableOpacity>
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
              >
                <ThemedText
                  type="caption"
                  style={
                    formData.status === 3
                      ? { color: colors.contrastText }
                      : { color: colors.text }
                  }
                >
                  Suspendido
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Card>
      {footerContent}

      {/* Modal de selección de items del menú */}
      <MenuItemSelectorModal
        visible={isMenuItemSelectorVisible}
        onClose={() => setIsMenuItemSelectorVisible(false)}
        selectedMenuItemIds={menuItemIds}
        onSelectionChange={handleMenuItemIdsChange}
      />
    </ScrollView>
  );
}
