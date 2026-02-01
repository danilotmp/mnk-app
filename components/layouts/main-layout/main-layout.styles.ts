/**
 * Estilos para el componente MainLayout
 */

import { StyleSheet } from 'react-native';
import { BaseTheme } from '@/constants/theme';

export const createMainLayoutStyles = (colors: BaseTheme['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    unifiedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      zIndex: 9999,
      paddingRight: 16,
      paddingLeft: 0, // Se sobrescribe condicionalmente en el componente para móvil
      position: 'relative', // Para posicionar el dropdown relativo al header
    },
    // Desktop/Tablet
    logoSection: {
      flexShrink: 0,
      minWidth: 150,
    },
    menuSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
    },
    userSection: {
      flexShrink: 0,
      minWidth: 150,
      justifyContent: 'flex-end',
      flexDirection: 'row',
    },
    // Web Desktop - Tres bloques
    webLeftSection: {
      width: 280, // Mismo ancho que el bloque derecho
      flexShrink: 0,
      paddingLeft: 16,
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    webMenuSection: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    webRightSection: {
      width: 280, // Mismo ancho que el bloque izquierdo
      flexShrink: 0,
      paddingRight: 16,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      flexDirection: 'row',
    },
    // Mobile
    mobileRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mobileMenuSection: {
      flexShrink: 0,
      marginLeft: 8,
    },
    mobileLogoSection: {
      flex: 1,
      alignItems: 'flex-start',
      paddingLeft: 0, // El padding ya está en unifiedHeader
    },
    mobileUserSection: {
      flexShrink: 0,
    },
    content: {
      flex: 1,
    },
    // Contenedor del body: menú vertical + contenido
    bodyContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    bodyContainerWithVerticalMenu: {
      // El menú vertical está dentro de este contenedor
      // El contenido se ajustará automáticamente
    },
    // Estilos para dropdowns de empresas
    companyDropdownContainer: {
      position: 'relative',
      width: '100%', // Ocupa todo el ancho del bloque izquierdo
    },
    companyDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      borderRadius: 8,
      borderWidth: 1,
      maxHeight: 300,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    companyDropdownDesktop: {
      zIndex: 10000, // Mayor que el zIndex del header (9999)
      borderWidth: 1.5, // Borde un poco más grueso
    },
    companyDropdownArrow: {
      position: 'absolute',
      width: 0,
      height: 0,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    companyDropdownArrowOuter: {
      top: -6,
      left: 20,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
    },
    companyDropdownArrowInner: {
      top: -5,
      left: 20,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
    },
    companyDropdownArrowDesktop: {
      top: -7,
      left: 20,
      borderLeftWidth: 7,
      borderRightWidth: 7,
      borderBottomWidth: 7,
    },
    companyDropdownArrowInnerDesktop: {
      top: -6,
      left: 20,
      borderLeftWidth: 7,
      borderRightWidth: 7,
      borderBottomWidth: 7,
    },
    companyDropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
    },
    companyDropdownItemDesktop: {
      paddingVertical: 12,
      paddingRight: 12,
      borderBottomWidth: 1,
    },
  });
