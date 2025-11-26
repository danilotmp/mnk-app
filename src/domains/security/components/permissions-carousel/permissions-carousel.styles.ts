import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/src/styles/themes/theme.types';

export const createPermissionsCarouselStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    // Título de sección
    sectionTitle: {
      paddingHorizontal: 16,
      marginBottom: 8,
      fontWeight: '600',
    },
    // Sección de permisos del sistema (más pequeños, solo visuales)
    systemSection: {
      marginBottom: 20,
    },
    // Sección de permisos normales
    normalSection: {
      flex: 1,
    },
    systemCarousel: {
      maxHeight: 100,
    },
    systemCarouselContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 12,
    },
    systemCard: {
      width: 80,
      height: 90,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      opacity: 0.7, // Más sutil para indicar que son solo visuales
    },
    systemIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    systemCardName: {
      textAlign: 'center',
      fontSize: 11,
      marginTop: 2,
    },
    // Sección de permisos normales (con acciones)
    carousel: {
      maxHeight: 200,
    },
    carouselContainer: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      gap: 16,
    },
    card: {
      width: 120,
      height: 140,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    createCard: {
      borderStyle: 'dashed',
      borderWidth: 2,
      backgroundColor: 'transparent',
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    createIconContainer: {
      backgroundColor: colors.primary + '10',
    },
    cardName: {
      textAlign: 'center',
      marginTop: 4,
    },
  });
};

