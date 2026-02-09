import { StyleSheet } from 'react-native';

/**
 * Estilos para el menú vertical
 * @param collapsed - Si el menú está colapsado (solo iconos)
 */
export function createVerticalMenuStyles(collapsed: boolean = false) {
  return StyleSheet.create({
    container: {
      height: '100%',
      borderRightWidth: 1,
      position: 'relative',
      overflow: 'hidden',
    },
    scrollContainer: {
      overflow: 'hidden',
    },
    toggleButton: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    scrollView: {
      flex: 1,
      height: '100%',
    },
    scrollContent: {
      paddingTop: 8,
      paddingBottom: 48, // Espacio para el botón fijo (40px altura + 8px padding)
    },
    menuItem: {
      minHeight: 40,
      borderLeftWidth: 3,
      marginHorizontal: 4,
      marginVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    menuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: collapsed ? 12 : 12,
      paddingVertical: 10,
      gap: 12,
    },
    menuItemIcon: {
      minWidth: 20,
    },
    menuItemLabel: {
      flex: 1,
      fontWeight: '500',
    },
    chevronIcon: {
      marginLeft: 'auto',
    },
    submenuContainer: {
      marginLeft: 20,
      marginTop: 4,
      marginBottom: 4,
    },
    submenuItem: {
      minHeight: 36,
      borderRadius: 4,
      marginVertical: 1,
    },
    submenuItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    submenuItemIcon: {
      minWidth: 16,
    },
    submenuItemLabel: {
      flex: 1,
    },
    // Estilos para columnas (mega menú)
    columnsContainer: {
      marginLeft: 20,
      marginTop: 4,
      marginBottom: 4,
    },
    columnContainer: {
      marginBottom: 16,
    },
    columnTitle: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    columnItem: {
      minHeight: 36,
      borderRadius: 4,
      marginVertical: 1,
    },
    columnItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    columnItemIcon: {
      minWidth: 16,
    },
    columnItemLabel: {
      flex: 1,
    },
  });
}

