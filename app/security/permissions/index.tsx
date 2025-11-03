/**
 * Página principal de administración de Permisos
 * Lista de permisos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService } from '@/src/domains/security';
import { PermissionFilters, SecurityPermission } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionsListStyles } from '@/src/styles/pages/permissions-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function PermissionsListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const styles = createPermissionsListStyles();

  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<PermissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    isActive: undefined,
    module: undefined,
    action: undefined,
  });

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PermissionsService.getPermissions(filters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
        
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
        setPermissions([]);
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (error: any) {
      alert.showError(error.message || t.security?.permissions?.loadError || 'Error al cargar permisos');
    } finally {
      setLoading(false);
    }
  }, [filters, alert, t]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

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
      module: undefined,
      action: undefined,
    });
  };

  const handleCreatePermission = () => {
    router.push('/security/permissions/create' as any);
  };

  const handleEditPermission = (permission: SecurityPermission) => {
    router.push(`/security/permissions/${permission.id}` as any);
  };

  const handleDeletePermission = async (permission: SecurityPermission) => {
    try {
      await PermissionsService.deletePermission(permission.id);
      await loadPermissions();
      alert.showSuccess(t.security?.permissions?.delete || 'Permiso eliminado');
    } catch (error: any) {
      alert.showError(error.message || 'Error al eliminar permiso');
    }
  };

  const columns: TableColumn<SecurityPermission>[] = [
    {
      key: 'name',
      label: t.security?.permissions?.name || 'Nombre',
      width: '25%',
    },
    {
      key: 'code',
      label: t.security?.permissions?.code || 'Código',
      width: '20%',
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      width: '15%',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      width: '15%',
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '10%',
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
      width: '15%',
      align: 'center',
      render: (permission) => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPermission(permission)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePermission(permission)}
          >
            <Ionicons name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h1" style={styles.title}>
              {t.security?.permissions?.title || 'Administración de Permisos'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.permissions?.subtitle || 'Gestiona los permisos del sistema'}
            </ThemedText>
          </View>
          <Button
            title={t.security?.permissions?.create || 'Crear Permiso'}
            onPress={handleCreatePermission}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          </Button>
        </View>

        <SearchFilterBar
          searchValue={filters.search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={t.security?.permissions?.searchPlaceholder || 'Buscar por nombre, código, módulo o acción...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
            module: filters.module,
            action: filters.action,
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <DataTable
          data={permissions}
          columns={columns}
          loading={loading}
          emptyMessage="No hay permisos disponibles"
          onRowPress={handleEditPermission}
          keyExtractor={(permission) => permission.id}
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

