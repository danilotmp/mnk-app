/**
 * Estilos para la pantalla de Flujos Configurables
 */
import { StyleSheet } from "react-native";

export const createFlowsListScreenStyles = (
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
    // Hero card
    heroCard: { padding: 0, overflow: "hidden", borderRadius: theme.borderRadius.lg },
    heroContent: { padding: theme.spacing.lg, flexDirection: isMobile ? "column" : "row", gap: theme.spacing.md },
    heroBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.sm },
    // Stages modal
    stageRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: theme.borderRadius.md, borderWidth: 1 },
    stageBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.sm },
    stageConnector: { width: 28, alignItems: "center", height: 12 },
    stageConnectorLine: { width: 2, height: "100%" },
  });
