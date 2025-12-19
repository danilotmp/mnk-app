import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { NotificationsService } from '@/src/domains/notifications/notifications.service';
import { SystemParam } from '@/src/domains/notifications/types';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
import { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { createNotificationsParamsStyles } from '../styles/notifications-params.styles';

/**
 * Pantalla de Administración de Parámetros del Sistema.
 * Centraliza la gestión de system_params (auth, notifications, system, etc.)
 */
export function NotificationsParamsScreen() {
  const { t } = useTranslation();
  const styles = createNotificationsParamsStyles();
  const { colors } = useTheme();
  const alert = useAlert();
  const { isMobile } = useResponsive();

  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<SystemParam[]>([]);
  const [scopeFilter, setScopeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [localFilter, setLocalFilter] = useState('');

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedParam, setSelectedParam] = useState<SystemParam | null>(null);

  const loadParams = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationsService.listParams({
        scope: scopeFilter || undefined,
      });
      setParams(data);
      setPagination(p => ({ ...p, total: data.length }));
    } catch (err: any) {
      const message = err?.message || t.notifications?.params?.loadError || 'Error al cargar parámetros';
      alert.showError(message);
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, alert, t]);

  useEffect(() => {
    loadParams();
  }, [loadParams]);

  const filteredParams = useMemo(() => {
    return params.filter((p) => {
      const search = localFilter.toLowerCase();
      const matchLocal = !search || 
        p.key.toLowerCase().includes(search) || 
        p.scope.toLowerCase().includes(search) ||
        String(p.value).toLowerCase().includes(search);
      
      return matchLocal;
    });
  }, [params, localFilter]);

  const paginatedParams = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredParams.slice(start, end);
  }, [filteredParams, pagination]);

  const filterConfigs: FilterConfig[] = [
    { key: 'scope', label: 'Scope', placeholder: 'Ej. notifications', type: 'text' },
  ];

  const getStatusBadge = (item: SystemParam) => {
    // Si el parámetro no tiene campo status explícito, asumimos activo (1)
    const rawStatus = item.status !== undefined ? item.status : 1;
    const description = item.statusDescription || (rawStatus === 1 ? t.common?.active || 'Activo' : t.common?.inactive || 'Inactivo');
    return <StatusBadge status={rawStatus} statusDescription={description} size="small" />;
  };

  const columns: TableColumn<SystemParam>[] = [
    { key: 'scope', label: 'Scope', width: '15%' },
    { key: 'key', label: 'Clave', width: '25%' },
    { key: 'value', label: 'Valor', width: '20%', render: (item) => String(item.value) },
    { key: 'type', label: 'Tipo', width: '10%' },
    { key: 'company', label: 'Alcance', width: '15%', render: (item) => (item.companyId ? `Empresa: ${item.companyId}` : 'Global') },
    { key: 'status', label: t.common?.status || 'Estado', width: '15%', render: (item) => getStatusBadge(item) },
  ];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedParam(null);
    setIsModalVisible(true);
  };

  const handleEdit = (p: SystemParam) => {
    setModalMode('edit');
    setSelectedParam(p);
    setIsModalVisible(true);
  };

  const handleDelete = (p: SystemParam) => {
    alert.showConfirm(
      t.common?.confirm || 'Confirmar',
      `¿Seguro que deseas eliminar el parámetro ${p.key}?`,
      async () => {
        alert.showInfo('Funcionalidad de borrado próximamente');
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="h3" style={{ marginBottom: 4 }}>
              {t.notifications?.params?.title || 'Administración de Parámetros del Sistema'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {t.notifications?.params?.subtitle || 'Gestiona los parámetros globales y por empresa del sistema.'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.common?.create || 'Crear')}
            onPress={handleCreate}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
          </Button>
        </View>

        {/* Filters */}
        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={setLocalFilter}
          onSearchSubmit={loadParams}
          filters={filterConfigs}
          activeFilters={{ scope: scopeFilter }}
          onAdvancedFilterChange={(key, val) => key === 'scope' && setScopeFilter(val)}
          onClearFilters={() => { setLocalFilter(''); setScopeFilter(''); }}
          filterPlaceholder="Filtrar por clave o valor..."
          searchPlaceholder="Buscar..."
        />

        {/* Table */}
        <View style={{ flex: 1 }}>
          <DataTable
            data={paginatedParams}
            columns={columns}
            loading={loading}
            emptyMessage="No hay parámetros disponibles"
            onRowPress={handleEdit}
            keyExtractor={(item) => `${item.scope}-${item.key}-${item.companyId || 'global'}`}
            showPagination={true}
            editAction={{ onPress: handleEdit }}
            deleteAction={{ onPress: handleDelete }}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: filteredParams.length,
              totalPages: Math.ceil(filteredParams.length / pagination.limit),
              hasNext: pagination.page < Math.ceil(filteredParams.length / pagination.limit),
              hasPrev: pagination.page > 1,
              onPageChange: (page) => setPagination(p => ({ ...p, page })),
              onLimitChange: (limit) => setPagination(p => ({ ...p, limit, page: 1 })),
              limitOptions: [10, 25, 50],
            }}
          />
        </View>

        {/* Modal Placeholder */}
        <SideModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          title={modalMode === 'edit' ? 'Editar Parámetro' : 'Crear Parámetro'}
          subtitle="Formulario de gestión de parámetros"
          footer={
            <>
              <Button title={t.common?.cancel || 'Cancelar'} variant="outlined" onPress={() => setIsModalVisible(false)} />
              <Button title={t.common?.save || 'Guardar'} variant="primary" onPress={() => alert.showInfo('Próximamente')} />
            </>
          }
        >
          <View style={{ padding: 16 }}>
            <ThemedText>Formulario para {selectedParam?.key || 'nuevo parámetro'}</ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 8 }}>
              Se incluirán campos para clave, valor, tipo y alcance.
            </ThemedText>
          </View>
        </SideModal>
      </View>
    </ThemedView>
  );
}
