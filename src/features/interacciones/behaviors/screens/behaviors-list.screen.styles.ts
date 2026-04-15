import { StyleSheet } from "react-native";

export const createBehaviorsListScreenStyles = (
  theme: { colors: any; spacing: any; typography: any; pageLayout: any; borderRadius: any },
  isMobile: boolean,
) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, padding: theme.spacing.lg },
    contentMobile: { padding: theme.spacing.md },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.pageLayout.subtitleContentGap },
    headerTitle: { flex: 1 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing.md, marginBottom: isMobile ? theme.pageLayout.titleSubtitleGapMobile : theme.pageLayout.titleSubtitleGap },
    title: { ...theme.typography.pageTitle, color: theme.colors.pageTitleColor },
    titleMobile: { ...theme.typography.pageTitleMobile, color: theme.colors.pageTitleColor },
    subtitle: { ...theme.typography.pageSubtitle, color: theme.colors.textSecondary },
    dataTableContainer: { flex: 1, minHeight: 0 },
    actionsContainer: { flexDirection: "row", gap: theme.spacing.sm, justifyContent: "center", alignItems: "center" },
    actionButton: { padding: theme.spacing.xs },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.sm },
  });
