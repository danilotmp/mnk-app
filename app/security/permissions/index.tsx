/**
 * Página principal de administración de Permisos
 * Lista de permisos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService } from '@/src/domains/security';
import { PermissionCreateForm, PermissionEditForm } from '@/src/domains/security/components';
import { PermissionFilters, SecurityPermission } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionsListStyles } from '@/src/styles/pages/permissions-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export default function PermissionsListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createPermissionsListStyles(isMobile);

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(null);
  const [localFilter, setLocalFilter] = useState(''); // Filtro local para la tabla
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<PermissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    isActive: undefined,
    module: undefined,
    action: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');

  const loadPermissions = useCallback(async (currentFilters: PermissionFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await PermissionsService.getPermissions(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
        
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
        setPermissions([]);
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
        setHasError(true);
        return;
      }
      const errorMessage = error.message || t.security?.permissions?.loadError || 'Error al cargar permisos';
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
   * Efecto para cargar permisos cuando cambian los filtros
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
    loadPermissions(filters);
  }, [accessLoading, hasAccess, hasError, isScreenFocused, loadPermissions, filters]);

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
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      isActive: undefined,
      module: undefined,
      action: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar permisos localmente según el filtro local
   */
  const filteredPermissions = useMemo(() => {
    if (!localFilter.trim()) {
      return permissions;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return permissions.filter((permission) => {
      const name = (permission.name || '').toLowerCase();
      const code = (permission.code || '').toLowerCase();
      const module = (permission.module || '').toLowerCase();
      const action = (permission.action || '').toLowerCase();
      
      return (
        name.includes(filterLower) ||
        code.includes(filterLower) ||
        module.includes(filterLower) ||
        action.includes(filterLower)
      );
    });
  }, [permissions, localFilter]);

  const handleCreatePermission = () => {
    setFormActions(null);
    setSelectedPermissionId(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar permiso
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditPermission = (permission: SecurityPermission) => {
    setFormActions(null);
    setSelectedPermissionId(permission.id);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedPermissionId(null);
    setFormActions(null);
  };

  const handleFormSuccess = () => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadPermissions(filters);
    handleCloseModal();
  };

  const handleDeletePermission = async (permission: SecurityPermission) => {
    try {
      await PermissionsService.deletePermission(permission.id);
      await loadPermissions(filters);
      alert.showSuccess(t.security?.permissions?.delete || 'Permiso eliminado');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar permiso');
    }
  };

  const columns: TableColumn<SecurityPermission>[] = [
    {
      key: 'name',
      label: t.security?.permissions?.name || 'Nombre',
      width: '23%',
    },
    {
      key: 'code',
      label: t.security?.permissions?.code || 'Código',
      width: '18%',
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      width: '13%',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      width: '13%',
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '15%',
      align: 'center',
      render: (permission) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: permission.isActive
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: permission.isActive ? colors.success : colors.error,
            }}
          >
            {permission.isActive
              ? t.security?.users?.active || 'Activo'
              : t.security?.users?.inactive || 'Inactivo'}
          </ThemedText>
        </View>
      ),
    },
    {
      key: 'actions',
      label: t.common?.actions || 'Acciones',
      width: '18%',
      align: 'center',
      render: (permission) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.permissions?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPermission(permission)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text={t.security?.permissions?.deleteShort || 'Eliminar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePermission(permission)}
            >
              <Ionicons name="trash" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
        </View>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'isActive',
      label: t.security?.users?.status || 'Estado',
      type: 'boolean',
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      type: 'text',
      placeholder: 'Filtrar por módulo...',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      type: 'text',
      placeholder: 'Filtrar por acción...',
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
              {t.security?.permissions?.title || 'Administración de Permisos'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.permissions?.subtitle || 'Gestiona los permisos del sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.permissions?.create || 'Crear Permiso')}
            onPress={handleCreatePermission}
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
          filterPlaceholder={t.security?.permissions?.filterPlaceholder || 'Filtrar por nombre, código, módulo o acción...'}
          searchPlaceholder={t.security?.permissions?.searchPlaceholder || 'Buscar por nombre, código, módulo o acción...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
            module: filters.module,
            action: filters.action,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredPermissions.length : undefined}
          totalCount={pagination.total}
        />

        {/* Tabla de permisos con scroll interno */}
        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredPermissions}
            columns={columns}
            loading={loading}
            emptyMessage="No hay permisos disponibles"
            onRowPress={handleEditPermission}
            keyExtractor={(permission) => permission.id}
            showPagination={true}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredPermissions.length : pagination.total, // Si hay filtro local, usar total filtrado
              totalPages: localFilter.trim() 
                ? Math.ceil(filteredPermissions.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredPermissions.length / pagination.limit)
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
                ? t.security?.permissions?.edit || 'Editar Permiso'
                : t.security?.permissions?.create || 'Crear Permiso'
            }
            subtitle={
              modalMode === 'edit'
                ? 'Modifica los datos del permiso'
                : 'Completa los datos del nuevo permiso'
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
                        : t.security?.permissions?.create || 'Crear Permiso'
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
            {modalMode === 'edit' && selectedPermissionId ? (
              <PermissionEditForm
                permissionId={selectedPermissionId}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
            {modalMode === 'create' ? (
              <PermissionCreateForm
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

