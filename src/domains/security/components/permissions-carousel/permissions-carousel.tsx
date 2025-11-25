/**
 * Componente de carrusel para mostrar permisos
 * Muestra iconos con nombres en formato de tarjetas deslizables
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { SecurityPermission } from '@/src/domains/security/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { createPermissionsCarouselStyles } from './permissions-carousel.styles';

interface PermissionsCarouselProps {
  permissions: SecurityPermission[];
  onPermissionSelect: (permission: SecurityPermission) => void;
  onCreateNew: () => void;
}

/**
 * Obtener icono según el módulo o acción del permiso
 */
const getPermissionIcon = (permission: SecurityPermission): string => {
  const module = permission.module?.toLowerCase() || '';
  const action = permission.action?.toLowerCase() || '';

  // Iconos por módulo
  if (module.includes('user') || module.includes('usuario')) return 'people';
  if (module.includes('role') || module.includes('rol')) return 'shield';
  if (module.includes('permission') || module.includes('permiso')) return 'lock-closed';
  if (module.includes('company') || module.includes('empresa')) return 'business';
  if (module.includes('branch') || module.includes('sucursal')) return 'storefront';
  if (module.includes('security') || module.includes('seguridad')) return 'shield-checkmark';
  
  // Iconos por acción
  if (action === 'view') return 'eye';
  if (action === 'create') return 'add-circle';
  if (action === 'edit') return 'pencil';
  if (action === 'delete') return 'trash';
  
  // Icono por defecto
  return 'key';
};

export function PermissionsCarousel({
  permissions,
  onPermissionSelect,
  onCreateNew,
}: PermissionsCarouselProps) {
  const { colors } = useTheme();
  const styles = createPermissionsCarouselStyles(colors);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
      style={styles.carousel}
    >
      {/* Permisos existentes */}
      {permissions.map((permission) => {
        const iconName = getPermissionIcon(permission);
        return (
          <TouchableOpacity
            key={permission.id}
            style={styles.card}
            onPress={() => onPermissionSelect(permission)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={iconName as any}
                size={48}
                color={colors.primary}
              />
            </View>
            <ThemedText
              type="body2"
              style={styles.cardName}
              numberOfLines={2}
            >
              {permission.name || permission.code}
            </ThemedText>
          </TouchableOpacity>
        );
      })}

      {/* Botón para crear nuevo permiso */}
      <TouchableOpacity
        style={[styles.card, styles.createCard]}
        onPress={onCreateNew}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, styles.createIconContainer]}>
          <Ionicons
            name="add"
            size={48}
            color={colors.primary}
          />
        </View>
        <ThemedText
          type="body2"
          style={styles.cardName}
        >
          Crear nuevo permiso
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

