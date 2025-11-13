/**
 * Página principal de administración de Roles
 * Lista de roles con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { RolesService } from '@/src/domains/security';
import { RoleCreateForm, RoleEditForm } from '@/src/domains/security/components';
import { RoleFilters, SecurityRole } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createRolesListStyles } from '@/src/styles/pages/roles-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export default function RolesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createRolesListStyles(isMobile);
  const usersTranslations = (t.security?.users as any) || {};
  const commonTranslations = (t.common as any) || {};

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [localFilter, setLocalFilter] = useState(''); // Filtro local para la tabla
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    isSystem: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');

  /**
   * Cargar roles
   */
  const loadRoles = useCallback(async (currentFilters: RoleFilters) => {
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
      if (handleApiError(error)) {
        return;
      }
      const errorMessage = error.message || t.security?.roles?.loadError || 'Error al cargar roles';
      setError(errorMessage);
      setHasError(true);
      // Mostrar error con detalles
      alert.showError(errorMessage, error.details || error.response?.result?.details);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [alert, handleApiError, t]);

  /**
   * Efecto para cargar roles cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   */
  useEffect(() => {
    if (!isScreenFocused || !hasAccess || accessLoading || hasError) {
      return;
    }

    const signature = JSON.stringify(filters);
    if (filtersSignatureRef.current === signature) {
      return;
    }

    filtersSignatureRef.current = signature;
    loadRoles(filters);
  }, [accessLoading, hasAccess, hasError, isScreenFocused, loadRoles, filters]);

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

    if (key === 'deleted') {
      setFilters((prev) => ({
        ...prev,
        status: value === 'deleted' ? -1 : undefined,
        page: 1,
      }));
      return;
    }

    // Convertir status de string a number si es necesario
    const processedValue = key === 'status' && value !== '' ? parseInt(value, 10) : value;
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : processedValue,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      isSystem: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar roles localmente según el filtro local
   */
  const filteredRoles = useMemo(() => {
    if (!localFilter.trim()) {
      return roles;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return roles.filter((role) => {
      const name = (role.name || '').toLowerCase();
      const code = (role.code || '').toLowerCase();
      const description = (role.description || '').toLowerCase();
      
      return (
        name.includes(filterLower) ||
        code.includes(filterLower) ||
        description.includes(filterLower)
      );
    });
  }, [roles, localFilter]);

  const handleCreateRole = () => {
    setFormActions(null);
    setSelectedRoleId(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar rol
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditRole = (role: SecurityRole) => {
    setFormActions(null);
    setSelectedRoleId(role.id);
    setModalMode('edit');
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

  const handleDeleteRole = async (role: SecurityRole) => {
    if (role.isSystem) {
      alert.showError('No se pueden eliminar roles del sistema');
      return;
    }
    try {
      await RolesService.deleteRole(role.id);
      await loadRoles(filters);
      alert.showSuccess(t.security?.roles?.delete || 'Rol eliminado');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar rol');
    }
  };

  const columns: TableColumn<SecurityRole>[] = [
    {
      key: 'name',
      label: t.security?.roles?.name || 'Nombre',
      width: '23%',
    },
    {
      key: 'code',
      label: t.security?.roles?.code || 'Código',
      width: '18%',
    },
    {
      key: 'description',
      label: t.security?.roles?.description || 'Descripción',
      width: '26%',
    },
    {
      key: 'permissions',
      label: t.security?.roles?.permissions || 'Permisos',
      width: '8%',
      align: 'center',
      render: (role) => (
        <ThemedText type="body2" variant="secondary">
          {role.permissions?.length || 0}
        </ThemedText>
      ),
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '15%',
      align: 'center',
      render: (role) => (
        <StatusBadge 
          status={role.status} 
          statusDescription={role.statusDescription}
          size="small"
        />
      ),
    },
    {
      key: 'actions',
      label: t.common?.actions || 'Acciones',
      width: '18%',
      align: 'center',
      render: (role) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.roles?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditRole(role)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
          {!role.isSystem && (
            <Tooltip text={t.security?.roles?.deleteShort || 'Eliminar'} position="left">
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteRole(role)}
              >
                <Ionicons name="trash" size={18} color={colors.primary} />
              </TouchableOpacity>
            </Tooltip>
          )}
        </View>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: usersTranslations.status || 'Estado',
      type: 'select',
      options: [
        { key: 'all', value: '', label: commonTranslations.all || 'Todos' },
        { key: 'active', value: '1', label: usersTranslations.active || 'Activo' },
        { key: 'inactive', value: '0', label: usersTranslations.inactive || 'Inactivo' },
        { key: 'pending', value: '2', label: usersTranslations.pending || 'Pendiente' },
        { key: 'suspended', value: '3', label: usersTranslations.suspended || 'Suspendido' },
      ],
    },
    {
      key: 'deleted',
      label: usersTranslations.deletedFilter || 'Usuarios',
      type: 'select',
      options: [
        {
          key: 'deleted',
          value: 'deleted',
          label: usersTranslations.deletedUser || 'Eliminados',
        },
      ],
    },
    {
      key: 'isSystem',
      label: 'Sistema',
      type: 'boolean',
    },
  ];

  if (accessLoading) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={{ marginTop: 12 }}>{t.common?.loading || 'Cargando...'}</ThemedText>
      </ThemedView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h3" style={styles.title}>
              {t.security?.roles?.title || 'Administración de Roles'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.roles?.subtitle || 'Gestiona los roles del sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.roles?.create || 'Crear Rol')}
            onPress={handleCreateRole}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
          </Button>
        </View>

        {/* Barra de búsqueda y filtros */}
        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={handleLocalFilterChange}
          onSearchSubmit={handleSearchSubmit}
          filterPlaceholder={t.security?.roles?.filterPlaceholder || 'Filtrar por nombre o código...'}
          searchPlaceholder={t.security?.roles?.searchPlaceholder || 'Buscar por nombre o código...'}
          filters={filterConfigs}
          activeFilters={{
            status:
              filters.status !== undefined && filters.status !== -1
                ? filters.status.toString()
                : '',
            deleted: filters.status === -1 ? 'deleted' : '',
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
            emptyMessage="No hay roles disponibles"
            onRowPress={handleEditRole}
            keyExtractor={(role) => role.id}
            showPagination={true}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredRoles.length : pagination.total,
              totalPages: localFilter.trim() 
                ? Math.ceil(filteredRoles.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredRoles.length / pagination.limit)
                : pagination.hasNext,
              hasPrev: localFilter.trim()
                ? pagination.page > 1
                : pagination.hasPrev,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
              limitOptions: [10, 25, 50, 100],
            }}
          />
        </View>

        {/* Modal de creación/edición */}
        {modalMode && (
          <SideModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            title={
              modalMode === 'edit'
                ? t.security?.roles?.edit || 'Editar Rol'
                : t.security?.roles?.create || 'Crear Rol'
            }
            subtitle={
              modalMode === 'edit'
                ? 'Modifica los datos del rol'
                : 'Completa los datos para registrar un nuevo rol'
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
                      modalMode === 'edit'
                        ? t.common.save
                        : t.security?.roles?.create || 'Crear Rol'
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
            {modalMode === 'edit' && selectedRoleId ? (
              <RoleEditForm
                roleId={selectedRoleId}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
            {modalMode === 'create' ? (
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
      </View>
    </ThemedView>
  );
}

