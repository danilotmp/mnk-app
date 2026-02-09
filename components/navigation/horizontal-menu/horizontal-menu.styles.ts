/**
 * Estilos adicionales para el componente HorizontalMenu
 * (complementa los estilos de src/styles/components/horizontal-menu.styles.ts)
 */

import { StyleSheet } from 'react-native';
import { BaseTheme } from '@/constants/theme';

export const createHorizontalMenuAdditionalStyles = (colors: BaseTheme['colors']) =>
  StyleSheet.create({
    // Estilos para mobile menu
    mobileMenuItemMargin: {
      marginLeft: 0, // Se aplica dinámicamente según el nivel
    },
    mobileMenuItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    mobileMenuItemRowCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    mobileSubmenuContainer: {
      backgroundColor: colors.surface,
    },
    mobileSubmenuText: {
      opacity: 0.8,
    },
    mobileSubmenuTextActive: {
      opacity: 1,
    },
    mobileChevron: {
      opacity: 0.6,
    },
    mobileSearchContainer: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    mobileSearchInputWrapper: {
      position: 'relative',
    },
    mobileSearchIcon: {
      position: 'absolute',
      left: 10,
      top: 10,
      zIndex: 1,
    },
    mobileClearButton: {
      position: 'absolute',
      right: 10,
      top: 8,
      zIndex: 1,
      padding: 4,
    },
    mobileSearchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingLeft: 36,
      height: 36,
    },
    mobileSearchInputText: {
      padding: 8,
      fontSize: 14,
    },
    hamburgerButtonBackground: {
      backgroundColor: colors.surface,
    },
    mobileMenuHeaderBorder: {
      borderBottomColor: colors.border,
    },
    mobileMenuContainerBackground: {
      backgroundColor: colors.background,
    },
    // Estilos para desktop menu
    desktopContainerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    desktopSearchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      marginRight: 8,
      overflow: 'hidden',
    },
    desktopSearchExpanded: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    desktopSearchIcon: {
      position: 'absolute',
      left: 10,
      top: 11,
      zIndex: 1,
    },
    desktopClearButton: {
      position: 'absolute',
      right: 10,
      top: 9,
      zIndex: 1,
      padding: 4,
    },
    desktopSearchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingLeft: 36,
      height: 36,
      flex: 1,
    },
    desktopSearchInputText: {
      padding: 8,
      fontSize: 14,
    },
    desktopSearchButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    megaMenuBackground: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    megaMenuScroll: {
      maxHeight: 600,
    },
    megaMenuSubmenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    megaMenuSubmenuIcon: {
      marginRight: 12,
    },
    megaMenuColumnMargin: {
      marginTop: 0, // Se aplica dinámicamente
    },
    megaMenuColumnTitle: {
      color: colors.textSecondary,
      fontWeight: '700',
      fontSize: 11,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
    },
    megaMenuColumnItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      paddingLeft: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    megaMenuColumnItemIcon: {
      marginRight: 12,
    },
    megaMenuColumnLine: {
      backgroundColor: colors.border,
    },
    desktopSubmenuBackground: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    desktopSubmenuItemBorder: {
      borderBottomColor: colors.border,
    },
    desktopSubmenuItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    desktopSubmenuItemContent: {
      flex: 1,
    },
    // Estilos para márgenes dinámicos
    submenuMargin: {
      marginLeft: 16,
    },
  });
