/**
 * Página principal de administración de Empresas
 * Lista de empresas con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { CompaniesService, CompanyCreateForm, CompanyEditForm } from '@/src/features/security/companies';
import { Company, CompanyFilters } from '@/src/features/security/companies/types/domain';
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

export function CompaniesListScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createCompaniesListStyles(isMobile);
  const usersTranslations = (t.security?.users as any) || {};
  const commonTranslations = (t.common as any) || {};

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
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
  const [filters, setFilters] = useState<CompanyFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    code: undefined,
    name: undefined,
    email: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');
  const loadCompaniesRef = useRef<(filters: CompanyFilters) => Promise<void>>();

  /**
   * Cargar empresas
   */
  const loadCompanies = useCallback(async (currentFilters: CompanyFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      setHasError(false);
      
      const response = await CompaniesService.getCompanies(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setCompanies(Array.isArray(response.data) ? response.data : []);
        
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
        setCompanies([]);
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
      // Si handleApiError retorna true, significa que el error fue manejado (401, 403, etc.)
      // En este caso, establecer hasError para evitar loops infinitos
      if (handleApiError(error)) {
        setHasError(true);
        return;
      }
      const errorMessage = error.message || t.security?.companies?.loadError || 'Error al cargar empresas';
      setError(errorMessage);
      setHasError(true);
      // Mostrar error con detalles
      alert.showError(errorMessage, error.details || error.response?.result?.details);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [alert, handleApiError, t]);

  // Actualizar ref para evitar re-renders
  loadCompaniesRef.current = loadCompanies;

  /**
   * Memoizar la signature de los filtros para evitar llamadas duplicadas
   * Usar valores específicos en lugar del objeto completo para estabilizar la dependencia
   */
  const filtersSignature = useMemo(() => {
    return JSON.stringify({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      search: filters.search || '',
      status: filters.status !== undefined ? filters.status : null,
      code: filters.code || '',
      name: filters.name || '',
      email: filters.email || '',
    });
  }, [
    filters.page,
    filters.limit,
    filters.search || '',
    filters.status,
    filters.code || '',
    filters.name || '',
    filters.email || '',
  ]);

  /**
   * Efecto para cargar empresas cuando cambian los filtros
   * Solo se ejecuta cuando los filtros cambian, evitando llamadas infinitas
   * IMPORTANTE: No incluir loadCompanies en las dependencias para evitar loops infinitos
   */
  useEffect(() => {
    // No recargar si hay un error activo (evita loops infinitos)
    if (hasError) {
      return;
    }
    
    if (!isScreenFocused || !hasAccess || accessLoading) {
      return;
    }

    // Verificar si los filtros realmente cambiaron
    if (filtersSignatureRef.current === filtersSignature) {
      return;
    }

    // Actualizar signature ANTES de la llamada para evitar llamadas duplicadas
    filtersSignatureRef.current = filtersSignature;
    
    // Usar ref para evitar dependencias en el useEffect
    if (loadCompaniesRef.current) {
      loadCompaniesRef.current(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessLoading, hasAccess, isScreenFocused, filtersSignature]);

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

    if (key === 'deleted') {
      setFilters((prev) => ({
        ...prev,
        status: value === 'deleted' ? -1 : undefined,
        page: 1,
      }));
      return;
    }

    // Convertir status de string a number si es necesario
    const processedValue = key === 'status' && value !== '' ? parseInt(value, 10) : value;
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : processedValue,
      page: 1,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      code: undefined,
      name: undefined,
      email: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar empresas localmente según el filtro local
   */
  const filteredCompanies = useMemo(() => {
    if (!localFilter.trim()) {
      return companies;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return companies.filter((company) => {
      const code = (company.code || '').toLowerCase();
      const name = (company.name || '').toLowerCase();
      const email = (company.email || '').toLowerCase();
      
      return (
        code.includes(filterLower) ||
        name.includes(filterLower) ||
        email.includes(filterLower)
      );
    });
  }, [companies, localFilter]);

  const handleCreateCompany = () => {
    setFormActions(null);
    setSelectedCompanyId(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar empresa
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditCompany = (company: Company) => {
    setFormActions(null);
    setSelectedCompanyId(company.id);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  /**
   * Cerrar modal de edición
   */
  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedCompanyId(null);
    setFormActions(null); // Resetear acciones del formulario
  };

  /**
   * Manejar éxito al crear/editar empresa
   */
  const handleFormSuccess = () => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadCompanies(filters);
    handleCloseModal();
  };

  /**
   * Manejar eliminación de empresa (llamado después de confirmación)
   */
  const handleDeleteCompany = async (company: Company) => {
    try {
      await CompaniesService.deleteCompany(company.id);
      await loadCompanies(filters);
      alert.showSuccess(t.security?.companies?.delete || 'Empresa eliminada');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar empresa');
    }
  };

  /**
   * Confirmar eliminación de empresa (muestra diálogo de confirmación)
   */
  const confirmDeleteCompany = (company: Company) => {
    const companiesTranslations = (t.security?.companies as any) || {};
    const title = companiesTranslations.deleteConfirmTitle || commonTranslations.confirm || 'Eliminar empresa';
    const messageTemplate =
      companiesTranslations.deleteConfirmMessage ||
      '¿Seguro que deseas eliminar la empresa {name}? Esta acción no se puede deshacer.';

    // Usar nombre, código o ID como identificador para el mensaje
    const identifier = company.name || company.code || company.id;
    const message = messageTemplate.includes('{name}')
      ? messageTemplate.replace('{name}', identifier)
      : messageTemplate;

    // Mostrar diálogo de confirmación y ejecutar eliminación si se confirma
    alert.showConfirm(title, message, () => handleDeleteCompany(company));
  };

  const columns: TableColumn<Company>[] = [
    {
      key: 'code',
      label: t.security?.companies?.code || 'Código',
      width: '18%',
    },
    {
      key: 'name',
      label: t.security?.companies?.name || 'Nombre',
      width: '28%',
    },
    {
      key: 'email',
      label: t.security?.companies?.email || 'Email',
      width: '26%',
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '18%',
      align: 'center',
      render: (company) => (
        <StatusBadge 
          status={company.status} 
          statusDescription={company.statusDescription}
          size="small"
        />
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      type: 'select',
      options: [
        { key: 'all', value: '', label: t.common?.all || 'Todos' },
        { key: 'active', value: '1', label: t.security?.users?.active || 'Activo' },
        { key: 'inactive', value: '0', label: t.security?.users?.inactive || 'Inactivo' },
        { key: 'pending', value: '2', label: t.security?.users?.pending || 'Pendiente' },
        { key: 'suspended', value: '3', label: t.security?.users?.suspended || 'Suspendido' },
      ],
    },
    {
      key: 'deleted',
      label: t.security?.companies?.deletedFilter || 'Empresas',
      type: 'select',
      options: [
        {
          key: 'deleted',
          value: 'deleted',
          label: t.security?.companies?.deletedUser || 'Eliminadas',
        },
      ],
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
              {t.security?.companies?.title || 'Administración de Empresas'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {t.security?.companies?.subtitle || 'Gestiona las empresas registradas en el sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.companies?.create || 'Crear Empresa')}
            onPress={handleCreateCompany}
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
          filterPlaceholder={t.security?.companies?.filterPlaceholder || 'Filtrar por código, nombre o email...'}
          searchPlaceholder={t.security?.companies?.searchPlaceholder || 'Buscar por código, nombre o email...'}
          filters={filterConfigs}
          activeFilters={{
            status:
              filters.status !== undefined && filters.status !== -1
                ? filters.status.toString()
                : '',
            deleted: filters.status === -1 ? 'deleted' : '',
          }}
          onAdvancedFilterChange={handleAdvancedFilterChange}
          onClearFilters={handleClearFilters}
          filteredCount={localFilter.trim() ? filteredCompanies.length : undefined}
          totalCount={pagination.total}
        />

        {/* Tabla de empresas con scroll interno */}
        <View style={styles.dataTableContainer}>
          <DataTable
            data={filteredCompanies}
            columns={columns}
            loading={loading}
            emptyMessage={t.security?.companies?.empty || 'No hay empresas disponibles'}
            onRowPress={handleEditCompany}
            keyExtractor={(company) => company.id}
            showPagination={true}
            actionsColumnLabel={t.common?.actions || 'Acciones'}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: localFilter.trim() ? filteredCompanies.length : pagination.total,
              totalPages: localFilter.trim() 
                ? Math.ceil(filteredCompanies.length / pagination.limit)
                : pagination.totalPages,
              hasNext: localFilter.trim()
                ? pagination.page < Math.ceil(filteredCompanies.length / pagination.limit)
                : pagination.hasNext,
              hasPrev: localFilter.trim()
                ? pagination.page > 1
                : pagination.hasPrev,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange,
              limitOptions: [10, 25, 50, 100],
            }}
            editAction={{
              onPress: (company) => handleEditCompany(company),
              tooltip: t.security?.companies?.editShort || 'Editar',
            }}
            deleteAction={{
              onPress: (company) => confirmDeleteCompany(company),
              tooltip: t.security?.companies?.deleteShort || 'Eliminar',
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
                ? t.security?.companies?.edit || 'Editar Empresa'
                : t.security?.companies?.create || 'Crear Empresa'
            }
            subtitle={
              modalMode === 'edit'
                ? (t.security?.companies?.editSubtitle || 'Modifica los datos de la empresa')
                : (t.security?.companies?.createSubtitle || 'Completa los datos para registrar una nueva empresa')
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
                        : t.security?.companies?.create || 'Crear Empresa'
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
      </View>
    </ThemedView>
  );
}
