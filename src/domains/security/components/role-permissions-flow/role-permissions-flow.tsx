/**
 * Componente de visualización de permisos del rol basado en el menú
 * Consulta el menú del rol y genera un árbol jerárquico
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
import { useCompanyOptions } from '../../hooks';
import { createPermissionFlowStyles } from './role-permissions-flow.styles';
import { PermissionFlowProps } from './role-permissions-flow.types';

export function PermissionFlow({ permissions, roleName, roleCode, roleId, companyId }: PermissionFlowProps) {
  const { colors } = useTheme();
  const { isMobile } = useResponsive();
  const { t } = useTranslation();
  const styles = createPermissionFlowStyles(colors, isMobile);
  const { companies, loading: companiesLoading } = useCompanyOptions();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>(companyId);
  
  // Estado para el menú del rol
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  
  // Estado para rastrear qué items están expandidos (inicialmente todos colapsados)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  /**
   * Verifica si existe un permiso para una ruta y acción específica
   * Lógica híbrida: primero busca por ruta exacta, luego por módulo (retrocompatibilidad)
   */
  const hasPermissionForRoute = (route: string | undefined, action: string): boolean => {
    if (!route) return false;

    // 1. Buscar permiso por ruta exacta (sistema nuevo)
    const routePermission = permissions.find(perm => 
      perm.route && 
      perm.route === route && 
      perm.action === action &&
      perm.status === 1 // Solo permisos activos
    );

    if (routePermission) {
      return true;
    }

    // 2. Si no hay permiso por ruta, buscar por módulo (retrocompatibilidad)
    // Extraer módulo de la ruta: "/security/users" -> "security"
    const moduleFromRoute = route.split('/').filter(p => p)[0];
    if (moduleFromRoute) {
      const modulePermission = permissions.find(perm => 
        perm.module === moduleFromRoute && 
        perm.action === action &&
        (perm.route === null || perm.route === undefined || perm.route === '') && // Solo permisos sin ruta
        perm.status === 1 // Solo permisos activos
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

  // Consultar menú del rol cuando cambie el roleId
  useEffect(() => {
    if (!roleId) {
      setMenuItems([]);
      return;
    }

    const loadMenu = async () => {
      setLoadingMenu(true);
      setMenuError(null);
      
      try {
        const menu = await MenuService.getMenuForRole(roleId, 'es');
        setMenuItems(menu);
      } catch (error: any) {
        console.error('Error al cargar menú del rol:', error);
        setMenuError(error.message || 'Error al cargar el menú');
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, [roleId]);


  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      {roleName && (
        <View style={styles.roleHeader}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          
          {/* Selector de empresa alineado a la izquierda */}
          {companies.length > 0 && (
            <View style={styles.companySelector}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.companySelectorContent}
              >
                {companies.map((comp) => (
                  <TouchableOpacity
                    key={comp.id}
                    style={[
                      styles.companyOption,
                      {
                        backgroundColor: selectedCompanyId === comp.id ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCompanyId(comp.id)}
                    disabled={companiesLoading}
                  >
                    <ThemedText
                      type="body2"
                      style={{
                        color: selectedCompanyId === comp.id ? '#FFFFFF' : colors.text,
                        fontWeight: selectedCompanyId === comp.id ? '600' : '400',
                      }}
                    >
                      {comp.name}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {(() => {
        if (loadingMenu) {
          return (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText type="body2" variant="secondary" style={styles.emptyStateText}>
                Cargando menú del rol...
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
                Este rol no tiene menú asignado
              </ThemedText>
            </View>
          );
        }

        return (
          <View style={styles.permissionsContainer}>
            {menuItems.map((menuItem, index) => {
              // Estructura jerárquica: items directos y columnas como grupos
              const directItems: Array<{ id: string; label: string; route?: string; description?: string }> = [];
              if (menuItem.submenu && menuItem.submenu.length > 0) {
                directItems.push(...menuItem.submenu);
              }
              const columnGroups: Array<{ title?: string; items: Array<{ id: string; label: string; route?: string; description?: string }> }> = [];
              if (menuItem.columns && menuItem.columns.length > 0) {
                for (const column of menuItem.columns) {
                  columnGroups.push({
                    title: column.title,
                    items: column.items || [],
                  });
                }
              }

              // Usar el código del rol si el label es "OTROS" o similar
              const displayLabel = menuItem.label.toUpperCase() === 'OTROS' && roleCode 
                ? roleCode.toUpperCase() 
                : menuItem.label.toUpperCase();

              const itemId = menuItem.id || `item-${index}`;
              const isExpanded = expandedItems.has(itemId);
              const hasSubItems = directItems.length > 0 || columnGroups.length > 0;

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
                        {hasAnyPermissionForRoute(menuItem.route) ? (
                          <>
                            {hasPermissionForRoute(menuItem.route, 'view') && (
                              <Tooltip text="Ver" position="top">
                                <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                              </Tooltip>
                            )}
                            {hasPermissionForRoute(menuItem.route, 'create') && (
                              <Tooltip text="Crear" position="top">
                                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                              </Tooltip>
                            )}
                            {hasPermissionForRoute(menuItem.route, 'edit') && (
                              <Tooltip text="Editar" position="top">
                                <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                              </Tooltip>
                            )}
                            {hasPermissionForRoute(menuItem.route, 'delete') && (
                              <Tooltip text="Eliminar" position="top">
                                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                              </Tooltip>
                            )}
                          </>
                        ) : (
                          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                            {t.security.roles.defaultOption}
                          </ThemedText>
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
                        {directItems.length + columnGroups.reduce((acc, g) => acc + g.items.length, 0)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>

                  {/* Lista de items del menú - solo mostrar si está expandido */}
                  {isExpanded && (
                    <View>
                      {/* Items directos */}
                      {directItems.length > 0 && (
                        <View style={styles.permissionsList}>
                          {directItems.map((subItem, subIndex) => (
                            <View
                              key={subItem.id || subIndex}
                              style={[
                                styles.permissionItem,
                                {
                                  backgroundColor: colors.background,
                                  borderColor: colors.border,
                                },
                                subIndex < directItems.length - 1 && styles.permissionItemNotLast,
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
                                {hasAnyPermissionForRoute(subItem.route) ? (
                                  <>
                                    {hasPermissionForRoute(subItem.route, 'view') && (
                                      <Tooltip text="Ver" position="top">
                                        <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                                      </Tooltip>
                                    )}
                                    {hasPermissionForRoute(subItem.route, 'create') && (
                                      <Tooltip text="Crear" position="top">
                                        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                                      </Tooltip>
                                    )}
                                    {hasPermissionForRoute(subItem.route, 'edit') && (
                                      <Tooltip text="Editar" position="top">
                                        <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                                      </Tooltip>
                                    )}
                                    {hasPermissionForRoute(subItem.route, 'delete') && (
                                      <Tooltip text="Eliminar" position="top">
                                        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                                      </Tooltip>
                                    )}
                                  </>
                                ) : (
                                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                                    {t.security.roles.defaultOption}
                                  </ThemedText>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Grupos de columnas */}
                      {columnGroups.map((group, groupIndex) => (
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
                                    {hasAnyPermissionForRoute(subItem.route) ? (
                                      <>
                                        {hasPermissionForRoute(subItem.route, 'view') && (
                                          <Tooltip text="Ver" position="top">
                                            <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                                          </Tooltip>
                                        )}
                                        {hasPermissionForRoute(subItem.route, 'create') && (
                                          <Tooltip text="Crear" position="top">
                                            <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                                          </Tooltip>
                                        )}
                                        {hasPermissionForRoute(subItem.route, 'edit') && (
                                          <Tooltip text="Editar" position="top">
                                            <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
                                          </Tooltip>
                                        )}
                                        {hasPermissionForRoute(subItem.route, 'delete') && (
                                          <Tooltip text="Eliminar" position="top">
                                            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                                          </Tooltip>
                                        )}
                                      </>
                                    ) : (
                                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>
                                        {t.security.roles.defaultOption}
                                      </ThemedText>
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

