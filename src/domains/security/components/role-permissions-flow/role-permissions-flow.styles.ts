import { StyleSheet } from "react-native";

export function createPermissionFlowStyles(colors: any, isMobile: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      height: "100%",
      backgroundColor: colors.surfaceVariant ?? colors.surface,
    },
    scrollContent: {
      padding: isMobile ? 16 : 20,
      paddingBottom: isMobile ? 24 : 32,
    },
    permissionsContainer: {
      gap: isMobile ? 8 : 2,
    },
    moduleContainer: {
      marginBottom: isMobile ? 4 : 5,
    },
    moduleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isMobile ? 14 : 18,
      paddingVertical: isMobile ? 10 : 12,
      borderRadius: 8,
      borderWidth: 1,
    },
    moduleHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    moduleIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    chevronIcon: {
      marginLeft: 8,
    },
    moduleTitle: {
      fontWeight: "600",
      fontSize: isMobile ? 14 : 16,
    },
    moduleBadge: {
      paddingHorizontal: isMobile ? 10 : 12,
      paddingVertical: isMobile ? 4 : 6,
      borderRadius: 12,
      minWidth: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    // Nivel de agrupación (columns) dentro de un módulo
    groupContainer: {
      marginTop: isMobile ? 6 : 8,
      marginLeft: isMobile ? 12 : 16,
      borderRadius: 8,
      overflow: "hidden",
    },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isMobile ? 12 : 14,
      paddingVertical: isMobile ? 6 : 8,
      borderWidth: 1,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomWidth: 0,
    },
    groupTitle: {
      fontWeight: "600",
      fontSize: isMobile ? 13 : 14,
    },
    groupBadge: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      borderRadius: 0,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
    },
    permissionsList: {
      marginLeft: isMobile ? 12 : 16,
      borderRadius: 8,
      overflow: "hidden",
    },
    permissionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isMobile ? 14 : 18,
      paddingVertical: isMobile ? 12 : 16,
      borderWidth: 1,
      borderTopWidth: 0,
    },
    permissionActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: isMobile ? 10 : 12,
    },
    permissionItemNotLast: {
      borderBottomWidth: 0,
    },
    permissionItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    permissionIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    permissionInfo: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: isMobile ? 60 : 80,
    },
    emptyStateText: {
      marginTop: 16,
      textAlign: "center",
    },
  });
}
