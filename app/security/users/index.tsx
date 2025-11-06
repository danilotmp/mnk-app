/**
 * Página principal de administración de Usuarios
 * Lista de usuarios con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { UsersService } from '@/src/domains/security';
import { UserEditForm } from '@/src/domains/security/components/user-edit-form';
import { SecurityUser, UserFilters } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createUsersListStyles } from '@/src/styles/pages/users-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';

export default function UsersListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { currentCompany: company } = useMultiCompany();
  const { isMobile } = useResponsive();
  const styles = createUsersListStyles(isMobile);

  /**
   * Validar si un string es un UUID válido
   */
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
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
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    isActive: undefined,
    companyId: company?.id && isValidUUID(company.id) ? company.id : undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);

  /**
   * Cargar usuarios
   */
  const loadUsers = useCallback(async (currentFilters: UserFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      setHasError(false);
      
      const response = await UsersService.getUsers(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
        
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
          // Si no hay meta en la respuesta, usar valores por defecto
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
        setUsers([]);
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
      const errorMessage = error.message || t.security?.users?.loadError || 'Error al cargar usuarios';
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
   * Efecto para actualizar companyId cuando cambia la empresa
   */
  useEffect(() => {
    if (company?.id && isValidUUID(company.id)) {
      setFilters((prev) => ({
        ...prev,
        companyId: company.id,
      }));
    } else {
      // Si no hay empresa válida, remover el filtro companyId
      setFilters((prev) => {
        const { companyId, ...rest } = prev;
        return rest;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  /**
   * Efecto para cargar usuarios cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   */
  useEffect(() => {
    // Resetear el flag de error cuando cambian los filtros para permitir un nuevo intento
    setHasError(false);
    loadUsers(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.search, filters.isActive, filters.companyId]);

  /**
   * Manejar cambio de página
   */
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  /**
   * Manejar cambio de límite
   */
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

  /**
   * Limpiar filtros
   */
  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      isActive: undefined,
      companyId: company?.id && isValidUUID(company.id) ? company.id : undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
  };

  /**
   * Filtrar usuarios localmente según el filtro local
   */
  const filteredUsers = useMemo(() => {
    if (!localFilter.trim()) {
      return users;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return users.filter((user) => {
      const email = (user.email || '').toLowerCase();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      
      return (
        email.includes(filterLower) ||
        firstName.includes(filterLower) ||
        lastName.includes(filterLower) ||
        `${firstName} ${lastName}`.includes(filterLower)
      );
    });
  }, [users, localFilter]);

  /**
   * Navegar a crear usuario
   */
  const handleCreateUser = () => {
    router.push('/security/users/create' as any);
  };

  /**
   * Navegar a editar usuario
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditUser = (user: SecurityUser) => {
    setEditingUserId(user.id);
    setEditModalVisible(true);
  };

  /**
   * Cerrar modal de edición
   */
  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setEditingUserId(null);
    setFormActions(null); // Resetear acciones del formulario
  };

  /**
   * Manejar éxito al editar usuario
   */
  const handleEditSuccess = () => {
    loadUsers(filters);
    handleCloseEditModal();
  };

  /**
   * Manejar activar/desactivar usuario
   */
  const handleToggleStatus = async (user: SecurityUser) => {
    try {
      await UsersService.toggleUserStatus(user.id, !user.isActive);
      loadUsers(filters);
      alert.showSuccess(
        user.isActive
          ? t.security?.users?.deactivated || 'Usuario desactivado'
          : t.security?.users?.activated || 'Usuario activado'
      );
    } catch (error: any) {
      alert.showError(error.message || 'Error al cambiar estado del usuario');
    }
  };

  /**
   * Manejar eliminar usuario
   */
  const handleDeleteUser = async (user: SecurityUser) => {
    try {
      await UsersService.deleteUser(user.id);
      loadUsers(filters);
      alert.showSuccess(t.security?.users?.deleted || 'Usuario eliminado');
    } catch (error: any) {
      alert.showError(error.message || 'Error al eliminar usuario');
    }
  };

  /**
   * Columnas de la tabla
   */
  const columns: TableColumn<SecurityUser>[] = [
    {
      key: 'email',
      label: t.security?.users?.email || 'Email',
      width: '23%',
    },
    {
      key: 'name',
      label: t.security?.users?.name || 'Nombre',
      width: '18%',
      render: (user) => (
        <ThemedText type="body2">
          {user.firstName} {user.lastName}
        </ThemedText>
      ),
    },
    {
      key: 'phone',
      label: t.security?.users?.phone || 'Teléfono',
      width: '13%',
    },
    {
      key: 'role',
      label: t.security?.users?.role || 'Rol',
      width: '13%',
      render: (user) => (
        <ThemedText type="body2" variant="secondary">
          {user.roleId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '15%',
      align: 'center',
      render: (user) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: user.isActive
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: user.isActive ? colors.success : colors.error,
            }}
          >
            {user.isActive
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
      render: (user) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.users?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditUser(user)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip
            text={
              user.isActive
                ? t.security?.users?.deactivateShort || 'Desactivar'
                : t.security?.users?.activateShort || 'Activar'
            }
            position="left"
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleToggleStatus(user)}
            >
              <Ionicons
                name={user.isActive ? 'eye-off' : 'eye'}
                size={18}
                color={colors.primary}
              />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text={t.security?.users?.deleteShort || 'Eliminar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteUser(user)}
            >
              <Ionicons name="trash" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
        </View>
      ),
    },
  ];

  /**
   * Filtros disponibles
   */
  const filterConfigs: FilterConfig[] = [
    {
      key: 'isActive',
      label: t.security?.users?.status || 'Estado',
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
              {t.security?.users?.title || 'Administración de Usuarios'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.users?.subtitle || 'Gestiona los usuarios del sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.users?.create || 'Crear Usuario')}
            onPress={handleCreateUser}
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
          filterPlaceholder={t.security?.users?.filterPlaceholder || 'Filtrar por email o nombre...'}
          searchPlaceholder={t.security?.users?.searchPlaceholder || 'Buscar por email o nombre...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredUsers.length : undefined}
          totalCount={pagination.total}
        />

        {/* Tabla de usuarios con scroll interno */}
        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredUsers}
            columns={columns}
            loading={loading}
            emptyMessage={t.security?.users?.empty || 'No hay usuarios disponibles'}
            onRowPress={handleEditUser}
            keyExtractor={(user) => user.id}
            showPagination={true}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredUsers.length : pagination.total,
              totalPages: localFilter.trim() 
                ? Math.ceil(filteredUsers.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredUsers.length / pagination.limit)
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
        {editingUserId && (
          <SideModal
            visible={editModalVisible}
            onClose={handleCloseEditModal}
            title={t.security?.users?.edit || 'Editar Usuario'}
            subtitle="Modifica los datos del usuario"
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
            <UserEditForm
              userId={editingUserId}
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

