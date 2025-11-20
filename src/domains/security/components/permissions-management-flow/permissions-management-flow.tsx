/**
 * Componente de administración masiva de permisos
 * Basado en el diseño de role-permissions-flow pero para edición masiva
 */

import { ThemedText } from '@/components/themed-text';
import { Tooltip } from '@/components/ui/tooltip';
import { useResponsive } from '@/hooks/use-responsive';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { MenuService } from '@/src/infrastructure/menu/menu.service';
import { MenuItem } from '@/src/infrastructure/menu/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { createPermissionFlowStyles } from '../role-permissions-flow/role-permissions-flow.styles';
import { PermissionsManagementFlowProps, PermissionChange } from './permissions-management-flow.types';

export function PermissionsManagementFlow({ 
  permissions, 
  roleId,
  onChanges,
  searchValue = '',
  selectedModule = '',
  selectedAction = '',
  onMenuItemsLoaded,
}: PermissionsManagementFlowProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createPermissionFlowStyles(colors, isMobile);
  
  // Estado para el menú completo
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  
  // Estado para rastrear qué items están expandidos (inicialmente todos colapsados)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  // Estado para rastrear cambios de permisos
  // Estructura: { [route]: { view: boolean, create: boolean, edit: boolean, delete: boolean } }
  const [permissionChanges, setPermissionChanges] = useState<Record<string, {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  }>>({});

  /**
   * Verifica si existe un permiso para una ruta y acción específica
   */
  const hasPermissionForRoute = (route: string | undefined, action: string): boolean => {
    if (!route) return false;

    // Buscar permiso por ruta exacta
    const routePermission = permissions.find(perm => 
      perm.route && 
      perm.route === route && 
      perm.action === action &&
      perm.status === 1 // Solo permisos activos
    );

    if (routePermission) {
      return true;
    }

    // Si no hay permiso por ruta, buscar por módulo (retrocompatibilidad)
    const moduleFromRoute = route.split('/').filter(p => p)[0];
    if (moduleFromRoute) {
      const modulePermission = permissions.find(perm => 
        perm.module === moduleFromRoute && 
        perm.action === action &&
        (perm.route === null || perm.route === undefined || perm.route === '') &&
        perm.status === 1
      );

      if (modulePermission) {
        return true;
      }
    }

    return false;
  };

  /**
   * Verifica si existe al menos un permiso para una ruta (cualquiera de las 4 acciones)
   * Usado para determinar si mostrar iconos o el texto "Opción por defecto"
   */
  const hasAnyPermissionForRoute = (route: string | undefined): boolean => {
    if (!route) return false;
    return ['view', 'create', 'edit', 'delete'].some(action => hasPermissionForRoute(route, action));
  };

  /**
   * Obtiene el estado actual de un permiso (considerando cambios pendientes)
   */
  const getPermissionState = (route: string | undefined, action: string): boolean => {
    if (!route) return false;
    
    // Si hay cambios pendientes, usar esos
    if (permissionChanges[route]) {
      return permissionChanges[route][action as keyof typeof permissionChanges[typeof route]] || false;
    }
    
    // Si no, usar el estado actual
    return hasPermissionForRoute(route, action);
  };

  /**
   * Toggle de un permiso específico
   */
  const togglePermission = (route: string | undefined, action: string) => {
    if (!route) return;
    
    setPermissionChanges((prev) => {
      const currentState = getPermissionState(route, action);
      const newState = !currentState;
      
      const newChanges = { ...prev };
      
      if (!newChanges[route]) {
        // Inicializar con el estado actual
        newChanges[route] = {
          view: hasPermissionForRoute(route, 'view'),
          create: hasPermissionForRoute(route, 'create'),
          edit: hasPermissionForRoute(route, 'edit'),
          delete: hasPermissionForRoute(route, 'delete'),
        };
      }
      
      // Aplicar el cambio
      newChanges[route] = {
        ...newChanges[route],
        [action]: newState,
      };
      
      // Si todos los valores coinciden con el estado original, eliminar el cambio
      const originalView = hasPermissionForRoute(route, 'view');
      const originalCreate = hasPermissionForRoute(route, 'create');
      const originalEdit = hasPermissionForRoute(route, 'edit');
      const originalDelete = hasPermissionForRoute(route, 'delete');
      
      if (
        newChanges[route].view === originalView &&
        newChanges[route].create === originalCreate &&
        newChanges[route].edit === originalEdit &&
        newChanges[route].delete === originalDelete
      ) {
        delete newChanges[route];
      }
      
      // Notificar cambios al padre
      if (onChanges) {
        const changes: PermissionChange[] = Object.entries(newChanges).map(([route, actions]) => ({
          route,
          view: actions.view,
          create: actions.create,
          edit: actions.edit,
          delete: actions.delete,
        }));
        onChanges(changes);
      }
      
      return newChanges;
    });
  };

  // Consultar menú del rol o menú completo
  useEffect(() => {
    if (!roleId) {
      // Si no hay roleId, cargar menú completo
      const loadMenu = async () => {
        setLoadingMenu(true);
        setMenuError(null);
        
        try {
          const menu = await MenuService.getMenu('es', true); // showAll = true para mostrar todas las opciones
          setMenuItems(menu);
          onMenuItemsLoaded?.(menu);
        } catch (error: any) {
          console.error('Error al cargar menú:', error);
          setMenuError(error.message || 'Error al cargar el menú');
        } finally {
          setLoadingMenu(false);
        }
      };

      loadMenu();
      return;
    }

    // Si hay roleId, cargar menú del rol específico
    const loadMenuForRole = async () => {
      setLoadingMenu(true);
      setMenuError(null);
      
        try {
          const menu = await MenuService.getMenuForRole(roleId, 'es', true); // showAll = true para mostrar todas las opciones
          setMenuItems(menu);
          onMenuItemsLoaded?.(menu);
        } catch (error: any) {
        console.error('Error al cargar menú del rol:', error);
        setMenuError(error.message || 'Error al cargar el menú del rol');
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenuForRole();
  }, [roleId]);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {(() => {
        if (loadingMenu) {
          return (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText type="body2" variant="secondary" style={styles.emptyStateText}>
                Cargando menú...
              </ThemedText>
            </View>
          );
        }

        if (menuError) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle" size={64} color={colors.error || colors.textSecondary} />
              <ThemedText type="body1" variant="secondary" style={styles.emptyStateText}>
                {menuError}
              </ThemedText>
            </View>
          );
        }

        if (menuItems.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
              <ThemedText type="body1" variant="secondary" style={styles.emptyStateText}>
                No hay items de menú disponibles
              </ThemedText>
            </View>
          );
        }

        // Aplicar filtros a los menuItems
        const filteredMenuItems = menuItems.filter((menuItem) => {
          // Filtro por módulo
          if (selectedModule && menuItem.label !== selectedModule) {
            return false;
          }

          // Filtro por búsqueda (label, route, description)
          if (searchValue.trim()) {
            const searchLower = searchValue.toLowerCase();
            const matchesLabel = menuItem.label?.toLowerCase().includes(searchLower);
            const matchesRoute = menuItem.route?.toLowerCase().includes(searchLower);
            const matchesDescription = menuItem.description?.toLowerCase().includes(searchLower);
            
            // También buscar en subitems
            let matchesSubItems = false;
            if (menuItem.submenu) {
              matchesSubItems = menuItem.submenu.some((subItem) => {
                return (
                  subItem.label?.toLowerCase().includes(searchLower) ||
                  subItem.route?.toLowerCase().includes(searchLower) ||
                  subItem.description?.toLowerCase().includes(searchLower)
                );
              });
            }
            
            // También buscar en columnas
            let matchesColumns = false;
            if (menuItem.columns) {
              matchesColumns = menuItem.columns.some((column) => {
                return column.items?.some((item) => {
                  return (
                    item.label?.toLowerCase().includes(searchLower) ||
                    item.route?.toLowerCase().includes(searchLower) ||
                    item.description?.toLowerCase().includes(searchLower)
                  );
                });
              });
            }

            if (!matchesLabel && !matchesRoute && !matchesDescription && !matchesSubItems && !matchesColumns) {
              return false;
            }
          }

          // Filtro por acción (solo si se seleccionó una acción)
          if (selectedAction) {
            const hasActionPermission = hasPermissionForRoute(menuItem.route, selectedAction);
            
            // Verificar también en subitems
            let hasActionInSubItems = false;
            if (menuItem.submenu) {
              hasActionInSubItems = menuItem.submenu.some((subItem) =>
                hasPermissionForRoute(subItem.route, selectedAction)
              );
            }
            
            // Verificar también en columnas
            let hasActionInColumns = false;
            if (menuItem.columns) {
              hasActionInColumns = menuItem.columns.some((column) =>
                column.items?.some((item) => hasPermissionForRoute(item.route, selectedAction))
              );
            }

            if (!hasActionPermission && !hasActionInSubItems && !hasActionInColumns) {
              return false;
            }
          }

          return true;
        });

        // Función auxiliar para verificar si un item debe mostrarse según los filtros
        const shouldShowItem = (item: { label?: string; route?: string; description?: string; isPublic?: boolean }): boolean => {
          // Filtro por búsqueda
          if (searchValue.trim()) {
            const searchLower = searchValue.toLowerCase();
            const matchesLabel = item.label?.toLowerCase().includes(searchLower);
            const matchesRoute = item.route?.toLowerCase().includes(searchLower);
            const matchesDescription = item.description?.toLowerCase().includes(searchLower);
            
            if (!matchesLabel && !matchesRoute && !matchesDescription) {
              return false;
            }
          }

          // Filtro por acción
          if (selectedAction) {
            return hasPermissionForRoute(item.route, selectedAction);
          }

          return true;
        };

        return (
          <View style={styles.permissionsContainer}>
            {filteredMenuItems.map((menuItem, index) => {
              // Estructura jerárquica: items directos y columnas como grupos
              const directItems: Array<{ id: string; label: string; route?: string; description?: string; isPublic?: boolean }> = [];
              if (menuItem.submenu && menuItem.submenu.length > 0) {
                directItems.push(...menuItem.submenu);
              }
              const columnGroups: Array<{ title?: string; items: Array<{ id: string; label: string; route?: string; description?: string; isPublic?: boolean }> }> = [];
              if (menuItem.columns && menuItem.columns.length > 0) {
                for (const column of menuItem.columns) {
                  columnGroups.push({
                    title: column.title,
                    items: column.items || [],
                  });
                }
              }

              // Filtrar items directos y columnas según los filtros aplicados
              const filteredDirectItems = directItems.filter((item) => shouldShowItem(item));
              const filteredColumnGroups = columnGroups.map((group) => ({
                ...group,
                items: group.items.filter((item) => shouldShowItem(item)),
              })).filter((group) => group.items.length > 0); // Solo mostrar grupos que tengan items después del filtro

              const displayLabel = menuItem.label.toUpperCase();

              const itemId = menuItem.id || `item-${index}`;
              const isExpanded = expandedItems.has(itemId);
              const hasSubItems = filteredDirectItems.length > 0 || filteredColumnGroups.length > 0;

              // Toggle para expandir/colapsar
              const toggleExpand = () => {
                setExpandedItems((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(itemId)) {
                    newSet.delete(itemId);
                  } else {
                    newSet.add(itemId);
                  }
                  return newSet;
                });
              };

              // Si NO tiene subitems, renderizar directamente como un permissionItem (página)
              if (!hasSubItems) {
                return (
                  <View key={itemId} style={styles.moduleContainer}>
                    <View 
                      style={[
                        styles.permissionItem,
                        { 
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.permissionItemLeft}>
                        <View style={[styles.permissionIcon, { backgroundColor: colors.primary + '15' }]}>
                          <Ionicons 
                            name="document-text" 
                            size={16} 
                            color={colors.primary} 
                          />
                        </View>
                        <View style={styles.permissionInfo}>
                          <ThemedText type="body2" style={{ color: colors.text, fontWeight: '500' }}>
                            {menuItem.label}
                          </ThemedText>
                          {menuItem.description && (
                            <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                              {menuItem.description}
                            </ThemedText>
                          )}
                          {menuItem.route && (
                            <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                              {menuItem.route}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <View style={styles.permissionActions}>
                        {menuItem.isPublic === true || menuItem.isPublic === 'true' || menuItem.isPublic === 1 ? (
                          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            {t.security?.roles?.defaultOption || 'Opción por defecto'}
                          </ThemedText>
                        ) : (
                          <>
                            <Tooltip text="Ver" position="top">
                              <TouchableOpacity onPress={() => togglePermission(menuItem.route, 'view')}>
                                <Ionicons 
                                  name="eye-outline" 
                                  size={18} 
                                  color={getPermissionState(menuItem.route, 'view') ? colors.primaryDark : colors.textSecondary} 
                                />
                              </TouchableOpacity>
                            </Tooltip>
                            <Tooltip text="Crear" position="top">
                              <TouchableOpacity onPress={() => togglePermission(menuItem.route, 'create')}>
                                <Ionicons 
                                  name="create-outline" 
                                  size={18} 
                                  color={getPermissionState(menuItem.route, 'create') ? colors.primaryDark : colors.textSecondary} 
                                />
                              </TouchableOpacity>
                            </Tooltip>
                            <Tooltip text="Editar" position="top">
                              <TouchableOpacity onPress={() => togglePermission(menuItem.route, 'edit')}>
                                <Ionicons 
                                  name="pencil-outline" 
                                  size={18} 
                                  color={getPermissionState(menuItem.route, 'edit') ? colors.primaryDark : colors.textSecondary} 
                                />
                              </TouchableOpacity>
                            </Tooltip>
                            <Tooltip text="Eliminar" position="top">
                              <TouchableOpacity onPress={() => togglePermission(menuItem.route, 'delete')}>
                                <Ionicons 
                                  name="trash-outline" 
                                  size={18} 
                                  color={getPermissionState(menuItem.route, 'delete') ? colors.primaryDark : colors.textSecondary} 
                                />
                              </TouchableOpacity>
                            </Tooltip>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }

              // Si SÍ tiene subitems, renderizar como módulo colapsable
              return (
                <View key={itemId} style={styles.moduleContainer}>
                  {/* Header del módulo/item del menú - siempre clickeable */}
                  <TouchableOpacity
                    style={[styles.moduleHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={toggleExpand}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleHeaderLeft}>
                      <View style={[styles.moduleIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="cube" size={20} color={colors.primary} />
                      </View>
                      <ThemedText type="body1" style={[styles.moduleTitle, { color: colors.text }]}>
                        {displayLabel}
                      </ThemedText>
                      <Ionicons 
                        name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
                        size={20} 
                        color={colors.textSecondary} 
                        style={styles.chevronIcon}
                      />
                    </View>
                    <View style={[styles.moduleBadge]}>
                      <ThemedText type="caption" style={{ color: '#fff', fontWeight: '600' }}>
                        {filteredDirectItems.length + filteredColumnGroups.reduce((acc, g) => acc + g.items.length, 0)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Lista de items del menú - solo mostrar si está expandido */}
                  {isExpanded && (
                    <View>
                      {/* Items directos */}
                      {filteredDirectItems.length > 0 && (
                        <View style={styles.permissionsList}>
                          {filteredDirectItems.map((subItem, subIndex) => (
                              <View
                                key={subItem.id || subIndex}
                                style={[
                                  styles.permissionItem,
                                  {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                  },
                                  subIndex < filteredDirectItems.length - 1 && styles.permissionItemNotLast,
                              ]}
                            >
                              <View style={styles.permissionItemLeft}>
                                <View style={[styles.permissionIcon, { backgroundColor: colors.primary + '15' }]}>
                                  <Ionicons name="document-text" size={16} color={colors.primary} />
                                </View>
                                <View style={styles.permissionInfo}>
                                  <ThemedText type="body2" style={{ color: colors.text, fontWeight: '500' }}>
                                    {subItem.label}
                                  </ThemedText>
                                  {subItem.description && (
                                    <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                                      {subItem.description}
                                    </ThemedText>
                                  )}
                                  {subItem.route && (
                                    <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                                      {subItem.route}
                                    </ThemedText>
                                  )}
                                </View>
                              </View>
                              <View style={styles.permissionActions}>
                                {subItem.isPublic === true || subItem.isPublic === 'true' || subItem.isPublic === 1 ? (
                                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                                    {t.security?.roles?.defaultOption || 'Opción por defecto'}
                                  </ThemedText>
                                ) : (
                                  <>
                                    <Tooltip text="Ver" position="top">
                                      <TouchableOpacity onPress={() => togglePermission(subItem.route, 'view')}>
                                        <Ionicons 
                                          name="eye-outline" 
                                          size={18} 
                                          color={getPermissionState(subItem.route, 'view') ? colors.primaryDark : colors.textSecondary} 
                                        />
                                      </TouchableOpacity>
                                    </Tooltip>
                                    <Tooltip text="Crear" position="top">
                                      <TouchableOpacity onPress={() => togglePermission(subItem.route, 'create')}>
                                        <Ionicons 
                                          name="create-outline" 
                                          size={18} 
                                          color={getPermissionState(subItem.route, 'create') ? colors.primaryDark : colors.textSecondary} 
                                        />
                                      </TouchableOpacity>
                                    </Tooltip>
                                    <Tooltip text="Editar" position="top">
                                      <TouchableOpacity onPress={() => togglePermission(subItem.route, 'edit')}>
                                        <Ionicons 
                                          name="pencil-outline" 
                                          size={18} 
                                          color={getPermissionState(subItem.route, 'edit') ? colors.primaryDark : colors.textSecondary} 
                                        />
                                      </TouchableOpacity>
                                    </Tooltip>
                                    <Tooltip text="Eliminar" position="top">
                                      <TouchableOpacity onPress={() => togglePermission(subItem.route, 'delete')}>
                                        <Ionicons 
                                          name="trash-outline" 
                                          size={18} 
                                          color={getPermissionState(subItem.route, 'delete') ? colors.primaryDark : colors.textSecondary} 
                                        />
                                      </TouchableOpacity>
                                    </Tooltip>
                                  </>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Grupos de columnas */}
                      {filteredColumnGroups.map((group, groupIndex) => (
                        <View key={`group-${groupIndex}`} style={styles.groupContainer}>
                          <View style={[styles.groupHeader, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                            <ThemedText type="body2" style={[styles.groupTitle, { color: colors.text }]}>
                              {group.title || 'Grupo'}
                            </ThemedText>
                            <View style={styles.groupBadge}>
                              <ThemedText type="caption" style={{ color: colors.text, fontWeight: '600' }}>
                                {group.items.length}
                              </ThemedText>
                            </View>
                          </View>

                          {group.items.length > 0 && (
                            <View style={styles.permissionsList}>
                              {group.items.map((subItem, subIndex) => (
                                  <View
                                    key={subItem.id || subIndex}
                                    style={[
                                      styles.permissionItem,
                                      {
                                        backgroundColor: colors.background,
                                        borderColor: colors.border,
                                      },
                                      subIndex < group.items.length - 1 && styles.permissionItemNotLast,
                                  ]}
                                >
                                  <View style={styles.permissionItemLeft}>
                                    <View style={[styles.permissionIcon, { backgroundColor: colors.primary + '15' }]}>
                                      <Ionicons name="document-text" size={16} color={colors.primary} />
                                    </View>
                                    <View style={styles.permissionInfo}>
                                      <ThemedText type="body2" style={{ color: colors.text, fontWeight: '500' }}>
                                        {subItem.label}
                                      </ThemedText>
                                      {subItem.description && (
                                        <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                                          {subItem.description}
                                        </ThemedText>
                                      )}
                                      {subItem.route && (
                                        <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
                                          {subItem.route}
                                        </ThemedText>
                                      )}
                                    </View>
                                  </View>
                                  <View style={styles.permissionActions}>
                                    {subItem.isPublic === true || subItem.isPublic === 'true' || subItem.isPublic === 1 ? (
                                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                                        {t.security?.roles?.defaultOption || 'Opción por defecto'}
                                      </ThemedText>
                                    ) : (
                                      <>
                                        <Tooltip text="Ver" position="top">
                                          <TouchableOpacity onPress={() => togglePermission(subItem.route, 'view')}>
                                            <Ionicons 
                                              name="eye-outline" 
                                              size={18} 
                                              color={getPermissionState(subItem.route, 'view') ? colors.primaryDark : colors.textSecondary} 
                                            />
                                          </TouchableOpacity>
                                        </Tooltip>
                                        <Tooltip text="Crear" position="top">
                                          <TouchableOpacity onPress={() => togglePermission(subItem.route, 'create')}>
                                            <Ionicons 
                                              name="create-outline" 
                                              size={18} 
                                              color={getPermissionState(subItem.route, 'create') ? colors.primaryDark : colors.textSecondary} 
                                            />
                                          </TouchableOpacity>
                                        </Tooltip>
                                        <Tooltip text="Editar" position="top">
                                          <TouchableOpacity onPress={() => togglePermission(subItem.route, 'edit')}>
                                            <Ionicons 
                                              name="pencil-outline" 
                                              size={18} 
                                              color={getPermissionState(subItem.route, 'edit') ? colors.primaryDark : colors.textSecondary} 
                                            />
                                          </TouchableOpacity>
                                        </Tooltip>
                                        <Tooltip text="Eliminar" position="top">
                                          <TouchableOpacity onPress={() => togglePermission(subItem.route, 'delete')}>
                                            <Ionicons 
                                              name="trash-outline" 
                                              size={18} 
                                              color={getPermissionState(subItem.route, 'delete') ? colors.primaryDark : colors.textSecondary} 
                                            />
                                          </TouchableOpacity>
                                        </Tooltip>
                                      </>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })()}
    </ScrollView>
  );
}

