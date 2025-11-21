/**
 * Página principal de administración de Permisos
 * Lista de permisos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SideModal } from '@/components/ui/side-modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService, RolesService, useCompanyOptions } from '@/src/domains/security';
import type { PermissionChange } from '@/src/domains/security/components';
import { PermissionCreateForm, PermissionEditForm, PermissionsFlowFilters, PermissionsManagementFlow } from '@/src/domains/security/components';
import type { PermissionOperation } from '@/src/domains/security/services/roles.service';
import { PermissionFilters, RoleFilters, SecurityPermission, SecurityRole } from '@/src/domains/security/types';
import type { TableColumn } from '@/src/domains/shared/components/data-table/data-table.types';
import { FilterConfig } from '@/src/domains/shared/components/search-filter-bar/search-filter-bar.types';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionsListStyles } from '@/src/styles/pages/permissions-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';

export default function PermissionsListPage() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createPermissionsListStyles(isMobile);
  
  // Color para iconos de acción: primaryDark en dark theme, primary en light theme
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
    isScreenFocused,
  } = useRouteAccessGuard(pathname);

  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<SecurityPermission[]>([]); // Permisos del rol seleccionado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0); // Key para forzar recarga del menú
  const loadingRef = useRef(false); // Para evitar llamadas simultáneas
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(null);
  const [localFilter, setLocalFilter] = useState(''); // Filtro local para la tabla
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<PermissionFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined, // Filtro de estado: -1, 0, 1, 2, 3
    module: undefined,
    action: undefined,
  });
  
  // Flag para prevenir llamadas infinitas cuando hay un error activo
  const [hasError, setHasError] = useState(false);
  const filtersSignatureRef = useRef<string>('');
  
  // Estado para rastrear cambios masivos de permisos
  const [permissionChanges, setPermissionChanges] = useState<PermissionChange[]>([]);
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Estados para los selectores dependientes
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(undefined);
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(undefined);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  // Estados para filtros locales
  const [searchValue, setSearchValue] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [showDefaultOptions, setShowDefaultOptions] = useState(true); // Por defecto mostrar opciones por defecto
  const [showAll, setShowAll] = useState(true); // Por defecto mostrar todas las opciones (vista previa preseleccionada)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  // Obtener empresas
  const { companies, loading: companiesLoading } = useCompanyOptions();

  const loadPermissions = useCallback(async (currentFilters: PermissionFilters) => {
    // Prevenir llamadas simultáneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await PermissionsService.getPermissions(currentFilters);
      
      // Asegurar que la respuesta tenga la estructura correcta
      if (response && response.data) {
        setPermissions(Array.isArray(response.data) ? response.data : []);
        
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
        setPermissions([]);
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
        setHasError(true);
        return;
      }
      const errorMessage = error.message || t.security?.permissions?.loadError || 'Error al cargar permisos';
      setHasError(true);
      // Mostrar error con detalles
      alert.showError(errorMessage, error.details || error.response?.result?.details);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [alert, handleApiError, t]);

  /**
   * Efecto para cargar permisos cuando cambian los filtros
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
    loadPermissions(filters);
  }, [accessLoading, hasAccess, hasError, isScreenFocused, loadPermissions, filters]);

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
    // Convertir status de string a number si es necesario
    const processedValue = key === 'status' && value !== '' ? parseInt(value, 10) : value;
    setFilters((prev) => ({ ...prev, [key]: value === '' ? undefined : processedValue, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      module: undefined,
      action: undefined,
    });
    setLocalFilter(''); // Limpiar también el filtro local
    setHasError(false);
  };

  /**
   * Filtrar permisos localmente según el filtro local
   */
  const filteredPermissions = useMemo(() => {
    if (!localFilter.trim()) {
      return permissions;
    }
    
    const filterLower = localFilter.toLowerCase().trim();
    return permissions.filter((permission) => {
      const name = (permission.name || '').toLowerCase();
      const code = (permission.code || '').toLowerCase();
      const module = (permission.module || '').toLowerCase();
      const action = (permission.action || '').toLowerCase();
      
      return (
        name.includes(filterLower) ||
        code.includes(filterLower) ||
        module.includes(filterLower) ||
        action.includes(filterLower)
      );
    });
  }, [permissions, localFilter]);

  const handleCreatePermission = () => {
    setFormActions(null);
    setSelectedPermissionId(null);
    setModalMode('create');
    setIsModalVisible(true);
  };

  /**
   * Navegar a editar permiso
   * En web: abre modal lateral (1/3 del ancho)
   * En móvil: abre modal lateral (100% del ancho)
   */
  const handleEditPermission = (permission: SecurityPermission) => {
    setFormActions(null);
    setSelectedPermissionId(permission.id);
    setModalMode('edit');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setModalMode(null);
    setSelectedPermissionId(null);
    setFormActions(null);
  };

  const handleFormSuccess = () => {
    filtersSignatureRef.current = JSON.stringify(filters);
    loadPermissions(filters);
    handleCloseModal();
  };

  const handleDeletePermission = async (permission: SecurityPermission) => {
    try {
      await PermissionsService.deletePermission(permission.id);
      await loadPermissions(filters);
      alert.showSuccess(t.security?.permissions?.delete || 'Permiso eliminado');
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      alert.showError(error.message || 'Error al eliminar permiso');
    }
  };

  /**
   * Validar si un string es un UUID válido
   */
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  /**
   * Buscar menuItemId por route en menuItems (recursivamente)
   * Retorna solo si el id es un UUID válido
   */
  const findMenuItemIdByRoute = (route: string | undefined, items: MenuItem[]): string | null => {
    if (!route) return null;

    for (const item of items) {
      // Buscar en item directo
      if (item.route === route) {
        // Validar que el id sea un UUID válido
        if (isValidUUID(item.id)) {
          return item.id;
        }
        console.warn(`El menuItem con route "${route}" tiene un id inválido: "${item.id}". Debe ser un UUID.`);
      }

      // Buscar en submenu
      if (item.submenu) {
        for (const subItem of item.submenu) {
          if (subItem.route === route) {
            // Validar que el id sea un UUID válido
            if (isValidUUID(subItem.id)) {
              return subItem.id;
            }
            console.warn(`El menuItem del submenu con route "${route}" tiene un id inválido: "${subItem.id}". Debe ser un UUID.`);
          }
        }
      }

      // Buscar en columnas
      if (item.columns) {
        for (const column of item.columns) {
          if (column.items) {
            for (const columnItem of column.items) {
              if (columnItem.route === route) {
                // Validar que el id sea un UUID válido
                if (isValidUUID(columnItem.id)) {
                  return columnItem.id;
                }
                console.warn(`El menuItem de la columna con route "${route}" tiene un id inválido: "${columnItem.id}". Debe ser un UUID.`);
              }
            }
          }
        }
      }
    }

    return null;
  };

  /**
   * Convertir PermissionChange[] a PermissionOperation[]
   * Necesita obtener los IDs de permisos genéricos y menuItems
   */
  const convertPermissionChangesToOperations = async (
    changes: PermissionChange[],
    menuItems: MenuItem[],
    rolePermissions: SecurityPermission[]
  ): Promise<PermissionOperation[]> => {
    // 1. Obtener permisos genéricos (view, create, edit, delete) desde el backend
    // Estos permisos tienen action = 'view'/'create'/'edit'/'delete' y route = null o vacío
    const genericPermissionsResponse = await PermissionsService.getPermissions({
      page: 1,
      limit: 100,
    });
    
    const allPermissions = Array.isArray(genericPermissionsResponse.data)
      ? genericPermissionsResponse.data
      : (genericPermissionsResponse.data || []);

    // Buscar permisos genéricos (sin route específico)
    const genericPermissionIds: Record<string, string> = {};
    const actions = ['view', 'create', 'edit', 'delete'];
    
    for (const action of actions) {
      const genericPermission = allPermissions.find(
        p => p.action === action && (!p.route || p.route === '')
      );
      if (genericPermission) {
        genericPermissionIds[action] = genericPermission.id;
      }
    }

    // Verificar que todos los permisos genéricos existen
    const missingActions = ['view', 'create', 'edit', 'delete'].filter(
      action => !genericPermissionIds[action]
    );
    if (missingActions.length > 0) {
      throw new Error(`No se encontraron permisos genéricos para: ${missingActions.join(', ')}`);
    }

    // 2. Convertir cambios a operaciones
    const operations: PermissionOperation[] = [];

    for (const change of changes) {
      // Buscar menuItemId por route (debe ser un UUID válido)
      const menuItemId = findMenuItemIdByRoute(change.route, menuItems);
      if (!menuItemId) {
        console.warn(`No se encontró menuItemId válido (UUID) para la ruta: ${change.route}`);
        console.warn(`MenuItems disponibles:`, JSON.stringify(menuItems.map(item => ({ id: item.id, route: item.route, label: item.label })), null, 2));
        continue; // Saltar este cambio si no se encuentra el menuItemId
      }

      // Obtener estado original de cada acción
      const originalView = rolePermissions.some(
        p => p.route === change.route && p.action === 'view'
      );
      const originalCreate = rolePermissions.some(
        p => p.route === change.route && p.action === 'create'
      );
      const originalEdit = rolePermissions.some(
        p => p.route === change.route && p.action === 'edit'
      );
      const originalDelete = rolePermissions.some(
        p => p.route === change.route && p.action === 'delete'
      );

      // Comparar y agregar operaciones
      if (change.view !== originalView) {
        operations.push({
          permissionId: genericPermissionIds.view,
          menuItemId,
          action: change.view ? 'add' : 'remove',
        });
      }

      if (change.create !== originalCreate) {
        operations.push({
          permissionId: genericPermissionIds.create,
          menuItemId,
          action: change.create ? 'add' : 'remove',
        });
      }

      if (change.edit !== originalEdit) {
        operations.push({
          permissionId: genericPermissionIds.edit,
          menuItemId,
          action: change.edit ? 'add' : 'remove',
        });
      }

      if (change.delete !== originalDelete) {
        operations.push({
          permissionId: genericPermissionIds.delete,
          menuItemId,
          action: change.delete ? 'add' : 'remove',
        });
      }
    }

    return operations;
  };

  /**
   * Guardar cambios masivos de permisos
   */
  const handleSaveChanges = async () => {
    if (permissionChanges.length === 0 || !selectedRoleId) {
      return;
    }

    try {
      setSavingChanges(true);

      // Convertir PermissionChange[] a PermissionOperation[]
      const operations = await convertPermissionChangesToOperations(
        permissionChanges,
        menuItems,
        rolePermissions
      );

      if (operations.length === 0) {
        alert.showError('No hay cambios válidos para guardar');
        return;
      }

      // Llamar al servicio bulk
      const result = await RolesService.bulkUpdateRolePermissions(
        selectedRoleId,
        operations,
        selectedCompanyId
      );

      // El servicio retorna response.data directamente, que tiene la estructura:
      // { role: SecurityRole, summary: { total, added, removed } }
      // Por lo tanto, result ya contiene role y summary directamente (sin .data)
      
      // Mostrar mensaje de éxito con resumen
      let summaryMessage = '';
      if (result && 'summary' in result && result.summary) {
        const summary = result.summary;
        summaryMessage = `${summary.added > 0 ? `${summary.added} agregado${summary.added > 1 ? 's' : ''}` : ''}${summary.added > 0 && summary.removed > 0 ? ', ' : ''}${summary.removed > 0 ? `${summary.removed} removido${summary.removed > 1 ? 's' : ''}` : ''}`;
      }
      
      alert.showSuccess(
        `Permisos actualizados correctamente${summaryMessage ? ` (${summaryMessage})` : ''}`
      );

      // Limpiar cambios pendientes primero
      setPermissionChanges([]);

      // Recargar el rol completo para obtener permisos actualizados
      // Esto asegura que tenemos los permisos más recientes después del bulk update
      if (selectedRoleId) {
        try {
          setLoadingRolePermissions(true);
          const updatedRole = await RolesService.getRoleById(selectedRoleId);
          setRolePermissions(updatedRole.permissions || []);
          
          // Forzar recarga del menú incrementando el key
          // Esto hará que PermissionsManagementFlow se remonte y recargue el menú
          setMenuRefreshKey(prev => prev + 1);
        } catch (error: any) {
          console.error('Error al recargar permisos del rol:', error);
          if (handleApiError(error)) {
            return;
          }
          // Si falla, intentar usar los permisos de la respuesta del bulk
          if (result && typeof result === 'object' && 'role' in result) {
            const role = result.role as SecurityRole;
            if (role?.permissions) {
              setRolePermissions(role.permissions);
            }
          }
        } finally {
          setLoadingRolePermissions(false);
        }
      }

      // Nota: El menú se recargará automáticamente cuando PermissionsManagementFlow
      // detecte que rolePermissions cambió, ya que está escuchando los cambios
      // Las selecciones de empresa, rol y filtros se mantienen porque no las estamos cambiando
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }

      // Mostrar errores específicos si existen
      if (error.details?.errors && Array.isArray(error.details.errors)) {
        const errorMessages = error.details.errors.map((e: any) => e.error).join(', ');
        alert.showError(`Error al guardar permisos: ${errorMessages}`);
      } else {
        alert.showError(error.message || 'Error al guardar permisos');
      }
    } finally {
      setSavingChanges(false);
    }
  };

  /**
   * Cargar roles por empresa
   */
  const loadRolesByCompany = useCallback(async (companyId: string | undefined) => {
    if (!companyId) {
      setRoles([]);
      setSelectedRoleId(undefined);
      return;
    }

    try {
      setLoadingRoles(true);
      const roleFilters: RoleFilters = {
        page: 1,
        limit: 100, // Obtener todos los roles de la empresa
      };
      const response = await RolesService.getRoles(roleFilters);
      
      // Filtrar roles por companyId (ya que RoleFilters no tiene companyId)
      const companyRoles = (response.data || []).filter(role => role.companyId === companyId);
      setRoles(companyRoles);
      
      // Si había un rol seleccionado que ya no existe, limpiarlo
      if (selectedRoleId && !companyRoles.find(r => r.id === selectedRoleId)) {
        setSelectedRoleId(undefined);
      }
    } catch (error: any) {
      if (handleApiError(error)) {
        return;
      }
      console.error('Error al cargar roles:', error);
      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, [selectedRoleId, handleApiError]);

  /**
   * Manejar cambio de empresa
   */
  const handleCompanyChange = (companyId: string | undefined) => {
    setSelectedCompanyId(companyId);
    setSelectedRoleId(undefined); // Limpiar rol seleccionado cuando cambia la empresa
    setPermissionChanges([]); // Limpiar cambios pendientes
    loadRolesByCompany(companyId);
  };

  /**
   * Manejar cambio de rol
   */
  const handleRoleChange = async (roleId: string | undefined) => {
    setSelectedRoleId(roleId);
    setPermissionChanges([]); // Limpiar cambios pendientes al cambiar de rol
    
    // Cargar permisos del rol seleccionado
    if (roleId) {
      try {
        setLoadingRolePermissions(true);
        const role = await RolesService.getRoleById(roleId);
        setRolePermissions(role.permissions || []);
      } catch (error: any) {
        if (handleApiError(error)) {
          return;
        }
        console.error('Error al cargar permisos del rol:', error);
        setRolePermissions([]);
      } finally {
        setLoadingRolePermissions(false);
      }
    } else {
      setRolePermissions([]);
    }
  };

  // Cargar roles cuando cambia la empresa seleccionada
  useEffect(() => {
    loadRolesByCompany(selectedCompanyId);
  }, [selectedCompanyId, loadRolesByCompany]);

  const columns: TableColumn<SecurityPermission>[] = [
    {
      key: 'name',
      label: t.security?.permissions?.name || 'Nombre',
      width: '23%',
    },
    {
      key: 'code',
      label: t.security?.permissions?.code || 'Código',
      width: '18%',
    },
    {
      key: 'module',
      label: t.security?.permissions?.module || 'Módulo',
      width: '13%',
    },
    {
      key: 'action',
      label: t.security?.permissions?.action || 'Acción',
      width: '13%',
    },
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      width: '15%',
      align: 'center',
      render: (permission) => (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: permission.status === 1
                ? colors.success + '20'
                : colors.error + '20',
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: permission.status === 1 ? colors.success : colors.error,
            }}
          >
            {permission.status === 1
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
      render: (permission) => (
        <View style={styles.actionsContainer}>
          <Tooltip text={t.security?.permissions?.editShort || 'Editar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditPermission(permission)}
            >
              <Ionicons name="pencil" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
          <Tooltip text={t.security?.permissions?.deleteShort || 'Eliminar'} position="left">
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePermission(permission)}
            >
              <Ionicons name="trash" size={18} color={actionIconColor} />
            </TouchableOpacity>
          </Tooltip>
        </View>
      ),
    },
  ];

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: t.security?.users?.status || 'Estado',
      type: 'select',
      options: [
        { value: '', label: t.common?.all || 'Todos' },
        { value: '1', label: t.security?.users?.active || 'Activo' },
        { value: '0', label: t.security?.users?.inactive || 'Inactivo' },
        { value: '2', label: 'Pendiente' },
        { value: '3', label: 'Suspendido' },
        { value: '-1', label: 'Eliminado' },
      ],
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
              {t.security?.permissions?.title || 'Administración de Permisos'}
            </ThemedText>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {t.security?.permissions?.subtitle || 'Gestiona los permisos del sistema'}
            </ThemedText>
          </View>
          <Button
            title={isMobile ? '' : (t.security?.permissions?.create || 'Crear Permiso')}
            onPress={handleCreatePermission}
            variant="primary"
            size="md"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={!isMobile ? { marginRight: 8 } : undefined} />
          </Button>
        </View>

        {/* Selectores dependientes: Empresa y Rol */}
        <View style={[styles.selectorsContainer, { gap: 16 }]}>
          <View style={{ flex: 1 }}>
            <Select
              label={t.security?.users?.company || 'Empresa'}
              placeholder={t.security?.users?.selectCompany || 'Selecciona una empresa'}
              value={selectedCompanyId}
              options={companies.map(comp => ({ value: comp.id, label: comp.name }))}
              onSelect={(value) => handleCompanyChange(value as string)}
              searchable={companies.length > 5}
              required
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <Select
              label={'Rol'}
              placeholder={t.security?.roles?.selectRole || 'Selecciona un rol'}
              value={selectedRoleId}
              options={roles.map(role => ({ value: role.id, label: role.name }))}
              onSelect={(value) => handleRoleChange(value as string)}
              searchable={roles.length > 5}
              disabled={!selectedCompanyId || loadingRoles}
              required
            />
          </View>
        </View>

        {/* Filtros locales para PermissionsManagementFlow */}
        <PermissionsFlowFilters
            menuItems={menuItems}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            selectedModule={selectedModule}
            onModuleChange={setSelectedModule}
            selectedAction={selectedAction}
            onActionChange={setSelectedAction}
            showDefaultOptions={showDefaultOptions}
            onShowDefaultOptionsChange={setShowDefaultOptions}
            showAll={showAll}
            onShowAllChange={setShowAll}
            onClearFilters={() => {
              setSearchValue('');
              setSelectedModule('');
              setSelectedAction('');
              setShowDefaultOptions(true); // Restaurar a mostrar por defecto
            }}
          />

        {/* Componente de administración masiva de permisos - Solo mostrar si hay un rol seleccionado */}
        {selectedRoleId ? (
          <View style={styles.dataTableContainer}>
            {loadingRolePermissions ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText type="body2" variant="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
                  Cargando permisos del rol...
                </ThemedText>
              </View>
            ) : (
              <PermissionsManagementFlow
                key={`${selectedRoleId}-${menuRefreshKey}`} // Key para forzar recarga cuando cambie
                permissions={rolePermissions}
                roleId={selectedRoleId}
                searchValue={searchValue}
                selectedModule={selectedModule}
                selectedAction={selectedAction}
                showDefaultOptions={showDefaultOptions}
                showAll={showAll}
                onChanges={(changes) => {
                  setPermissionChanges(changes);
                }}
                onMenuItemsLoaded={(items) => {
                  setMenuItems(items);
                }}
              />
            )}
          </View>
        ) : (
          <View style={[styles.dataTableContainer, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
            <View style={{ alignItems: 'center', gap: 16 }}>
              <Ionicons 
                name="git-branch-outline" 
                size={64} 
                color={colors.textSecondary} 
              />
              <ThemedText 
                type="body1" 
                style={{ 
                  textAlign: 'center', 
                  color: colors.textSecondary,
                  maxWidth: 300,
                }}
              >
                {!selectedCompanyId 
                  ? t.security?.permissions?.selectCompany || 'Selecciona una empresa para comenzar'
                  : t.security?.permissions?.selectRole || 'Selecciona un rol para ver y gestionar sus permisos'}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Botón Guardar - solo aparece cuando hay cambios, fuera del content para que quede fijo abajo */}
      {permissionChanges.length > 0 && (() => {
        // Calcular la cantidad de permisos pendientes (acciones individuales que difieren del estado original)
        const pendingCount = permissionChanges.reduce((total, change) => {
          // Obtener el estado original de cada acción para esta ruta
          const originalView = rolePermissions.some(p => p.route === change.route && p.action === 'view');
          const originalCreate = rolePermissions.some(p => p.route === change.route && p.action === 'create');
          const originalEdit = rolePermissions.some(p => p.route === change.route && p.action === 'edit');
          const originalDelete = rolePermissions.some(p => p.route === change.route && p.action === 'delete');
          
          // Contar cuántas acciones difieren del estado original
          let count = 0;
          if (change.view !== originalView) count++;
          if (change.create !== originalCreate) count++;
          if (change.edit !== originalEdit) count++;
          if (change.delete !== originalDelete) count++;
          
          return total + count;
        }, 0);

        const pendingText = typeof t.security?.permissions?.pendingChanges === 'function'
          ? t.security.permissions.pendingChanges(pendingCount)
          : (t.security?.permissions?.pendingChanges || `${pendingCount} ${pendingCount === 1 ? 'permiso' : 'permisos'} pendiente${pendingCount === 1 ? '' : 's'} de guardar`);

        return (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 }]}>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>
              {pendingText}
            </ThemedText>
            <Button
              title={t.common?.save || 'Guardar'}
              onPress={handleSaveChanges}
              variant="primary"
              size="md"
              disabled={savingChanges}
            >
              {savingChanges && (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
            </Button>
          </View>
        );
      })()}

      {/* Modal de creación/edición */}
      {modalMode && (
          <SideModal
            visible={isModalVisible}
            onClose={handleCloseModal}
            title={
              modalMode === 'edit'
                ? t.security?.permissions?.edit || 'Editar Permiso'
                : t.security?.permissions?.create || 'Crear Permiso'
            }
            subtitle={
              modalMode === 'edit'
                ? 'Modifica los datos del permiso'
                : 'Completa los datos del nuevo permiso'
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
                        : t.security?.permissions?.create || 'Crear Permiso'
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
            {modalMode === 'edit' && selectedPermissionId ? (
              <PermissionEditForm
                permissionId={selectedPermissionId}
                onSuccess={handleFormSuccess}
                onCancel={handleCloseModal}
                showHeader={false}
                showFooter={false}
                onFormReady={setFormActions}
              />
            ) : null}
            {modalMode === 'create' ? (
              <PermissionCreateForm
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

