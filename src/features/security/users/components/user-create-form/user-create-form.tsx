/**
 * Componente reutilizable para formulario de usuario (crear)
 * Puede usarse tanto en página independiente como en modal
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { useTheme } from "@/hooks/use-theme";
import { useCompanyOptions } from "@/src/domains/security/hooks";
import {
    EmailInput,
    PasswordInput,
    PhoneInput,
    StatusSelector,
} from "@/src/domains/shared/components";
import { BranchesService } from "@/src/features/security/branches";
import { RolesService } from "@/src/features/security/roles";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import React, {
    startTransition,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { ActivityIndicator, ScrollView, TextInput, View } from "react-native";
import { UsersService } from "../../services";
import { UserCreatePayload } from "../../types/domain";
import { CompanyConfigCarousel } from "../company-config-carousel/company-config-carousel";
import { createUserFormStyles } from "./user-create-form.styles";
import { UserCreateFormProps } from "./user-create-form.types";

export function UserCreateForm({
  onSuccess,
  onCancel,
  showHeader = true,
  showFooter = true,
  onFormReady,
}: UserCreateFormProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const styles = createUserFormStyles();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyId: "", // Mantener para compatibilidad
    branchIds: [] as string[], // Mantener para compatibilidad
    companyBranches: {} as Record<string, string[]>, // Nueva estructura: { [companyId]: [branchIds] }
    companyRoles: {} as Record<string, string[]>, // Nueva estructura: { [companyId]: [roleIds] }
    roleId: "", // Mantener para compatibilidad
    status: 1, // Default: Activo
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const phoneRef = useRef<string>(""); // Ref para mantener el teléfono actualizado
  const branchIdsRef = useRef<string[]>([]); // Ref para mantener los branchIds actualizados
  const companyBranchesRef = useRef<Record<string, string[]>>({}); // Ref para mantener companyBranches actualizado
  const companyRolesRef = useRef<Record<string, string[]>>({}); // Ref para mantener companyRoles actualizado
  const roleIdRef = useRef<string>(""); // Ref para mantener el roleId actualizado (compatibilidad)
  const statusRef = useRef<number>(1); // Ref para mantener el status actualizado
  const formDataRef = useRef(formData); // Ref para mantener el formData actualizado y evitar stale closure
  const selectedCompanyIdsRef = useRef<string[]>([]); // Ref para mantener selectedCompanyIds actualizado
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]); // Empresas seleccionadas
  const [branchesByCompany, setBranchesByCompany] = useState<
    Record<string, any[]>
  >({}); // Sucursales por empresa
  const [rolesByCompany, setRolesByCompany] = useState<Record<string, any[]>>(
    {},
  ); // Roles por empresa

  // Sincronizar el ref cuando cambia el formData desde efectos externos
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const { companies, loading: companiesLoading } = useCompanyOptions();

  // Sincronizar el ref cuando cambia selectedCompanyIds
  useEffect(() => {
    selectedCompanyIdsRef.current = selectedCompanyIds;
  }, [selectedCompanyIds]);

  /**
   * Validar formulario
   */
  const validateForm = useCallback(() => {
    // Usar formDataRef.current para obtener los valores más recientes y evitar stale closure
    const currentFormData = formDataRef.current;
    const newErrors: Record<string, string> = {};

    if (!currentFormData.email.trim()) {
      newErrors.email = t.auth?.emailRequired || "El email es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentFormData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!currentFormData.password.trim()) {
      newErrors.password =
        t.auth?.passwordRequired || "La contraseña es requerida";
    } else if (currentFormData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!currentFormData.firstName.trim()) {
      newErrors.firstName = "El nombre es requerido";
    }

    if (!currentFormData.lastName.trim()) {
      newErrors.lastName = "El apellido es requerido";
    }

    // Validar que haya al menos una empresa seleccionada
    if (selectedCompanyIdsRef.current.length === 0) {
      newErrors.companyId = "Selecciona al menos una empresa";
    }

    // Validar que cada empresa tenga al menos una sucursal seleccionada
    const companiesWithoutBranches = selectedCompanyIdsRef.current.filter(
      (companyId) => {
        const branchIds = companyBranchesRef.current[companyId] || [];
        return branchIds.length === 0;
      },
    );
    if (companiesWithoutBranches.length > 0) {
      newErrors.branchIds =
        "Selecciona al menos una sucursal para cada empresa";
    }

    // Validar que cada empresa tenga al menos un rol seleccionado
    const companiesWithoutRoles = selectedCompanyIdsRef.current.filter(
      (companyId) => {
        const roleIds = companyRolesRef.current[companyId] || [];
        return roleIds.length === 0;
      },
    );
    if (companiesWithoutRoles.length > 0) {
      newErrors.roleId = "Selecciona al menos un rol para cada empresa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [t.auth]);

  /**
   * Manejar cambio de campo
   */
  const handleChange = useCallback(
    (field: string, value: any) => {
      // Guardar en refs para evitar stale closure
      if (field === "phone") {
        phoneRef.current = value;
      }
      if (field === "roleId") {
        roleIdRef.current = value;
      }
      if (field === "status") {
        statusRef.current = value;
      }

      setFormData((prev) => {
        const updated = { ...prev, [field]: value };
        formDataRef.current = updated;
        return updated;
      });
      setErrors((prev) => {
        if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
        return prev;
      });
      // Limpiar error general cuando el usuario empieza a editar
      if (generalError) {
        setGeneralError(null);
      }
    },
    [generalError],
  );

  // Manejar selección de empresas (múltiple)
  const handleCompanySelect = useCallback(
    (selectedIds: string[]) => {
      // Actualizar selectedCompanyIds primero (esto actualiza el Select sin cerrar el modal)
      setSelectedCompanyIds(selectedIds);
      selectedCompanyIdsRef.current = selectedIds;

      // Actualizar companyBranches, companyRoles y formData dentro de startTransition para evitar re-renders que cierren el modal
      startTransition(() => {
        setFormData((prev) => {
          const updatedCompanyBranches: Record<string, string[]> = {};
          const updatedCompanyRoles: Record<string, string[]> = {};
          selectedIds.forEach((companyId) => {
            updatedCompanyBranches[companyId] =
              prev.companyBranches?.[companyId] || [];
            updatedCompanyRoles[companyId] =
              prev.companyRoles?.[companyId] || [];
          });

          const updated = {
            ...prev,
            companyBranches: updatedCompanyBranches,
            companyRoles: updatedCompanyRoles,
            companyId: selectedIds[0] || "", // Mantener primera empresa para compatibilidad
          };

          companyBranchesRef.current = updatedCompanyBranches;
          companyRolesRef.current = updatedCompanyRoles;
          formDataRef.current = updated;

          return updated;
        });

        if (errors.companyId) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.companyId;
            return newErrors;
          });
        }
      });

      // Cargar sucursales y roles para nuevas empresas seleccionadas
      selectedIds.forEach(async (companyId) => {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(companyId)) {
          // Cargar sucursales
          if (!branchesByCompany[companyId]) {
            try {
              const companyBranches =
                await BranchesService.getBranchesByCompany(companyId);
              setBranchesByCompany((prev) => ({
                ...prev,
                [companyId]: companyBranches || [],
              }));
            } catch (error) {
              console.error(
                `Error al cargar sucursales para empresa ${companyId}:`,
                error,
              );
            }
          }

          // Cargar roles por empresa
          if (!rolesByCompany[companyId]) {
            try {
              // Asegurar que se pase el companyId correcto para cada empresa
              const rolesResponse = await RolesService.getRoles({
                page: 1,
                limit: 100,
                status: 1, // Solo roles activos
                companyId: companyId, // Filtrar por empresa específica
              });
              const rolesData = Array.isArray(rolesResponse.data)
                ? rolesResponse.data
                : [];
              // Actualizar el estado con los roles específicos de esta empresa
              setRolesByCompany((prev) => {
                const updated = {
                  ...prev,
                  [companyId]: rolesData,
                };
                return updated;
              });
            } catch (error) {
              console.error(
                `Error al cargar roles para empresa ${companyId}:`,
                error,
              );
              setRolesByCompany((prev) => ({
                ...prev,
                [companyId]: [],
              }));
            }
          }
        }
      });
    },
    [branchesByCompany, rolesByCompany, errors],
  );

  // Manejar selección de sucursales para una empresa específica
  const handleBranchSelect = useCallback(
    (companyId: string, selectedBranchIds: string[]) => {
      setFormData((prev) => {
        const updatedCompanyBranches = {
          ...(prev.companyBranches || {}),
          [companyId]: selectedBranchIds,
        };

        // Calcular todos los branchIds para compatibilidad
        const allBranchIds = Object.values(updatedCompanyBranches).flat();

        const updated = {
          ...prev,
          companyBranches: updatedCompanyBranches,
          branchIds: allBranchIds, // Mantener para compatibilidad
        };

        companyBranchesRef.current = updatedCompanyBranches;
        branchIdsRef.current = allBranchIds;
        formDataRef.current = updated;

        return updated;
      });

      if (errors.branchIds) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.branchIds;
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Manejar selección de roles para una empresa específica
  const handleRoleSelect = useCallback(
    (companyId: string, selectedRoleIds: string[]) => {
      setFormData((prev) => {
        const updatedCompanyRoles = {
          ...(prev.companyRoles || {}),
          [companyId]: selectedRoleIds,
        };

        // Calcular todos los roleIds para compatibilidad
        const allRoleIds = Object.values(updatedCompanyRoles).flat();

        const updated = {
          ...prev,
          companyRoles: updatedCompanyRoles,
          roleId: allRoleIds[0] || "", // Mantener para compatibilidad (primer rol)
        };

        companyRolesRef.current = updatedCompanyRoles;
        roleIdRef.current = allRoleIds[0] || "";
        formDataRef.current = updated;

        return updated;
      });

      // Limpiar error de roles si se seleccionó al menos un rol para esta empresa
      if (selectedRoleIds.length > 0 && errors.roleId) {
        // Verificar si todas las empresas tienen al menos un rol
        const allCompaniesHaveRoles = selectedCompanyIdsRef.current.every(
          (cId) => {
            if (cId === companyId) {
              return selectedRoleIds.length > 0;
            }
            const roleIds = companyRolesRef.current[cId] || [];
            return roleIds.length > 0;
          },
        );

        if (allCompaniesHaveRoles) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.roleId;
            return newErrors;
          });
        }
      }
    },
    [errors],
  );

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Usar formDataRef.current para obtener los valores más recientes
      const currentFormData = formDataRef.current;

      // Construir payload con estructura anidada: companies[] con branchIds[] y roleIds[] dentro
      const companies = selectedCompanyIdsRef.current.map((companyId) => ({
        id: companyId,
        branchIds: companyBranchesRef.current[companyId] || [], // Array de UUIDs directamente
        roleIds: companyRolesRef.current[companyId] || [], // Array de UUIDs de roles por empresa
      }));

      const createData: UserCreatePayload = {
        email: currentFormData.email.trim(),
        password: currentFormData.password,
        firstName: currentFormData.firstName.trim(),
        lastName: currentFormData.lastName.trim(),
        phone: phoneRef.current.trim(),
        companies,
        status: statusRef.current, // Usar status (número) directamente
      };

      // Mantener roleId para compatibilidad (primer rol de la primera empresa si existe)
      if (roleIdRef.current && roleIdRef.current.trim()) {
        createData.roleId = roleIdRef.current.trim();
      }

      await UsersService.createUser(createData);
      alert.showSuccess(
        t.security?.users?.create || "Usuario creado exitosamente",
      );
      onSuccess?.();
      onCancel?.();
    } catch (error: any) {
      const { message: errorMessage, detail: detailString } = extractErrorInfo(
        error,
        "Error al crear usuario",
      );

      // Mostrar error solo en InlineAlert dentro del modal (no mostrar Toast en modales)
      setGeneralError({ message: errorMessage, detail: detailString });
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, alert, onSuccess, onCancel, t.security?.users?.create]);

  /**
   * Manejar cancelar
   */
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  /**
   * Exponer funciones del formulario cuando está listo (para footer externo)
   */
  const loadingOptions = companiesLoading;

  // Llamar onFormReady solo cuando el componente está listo o cuando isLoading cambia
  useEffect(() => {
    if (onFormReady && !loadingOptions) {
      onFormReady({
        isLoading,
        handleSubmit,
        handleCancel,
        generalError,
      });
    }
    // Intencionalmente solo depende de isLoading, loadingOptions y generalError
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, loadingOptions, generalError]);

  if (loadingOptions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText type="body2" variant="secondary" style={styles.loadingText}>
          {t.common?.loading || "Cargando información..."}
        </ThemedText>
      </View>
    );
  }

  // Renderizar contenido del formulario (sin ScrollView si está en modal)
  const formContent = (
    <>
      {/* Formulario */}
      <Card variant="flat" style={styles.formCard}>
        {/* Email */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.auth?.email || "Email"} *
          </ThemedText>
          <EmailInput
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            placeholder={t.auth?.email || "Email"}
            required
            error={!!errors.email}
            errorMessage={errors.email}
            disabled={isLoading}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.auth?.password || "Contraseña"} *
          </ThemedText>
          <PasswordInput
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
            placeholder={t.auth?.password || "Contraseña"}
            required
            error={!!errors.password}
            errorMessage={errors.password}
            disabled={isLoading}
          />
        </View>

        {/* First Name */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.users?.name || "Nombre"} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.firstName ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.firstName}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={
                t.security?.users?.firstNamePlaceholder || "Nombre del usuario"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </InputWithFocus>
          {errors.firstName && (
            <ThemedText type="caption" variant="error" style={styles.errorText}>
              {errors.firstName}
            </ThemedText>
          )}
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.users?.lastName || "Apellido"} *
          </ThemedText>
          <InputWithFocus
            containerStyle={[
              styles.inputContainer,
              {
                backgroundColor: colors.surface,
                borderColor: errors.lastName ? colors.error : colors.border,
              },
            ]}
            primaryColor={colors.primary}
            error={!!errors.lastName}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder={
                t.security?.users?.lastNamePlaceholder || "Apellido del usuario"
              }
              placeholderTextColor={colors.textSecondary}
              value={formData.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </InputWithFocus>
          {errors.lastName && (
            <ThemedText type="caption" variant="error" style={styles.errorText}>
              {errors.lastName}
            </ThemedText>
          )}
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <ThemedText
            type="body2"
            style={[styles.label, { color: colors.text }]}
          >
            {t.security?.users?.phone || "Teléfono"}
          </ThemedText>
          <PhoneInput
            value={formData.phone}
            onChangeText={(text) => {
              // Solo permitir números, espacios y algunos caracteres de teléfono
              const cleaned = text.replace(/[^\d\s+()-]/g, "");
              handleChange("phone", cleaned);
            }}
            placeholder={t.security?.users?.phone || "Teléfono"}
            disabled={isLoading}
          />
        </View>

        {/* Companies */}
        <View style={styles.inputGroup}>
          <Select
            label="Empresas"
            placeholder="Selecciona una o más empresas"
            value={selectedCompanyIds}
            options={companies.map((comp) => ({
              value: comp.id,
              label: comp.name,
            }))}
            onSelect={(value) => handleCompanySelect(value as string[])}
            error={!!errors.companyId}
            errorMessage={errors.companyId}
            required
            multiple={true}
            disabled={isLoading}
            searchable={true}
          />
        </View>

        {/* Carrusel de configuración por empresa */}
        {selectedCompanyIds.length > 0 && (
          <CompanyConfigCarousel
            selectedCompanyIds={selectedCompanyIds}
            companies={companies}
            branchesByCompany={branchesByCompany}
            rolesByCompany={rolesByCompany}
            companyBranches={formData.companyBranches || {}}
            companyRoles={formData.companyRoles || {}}
            onBranchSelect={handleBranchSelect}
            onRoleSelect={handleRoleSelect}
            branchErrors={errors.branchIds}
            roleErrors={errors.roleId}
            isLoading={isLoading}
            t={t}
          />
        )}

        {/* Estado */}
        <View style={styles.inputGroup}>
          <StatusSelector
            value={formData.status}
            onChange={(value) => handleChange("status", value)}
            label={t.security?.users?.status || "Estado"}
            required
            disabled={isLoading}
          />
        </View>

        {/* Botones (solo si showFooter es true) */}
        {showFooter && (
          <View style={styles.actions}>
            <Button
              title={t.common?.cancel || "Cancelar"}
              onPress={handleCancel}
              variant="outlined"
              size="md"
              style={styles.cancelButton}
              disabled={isLoading}
            />
            <Button
              title={t.common?.save || "Guardar"}
              onPress={handleSubmit}
              variant="primary"
              size="md"
              style={styles.submitButton}
              disabled={isLoading}
            />
          </View>
        )}
      </Card>
    </>
  );

  // Si está en modal (showHeader=false), no usar ScrollView propio (el modal lo maneja)
  if (!showHeader) {
    return <>{formContent}</>;
  }

  // Si está en página independiente, usar ScrollView propio
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {formContent}
    </ScrollView>
  );
}
