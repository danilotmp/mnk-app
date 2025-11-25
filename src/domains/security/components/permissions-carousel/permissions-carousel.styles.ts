import { StyleSheet } from 'react-native';
import type { ThemeColors } from '@/src/styles/themes/theme.types';

export const createPermissionsCarouselStyles = (colors: ThemeColors) => {
  return StyleSheet.create({
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

