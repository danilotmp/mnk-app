/**
 * Página principal de administración de Sucursales
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  BranchCreateForm,
  BranchEditForm,
  BranchFilters,
  BranchesService,
  SecurityBranch,
  useCompanyOptions,
} from '@/src/domains/security';
import { DataTable, TableColumn } from '@/src/domains/shared/components/data-table';
import { FilterConfig, SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createBranchesListStyles } from '@/src/styles/pages/branches-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function BranchesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const styles = createBranchesListStyles(isMobile);

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const { companies } = useCompanyOptions({ includeInactive: true });

  const [branches, setBranches] = useState<SecurityBranch[]>([]);
  const [localFilter, setLocalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<BranchFilters>({
    page: 1,
    limit: 10,
    search: '',
    companyId: undefined,
    type: undefined,
    isActive: undefined,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(
    null
  );
  const filtersSignatureRef = useRef<string>('');

  const loadBranches = useCallback(
    async (currentFilters: BranchFilters) => {
      if (loadingRef.current) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setHasError(false);

        const response = await BranchesService.getBranches(currentFilters);
        const items = Array.isArray(response.data) ? response.data : [];
        setBranches(items);

        if (response.meta) {
          setPagination({
            page: response.meta.page ?? currentFilters.page ?? 1,
            limit: response.meta.limit ?? currentFilters.limit ?? 10,
            total: response.meta.total ?? items.length,
            totalPages: response.meta.totalPages ?? 1,
            hasNext: response.meta.hasNext ?? false,
            hasPrev: response.meta.hasPrev ?? false,
          });
        } else {
          setPagination({
            page: currentFilters.page ?? 1,
            limit: currentFilters.limit ?? 10,
            total: items.length,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          });
        }
      } catch (error: any) {
        if (handleApiError(error)) {
          setHasError(true);
          return;
        }
        const message = error?.message || t.security?.branches?.loadError || 'Error al cargar sucursales';
        setHasError(true);
        alert.showError(message, false, undefined, (error as any)?.result?.details || '');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [alert, handleApiError, t.security?.branches?.loadError]
  );

  useEffect(() => {
    if (!isScreenFocused || !hasAccess || accessLoading || hasError) {
      return;
    }

    const signature = JSON.stringify(filters);
    if (filtersSignatureRef.current === signature) {
      return;
    }

    filtersSignatureRef.current = signature;
    loadBranches(filters);
  }, [accessLoading, filters, hasAccess, hasError, isScreenFocused, loadBranches]);

  const handleSearchSubmit = useCallback(
    (term: string) => {
      setLocalFilter(term);
      setFilters((prev) => ({
        ...prev,
        search: term,
        page: 1,
      }));
      setHasError(false);
    },
    []
  );

  const handleAdvancedFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
    setHasError(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      companyId: undefined,
      type: undefined,
      isActive: undefined,
    });
    setLocalFilter('');
    setHasError(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleLimitChange = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const filteredBranches = useMemo(() => {
    if (!localFilter.trim()) {
      return branches;
    }

    const term = localFilter.trim().toLowerCase();
    return branches.filter((branch) => {
      return (
        branch.code.toLowerCase().includes(term) ||
        branch.name.toLowerCase().includes(term) ||
        (branch.company?.name || '').toLowerCase().includes(term)
      );
    });
  }, [branches, localFilter]);

  const columns = useMemo<TableColumn<SecurityBranch>[]>(() => {
    return [
      {
        key: 'code',
        label: 'Código',
        width: 140,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.text }}>
            {item.code}
          </ThemedText>
        ),
      },
      {
        key: 'name',
        label: 'Nombre',
        minWidth: 200,
        render: (item) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ThemedText type="body2" style={{ color: colors.text, flexShrink: 1 }}>
              {item.name}
            </ThemedText>
            {!item.isActive ? (
              <View style={[styles.statusBadge, { backgroundColor: colors.border + '33' }]}>
                <ThemedText type="caption" variant="secondary">
                  {t.security?.branches?.inactive || 'Inactiva'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ),
      },
      {
        key: 'company',
        label: 'Empresa',
        minWidth: 200,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {item.company?.name || t.security?.branches?.unknownCompany || 'Sin empresa'}
          </ThemedText>
        ),
      },
      {
        key: 'type',
        label: 'Tipo',
        width: 140,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {t.security?.branches?.types?.[item.type || 'branch'] || item.type}
          </ThemedText>
        ),
      },
      {
        key: 'isActive',
        label: 'Estado',
        width: 120,
        align: 'center',
        render: (item) => (
          <ThemedText type="body2" style={{ color: item.isActive ? colors.success : colors.error }}>
            {item.isActive ? (t.security?.users?.active || 'Activa') : (t.security?.users?.inactive || 'Inactiva')}
          </ThemedText>
        ),
      },
    ];
  }, [colors.error, colors.success, colors.text, colors.textSecondary, styles.statusBadge, t.security?.branches?.inactive, t.security?.branches?.types, t.security?.branches?.unknownCompany, t.security?.users?.active, t.security?.users?.inactive]);

  const filterConfigs = useMemo<FilterConfig[]>(() => {
    return [
      {
        key: 'companyId',
        label: t.security?.branches?.filters?.company || 'Empresa',
        type: 'select',
        options: [
          { label: t.security?.branches?.filters?.allCompanies || 'Todas', value: undefined },
          ...companies.map((company) => ({ label: company.name, value: company.id })),
        ],
      },
      {
        key: 'type',
        label: t.security?.branches?.filters?.type || 'Tipo',
        type: 'select',
        options: [
          { label: t.security?.branches?.filters?.allTypes || 'Todos', value: undefined },
          { label: 'Casa matriz', value: 'headquarters' },
          { label: 'Sucursal', value: 'branch' },
          { label: 'Bodega', value: 'warehouse' },
          { label: 'Tienda', value: 'store' },
        ],
      },
      {
        key: 'isActive',
        label: t.security?.branches?.filters?.status || 'Estado',
        type: 'select',
        options: [
          { label: t.security?.branches?.filters?.allStatus || 'Todos', value: undefined },
          { label: t.security?.users?.active || 'Activas', value: true },
          { label: t.security?.users?.inactive || 'Inactivas', value: false },
        ],
      },
    ];
  }, [companies, t.security?.branches?.filters, t.security?.users?.active, t.security?.users?.inactive]);

  const handleCreateBranch = useCallback(() => {
    setFormActions(null);
    setSelectedBranchId(null);
    setModalMode('create');
    setIsModalVisible(true);
  }, []);

  const handleEditBranch = useCallback((branch: SecurityBranch) => {
    setFormActions(null);
    setSelectedBranchId(branch.id);
    setModalMode('edit');
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedBranchId(null);
    setFormActions(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadBranches(filters);
    handleCloseModal();
  }, [filters, handleCloseModal, loadBranches]);

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
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <ThemedText type="h3" style={styles.title}>
              {t.security?.branches?.title || 'Administración de Sucursales'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.branches?.subtitle || 'Gestiona las sucursales registradas en el sistema'}
            </ThemedText>
          </View>
          <View style={styles.actionsContainer}>
            <Tooltip
              content={t.security?.branches?.create || 'Crear sucursal'}
              placement="bottom"
              disabled={!isMobile}
            >
              <Button title={isMobile ? '' : (t.security?.branches?.create || 'Crear sucursal')} onPress={handleCreateBranch}>
                <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
              </Button>
            </Tooltip>
          </View>
        </View>

        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={setLocalFilter}
          onSearchSubmit={handleSearchSubmit}
          filterPlaceholder={t.security?.branches?.filterPlaceholder || 'Filtrar por código, nombre o empresa'}
          searchPlaceholder={t.security?.branches?.searchPlaceholder || 'Buscar sucursales'}
          filters={filterConfigs}
          activeFilters={{
            companyId: filters.companyId,
            type: filters.type,
            isActive: filters.isActive,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredBranches.length : undefined}
          totalCount={pagination.total}
        />

        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredBranches}
            columns={columns}
            loading={loading}
            emptyMessage={t.security?.branches?.empty || 'No hay sucursales registradas'}
            onRowPress={handleEditBranch}
            keyExtractor={(item) => item.id}
            showPagination
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredBranches.length : pagination.total,
              totalPages: localFilter.trim()
                ? Math.ceil(filteredBranches.length / pagination.limit) || 1
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredBranches.length / pagination.limit)
                : pagination.hasNext,
              hasPrev: pagination.hasPrev,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
              limitOptions: [10, 25, 50, 100],
            }}
          />
        </View>
      </View>

      {modalMode && (
        <SideModal
          visible={isModalVisible}
          onClose={handleCloseModal}
          title={
            modalMode === 'edit'
              ? t.security?.branches?.editTitle || 'Editar sucursal'
              : t.security?.branches?.createTitle || 'Crear sucursal'
          }
          subtitle={
            modalMode === 'edit'
              ? t.security?.branches?.editSubtitle || 'Actualiza la información de la sucursal seleccionada'
              : t.security?.branches?.createSubtitle || 'Completa la información para registrar una nueva sucursal'
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
                  title={modalMode === 'edit' ? t.common.save : t.security?.branches?.create || 'Crear sucursal'}
                  onPress={formActions.handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          {modalMode === 'edit' && selectedBranchId ? (
            <BranchEditForm
              branchId={selectedBranchId}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          ) : null}
          {modalMode === 'create' ? (
            <BranchCreateForm
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          ) : null}
        </SideModal>
      )}
    </ThemedView>
  );
}


