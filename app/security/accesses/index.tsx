/**
 * Página principal de administración de Accesos
 * Lista de accesos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { AccessesService } from '@/src/domains/security';
import { AccessFilters, SecurityAccess } from '@/src/domains/security/types';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createAccessesListStyles } from '@/src/styles/pages/accesses-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export default function AccessesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createAccessesListStyles(isMobile);

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [accesses, setAccesses] = useState<SecurityAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [localFilter, setLocalFilter] = useState(''); // Filtro local para la tabla
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
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');

  const loadAccesses = useCallback(async (currentFilters: AccessFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      setHasError(false);
      
      const response = await AccessesService.getAccesses(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setAccesses(Array.isArray(response.data) ? response.data : []);
        
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
        setAccesses([]);
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
      const errorMessage = error.message || t.security?.accesses?.loadError || 'Error al cargar accesos';
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
   * Efecto para cargar accesos cuando cambian los filtros
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
    loadAccesses(filters);
  }, [accessLoading, hasAccess, hasError, isScreenFocused, loadAccesses, filters]);

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
      userId: undefined,
      companyId: undefined,
      branchId: undefined,
      roleId: undefined,
      isActive: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar accesos localmente según el filtro local
   */
  const filteredAccesses = useMemo(() => {
    if (!localFilter.trim()) {
      return accesses;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return accesses.filter((access) => {
      const userId = (access.userId || '').toLowerCase();
      const companyId = (access.companyId || '').toLowerCase();
      const branchId = (access.branchId || '').toLowerCase();
      const roleId = (access.roleId || '').toLowerCase();
      
      return (
        userId.includes(filterLower) ||
        companyId.includes(filterLower) ||
        branchId.includes(filterLower) ||
        roleId.includes(filterLower)
      );
    });
  }, [accesses, localFilter]);

  const handleCreateAccess = () => {
    router.push('/security/accesses/create' as any);
  };

  const handleEditAccess = (access: SecurityAccess) => {
    router.push(`/security/accesses/${access.id}` as any);
  };

  const handleDeleteAccess = async (access: SecurityAccess) => {
    try {
      await AccessesService.deleteAccess(access.id);
      await loadAccesses(filters);
      alert.showSuccess(t.security?.accesses?.delete || 'Acceso eliminado');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar acceso');
    }
  };

  const columns: TableColumn<SecurityAccess>[] = [
    {
      key: 'user',
      label: t.security?.accesses?.user || 'Usuario',
      width: '18%',
      render: (access) => (
        <ThemedText type="body2">
          {access.userId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'company',
      label: t.security?.accesses?.company || 'Empresa',
      width: '18%',
      render: (access) => (
        <ThemedText type="body2">
          {access.companyId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'branch',
      label: t.security?.accesses?.branch || 'Sucursal',
      width: '13%',
      render: (access) => (
        <ThemedText type="body2" variant="secondary">
          {access.branchId || 'Todas'}
        </ThemedText>
      ),
    },
    {
      key: 'role',
      label: t.security?.accesses?.role || 'Rol',
      width: '13%',
      render: (access) => (
        <ThemedText type="body2" variant="secondary">
          {access.roleId || '-'}
        </ThemedText>
      ),
    },
    {
      key: 'permissions',
      label: t.security?.accesses?.permissions || 'Permisos',
      width: '8%',
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
      width: '15%',
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
      width: '18%',
      align: 'center',
      render: (access) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.accesses?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditAccess(access)}
            >
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text={t.security?.accesses?.deleteShort || 'Eliminar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteAccess(access)}
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
              {t.security?.accesses?.title || 'Administración de Accesos'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.accesses?.subtitle || 'Gestiona los accesos de usuarios'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.accesses?.create || 'Crear Acceso')}
            onPress={handleCreateAccess}
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
          filterPlaceholder={t.security?.accesses?.filterPlaceholder || 'Filtrar por usuario, empresa o sucursal...'}
          searchPlaceholder={t.security?.accesses?.searchPlaceholder || 'Buscar por usuario, empresa o sucursal...'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredAccesses.length : undefined}
          totalCount={pagination.total}
        />

        {/* Tabla de accesos con scroll interno */}
        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredAccesses}
            columns={columns}
            loading={loading}
            emptyMessage="No hay accesos disponibles"
            onRowPress={handleEditAccess}
            keyExtractor={(access) => access.id}
            showPagination={true}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredAccesses.length : pagination.total,
              totalPages: localFilter.trim() 
                ? Math.ceil(filteredAccesses.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredAccesses.length / pagination.limit)
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
      </View>
    </ThemedView>
  );
}

