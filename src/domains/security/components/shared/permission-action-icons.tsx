/**
 * Componente reutilizable para renderizar los iconos de acción de permisos
 * O el texto "Opción por defecto" si el item es público
 */

import { ThemedText } from '@/components/themed-text';
import { Tooltip } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
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
  containerStyle,
}: PermissionActionIconsProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  // Color para iconos activos: primaryDark en dark theme, primary en light theme
  const activeIconColor = isDark ? colors.primaryDark : colors.primary;
  
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
  
  return (
    <View style={containerStyle}>
      {filteredActions.map((action) => {
        // Determinar si el permiso está activo
        let isActive = false;
        if (interactive && getPermissionState) {
          isActive = getPermissionState(route, action.name);
        } else if (!interactive && hasPermissionForRoute) {
          isActive = hasPermissionForRoute(route, action.name);
        }
        
        // Color del icono según estado
        const iconColor = isActive ? activeIconColor : colors.textSecondary;
        
        // Renderizar icono
        const iconElement = (
          <Ionicons 
            name={action.icon as any} 
            size={18} 
            color={iconColor} 
          />
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
      })}
    </View>
  );
}

