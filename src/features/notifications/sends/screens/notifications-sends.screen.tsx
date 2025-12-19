import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatusBadge } from '@/components/ui/status-badge';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { NotificationsService } from '@/src/domains/notifications/notifications.service';
import { NotificationLog } from '@/src/domains/notifications/types';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
import { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { createNotificationsSendsStyles } from '../styles/notifications-sends.styles';

/**
 * Pantalla de Log de Envíos de Notificaciones.
 * Muestra el historial de correos enviados por el sistema.
 */
export function NotificationsSendsScreen() {
  const { t } = useTranslation();
  const styles = createNotificationsSendsStyles();
  const { colors } = useTheme();
  const alert = useAlert();
  const { isMobile } = useResponsive();

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ status: string; code: string; lang: string }>({
    status: '',
    code: '',
    lang: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [localFilter, setLocalFilter] = useState('');

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationsService.listNotifications({
        status: filters.status || undefined,
        code: filters.code || undefined,
        lang: filters.lang || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      const message = err?.message || t.notifications?.sends?.loadError || 'Error al cargar envíos';
      alert.showError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, alert, t]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const search = localFilter.toLowerCase();
      const matchLocal = !search || 
        log.templateCode.toLowerCase().includes(search) || 
        log.recipientsMasked.some(r => r.toLowerCase().includes(search));
      return matchLocal;
    });
  }, [logs, localFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredLogs.slice(start, end);
  }, [filteredLogs, pagination]);

  const filterConfigs: FilterConfig[] = [
    { key: 'status', label: 'Estado', placeholder: 'Ej. sent, failed', type: 'text' },
    { key: 'code', label: 'Código', placeholder: 'Código plantilla', type: 'text' },
  ];

  const getStatusBadge = (item: NotificationLog) => {
    const raw = (item.status || '').toLowerCase();
    const description = (item as any).statusDescription || item.status || '-';

    let statusNumber = 0; // Inactivo/Error por defecto
    if (raw === 'sent' || raw === 'success' || raw === 'delivered') {
      statusNumber = 1; // Activo/Éxito
    } else if (raw === 'queued' || raw === 'pending') {
      statusNumber = 2; // Pendiente
    }

    return <StatusBadge status={statusNumber} statusDescription={description} size="small" />;
  };

  const columns: TableColumn<NotificationLog>[] = [
    { key: 'status', label: t.common?.status || 'Estado', width: '15%', render: (item) => getStatusBadge(item) },
    { key: 'templateCode', label: 'Plantilla', width: '20%' },
    { key: 'lang', label: 'Idioma', width: '10%' },
    { key: 'recipients', label: 'Destinatarios', width: '30%', render: (item) => item.recipientsMasked.join(', ') },
    { key: 'error', label: 'Error', width: '25%', render: (item) => item.error || '-' },
  ];

  const handleRetry = async (item: NotificationLog) => {
    try {
      await NotificationsService.retryNotification(item.id);
      alert.showSuccess('Reintento encolado correctamente');
      loadLogs();
    } catch (e: any) {
      alert.showError(e.message || 'Error al reintentar');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ flex: 1, padding: 16, gap: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="h3" style={{ marginBottom: 4 }}>
              {t.notifications?.sends?.title || 'Log de Envíos'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {t.notifications?.sends?.subtitle || 'Visualiza el historial de correos y reintenta envíos fallidos.'}
            </ThemedText>
          </View>
        </View>

        {/* Filters */}
        <SearchFilterBar
          filterValue={localFilter}
          onFilterChange={setLocalFilter}
          onSearchSubmit={loadLogs}
          filters={filterConfigs}
          activeFilters={filters}
          onAdvancedFilterChange={(key, val) => setFilters(p => ({ ...p, [key]: val }))}
          onClearFilters={() => { setLocalFilter(''); setFilters({ status: '', code: '', lang: '' }); }}
          filterPlaceholder="Filtrar por plantilla o destinatario..."
          searchPlaceholder="Buscar..."
        />

        {/* Table */}
        <View style={{ flex: 1 }}>
          <DataTable
            data={paginatedLogs}
            columns={columns}
            loading={loading}
            emptyMessage="No hay registros de envío disponibles"
            keyExtractor={(item) => item.id}
            showPagination={true}
            actions={[
              {
                id: 'retry',
                icon: 'refresh',
                tooltip: t.common?.retry || 'Reintentar',
                visible: (item) => item.status?.toLowerCase() === 'failed',
                onPress: handleRetry,
              },
            ]}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: filteredLogs.length,
              totalPages: Math.ceil(filteredLogs.length / pagination.limit),
              hasNext: pagination.page < Math.ceil(filteredLogs.length / pagination.limit),
              hasPrev: pagination.page > 1,
              onPageChange: (page) => setPagination(p => ({ ...p, page })),
              onLimitChange: (limit) => setPagination(p => ({ ...p, limit, page: 1 })),
              limitOptions: [10, 25, 50],
            }}
          />
        </View>
      </View>
    </ThemedView>
  );
}
