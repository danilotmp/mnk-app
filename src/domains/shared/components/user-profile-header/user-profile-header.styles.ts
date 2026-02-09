/**
 * Estilos para el componente UserProfileHeader
 */

import { Platform, StyleSheet } from "react-native";

export interface UserProfileHeaderTheme {
  colors: {
    overlay: string;
    surfaceVariant?: string;
    surface?: string;
  };
  shadows: {
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

export const createUserProfileHeaderStyles = (theme?: UserProfileHeaderTheme) =>
  StyleSheet.create({
    profileContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    themeToggleWrapper: {
      marginRight: 8,
    },
    themeToggleWrapperMobile: {
      marginRight: 4,
    },
    languageSelectorWrapper: {
      marginLeft: 8,
    },
    languageSelectorWrapperMobile: {
      marginLeft: 4,
    },
    profileSectionDivider: {
      width: 2,
      height: 24,
      marginHorizontal: 12,
      borderRadius: 1,
    },
    loginButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 8,
      backgroundColor: "transparent",
    },
    loginButtonMobile: {
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderRadius: 20,
      gap: 0,
      justifyContent: "center",
      alignItems: "center",
      minWidth: 36,
      minHeight: 36,
    },
    loginButtonText: {
      fontSize: 14,
    },
    loginIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    modalControlsContainer: {
      position: "absolute",
      top: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      zIndex: 10,
    },
    modalControlsContainerMobile: {
      top: 12,
      right: 12,
    },
    profileButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      paddingLeft: 16,
      paddingRight: 12,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
      borderTopRightRadius: 20,
      borderBottomRightRadius: 20,
      gap: 8,
      backgroundColor: "transparent",
      ...Platform.select({
        web: {
          outline: "none",
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
          borderWidth: 0,
          borderColor: "transparent",
        },
      }),
    },
    profileButtonMobile: {
      paddingVertical: 4,
      paddingLeft: 8,
      paddingRight: 4,
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      gap: 0,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    userInfo: {
      flex: 1,
      minWidth: 100,
    },
    userName: {
      fontSize: 14,
    },
    dropdownIcon: {
      fontSize: 10,
      opacity: 0.6,
    },
    profileButtonWrapper: {
      flexDirection: "row",
      alignItems: "center",
    },
    profileDropdownTrigger: {
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    profileDropdownArrow: {
      opacity: 0.7,
    },
    dropdownMenuContainer: {
      position: "absolute",
      top: 72,
      right: 16,
      minWidth: 180,
      borderRadius: 12,
      paddingVertical: 8,
      overflow: "visible",
      // Sombra aplicada desde el componente con shadows.lg del tema (igual que selector de empresas)
    },
    dropdownArrowOuter: {
      position: "absolute",
      top: -6,
      right: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
    },
    dropdownArrowInner: {
      position: "absolute",
      top: -5,
      right: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderBottomWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
    },
    dropdownMenuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
    },
    modalContent: {
      backgroundColor: theme?.colors?.surfaceVariant ?? theme?.colors?.surface,
      borderRadius: 16,
      padding: 24,
      position: "relative",
      ...Platform.select({
        web: {
          boxShadow: theme?.shadows.md
            ? `0px ${theme.shadows.md.shadowOffset.height}px ${theme.shadows.md.shadowRadius}px rgba(0, 0, 0, ${theme.shadows.md.shadowOpacity})`
            : "0px 2px 8px rgba(0, 0, 0, 0.25)",
        },
        default: theme?.shadows.md || {
          shadowColor: theme?.colors?.shadow ?? "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        },
      }),
    },
    modalHeader: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatarLarge: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    avatarTextLarge: {
      fontSize: 32,
      fontWeight: "bold",
    },
    modalUserName: {
      marginBottom: 4,
    },
    badge: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    divider: {
      height: 1,
      marginVertical: 16,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      marginBottom: 12,
    },
    branchOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    branchOptionInfo: {
      flex: 1,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    menuOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 16,
      gap: 12,
    },
    menuIcon: {
      fontSize: 20,
    },
    closeButton: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
  });
