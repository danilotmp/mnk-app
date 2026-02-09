export const createRolePermissionsModalStyles = (colors: any, isMobile: boolean) => {
  return {
    treeContainer: {
      padding: isMobile ? 16 : 20,
    },
    footerButtons: {
      flexDirection: 'row' as const,
      gap: isMobile ? 8 : 12,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    emptyState: {
      width: '100%',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: 600,
      maxHeight: 600,
    },
    emptyStateIcon: {
      marginBottom: 16,
    },
    emptyStateText: {
      textAlign: 'center' as const,
      color: colors.textSecondary,
    },
  };
};

