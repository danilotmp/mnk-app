/**
 * Página principal de administración de Accesos
 * Lista de accesos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { AccessesService } from '@/src/domains/security';
import { AccessFilters, SecurityAccess } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createAccessesListStyles } from '@/src/styles/pages/accesses-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';

export default function AccessesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const alert = useAlert();
  const styles = createAccessesListStyles();

  const [accesses, setAccesses] = useState<SecurityAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AccessFilters>({
    page: 1,
    limit: 10,
    search: '',
    userId: undefined,
    companyId: undefined,
    branchId: undefined,
    roleId: undefined,
    isActive: undefined,
  });

  const loadAccesses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AccessesService.getAccesses(filters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setAccesses(Array.isArray(response.data) ? response.data : []);
        
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
        setAccesses([]);
        setPagination({
          page: filters.page || 1,
          limit: filters.limit || 10,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (error: any) {
      alert.showError(error.message || t.security?.accesses?.loadError || 'Error al cargar accesos');
    } finally {
      setLoading(false);
    }
  }, [filters, alert, t]);

  useEffect(() => {
    loadAccesses();
  }, [loadAccesses]);

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
      userId: undefined,
      companyId: undefined,
      branchId: undefined,
      roleId: undefined,
      isActive: undefined,
    });
  };

  const handleCreateAccess = () => {
    router.push('/security/accesses/create' as any);
  };

  const handleEditAccess = (access: SecurityAccess) => {
    router.push(`/security/accesses/${access.id}` as any);
  };

  const handleDeleteAccess = async (access: SecurityAccess) => {
    try {
      await AccessesService.deleteAccess(access.id);
      await loadAccesses();
      alert.showSuccess(t.security?.accesses?.delete || 'Acceso eliminado');
    } catch (error: any) {
      alert.showError(error.message || 'Error al eliminar acceso');
    }
  };

  const columns: TableColumn<SecurityAccess>[] = [
    {
      key: 'user',
      label: t.security?.accesses?.user || 'Usuario',
      width: '20%',
      render: (access) => (
        <ThemedText type="body2">
          {access.userId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'company',
      label: t.security?.accesses?.company || 'Empresa',
      width: '20%',
      render: (access) => (
        <ThemedText type="body2">
          {access.companyId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'branch',
      label: t.security?.accesses?.branch || 'Sucursal',
      width: '15%',
      render: (access) => (
        <ThemedText type="body2" variant="secondary">
          {access.branchId || 'Todas'}
        </ThemedText>
      ),
    },
    {
      key: 'role',
      label: t.security?.accesses?.role || 'Rol',
      width: '15%',
      render: (access) => (
        <ThemedText type="body2" variant="secondary">
          {access.roleId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'permissions',
      label: t.security?.accesses?.permissions || 'Permisos',
      width: '10%',
      align: 'center',
      render: (access) => (
        <ThemedText type="body2" variant="secondary">
          {access.permissions?.length || 0}
        </ThemedText>
      ),
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '10%',
      align: 'center',
      render: (access) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: access.isActive
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: access.isActive ? colors.success : colors.error,
            }}
          >
            {access.isActive
              ? t.security?.users?.active || 'Activo'
              : t.security?.users?.inactive || 'Inactivo'}
          </ThemedText>
        </View>
      ),
    },
    {
      key: 'actions',
      label: t.common?.actions || 'Acciones',
      width: '10%',
      align: 'center',
      render: (access) => (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditAccess(access)}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteAccess(access)}
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
              {t.security?.accesses?.title || 'Administración de Accesos'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.accesses?.subtitle || 'Gestiona los accesos de usuarios'}
            </ThemedText>
          </View>
          <Button
            title={t.security?.accesses?.create || 'Crear Acceso'}
            onPress={handleCreateAccess}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          </Button>
        </View>

        <SearchFilterBar
          searchValue={filters.search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={t.security?.accesses?.searchPlaceholder || 'Buscar por usuario, empresa o sucursal...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
          }}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        <DataTable
          data={accesses}
          columns={columns}
          loading={loading}
          emptyMessage="No hay accesos disponibles"
          onRowPress={handleEditAccess}
          keyExtractor={(access) => access.id}
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

