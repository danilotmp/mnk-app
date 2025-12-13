/**
 * Componente reutilizable para renderizar los iconos de acción de permisos
 * O el texto "Opción por defecto" si el item es público
 */

import { ThemedText } from '@/components/themed-text';
import { Tooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { DynamicIcon } from '@/src/domains/security/components/shared/dynamic-icon/dynamic-icon';
import { SecurityPermission } from '@/src/domains/security/types';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';

export interface PermissionActionIconsProps {
  /**
   * Ruta del item del menú
   */
  route?: string;
  
  /**
   * Si el item es público (isPublic = true)
   */
  isPublic?: boolean;
  
  /**
   * Si los iconos son interactivos (para administración de permisos)
   * Si es false, solo muestra los iconos sin interacción (para visualización)
   */
  interactive?: boolean;
  
  /**
   * Callback cuando se hace toggle de un permiso (solo si interactive = true)
   */
  onTogglePermission?: (route: string | undefined, action: string) => void;
  
  /**
   * Función para obtener el estado actual de un permiso (solo si interactive = true)
   */
  getPermissionState?: (route: string | undefined, action: string) => boolean;
  
  /**
   * Función para verificar si existe un permiso (solo si interactive = false)
   */
  hasPermissionForRoute?: (route: string | undefined, action: string) => boolean;
  
  /**
   * Función para verificar si hay un cambio pendiente (aún no guardado) para una ruta y acción específica
   * Si retorna true, el icono se mostrará en color verde para indicar que hay un cambio pendiente
   */
  hasPendingChange?: (route: string | undefined, action: string) => boolean;
  
  /**
   * Permisos personalizados (isSystem = false) para mostrar iconos adicionales
   */
  customPermissions?: SecurityPermission[];
  
  /**
   * ID del item del menú para verificar si está en algún permiso personalizado
   */
  menuItemId?: string;
  
  /**
   * Estilo del contenedor de acciones
   */
  containerStyle?: any;
}

/**
 * Componente que renderiza los iconos de acción de permisos
 * O el texto "Opción por defecto" si el item es público
 */
export function PermissionActionIcons({
  route,
  isPublic = false,
  interactive = false,
  onTogglePermission,
  getPermissionState,
  hasPermissionForRoute,
  hasPendingChange,
  customPermissions = [],
  menuItemId,
  containerStyle,
}: PermissionActionIconsProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Color para iconos activos: primaryDark en dark theme, primary en light theme
  const activeIconColor = isDark ? colors.primaryDark : colors.primary;
  
  // Encontrar permisos personalizados que incluyen este menuItemId (debe estar antes del early return)
  const customPermsForMenuItem = useMemo(() => {
    if (!menuItemId || !customPermissions || customPermissions.length === 0) {
      return [];
    }
    
    const matchingPerms = customPermissions
      .filter((perm) => {
        // Verificar si el menuItemId está en el array menuItemIds del permiso
        if (!perm.menuItemIds || !Array.isArray(perm.menuItemIds)) {
          return false;
        }
        
        // Comparar el menuItemId con los IDs en el array menuItemIds
        // El backend puede devolver menuItemIds como array de strings o como array de objetos
        const hasMenuItem = perm.menuItemIds.some((id: string | any) => {
          // Si es un objeto, extraer el id
          if (typeof id === 'object' && id !== null && id.id) {
            return String(id.id) === String(menuItemId);
          }
          // Si es un string, comparar directamente (normalizar ambos a string para comparación)
          return String(id) === String(menuItemId);
        });
        
        return hasMenuItem;
      })
      .sort((a, b) => {
        // Ordenar por el campo order
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });
    
    
    return matchingPerms;
  }, [menuItemId, customPermissions]);
  
  // Verificar si es público (flexible: boolean, string "true", o número 1)
  const isPublicValue = isPublic === true || 
                        (typeof isPublic === 'string' && isPublic === 'true') || 
                        (typeof isPublic === 'number' && isPublic === 1);
  
  // Si es público, mostrar texto "Opción por defecto"
  if (isPublicValue) {
    return (
      <View style={containerStyle}>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {t.security?.roles?.defaultOption || 'Opción por defecto'}
        </ThemedText>
      </View>
    );
  }
  
  // Si no es público, mostrar iconos de acción
  const actions = [
    { name: 'view', icon: 'eye-outline', tooltip: t.common?.view || 'Ver' },
    { name: 'create', icon: 'create-outline', tooltip: t.common?.create || 'Crear' },
    { name: 'edit', icon: 'pencil-outline', tooltip: t.common?.edit || 'Editar' },
    { name: 'delete', icon: 'trash-outline', tooltip: t.common?.delete || 'Eliminar' },
  ];
  
  // Filtrar acciones según el modo
  const filteredActions = actions.filter((action) => {
    // Si es interactivo, mostrar todas las acciones
    if (interactive) {
      return true;
    }
    
    // Si no es interactivo, solo mostrar si tiene permiso
    if (hasPermissionForRoute) {
      return hasPermissionForRoute(route, action.name);
    }
    
    return false;
  });
  
  // Si no hay acciones para mostrar, retornar null
  if (filteredActions.length === 0) {
    return null;
  }
  
  // Función para renderizar un icono de acción estándar
  const renderActionIcon = (action: { name: string; icon: string; tooltip: string }) => {
    // Determinar si el permiso está activo
    let isActive = false;
    if (interactive && getPermissionState) {
      isActive = getPermissionState(route, action.name);
    } else if (!interactive && hasPermissionForRoute) {
      isActive = hasPermissionForRoute(route, action.name);
    }
    
    // Verificar si hay un cambio pendiente (no guardado aún)
    const hasPending = hasPendingChange ? hasPendingChange(route, action.name) : false;
    
    // Color del icono según estado (sin considerar cambios pendientes para el color)
    // Si está activo, usar el color de tema
    // Si no está activo, usar color secundario
    const iconColor = isActive ? activeIconColor : colors.textSecondary;
    
    // Renderizar icono con punto verde debajo si hay cambio pendiente
    const iconElement = (
      <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 28, minWidth: 24, paddingBottom: hasPending ? 6 : 0 }}>
        <Ionicons 
          name={action.icon as any} 
          size={18} 
          color={iconColor} 
        />
        {/* Punto verde debajo del icono si hay cambio pendiente */}
        {hasPending && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              alignSelf: 'center',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.success || '#10b981',
            }}
          />
        )}
      </View>
    );
    
    // Si es interactivo, envolver en TouchableOpacity
    if (interactive && onTogglePermission) {
      return (
        <Tooltip key={action.name} text={action.tooltip} position="top">
          <TouchableOpacity onPress={() => onTogglePermission(route, action.name)}>
            {iconElement}
          </TouchableOpacity>
        </Tooltip>
      );
    }
    
    // Si no es interactivo, solo mostrar con tooltip
    return (
      <Tooltip key={action.name} text={action.tooltip} position="top">
        {iconElement}
      </Tooltip>
    );
  };

  // Función para renderizar un icono de permiso personalizado
  const renderCustomPermissionIcon = (perm: SecurityPermission) => {
    // Usar el ID o código del permiso como identificador
    const permissionId = perm.id || perm.code || '';
    
    // Determinar si el permiso está activo
    let isActive = false;
    if (interactive && getPermissionState) {
      isActive = getPermissionState(route, permissionId);
    }
    
    // Verificar si hay un cambio pendiente (no guardado aún)
    const hasPending = hasPendingChange ? hasPendingChange(route, permissionId) : false;
    
    // Color del icono según estado (sin considerar cambios pendientes para el color)
    // Si está activo, usar el color de tema
    // Si no está activo, usar color secundario
    const iconColor = isActive ? activeIconColor : colors.textSecondary;
    const iconName = perm.icon || 'image-outline';
    
    // Renderizar icono con punto verde debajo si hay cambio pendiente
    const iconElement = (
      <View style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 28, minWidth: 24, paddingBottom: hasPending ? 6 : 0 }}>
        <DynamicIcon 
          name={iconName} 
          size={18} 
          color={iconColor} 
        />
        {/* Punto verde debajo del icono si hay cambio pendiente */}
        {hasPending && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              alignSelf: 'center',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.success || '#10b981',
            }}
          />
        )}
      </View>
    );
    
    // Si es interactivo, envolver en TouchableOpacity
    if (interactive && onTogglePermission) {
      return (
        <Tooltip key={perm.id} text={perm.name || perm.code || ''} position="top">
          <TouchableOpacity onPress={() => onTogglePermission(route, permissionId)}>
            {iconElement}
          </TouchableOpacity>
        </Tooltip>
      );
    }
    
    // Si no es interactivo, solo mostrar con tooltip
    return (
      <Tooltip key={perm.id} text={perm.name || perm.code || ''} position="top">
        {iconElement}
      </Tooltip>
    );
  };

  return (
    <View style={[containerStyle, { overflow: 'visible' }]}>
      {/* Renderizar iconos de acción estándar */}
      {filteredActions.map((action) => renderActionIcon(action))}
      
      {/* Renderizar iconos de permisos personalizados */}
      {customPermsForMenuItem.map((perm) => renderCustomPermissionIcon(perm))}
    </View>
  );
}

