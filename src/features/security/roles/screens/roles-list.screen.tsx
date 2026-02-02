/**
 * Página principal de administración de Roles
 * Lista de roles con paginación, búsqueda y filtros
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { CenteredModal } from "@/components/ui/centered-modal";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SideModal } from "@/components/ui/side-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { RolePermissionsModal } from "@/src/domains/security/components";
import { useCompanyOptions } from "@/src/domains/security/hooks";
import { DynamicIcon, SearchFilterBar } from "@/src/domains/shared/components";
import { DataTable } from "@/src/domains/shared/components/data-table/data-table";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { FilterConfig } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar.types";
import { useMultiCompany } from "@/src/domains/shared/hooks";
import { PermissionsManagementContent } from "@/src/features/security/permissions/components/permissions-management-content/permissions-management-content";
import {
    RoleCreateForm,
    RoleEditForm,
    RolesService,
} from "@/src/features/security/roles";
import { Role, RoleFilters } from "@/src/features/security/roles/types/domain";
import { useRouteAccessGuard } from "@/src/infrastructure/access";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import { createRolesListScreenStyles } from "./roles-list.screen.styles";

export function RolesListScreen() {
  const { colors, spacing, typography, pageLayout, borderRadius } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const { currentCompany } = useMultiCompany();
  const { companies } = useCompanyOptions();
  const alert = useAlert();
  const { isMobile } = useResponsive();

  const styles = useMemo(
    () =>
      createRolesListScreenStyles(
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
  const usersTranslations = (t.security?.users as any) || {};
  const commonTranslations = (t.common as any) || {};

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{
    isLoading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  } | null>(null);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] =
    useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] =
    useState<Role | null>(null);
  const [isEditPermissionsModalVisible, setIsEditPermissionsModalVisible] =
    useState(false);
  const [selectedRoleForEditPermissions, setSelectedRoleForEditPermissions] =
    useState<Role | null>(null);
  const [permissionsModalError, setPermissionsModalError] = useState<{
    message: string;
    detail?: string;
  } | null>(null);
  const [permissionsModalSuccess, setPermissionsModalSuccess] = useState<
    string | null
  >(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [localFilter, setLocalFilter] = useState(""); // Filtro local para la tabla
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    isSystem: undefined,
  });

  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>("");

  /**
   * Cargar roles
   */
  const loadRoles = useCallback(
    async (currentFilters: RoleFilters) => {
      // Prevenir llamadas simultáneas
      if (loadingRef.current) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setError(null);
        setHasError(false);

        const response = await RolesService.getRoles(currentFilters);

        // Asegurar que la respuesta tenga la estructura correcta
        if (response && response.data) {
          setRoles(Array.isArray(response.data) ? response.data : []);

          // Usar meta de la respuesta del backend
          if (response.meta) {
            setPagination({
              page: response.meta.page || currentFilters.page || 1,
              limit: response.meta.limit || currentFilters.limit || 10,
              total: response.meta.total || 0,
              totalPages: response.meta.totalPages || 0,
              hasNext: response.meta.hasNext || false,
              hasPrev: response.meta.hasPrev || false,
            });
          } else {
            setPagination({
              page: currentFilters.page || 1,
              limit: currentFilters.limit || 10,
              total: Array.isArray(response.data) ? response.data.length : 0,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            });
          }
        } else {
          setRoles([]);
          setPagination({
            page: currentFilters.page || 1,
            limit: currentFilters.limit || 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          });
        }

        setHasError(false);
      } catch (error: any) {
        // Si handleApiError retorna true, significa que el error fue manejado (401, 403, etc.)
        // En este caso, establecer hasError para evitar loops infinitos
        if (handleApiError(error)) {
          setHasError(true);
          return;
        }
        const { message: errorMessage, detail: detailString } =
          extractErrorInfo(
            error,
            t.security?.roles?.loadError || "Error al cargar roles",
          );
        setError(errorMessage);
        setHasError(true);
        // Mostrar error con detalles
        alert.showError(errorMessage, false, undefined, detailString, error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [alert, handleApiError, t],
  );

  /**
   * Efecto para cargar roles cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   * IMPORTANTE: No incluir loadRoles en las dependencias para evitar loops infinitos
   */
  useEffect(() => {
    // No recargar si hay un error activo (evita loops infinitos)
    if (hasError) {
      return;
    }

    if (!isScreenFocused || !hasAccess || accessLoading) {
      return;
    }

    const signature = JSON.stringify(filters);
    if (filtersSignatureRef.current === signature) {
      return;
    }

    filtersSignatureRef.current = signature;
    loadRoles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLoading, hasAccess, isScreenFocused, filters]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  /**
   * Manejar cambio de filtro local (sin API, solo filtra en la tabla)
   */
  const handleLocalFilterChange = useCallback((value: string) => {
    setLocalFilter(value);
    setHasError(false);
  }, []);

  /**
   * Manejar búsqueda API (consulta al backend)
   */
  const handleSearchSubmit = (search: string) => {
    setHasError(false);
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  /**
   * Manejar cambio de filtros avanzados (consulta API)
   */
  const handleAdvancedFilterChange = (key: string, value: any) => {
    setHasError(false);

    if (key === "deleted") {
      setFilters((prev) => ({
        ...prev,
        status: value === "deleted" ? -1 : undefined,
        page: 1,
      }));
      return;
    }

    // Manejar filtros boolean (isSystem)
    // El componente SearchFilterBar envía true, false o undefined
    if (key === "isSystem") {
      setFilters((prev) => ({
        ...prev,
        isSystem: value, // Mantener el valor boolean (true/false) o undefined
        page: 1,
      }));
      return;
    }

    // Convertir status de string a number si es necesario
    const processedValue =
      key === "status" && value !== "" ? parseInt(value, 10) : value;
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : processedValue,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      status: undefined,
      isSystem: undefined,
    });
    setLocalFilter(""); // Limpiar también el filtro local
    setHasError(false);
  };

  // Función para obtener el nombre de la empresa por su ID
  const getCompanyName = useCallback(
    (companyId?: string) => {
      if (!companyId) return "-";
      const company = companies.find((c) => c.id === companyId);
      return company?.name || "-";
    },
    [companies],
  );

  /**
   * Filtrar roles localmente según el filtro local
   */
  const filteredRoles = useMemo(() => {
    if (!localFilter.trim()) {
      return roles;
    }

    const filterLower = localFilter.toLowerCase().trim();
    return roles.filter((role) => {
      const name = (role.name || "").toLowerCase();
      const code = (role.code || "").toLowerCase();
      const description = (role.description || "").toLowerCase();
      const companyName = getCompanyName(role.companyId).toLowerCase();

      return (
        name.includes(filterLower) ||
        code.includes(filterLower) ||
        description.includes(filterLower) ||
        companyName.includes(filterLower)
      );
    });
  }, [roles, localFilter, getCompanyName]);

  const handleCreateRole = () => {
    setFormActions(null);
    setSelectedRoleId(null);
    setModalMode("create");
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar rol
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditRole = (role: Role) => {
    setFormActions(null);
    setSelectedRoleId(role.id);
    setModalMode("edit");
    setIsModalVisible(true);
  };

  /**
   * Cerrar modal de edición
   */
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedRoleId(null);
    setFormActions(null); // Resetear acciones del formulario
  };

  /**
   * Manejar éxito al crear/editar rol
   */
  const handleFormSuccess = () => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadRoles(filters);
    handleCloseModal();
  };

  /**
   * Manejar eliminación de rol (llamado después de confirmación)
   */
  const handleDeleteRole = async (role: Role) => {
    if (role.isSystem) {
      alert.showError("No se pueden eliminar roles del sistema");
      return;
    }
    try {
      await RolesService.deleteRole(role.id);
      await loadRoles(filters);
      alert.showSuccess(t.security?.roles?.delete || "Rol eliminado");
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      const { message: errorMessage, detail: detailString } = extractErrorInfo(
        error,
        "Error al eliminar rol",
      );
      alert.showError(errorMessage, false, undefined, detailString, error);
    }
  };

  /**
   * Confirmar eliminación de rol (muestra diálogo de confirmación)
   * Valida que no sea un rol del sistema y muestra mensaje de confirmación
   */
  const confirmDeleteRole = (role: Role) => {
    // Validar que no sea un rol del sistema antes de mostrar confirmación
    // (Aunque el botón no debería mostrarse, esta validación es defensiva)
    if (role.isSystem) {
      alert.showError("No se pueden eliminar roles del sistema");
      return;
    }

    const rolesTranslations = (t.security?.roles as any) || {};
    const title =
      rolesTranslations.deleteConfirmTitle ||
      commonTranslations.confirm ||
      "Eliminar rol";
    const messageTemplate =
      rolesTranslations.deleteConfirmMessage ||
      "¿Seguro que deseas eliminar el rol {name}? Esta acción no se puede deshacer.";

    // Usar nombre, código o ID como identificador para el mensaje
    const identifier = role.name || role.code || role.id;
    const message = messageTemplate.includes("{name}")
      ? messageTemplate.replace("{name}", identifier)
      : messageTemplate.replace("{email}", identifier); // Fallback para compatibilidad

    // Mostrar diálogo de confirmación y ejecutar eliminación si se confirma
    alert.showConfirm(title, message, () => handleDeleteRole(role));
  };

  const columns: TableColumn<Role>[] = [
    {
      key: "company",
      label: t.security?.roles?.company || "Empresa",
      width: "18%",
      render: (role) => (
        <ThemedText type="body2">{getCompanyName(role.companyId)}</ThemedText>
      ),
    },
    {
      key: "code",
      label: t.security?.roles?.code || "Código",
      width: "15%",
    },
    {
      key: "name",
      label: t.security?.roles?.name || "Nombre",
      width: "18%",
    },
    {
      key: "description",
      label: t.security?.roles?.description || "Descripción",
      width: "20%",
    },
    {
      key: "isSystem",
      label: t.security?.roles?.system || "Sistema",
      width: "8%",
      align: "center",
      render: (role) => (
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {role.isSystem ? (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.primary}
            />
          ) : (
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          )}
        </View>
      ),
    },
    {
      key: "status",
      label: t.security?.users?.status || "Estado",
      width: "15%",
      align: "center",
      render: (role) => (
        <StatusBadge
          status={role.status}
          statusDescription={role.statusDescription}
          size="small"
        />
      ),
    },
    {
      key: "permissions",
      label: t.security?.roles?.permissions || "Permisos",
      width: "8%",
      align: "center",
      render: (role) => (
        <ThemedText type="body2" variant="secondary">
          {role.permissions?.length || 0}
        </ThemedText>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: "status",
      label: usersTranslations.status || "Estado",
      type: "select",
      options: [
        { key: "all", value: "", label: commonTranslations.all || "Todos" },
        {
          key: "active",
          value: "1",
          label: usersTranslations.active || "Activo",
        },
        {
          key: "inactive",
          value: "0",
          label: usersTranslations.inactive || "Inactivo",
        },
        {
          key: "pending",
          value: "2",
          label: usersTranslations.pending || "Pendiente",
        },
        {
          key: "suspended",
          value: "3",
          label: usersTranslations.suspended || "Suspendido",
        },
      ],
    },
    {
      key: "deleted",
      label: usersTranslations.deletedFilter || "Usuarios",
      type: "select",
      options: [
        {
          key: "deleted",
          value: "deleted",
          label: usersTranslations.deletedUser || "Eliminados",
        },
      ],
    },
    {
      key: "isSystem",
      label: t.security?.roles?.system || "Sistema",
      type: "boolean",
    },
  ];

  if (accessLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>
          {t.common?.loading || "Cargando..."}
        </ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Header con icono, título y subtítulo (estandarizado) */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.headerRow}>
              <DynamicIcon
                name="Ionicons:shield-checkmark"
                size={
                  isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle
                }
                color={colors.primary}
                style={styles.headerIcon}
              />
              <ThemedText
                type="h2"
                style={isMobile ? styles.titleMobile : styles.title}
              >
                {t.security?.roles?.title || "Administración de Roles"}
              </ThemedText>
            </View>
            <ThemedText type="body1" style={styles.subtitle}>
              {t.security?.roles?.subtitle || "Gestiona los roles del sistema"}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? "" : t.security?.roles?.create || "Crear Rol"}
            onPress={handleCreateRole}
            variant="primary"
            size="md"
          >
            <Ionicons
              name="add"
              size={pageLayout.iconSubtitle}
              color="#FFFFFF"
              style={!isMobile ? { marginRight: spacing.sm } : undefined}
            />
          </Button>
        </View>

        {/* Barra de búsqueda y filtros */}
        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={handleLocalFilterChange}
          onSearchSubmit={handleSearchSubmit}
          filterPlaceholder={
            t.security?.roles?.filterPlaceholder ||
            "Filtrar por nombre o código..."
          }
          searchPlaceholder={
            t.security?.roles?.searchPlaceholder ||
            "Buscar por nombre o código..."
          }
          filters={filterConfigs}
          activeFilters={{
            status:
              filters.status !== undefined && filters.status !== -1
                ? filters.status.toString()
                : "",
            deleted: filters.status === -1 ? "deleted" : "",
            isSystem: filters.isSystem,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredRoles.length : undefined}
          totalCount={pagination.total}
        />

        {/* Tabla de roles con scroll interno */}
        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredRoles}
            columns={columns}
            loading={loading}
            emptyMessage={
              t.security?.roles?.empty || "No hay roles disponibles"
            }
            onRowPress={handleEditRole}
            keyExtractor={(role) => role.id}
            showPagination={true}
            actionsColumnLabel={t.common?.actions || "Acciones"}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim()
                ? filteredRoles.length
                : pagination.total,
              totalPages: localFilter.trim()
                ? Math.ceil(filteredRoles.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page <
                  Math.ceil(filteredRoles.length / pagination.limit)
                : pagination.hasNext,
              hasPrev: localFilter.trim()
                ? pagination.page > 1
                : pagination.hasPrev,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
              limitOptions: [10, 25, 50, 100],
            }}
            editAction={{
              onPress: (role) => handleEditRole(role),
              tooltip: t.security?.roles?.editShort || "Editar",
            }}
            deleteAction={{
              onPress: (role) => confirmDeleteRole(role),
              tooltip: t.security?.roles?.deleteShort || "Eliminar",
              visible: (role) => !role.isSystem, // Solo mostrar si NO es del sistema
            }}
            actions={[
              {
                id: "view-permissions",
                icon: "git-network",
                tooltip: t.security?.roles?.viewPermissions || "Ver permisos",
                onPress: (role) => {
                  setSelectedRoleForPermissions(role);
                  setIsPermissionsModalVisible(true);
                },
              },
            ]}
          />
        </View>

        {/* Modal de creación/edición */}
        {modalMode && (
          <SideModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            title={
              modalMode === "edit"
                ? t.security?.roles?.edit || "Editar Rol"
                : t.security?.roles?.create || "Crear Rol"
            }
            subtitle={
              modalMode === "edit"
                ? t.security?.roles?.editSubtitle ||
                  "Modifica los datos del rol"
                : t.security?.roles?.createSubtitle ||
                  "Completa los datos para registrar un nuevo rol"
            }
            topAlert={
              formActions?.generalError ? (
                <InlineAlert
                  type="error"
                  message={formActions.generalError.message}
                  detail={formActions.generalError.detail}
                  duration={5000}
                  autoClose={true}
                  onDismiss={() => {
                    if (formActions) {
                      setFormActions({ ...formActions, generalError: null });
                    }
                  }}
                />
              ) : undefined
            }
            footer={
              formActions ? (
                <>
                  <Button
                    title={t.common.cancel}
                    onPress={formActions.handleCancel}
                    variant="outlined"
                    size="md"
                    disabled={formActions.isLoading}
                  />
                  <Button
                    title={
                      modalMode === "edit"
                        ? t.common.save
                        : t.security?.roles?.create || "Crear Rol"
                    }
                    onPress={formActions.handleSubmit}
                    variant="primary"
                    size="md"
                    disabled={formActions.isLoading}
                  />
                </>
              ) : null
            }
          >
            {modalMode === "edit" && selectedRoleId ? (
              <RoleEditForm
                roleId={selectedRoleId}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
            {modalMode === "create" ? (
              <RoleCreateForm
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
          </SideModal>
        )}

        {/* Modal de permisos (vista) */}
        <RolePermissionsModal
          visible={isPermissionsModalVisible}
          role={selectedRoleForPermissions}
          onClose={() => {
            setIsPermissionsModalVisible(false);
            setSelectedRoleForPermissions(null);
          }}
          onEdit={(role) => {
            // Cerrar el modal de vista
            setIsPermissionsModalVisible(false);
            setSelectedRoleForPermissions(null);

            // Abrir el modal de edición de permisos
            setSelectedRoleForEditPermissions(role);
            setIsEditPermissionsModalVisible(true);
          }}
        />

        {/* Modal centrado para editar permisos */}
        <CenteredModal
          visible={isEditPermissionsModalVisible}
          onClose={() => {
            setIsEditPermissionsModalVisible(false);
            setSelectedRoleForEditPermissions(null);
            setPermissionsModalError(null);
            setPermissionsModalSuccess(null);
          }}
          title={t.security?.permissions?.title || "Administración de Permisos"}
          subtitle={
            t.security?.permissions?.subtitle ||
            "Gestiona los permisos del sistema"
          }
          width="90%"
          height="90%"
          topAlert={
            permissionsModalError ? (
              <InlineAlert
                type="error"
                message={permissionsModalError.message}
                detail={permissionsModalError.detail}
                duration={5000}
                autoClose={true}
                onDismiss={() => setPermissionsModalError(null)}
              />
            ) : permissionsModalSuccess ? (
              <InlineAlert
                type="success"
                message={permissionsModalSuccess}
                duration={3000}
                autoClose={true}
                onDismiss={() => setPermissionsModalSuccess(null)}
              />
            ) : undefined
          }
        >
          <PermissionsManagementContent
            initialCompanyId={
              selectedRoleForEditPermissions?.companyId || currentCompany?.id
            }
            initialRoleId={selectedRoleForEditPermissions?.id}
            onClose={() => {
              setIsEditPermissionsModalVisible(false);
              setSelectedRoleForEditPermissions(null);
              setPermissionsModalError(null);
              setPermissionsModalSuccess(null);
            }}
            onError={(error) => {
              setPermissionsModalError(error);
              setPermissionsModalSuccess(null);
            }}
            onSuccess={(message) => {
              setPermissionsModalSuccess(message);
              setPermissionsModalError(null);
            }}
          />
        </CenteredModal>
      </View>
    </ThemedView>
  );
}
