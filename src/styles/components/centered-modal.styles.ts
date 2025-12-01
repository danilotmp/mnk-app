import { Platform, StyleSheet } from 'react-native';
import type { ThemeColors } from '@/src/styles/themes/theme.types';

export const createCenteredModalStyles = (colors: ThemeColors, isMobile: boolean) => {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      borderRadius: 16,
      overflow: 'hidden',
      ...Platform.select({
        web: {
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
    },
    headerTitle: {
      flex: 1,
      marginRight: 16,
    },
    title: {
      marginBottom: 4,
    },
    closeButton: {
      padding: 4,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 24,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderTopWidth: 1,
      gap: 12,
    },
  });
};

