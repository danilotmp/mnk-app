/**
 * Componente recursivo para renderizar un item del menú (página)
 * Se reutiliza en todos los niveles (items directos, subitems, columnas)
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { PermissionActionIcons, PermissionActionIconsProps } from './permission-action-icons';

export interface PermissionMenuItemProps {
  /**
   * Item del menú a renderizar (puede ser MenuItem o MenuSubItem)
   */
  item: {
    id: string;
    label: string;
    route?: string;
    description?: string;
    isPublic?: boolean;
  };
  
  /**
   * Estilos para el item
   */
  itemStyle?: any;
  
  /**
   * Estilo para el contenedor de acciones
   */
  actionsContainerStyle?: any;
  
  /**
   * Props para los iconos de acción
   */
  actionIconsProps: Omit<PermissionActionIconsProps, 'route' | 'isPublic' | 'containerStyle'>;
  
  /**
   * ID del item del menú (se pasa automáticamente a actionIconsProps)
   */
  menuItemId?: string;
}

/**
 * Componente recursivo para renderizar un item del menú
 */
export function PermissionMenuItem({
  item,
  itemStyle,
  actionsContainerStyle,
  actionIconsProps,
  menuItemId,
}: PermissionMenuItemProps) {
  const { colors } = useTheme();
  
  // Usar menuItemId del prop o del item.id
  const finalMenuItemId = menuItemId || item.id;
  
  return (
    <View style={itemStyle}>
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
            {item.label}
          </ThemedText>
          {item.description && (
            <ThemedText type="caption" style={{ marginTop: 2, color: colors.textSecondary }}>
              {item.description}
            </ThemedText>
          )}
          {item.route && (
            <ThemedText type="caption" variant="secondary" style={{ marginTop: 2 }}>
              {item.route}
            </ThemedText>
          )}
        </View>
      </View>
      <PermissionActionIcons
        route={item.route}
        isPublic={item.isPublic}
        containerStyle={actionsContainerStyle}
        menuItemId={finalMenuItemId}
        {...actionIconsProps}
      />
    </View>
  );
}

// Estilos locales (serán inyectados por el componente padre)
const styles = {
  permissionItemLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 12,
  },
  permissionIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  permissionInfo: {
    flex: 1,
  },
};

