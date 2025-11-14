/**
 * Página principal de administración de Empresas
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import {
  CompanyCreateForm,
  CompanyEditForm,
  CompaniesService,
  SecurityCompany,
  CompanyFilters,
} from '@/src/domains/security';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
import type { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createCompaniesListStyles } from '@/src/styles/pages/companies-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function CompaniesListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const pathname = usePathname();
  const { isMobile } = useResponsive();
  const styles = createCompaniesListStyles(isMobile);

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [companies, setCompanies] = useState<SecurityCompany[]>([]);
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
  const [filters, setFilters] = useState<CompanyFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    code: undefined,
    name: undefined,
    email: undefined,
  });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(
    null
  );
  const filtersSignatureRef = useRef<string>('');

  const loadCompanies = useCallback(
    async (currentFilters: CompanyFilters) => {
      if (loadingRef.current) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        setHasError(false);

        const response = await CompaniesService.getCompanies(currentFilters);
        const items = Array.isArray(response.data) ? response.data : [];
        setCompanies(items);

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
        const message = error?.message || t.security?.companies?.loadError || 'Error al cargar empresas';
        setHasError(true);
        alert.showError(message, false, undefined, (error as any)?.result?.details || '');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [alert, handleApiError, t.security?.companies?.loadError]
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
    loadCompanies(filters);
  }, [accessLoading, filters, hasAccess, hasError, isScreenFocused, loadCompanies]);

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
      isActive: undefined,
      code: undefined,
      name: undefined,
      email: undefined,
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

  const filteredCompanies = useMemo(() => {
    if (!localFilter.trim()) {
      return companies;
    }

    const term = localFilter.trim().toLowerCase();
    return companies.filter((company) => {
      return (
        company.code.toLowerCase().includes(term) ||
        company.name.toLowerCase().includes(term) ||
        (company.email || '').toLowerCase().includes(term)
      );
    });
  }, [companies, localFilter]);

  const columns = useMemo<TableColumn<SecurityCompany>[]>(() => {
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
                  {t.security?.companies?.inactive || 'Inactiva'}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ),
      },
      {
        key: 'email',
        label: 'Email',
        minWidth: 220,
        render: (item) => (
          <ThemedText type="body2" style={{ color: colors.textSecondary }}>
            {item.email}
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
  }, [colors.error, colors.success, colors.text, colors.textSecondary, t.security?.companies?.inactive, t.security?.users?.active, t.security?.users?.inactive]);

  const filterConfigs = useMemo<FilterConfig[]>(() => {
    return [
      {
        key: 'isActive',
        label: t.security?.companies?.filters?.status || 'Estado',
        type: 'select',
        options: [
          { label: t.security?.companies?.filters?.all || 'Todas', value: undefined },
          { label: t.security?.users?.active || 'Activas', value: true },
          { label: t.security?.users?.inactive || 'Inactivas', value: false },
        ],
      },
    ];
  }, [t.security?.companies?.filters?.all, t.security?.companies?.filters?.status, t.security?.users?.active, t.security?.users?.inactive]);

  const handleCreateCompany = useCallback(() => {
    setFormActions(null);
    setSelectedCompanyId(null);
    setModalMode('create');
    setIsModalVisible(true);
  }, []);

  const handleEditCompany = useCallback((company: SecurityCompany) => {
    setFormActions(null);
    setSelectedCompanyId(company.id);
    setModalMode('edit');
    setIsModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedCompanyId(null);
    setFormActions(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadCompanies(filters);
    handleCloseModal();
  }, [filters, handleCloseModal, loadCompanies]);

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
              {t.security?.companies?.title || 'Administración de Empresas'}
            </ThemedText>
            <ThemedText type="body2" variant="secondary">
              {t.security?.companies?.subtitle || 'Gestiona las empresas registradas en el sistema'}
            </ThemedText>
          </View>
          <View style={styles.actionsContainer}>
            <Tooltip
              content={t.security?.companies?.create || 'Crear empresa'}
              placement="bottom"
              disabled={!isMobile}
            >
              <Button title={isMobile ? '' : (t.security?.companies?.create || 'Crear empresa')} onPress={handleCreateCompany}>
                <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
              </Button>
            </Tooltip>
          </View>
        </View>

        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={setLocalFilter}
          onSearchSubmit={handleSearchSubmit}
          filterPlaceholder={t.security?.companies?.filterPlaceholder || 'Filtrar por código, nombre o email'}
          searchPlaceholder={t.security?.companies?.searchPlaceholder || 'Buscar empresas'}
          filters={filterConfigs}
          activeFilters={{
            isActive: filters.isActive,
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredCompanies.length : undefined}
          totalCount={pagination.total}
        />

        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredCompanies}
            columns={columns}
            loading={loading}
            emptyMessage={t.security?.companies?.empty || 'No hay empresas registradas'}
            onRowPress={handleEditCompany}
            keyExtractor={(item) => item.id}
            showPagination
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredCompanies.length : pagination.total,
              totalPages: localFilter.trim()
                ? Math.ceil(filteredCompanies.length / pagination.limit) || 1
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredCompanies.length / pagination.limit)
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
              ? t.security?.companies?.editTitle || 'Editar empresa'
              : t.security?.companies?.createTitle || 'Crear empresa'
          }
          subtitle={
            modalMode === 'edit'
              ? t.security?.companies?.editSubtitle || 'Actualiza la información de la empresa seleccionada'
              : t.security?.companies?.createSubtitle || 'Completa la información para registrar una nueva empresa'
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
                  title={modalMode === 'edit' ? t.common.save : t.security?.companies?.create || 'Crear empresa'}
                  onPress={formActions.handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          {modalMode === 'edit' && selectedCompanyId ? (
            <CompanyEditForm
              companyId={selectedCompanyId}
              onSuccess={handleFormSuccess}
              onCancel={handleCloseModal}
              showHeader={false}
              showFooter={false}
              onFormReady={setFormActions}
            />
          ) : null}
          {modalMode === 'create' ? (
            <CompanyCreateForm
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


