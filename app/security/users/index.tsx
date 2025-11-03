/**
 * Página principal de administración de Usuarios
 * Lista de usuarios con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { UsersService } from '@/src/domains/security';
import { SecurityUser, UserFilters } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useMultiCompany } from '@/src/domains/shared/hooks';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createUsersListStyles } from '@/src/styles/pages/users-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function UsersListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const { company } = useMultiCompany();
  const styles = createUsersListStyles();

  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 10,
    search: '',
    isActive: undefined,
    companyId: company?.id,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);

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
        
        // Asegurar que pagination exista con valores por defecto
        if (response.pagination) {
          setPagination({
            page: response.pagination.page || currentFilters.page || 1,
            limit: response.pagination.limit || currentFilters.limit || 10,
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 0,
          });
        } else {
          // Si no hay paginación en la respuesta, usar valores por defecto
          setPagination({
            page: currentFilters.page || 1,
            limit: currentFilters.limit || 10,
            total: Array.isArray(response.data) ? response.data.length : 0,
            totalPages: 1,
          });
        }
      } else {
        setUsers([]);
        setPagination({
          page: currentFilters.page || 1,
          limit: currentFilters.limit || 10,
          total: 0,
          totalPages: 0,
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
   * Manejar búsqueda
   */
  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  /**
   * Manejar cambio de filtro
   */
  const handleFilterChange = (key: string, value: any) => {
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
      companyId: company?.id,
    });
  };

  /**
   * Navegar a crear usuario
   */
  const handleCreateUser = () => {
    router.push('/security/users/create' as any);
  };

  /**
   * Navegar a editar usuario
   */
  const handleEditUser = (user: SecurityUser) => {
    router.push(`/security/users/${user.id}` as any);
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
      width: '25%',
    },
    {
      key: 'name',
      label: t.security?.users?.name || 'Nombre',
      width: '20%',
      render: (user) => (
        <ThemedText type="body2">
          {user.firstName} {user.lastName}
        </ThemedText>
      ),
    },
    {
      key: 'phone',
      label: t.security?.users?.phone || 'Teléfono',
      width: '15%',
    },
    {
      key: 'role',
      label: t.security?.users?.role || 'Rol',
      width: '15%',
      render: (user) => (
        <ThemedText type="body2" variant="secondary">
          {user.roleId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '10%',
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
      width: '15%',
      align: 'center',
      render: (user) => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditUser(user)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleStatus(user)}
          >
            <Ionicons
              name={user.isActive ? 'eye-off' : 'eye'}
              size={18}
              color={user.isActive ? colors.warning : colors.success}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteUser(user)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h1" style={styles.title}>
              {t.security?.users?.title || 'Administración de Usuarios'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.users?.subtitle || 'Gestiona los usuarios del sistema'}
            </ThemedText>
          </View>
          <Button
            title={t.security?.users?.create || 'Crear Usuario'}
            onPress={handleCreateUser}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          </Button>
        </View>

        {/* Barra de búsqueda y filtros */}
        <SearchFilterBar
          searchValue={filters.search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={t.security?.users?.searchPlaceholder || 'Buscar por email o nombre...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tabla de usuarios */}
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          emptyMessage={t.security?.users?.empty || 'No hay usuarios disponibles'}
          onRowPress={handleEditUser}
          keyExtractor={(user) => user.id}
          showPagination={true}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            totalPages: pagination.totalPages,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange,
            limitOptions: [10, 25, 50, 100],
          }}
        />
      </ScrollView>
    </ThemedView>
  );
}

