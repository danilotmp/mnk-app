/**
 * Página principal de administración de Roles
 * Lista de roles con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { RolesService } from '@/src/domains/security';
import { RoleFilters, SecurityRole } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createRolesListStyles } from '@/src/styles/pages/roles-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function RolesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const styles = createRolesListStyles();

  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<RoleFilters>({
    page: 1,
    limit: 10,
    search: '',
    isActive: undefined,
    isSystem: undefined,
  });

  /**
   * Cargar roles
   */
  const loadRoles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await RolesService.getRoles(filters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setRoles(Array.isArray(response.data) ? response.data : []);
        
        if (response.pagination) {
          setPagination({
            page: response.pagination.page || filters.page || 1,
            limit: response.pagination.limit || filters.limit || 10,
            total: response.pagination.total || 0,
            totalPages: response.pagination.totalPages || 0,
          });
        } else {
          setPagination({
            page: filters.page || 1,
            limit: filters.limit || 10,
            total: Array.isArray(response.data) ? response.data.length : 0,
            totalPages: 1,
          });
        }
      } else {
        setRoles([]);
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (error: any) {
      alert.showError(error.message || t.security?.roles?.loadError || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  }, [filters, alert, t]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleSearchChange = (search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  };

  const handleFilterChange = (key: string, value: any) => {
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
  };

  const handleCreateRole = () => {
    router.push('/security/roles/create' as any);
  };

  const handleEditRole = (role: SecurityRole) => {
    router.push(`/security/roles/${role.id}` as any);
  };

  const handleDeleteRole = async (role: SecurityRole) => {
    if (role.isSystem) {
      alert.showError('No se pueden eliminar roles del sistema');
      return;
    }
    try {
      await RolesService.deleteRole(role.id);
      await loadRoles();
      alert.showSuccess(t.security?.roles?.delete || 'Rol eliminado');
    } catch (error: any) {
      alert.showError(error.message || 'Error al eliminar rol');
    }
  };

  const columns: TableColumn<SecurityRole>[] = [
    {
      key: 'name',
      label: t.security?.roles?.name || 'Nombre',
      width: '25%',
    },
    {
      key: 'code',
      label: t.security?.roles?.code || 'Código',
      width: '20%',
    },
    {
      key: 'description',
      label: t.security?.roles?.description || 'Descripción',
      width: '30%',
    },
    {
      key: 'permissions',
      label: t.security?.roles?.permissions || 'Permisos',
      width: '10%',
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
      width: '10%',
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
      width: '5%',
      align: 'center',
      render: (role) => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditRole(role)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          {!role.isSystem && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteRole(role)}
            >
              <Ionicons name="trash" size={18} color={colors.error} />
            </TouchableOpacity>
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h1" style={styles.title}>
              {t.security?.roles?.title || 'Administración de Roles'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.roles?.subtitle || 'Gestiona los roles del sistema'}
            </ThemedText>
          </View>
          <Button
            title={t.security?.roles?.create || 'Crear Rol'}
            onPress={handleCreateRole}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          </Button>
        </View>

        <SearchFilterBar
          searchValue={filters.search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={t.security?.roles?.searchPlaceholder || 'Buscar por nombre o código...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
            isSystem: filters.isSystem,
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <DataTable
          data={roles}
          columns={columns}
          loading={loading}
          emptyMessage="No hay roles disponibles"
          onRowPress={handleEditRole}
          keyExtractor={(role) => role.id}
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

