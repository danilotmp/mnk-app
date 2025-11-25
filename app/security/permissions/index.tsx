/**
 * Página principal de administración de Permisos
 * Lista de permisos con paginación, búsqueda y filtros
 */

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { CenteredModal } from '@/components/ui/centered-modal';
import { Select } from '@/components/ui/select';
import { SideModal } from '@/components/ui/side-modal';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { PermissionsService, useCompanyOptions } from '@/src/domains/security';
import type { PermissionChange } from '@/src/domains/security/components';
import { PermissionCreateForm, PermissionEditForm, PermissionsCarousel, PermissionsFlowFilters, PermissionsManagementFlow } from '@/src/domains/security/components';
import type { SecurityPermission, SecurityRole } from '@/src/domains/security/types';
import type { PermissionOperation, RoleFilters } from '@/src/features/security/roles';
import { RolesService } from '@/src/features/security/roles';
import { useRouteAccessGuard } from '@/src/infrastructure/access';
import { useTranslation } from '@/src/infrastructure/i18n';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { useAlert } from '@/src/infrastructure/messages/alert.service';
import { createPermissionsListStyles } from '@/src/styles/pages/permissions-list.styles';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, usePathname } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function PermissionsListPage() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const pathname = usePathname();
  const searchParams = useLocalSearchParams<{ companyId?: string; roleId?: string }>();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = createPermissionsListStyles(isMobile);

  const {
    loading: accessLoading,
    allowed: hasAccess,
    handleApiError,
  } = useRouteAccessGuard(pathname);

  const [rolePermissions, setRolePermissions] = useState<SecurityPermission[]>([]); // Permisos del rol seleccionado
  const [loadingRolePermissions, setLoadingRolePermissions] = useState(false);
  const [menuRefreshKey, setMenuRefreshKey] = useState(0); // Key para forzar recarga del menú
  
  // Estado para rastrear cambios masivos de permisos
  const [permissionChanges, setPermissionChanges] = useState<PermissionChange[]>([]);
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Estados para modales de permisos
  const [isCarouselModalVisible, setIsCarouselModalVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<SecurityPermission[]>([]);
  const [loadingAllPermissions, setLoadingAllPermissions] = useState(false);
  const [formActions, setFormActions] = useState<{ isLoading: boolean; handleSubmit: () => void; handleCancel: () => void } | null>(null);
  
  // Estados para los selectores dependientes
  // Inicializar con query params si existen (para redirección desde roles)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(
    searchParams.companyId || undefined
  );
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    searchParams.roleId || undefined
  );
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
  const { companies } = useCompanyOptions();

  /**
   * Cargar todos los permisos para el carrusel
   */
  const loadAllPermissions = useCallback(async () => {
    try {
      setLoadingAllPermissions(true);
      const response = await PermissionsService.getPermissions({
        page: 1,
        limit: 1000, // Cargar muchos permisos para el carrusel
      });
      
      if (response && response.data) {
        setAllPermissions(Array.isArray(response.data) ? response.data : []);
      } else {
        setAllPermissions([]);
      }
    } catch (error: any) {
      console.error('Error al cargar permisos:', error);
      setAllPermissions([]);
    } finally {
      setLoadingAllPermissions(false);
    }
  }, []);

  /**
   * Abrir modal de carrusel de permisos
   */
  const handleOpenCarousel = () => {
    loadAllPermissions();
    setIsCarouselModalVisible(true);
  };

  /**
   * Manejar selección de permiso del carrusel (editar)
   */
  const handlePermissionSelect = (permission: SecurityPermission) => {
    setIsCarouselModalVisible(false);
    setSelectedPermissionId(permission.id);
    setIsEditModalVisible(true);
  };

  /**
   * Manejar creación de nuevo permiso desde el carrusel
   */
  const handleCreateFromCarousel = () => {
    setIsCarouselModalVisible(false);
    setIsCreateModalVisible(true);
  };

  /**
   * Cerrar modales
   */
  const handleCloseCreateModal = () => {
    setIsCreateModalVisible(false);
    setFormActions(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedPermissionId(null);
    setFormActions(null);
  };

  /**
   * Manejar éxito al crear/editar permiso
   */
  const handleFormSuccess = () => {
    loadAllPermissions(); // Recargar permisos del carrusel
    handleCloseCreateModal();
    handleCloseEditModal();
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
        (p: SecurityPermission) => p.action === action && (!p.route || p.route === '')
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
      
      // Si hay un roleId en los query params y está en los roles cargados, seleccionarlo automáticamente
      if (searchParams.roleId && companyRoles.find(r => r.id === searchParams.roleId)) {
        setSelectedRoleId(searchParams.roleId);
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
  }, [selectedRoleId, handleApiError, searchParams.roleId]);

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
   * Nota: La carga de permisos se maneja automáticamente en el useEffect
   * que observa selectedRoleId, por lo que aquí solo actualizamos el estado
   */
  const handleRoleChange = (roleId: string | undefined) => {
    setSelectedRoleId(roleId);
    setPermissionChanges([]); // Limpiar cambios pendientes al cambiar de rol
    // Los permisos se cargarán automáticamente en el useEffect que observa selectedRoleId
  };

  // Cargar roles cuando cambia la empresa seleccionada
  useEffect(() => {
    loadRolesByCompany(selectedCompanyId);
  }, [selectedCompanyId, loadRolesByCompany]);

  // Cargar permisos del rol cuando cambia selectedRoleId
  // Esto se ejecuta tanto cuando el usuario cambia manualmente el selector
  // como cuando se establece desde los query params
  useEffect(() => {
    if (selectedRoleId) {
      // Limpiar permisos anteriores y cambios pendientes al cambiar de rol
      setPermissionChanges([]);
      
      // Cargar permisos del rol seleccionado
      const loadRolePermissions = async () => {
        try {
          setLoadingRolePermissions(true);
          const role = await RolesService.getRoleById(selectedRoleId);
          // Asegurar que los permisos se actualicen correctamente
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
      };
      
      loadRolePermissions();
    } else {
      setRolePermissions([]);
      setPermissionChanges([]);
    }
  }, [selectedRoleId, handleApiError]);

  // Aplicar query params al cargar la página (si vienen de redirección desde roles)
  // Esto permite que cuando se redirija desde la pantalla de roles, se seleccionen automáticamente
  // la empresa y el rol correspondientes
  useEffect(() => {
    // Si hay companyId en los query params y no está seleccionado, seleccionarlo
    if (searchParams.companyId && searchParams.companyId !== selectedCompanyId) {
      setSelectedCompanyId(searchParams.companyId);
    }
    // El roleId se manejará automáticamente cuando se carguen los roles en loadRolesByCompany
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.companyId, searchParams.roleId]);


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
            onPress={handleOpenCarousel}
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
        {selectedRoleId && !loadingRolePermissions ? (
          <View style={styles.dataTableContainer}>
            <PermissionsManagementFlow
              key={`${selectedRoleId}-${menuRefreshKey}-${rolePermissions.length}`} // Key incluye selectedRoleId, menuRefreshKey y length de permisos para forzar recarga
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
          </View>
        ) : selectedRoleId && loadingRolePermissions ? (
          <View style={styles.dataTableContainer}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText type="body2" variant="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
                Cargando permisos del rol...
              </ThemedText>
            </View>
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

      {/* Modal de carrusel de permisos */}
      <CenteredModal
        visible={isCarouselModalVisible}
        onClose={() => setIsCarouselModalVisible(false)}
        title={t.security?.permissions?.title || 'Seleccionar Permiso'}
        subtitle={t.security?.permissions?.subtitle || 'Selecciona un permiso para editar o crea uno nuevo'}
        width="90%"
        height="60%"
      >
        {loadingAllPermissions ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body2" variant="secondary" style={{ marginTop: 16 }}>
              Cargando permisos...
            </ThemedText>
          </View>
        ) : (
          <PermissionsCarousel
            permissions={allPermissions}
            onPermissionSelect={handlePermissionSelect}
            onCreateNew={handleCreateFromCarousel}
          />
        )}
      </CenteredModal>

      {/* Modal de creación de permiso */}
      {isCreateModalVisible && (
        <SideModal
          visible={isCreateModalVisible}
          onClose={handleCloseCreateModal}
          title={t.security?.permissions?.create || 'Crear Permiso'}
          subtitle={t.security?.permissions?.createSubtitle || 'Completa los datos para registrar un nuevo permiso'}
          footer={
            formActions ? (
              <>
                <Button
                  title={t.common?.cancel || 'Cancelar'}
                  onPress={formActions.handleCancel}
                  variant="outlined"
                  size="md"
                  disabled={formActions.isLoading}
                />
                <Button
                  title={t.security?.permissions?.create || 'Crear Permiso'}
                  onPress={formActions.handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          <PermissionCreateForm
            onSuccess={handleFormSuccess}
            onCancel={handleCloseCreateModal}
            showHeader={false}
            showFooter={false}
            onFormReady={setFormActions}
          />
        </SideModal>
      )}

      {/* Modal de edición de permiso */}
      {isEditModalVisible && selectedPermissionId && (
        <SideModal
          visible={isEditModalVisible}
          onClose={handleCloseEditModal}
          title={t.security?.permissions?.edit || 'Editar Permiso'}
          subtitle={t.security?.permissions?.editSubtitle || 'Modifica los datos del permiso'}
          footer={
            formActions ? (
              <>
                <Button
                  title={t.common?.cancel || 'Cancelar'}
                  onPress={formActions.handleCancel}
                  variant="outlined"
                  size="md"
                  disabled={formActions.isLoading}
                />
                <Button
                  title={t.common?.save || 'Guardar'}
                  onPress={formActions.handleSubmit}
                  variant="primary"
                  size="md"
                  disabled={formActions.isLoading}
                />
              </>
            ) : null
          }
        >
          <PermissionEditForm
            permissionId={selectedPermissionId}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseEditModal}
            showHeader={false}
            showFooter={false}
            onFormReady={setFormActions}
          />
        </SideModal>
      )}

    </ThemedView>
  );
}

