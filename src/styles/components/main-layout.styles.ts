import { StyleSheet } from 'react-native';

export const createMainLayoutStyles = () =>
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
    },
    mobileUserSection: {
      flexShrink: 0,
    },
    content: {
      flex: 1,
    },
  });


