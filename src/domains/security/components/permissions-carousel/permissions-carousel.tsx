/**
 * Componente de carrusel para mostrar permisos
 * Muestra iconos con nombres en formato de tarjetas deslizables
 */

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { SecurityPermission } from '@/src/domains/security/types';
import { useTranslation } from '@/src/infrastructure/i18n';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { DynamicIcon } from '@/src/domains/shared/components';
import { createPermissionsCarouselStyles } from './permissions-carousel.styles';

interface PermissionsCarouselProps {
  permissions: SecurityPermission[];
  onPermissionSelect: (permission: SecurityPermission) => void;
  onCreateNew: () => void;
}

/**
 * Obtener icono según el permiso
 * Prioriza el icono del permiso si existe, sino usa lógica de fallback
 */
const getPermissionIcon = (permission: SecurityPermission): string => {
  // Si el permiso tiene un icono definido, usarlo directamente
  if (permission.icon && permission.icon.trim()) {
    return permission.icon.trim();
  }

  // Fallback: usar lógica basada en módulo o acción
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
  const { t } = useTranslation();
  const styles = createPermissionsCarouselStyles(colors);

  // Separar permisos del sistema y permisos normales, ordenados por el campo 'order'
  const systemPermissions = permissions
    .filter(p => p.isSystem === true)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const normalPermissions = permissions
    .filter(p => !p.isSystem || p.isSystem === false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <View style={styles.container}>
      {/* Sección de permisos del sistema (solo visuales, más pequeños) */}
      {systemPermissions.length > 0 && (
        <View style={styles.systemSection}>
          <ThemedText type="body2" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t.security?.permissions?.systemPermissions || 'Permisos del sistema'}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.systemCarouselContainer}
            style={styles.systemCarousel}
          >
            {systemPermissions.map((permission) => {
              const iconName = getPermissionIcon(permission);
              return (
                <View
                  key={permission.id}
                  style={styles.systemCard}
                >
                  <View style={styles.systemIconContainer}>
                    <DynamicIcon
                      name={permission.icon || iconName}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <ThemedText
                    type="caption"
                    style={styles.systemCardName}
                    numberOfLines={2}
                  >
                    {permission.name || permission.code}
                  </ThemedText>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Sección de permisos normales (con acciones) */}
      <View style={styles.normalSection}>
        <ThemedText type="body2" style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t.security?.permissions?.customPermissions || 'Permisos personalizados'}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          style={styles.carousel}
        >
        {/* Permisos normales */}
        {normalPermissions.map((permission) => {
          const iconName = getPermissionIcon(permission);
          return (
            <TouchableOpacity
              key={permission.id}
              style={styles.card}
              onPress={() => onPermissionSelect(permission)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <DynamicIcon
                  name={permission.icon || iconName}
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
      </View>
    </View>
  );
}

