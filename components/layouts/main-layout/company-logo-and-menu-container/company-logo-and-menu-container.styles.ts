/**
 * Estilos para el componente CompanyLogoAndMenuContainer
 */

import { StyleSheet } from 'react-native';
import { AppConfig } from '@/src/config';

// Usar las mismas variables de configuración del menú vertical
const expandedWidth = AppConfig.navigation.verticalMenuExpandedWidth; // 280px
const collapsedWidth = AppConfig.navigation.verticalMenuCollapsedWidth; // 48px
const iconWidth = collapsedWidth - 16; // 32px
const companyNameWidth = expandedWidth - iconWidth; // 248px

export const createCompanyLogoAndMenuContainerStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      position: 'relative',
    },
    logoAndNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'absolute',
      left: 0,
      zIndex: 1,
      width: expandedWidth, // 280px
    },
    iconContainer: {
      width: iconWidth, // 32px
      marginRight: 0,
    },
    companyNameContainer: {
      overflow: 'hidden',
      width: companyNameWidth, // 248px
      paddingHorizontal: 12,
    },
    companyNameClickable: {
      paddingVertical: 4,
    },
    companyNameText: {
      fontWeight: '600',
    },
    menuContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: iconWidth, // 32px
      marginTop: 4,
      borderRadius: 8,
      borderWidth: 1,
      width: companyNameWidth, // 248px
      maxHeight: 300,
      zIndex: 10000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    dropdownArrowOuter: {
      position: 'absolute',
      top: -6,
      left: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    dropdownArrowInner: {
      position: 'absolute',
      top: -5,
      left: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    },
    dropdownItem: {
      padding: 12,
      borderBottomWidth: 1,
    },
  });
