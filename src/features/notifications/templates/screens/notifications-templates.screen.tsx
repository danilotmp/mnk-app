import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { InlineAlert } from '@/components/ui/inline-alert';
import { SideModal } from '@/components/ui/side-modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { NotificationsService } from '@/src/domains/notifications/notifications.service';
import { NotificationTemplate } from '@/src/domains/notifications/types';
import { DataTable } from '@/src/domains/shared/components/data-table/data-table';
import { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { SearchFilterBar } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useTranslation } from '@/src/infrastructure/i18n';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { TemplateEditForm } from '../components/template-edit-form/template-edit-form';
import { createNotificationsTemplatesStyles } from '../styles/notifications-templates.styles';

export function NotificationsTemplatesScreen() {
  const { t } = useTranslation();
  const styles = createNotificationsTemplatesStyles();
  const { colors, isDark } = useTheme();
  const alert = useAlert();
  const { isMobile } = useResponsive();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [filters, setFilters] = useState<{ code: string; lang: string; companyId: string }>({
    code: '',
    lang: '',
    companyId: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [localFilter, setLocalFilter] = useState('');

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [formActions, setFormActions] = useState<{
    isLoading: boolean;
    handleSubmit: () => void;
    handleCancel: () => void;
    generalError?: { message: string; detail?: string } | null;
  } | null>(null);

  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationsService.getTemplates();
      setTemplates(data);
      setPagination(p => ({ ...p, total: data.length }));
    } catch (err: any) {
      const message = err?.message || t.notifications?.templates?.loadError || 'Error al cargar plantillas';
      alert.showError(message);
    } finally {
      setLoading(false);
    }
  }, [alert, t]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const search = localFilter.toLowerCase();
      const matchLocal = !search || 
        tpl.code.toLowerCase().includes(search) || 
        tpl.subject.toLowerCase().includes(search);
      
      const matchCode = filters.code ? tpl.code?.toLowerCase().includes(filters.code.toLowerCase()) : true;
      const matchLang = filters.lang ? tpl.lang?.toLowerCase().includes(filters.lang.toLowerCase()) : true;
      const matchCompany = filters.companyId ? tpl.companyId === filters.companyId : true;
      
      return matchLocal && matchCode && matchLang && matchCompany;
    });
  }, [templates, filters, localFilter]);

  const paginatedTemplates = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return filteredTemplates.slice(start, end);
  }, [filteredTemplates, pagination]);

  const filterConfigs: FilterConfig[] = [
    { key: 'code', label: 'Código', placeholder: 'Código', type: 'text' },
    { key: 'lang', label: 'Idioma', placeholder: 'es | en', type: 'text' },
    { key: 'companyId', label: 'Empresa', placeholder: 'ID empresa', type: 'text' },
  ];

  const getStatusBadge = (item: NotificationTemplate) => {
    const rawStatus = item.status;
    const statusNumber = typeof rawStatus === 'number' ? rawStatus : 
                        (`${rawStatus}`.toLowerCase() === 'active' || `${rawStatus}` === '1' ? 1 : 0);
    const description = (item as any).statusDescription || (statusNumber === 1 ? t.common?.active || 'Activo' : t.common?.inactive || 'Inactivo');
    return <StatusBadge status={statusNumber} statusDescription={description} size="small" />;
  };

  const columns: TableColumn<NotificationTemplate>[] = [
    { key: 'code', label: 'Código', width: '20%' },
    { key: 'lang', label: 'Idioma', width: '10%' },
    { key: 'subject', label: 'Asunto', width: '30%' },
    { key: 'company', label: 'Alcance', width: '15%', render: (item) => (item.companyId ? `Empresa: ${item.companyId}` : 'Global') },
    { key: 'status', label: t.common?.status || 'Estado', width: '15%', render: (item) => getStatusBadge(item) },
    { key: 'vars', label: 'Vars', width: '10%', render: (item) => (item.requiredVars?.join(', ') || '-') },
  ];

  const handleCreate = () => {
    setModalMode('create');
    setSelectedTemplate(null);
    setIsModalVisible(true);
  };

  const handleEdit = (tpl: NotificationTemplate) => {
    setModalMode('edit');
    setSelectedTemplate(tpl);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedTemplate(null);
    setFormActions(null);
  };

  const handleFormSuccess = () => {
    handleCloseModal();
    loadTemplates();
  };

  const handleDelete = (tpl: NotificationTemplate) => {
    alert.showConfirm(
      t.common?.confirm || 'Confirmar',
      `¿Seguro que deseas eliminar la plantilla ${tpl.code}? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await NotificationsService.deleteTemplate(tpl.id);
          alert.showSuccess('Plantilla eliminada correctamente');
          loadTemplates();
          if (isModalVisible) handleCloseModal();
        } catch (e: any) {
          alert.showError(e.message || 'Error al eliminar la plantilla');
        }
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
              {t.notifications?.templates?.title || 'Plantillas de notificaciones'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {t.notifications?.templates?.subtitle || 'Listado y edición de plantillas.'}
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
          onSearchSubmit={loadTemplates}
          filters={filterConfigs}
          activeFilters={filters}
          onAdvancedFilterChange={(key, val) => setFilters(p => ({ ...p, [key]: val }))}
          onClearFilters={() => setFilters({ code: '', lang: '', companyId: '' })}
          filterPlaceholder="Filtrar por código o asunto..."
          searchPlaceholder="Buscar..."
        />

        {/* Table */}
        <View style={{ flex: 1 }}>
          <DataTable
            data={paginatedTemplates}
            columns={columns}
            loading={loading}
            emptyMessage="No hay plantillas disponibles"
            onRowPress={handleEdit}
            keyExtractor={(item) => item.id}
            showPagination={true}
            editAction={{ onPress: handleEdit }}
            deleteAction={{ onPress: handleDelete }}
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: filteredTemplates.length,
              totalPages: Math.ceil(filteredTemplates.length / pagination.limit),
              hasNext: pagination.page < Math.ceil(filteredTemplates.length / pagination.limit),
              hasPrev: pagination.page > 1,
              onPageChange: (page) => setPagination(p => ({ ...p, page })),
              onLimitChange: (limit) => setPagination(p => ({ ...p, limit, page: 1 })),
              limitOptions: [10, 25, 50],
            }}
          />
        </View>

        {/* Modal de creación/edición */}
        <SideModal
          visible={isModalVisible}
          onClose={handleCloseModal}
          title={modalMode === 'edit' ? 'Editar Plantilla' : 'Crear Plantilla'}
          subtitle={modalMode === 'edit' ? 'Modifica los datos de la plantilla' : 'Completa los datos para la nueva plantilla'}
          topAlert={
            formActions?.generalError ? (
              <InlineAlert
                type="error"
                message={formActions.generalError.message}
                detail={formActions.generalError.detail}
                duration={5000}
                autoClose={true}
                onDismiss={() => {
                  if (formActions) {
                    setFormActions({ ...formActions, generalError: null });
                  }
                }}
              />
            ) : undefined
          }
          footer={
            formActions ? (
              <>
                {modalMode === 'edit' && selectedTemplate ? (
                  <View style={{ marginRight: 'auto' }}>
                    <Tooltip text={t.common?.delete || 'Eliminar'} position="top">
                      <TouchableOpacity
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: formActions.isLoading ? 0.5 : 1,
                        }}
                        disabled={formActions.isLoading}
                        onPress={() => handleDelete(selectedTemplate)}
                      >
                        <Ionicons name="trash" size={18} color={actionIconColor} />
                      </TouchableOpacity>
                    </Tooltip>
                  </View>
                ) : null}
                <Button 
                  title={t.common?.cancel || 'Cancelar'} 
                  variant="outlined" 
                  onPress={handleCloseModal} 
                  disabled={formActions.isLoading}
                />
                <Button 
                  title={t.common?.save || 'Guardar'} 
                  variant="primary" 
                  onPress={formActions.handleSubmit} 
                  loading={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          <TemplateEditForm
            templateId={selectedTemplate?.id}
            initialData={selectedTemplate}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseModal}
            showHeader={false}
            showFooter={false}
            onFormReady={setFormActions}
          />
        </SideModal>
      </View>
    </ThemedView>
  );
}
