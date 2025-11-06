/**
 * Página principal de administración de Roles
 * Lista de roles con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { RolesService } from '@/src/domains/security';
import { RoleEditForm } from '@/src/domains/security/components/role-edit-form';
import { RoleFilters, SecurityRole } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createRolesListStyles } from '@/src/styles/pages/roles-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function RolesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createRolesListStyles(isMobile);

  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
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
    isActive: undefined,
    isSystem: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);

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
      const errorMessage = error.message || t.security?.roles?.loadError || 'Error al cargar roles';
      setError(errorMessage);
      setHasError(true);
      // Mostrar error con detalles
      alert.showError(errorMessage, error.details || error.response?.result?.details);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [alert, t]);

  /**
   * Efecto para cargar roles cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   */
  useEffect(() => {
    // Resetear el flag de error cuando cambian los filtros para permitir un nuevo intento
    setHasError(false);
    loadRoles(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.search, filters.isActive, filters.isSystem]);

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
  }, []);

  /**
   * Manejar búsqueda API (consulta al backend)
   */
  const handleSearchSubmit = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  /**
   * Manejar cambio de filtros avanzados (consulta API)
   */
  const handleAdvancedFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      isActive: undefined,
      isSystem: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
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
    router.push('/security/roles/create' as any);
  };

  /**
   * Navegar a editar rol
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditRole = (role: SecurityRole) => {
    setEditingRoleId(role.id);
    setEditModalVisible(true);
  };

  /**
   * Cerrar modal de edición
   */
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingRoleId(null);
    setFormActions(null); // Resetear acciones del formulario
  };

  /**
   * Manejar éxito al editar rol
   */
  const handleEditSuccess = () => {
    loadRoles(filters);
    handleCloseEditModal();
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
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: role.isActive
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: role.isActive ? colors.success : colors.error,
            }}
          >
            {role.isActive
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
      key: 'isActive',
      label: t.security?.users?.status || 'Estado',
      type: 'boolean',
    },
    {
      key: 'isSystem',
      label: 'Sistema',
      type: 'boolean',
    },
  ];

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
            isActive: filters.isActive,
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

        {/* Modal de edición */}
        {editingRoleId && (
          <SideModal
            visible={editModalVisible}
            onClose={handleCloseEditModal}
            title={t.security?.roles?.edit || 'Editar Rol'}
            subtitle="Modifica los datos del rol"
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
                    title={t.common.save}
                    onPress={formActions.handleSubmit}
                    variant="primary"
                    size="md"
                    disabled={formActions.isLoading}
                  />
                </>
              ) : null
            }
          >
            <RoleEditForm
              roleId={editingRoleId}
              onSuccess={handleEditSuccess}
              onCancel={handleCloseEditModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          </SideModal>
        )}
      </View>
    </ThemedView>
  );
}

