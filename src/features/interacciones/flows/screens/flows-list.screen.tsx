/**
 * Pantalla Flow Library — Administración de Flujos Configurables
 * Diseño: Hero card + tabla de blueprints + editor de etapas (CenteredModal) + editor de comportamiento (SideModal)
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { CenteredModal } from "@/components/ui/centered-modal";
import { InlineAlert } from "@/components/ui/inline-alert";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { SideModal } from "@/components/ui/side-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon } from "@/src/domains/shared/components";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { JsonEditor } from "@/src/domains/shared/components/json-editor/json-editor";
import { SearchFilterBar } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar";
import { StatusSelector } from "@/src/domains/shared/components/status-selector/status-selector";
import { useRouteAccessGuard } from "@/src/infrastructure/access";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { FlowsService } from "../services";
import type { FlowBehavior, FlowStageConfig, FlowTemplate } from "../types";
import { BEHAVIOR_KEYS, STAGE_ROLES } from "../types";
import { createFlowsListScreenStyles } from "./flows-list.screen.styles";

export function FlowsListScreen() {
  const { colors, isDark, spacing, typography, pageLayout, borderRadius, modalLayout } = useTheme();
  const { t } = useTranslation();
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = useMemo(() => createFlowsListScreenStyles({ colors, spacing, typography, pageLayout, borderRadius }, isMobile), [colors, spacing, typography, pageLayout, borderRadius, isMobile]);
  const { loading: accessLoading, allowed: hasAccess, handleApiError, isScreenFocused } = useRouteAccessGuard(pathname);
  const F = t.pages.flows;
  const B = t.pages.behaviors;
  const commonT = t.common;

  // --- Estado principal ---
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [localFilter, setLocalFilter] = useState("");
  const [filters, setFilters] = useState({ page: 1, limit: 10, search: "", status: undefined as number | undefined });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [hasError, setHasError] = useState(false);
  const loadingRef = useRef(false);
  const [behaviors, setBehaviors] = useState<FlowBehavior[]>([]);

  // --- Modal crear/editar template ---
  const [tmplModalVisible, setTmplModalVisible] = useState(false);
  const [tmplModalMode, setTmplModalMode] = useState<"create" | "edit" | null>(null);
  const [selectedTmpl, setSelectedTmpl] = useState<FlowTemplate | null>(null);
  const [tmplForm, setTmplForm] = useState({ code: "", name: "", description: "", status: 1 });
  const [tmplSaving, setTmplSaving] = useState(false);
  const [tmplError, setTmplError] = useState<{ message: string; detail?: string } | null>(null);

  // --- Modal editor de etapas (centrado, dos paneles) ---
  const [stagesVisible, setStagesVisible] = useState(false);
  const [stagesTmpl, setStagesTmpl] = useState<FlowTemplate | null>(null);
  const [stages, setStages] = useState<FlowStageConfig[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [editStage, setEditStage] = useState<FlowStageConfig | null>(null);
  const [stageSaving, setStageSaving] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // --- Modal editor de comportamiento (SideModal) ---
  const [behModalVisible, setBehModalVisible] = useState(false);
  const [editBehavior, setEditBehavior] = useState<FlowBehavior | null>(null);
  const [behSaving, setBehSaving] = useState(false);
  const [behError, setBehError] = useState<{ message: string; detail?: string } | null>(null);

  // --- Cargar datos ---
  const loadTemplates = useCallback(async (f: typeof filters) => {
    if (loadingRef.current) return;
    try {
      loadingRef.current = true; setLoading(true); setHasError(false);
      const res = await FlowsService.getTemplates(f);
      setTemplates(res.data || []);
      if (res.meta) setPagination({ page: res.meta.page || 1, limit: res.meta.limit || 10, total: res.meta.total || 0, totalPages: res.meta.totalPages || 0, hasNext: res.meta.hasNext || false, hasPrev: res.meta.hasPrev || false });
    } catch (err: any) {
      if (handleApiError(err)) { setHasError(true); return; }
      const { message, detail } = extractErrorInfo(err, "Error al cargar flujos");
      alert.showError(message, false, undefined, detail, err); setHasError(true);
    } finally { setLoading(false); loadingRef.current = false; }
  }, [alert, handleApiError]);

  useEffect(() => { if (hasError) return; if (isScreenFocused && hasAccess && !accessLoading) loadTemplates(filters); }, [accessLoading, hasAccess, isScreenFocused, filters]);
  useEffect(() => { FlowsService.getBehaviors().then(setBehaviors).catch(() => {}); }, []);

  // --- Template CRUD ---
  const openCreateTmpl = () => { setTmplForm({ code: "", name: "", description: "", status: 1 }); setTmplError(null); setTmplModalMode("create"); setSelectedTmpl(null); setTmplModalVisible(true); };
  const openEditTmpl = (t: FlowTemplate) => { setTmplForm({ code: t.code, name: t.name, description: t.description || "", status: t.status }); setTmplError(null); setTmplModalMode("edit"); setSelectedTmpl(t); setTmplModalVisible(true); };

  const saveTmpl = async () => {
    if (!tmplForm.code.trim() || !tmplForm.name.trim()) { setTmplError({ message: "Código y nombre son requeridos" }); return; }
    setTmplSaving(true);
    try {
      const p = { code: tmplForm.code.trim().toUpperCase().replace(/\s+/g, "_"), name: tmplForm.name.trim(), description: tmplForm.description.trim() || undefined, status: tmplForm.status };
      if (tmplModalMode === "create") { await FlowsService.createTemplate(p); alert.showSuccess(F.flowCreated || "Flujo creado"); }
      else if (selectedTmpl) { await FlowsService.updateTemplate(selectedTmpl.id, p); alert.showSuccess(F.flowUpdated || "Flujo actualizado"); }
      setTmplModalVisible(false); loadTemplates(filters);
    } catch (err: any) { const { message, detail } = extractErrorInfo(err, "Error"); setTmplError({ message, detail }); }
    finally { setTmplSaving(false); }
  };

  const deleteTmpl = async (t: FlowTemplate) => {
    if (t.isSystem) { alert.showError(F.systemFlowNotDeletable || "Los flujos del sistema no se pueden eliminar"); return; }
    try { await FlowsService.deleteTemplate(t.id); alert.showSuccess(F.flowDeleted || "Flujo eliminado"); loadTemplates(filters); setTmplModalVisible(false); }
    catch (err: any) { const { message, detail } = extractErrorInfo(err, "Error"); alert.showError(message, false, undefined, detail, err); }
  };

  // --- Stages ---
  const openStages = async (t: FlowTemplate) => {
    setStagesTmpl(t); setStagesVisible(true); setLoadingStages(true); setEditStage(null);
    try { const d = await FlowsService.getTemplateById(t.id); const sorted = (d.stages || []).sort((a, b) => a.orderIndex - b.orderIndex); setStages(sorted); setOriginalOrder(sorted.map((s) => s.id)); setOrderChanged(false); }
    catch { alert.showError("Error al cargar etapas"); setStages([]); }
    finally { setLoadingStages(false); }
  };

  const moveStage = (idx: number, dir: "up" | "down") => {
    const n = [...stages]; const t = dir === "up" ? idx - 1 : idx + 1;
    if (t < 0 || t >= n.length) return;
    [n[idx], n[t]] = [n[t], n[idx]]; n.forEach((s, i) => { s.orderIndex = i; }); setStages(n); setOrderChanged(true);
  };

  const saveStageOrder = async () => {
    if (!stagesTmpl) return; setStageSaving(true);
    try { await Promise.all(stages.map((s) => FlowsService.updateStage(stagesTmpl.id, s.id, { orderIndex: s.orderIndex }))); alert.showSuccess(F.orderUpdated); setOriginalOrder(stages.map((s) => s.id)); setOrderChanged(false); }
    catch { alert.showError("Error al guardar el orden"); } finally { setStageSaving(false); }
  };

  const cancelReorder = () => {
    const reordered = originalOrder.map((id) => stages.find((s) => s.id === id)).filter(Boolean) as FlowStageConfig[];
    reordered.forEach((s, i) => { s.orderIndex = i; });
    setStages(reordered);
    setOrderChanged(false);
  };

  const handleDrop = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    const n = [...stages];
    const [moved] = n.splice(fromIdx, 1);
    n.splice(toIdx, 0, moved);
    n.forEach((s, i) => { s.orderIndex = i; });
    setStages(n);
    setOrderChanged(true);
  };

  const handleStageDragStart = useCallback((e: any, index: number) => {
    if (Platform.OS !== "web") return;
    e.preventDefault();
    e.stopPropagation();
    dragIndexRef.current = index;
    dragOverIndexRef.current = null;
    setDragIndex(index);
    setDragOverIndex(null);

    const handleMouseUp = () => {
      const from = dragIndexRef.current;
      const to = dragOverIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        handleDrop(from, to);
      }
      dragIndexRef.current = null;
      dragOverIndexRef.current = null;
      setDragIndex(null);
      setDragOverIndex(null);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  }, [stages]);

  const addStage = async () => {
    if (!stagesTmpl) return; setStageSaving(true);
    try { const ns = await FlowsService.createStage(stagesTmpl.id, { stageCode: "NUEVA_ETAPA", orderIndex: stages.length, emoji: "⚙️", status: 1 }); setStages((p) => [...p, ns]); setEditStage(ns); }
    catch { alert.showError("Error al crear etapa"); } finally { setStageSaving(false); }
  };

  const saveStage = async (s: FlowStageConfig) => {
    if (!stagesTmpl) return; setStageSaving(true);
    try { const u = await FlowsService.updateStage(stagesTmpl.id, s.id, { stageCode: s.stageCode, behaviorId: s.behaviorId, emoji: s.emoji, orderIndex: s.orderIndex, transitionRules: s.transitionRules, skipConditions: s.skipConditions, contextOverride: s.contextOverride, status: s.status }); setStages((p) => p.map((x) => x.id === s.id ? { ...x, ...u } : x)); setEditStage(null); alert.showSuccess(F.stageUpdated || "Etapa actualizada"); }
    catch { alert.showError("Error al actualizar"); } finally { setStageSaving(false); }
  };

  const deleteStage = async (s: FlowStageConfig) => {
    if (!stagesTmpl) return;
    try { await FlowsService.deleteStage(stagesTmpl.id, s.id); setStages((p) => p.filter((x) => x.id !== s.id)); if (editStage?.id === s.id) setEditStage(null); alert.showSuccess(F.stageDeleted || "Etapa eliminada"); }
    catch { alert.showError("Error al eliminar"); }
  };

  // --- Behaviors ---
  const openBehavior = (b: FlowBehavior) => { setEditBehavior({ ...b }); setBehError(null); setBehModalVisible(true); };
  const saveBehavior = async () => {
    if (!editBehavior) return; setBehSaving(true);
    try { await FlowsService.updateBehavior(editBehavior.id, { name: editBehavior.name, description: editBehavior.description, role: editBehavior.role, callApiName: editBehavior.callApiName, guidelineKeys: editBehavior.guidelineKeys, stageConfig: editBehavior.stageConfig }); alert.showSuccess("Comportamiento actualizado"); setBehModalVisible(false); FlowsService.getBehaviors().then(setBehaviors).catch(() => {}); }
    catch (err: any) { const { message, detail } = extractErrorInfo(err, "Error"); setBehError({ message, detail }); }
    finally { setBehSaving(false); }
  };

  // --- Helpers ---
  const filteredTemplates = useMemo(() => { if (!localFilter.trim()) return templates; const f = localFilter.toLowerCase().trim(); return templates.filter((t) => (t.code || "").toLowerCase().includes(f) || (t.name || "").toLowerCase().includes(f)); }, [templates, localFilter]);
  const getBehaviorLabel = (key: string) => { const b = behaviors.find((x) => x.behaviorKey === key); return b?.name || BEHAVIOR_KEYS.find((x) => x.value === key)?.label || key; };
  const getBehavior = (key: string) => behaviors.find((x) => x.behaviorKey === key);
  const heroTemplate = useMemo(() => templates.find((t) => t.isSystem && t.status === 1), [templates]);

  const columns: TableColumn<FlowTemplate>[] = [
    { key: "code", label: F.code || "Código", width: "15%", render: (item) => (<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name={item.isSystem ? "shield-checkmark" : "document-outline"} size={16} color={colors.textSecondary} /><ThemedText type="caption" style={{ color: colors.primary, fontWeight: "500" }}>{item.code}</ThemedText></View>) },
    { key: "name", label: F.name || "Nombre", width: "22%", render: (item) => <ThemedText type="body2" style={{ fontWeight: "600" }}>{item.name}</ThemedText> },
    { key: "description", label: F.description || "Descripción", width: "28%", render: (item) => <ThemedText type="body2" numberOfLines={2} style={{ color: colors.textSecondary }}>{item.description || "—"}</ThemedText> },
    { key: "stages", label: F.stages || "Etapas", width: "8%", align: "center", render: (item) => <ThemedText type="body2" style={{ fontWeight: "600" }}>{item.stages?.length ?? "—"}</ThemedText> },
    { key: "isSystem", label: F.system || "Sistema", width: "10%", align: "center", render: (item) => (<View style={[styles.stageBadge, { backgroundColor: item.isSystem ? colors.primary + "20" : colors.surfaceVariant }]}><ThemedText type="caption" style={{ color: item.isSystem ? colors.primary : colors.textSecondary, fontWeight: "500" }}>{item.isSystem ? (F.system || "SISTEMA") : (F.user || "USUARIO")}</ThemedText></View>) },
    { key: "actions", label: "", width: "17%", align: "center", render: (item) => (<View style={styles.actionsContainer}><Tooltip text={F.stagesTitle || "Etapas"} position="left"><TouchableOpacity style={styles.actionButton} onPress={() => openStages(item)}><Ionicons name="git-branch-outline" size={18} color={actionIconColor} /></TouchableOpacity></Tooltip><Tooltip text={commonT.edit || "Editar"} position="left"><TouchableOpacity style={styles.actionButton} onPress={() => openEditTmpl(item)}><Ionicons name="pencil" size={18} color={actionIconColor} /></TouchableOpacity></Tooltip>{!item.isSystem && <Tooltip text={commonT.delete || "Eliminar"} position="left"><TouchableOpacity style={styles.actionButton} onPress={() => alert.showConfirm(F.deleteFlow || "Eliminar flujo", F.deleteFlowConfirm || "¿Eliminar este flujo?", () => deleteTmpl(item))}><Ionicons name="trash" size={18} color={actionIconColor} /></TouchableOpacity></Tooltip>}</View>) },
  ];

  if (accessLoading) return <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></ThemedView>;
  if (!hasAccess) return null;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, isMobile && styles.contentMobile]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.headerRow}>
              <DynamicIcon name="Ionicons:git-branch" size={isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle} color={colors.primary} />
              <ThemedText type="h2" style={isMobile ? styles.titleMobile : styles.title}>{F.title || "Flujos Configurables"}</ThemedText>
            </View>
            <ThemedText type="body1" style={styles.subtitle}>{F.subtitle || "Administra los templates de flujo conversacional y sus etapas"}</ThemedText>
          </View>
          <Button title={isMobile ? "" : (F.newFlow || "Nuevo Flujo")} onPress={openCreateTmpl} variant="primary" size="md">
            <Ionicons name="add" size={pageLayout.iconSubtitle} color={colors.contrastText} style={!isMobile ? { marginRight: spacing.sm } : undefined} />
          </Button>
        </View>

        {/* Búsqueda */}
        <SearchFilterBar filterValue={localFilter} onFilterChange={setLocalFilter} onSearchSubmit={(s) => { setHasError(false); setFilters((p) => ({ ...p, search: s, page: 1 })); }} filterPlaceholder={F.filterPlaceholder} searchPlaceholder={F.searchPlaceholder} filters={[]} activeFilters={{}} onAdvancedFilterChange={() => {}} onClearFilters={() => { setFilters({ page: 1, limit: 10, search: "", status: undefined }); setLocalFilter(""); setHasError(false); }} filteredCount={localFilter.trim() ? filteredTemplates.length : undefined} totalCount={pagination.total} />

        {/* Lista de flujos como cards */}
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : filteredTemplates.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ThemedText type="body2" style={{ color: colors.textSecondary }}>{F.noFlows}</ThemedText>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredTemplates.map((tmpl) => (
              <TouchableOpacity key={tmpl.id} activeOpacity={0.7} onPress={() => openStages(tmpl)}>
                <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderRadius: borderRadius.md, backgroundColor: colors.filterInputBackground, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
                  <Ionicons name={tmpl.isSystem ? "shield-checkmark" : "document-outline"} size={20} color={colors.textSecondary} />
                  <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600", width: isMobile ? 80 : 140 }} numberOfLines={1}>{tmpl.code}</ThemedText>
                  <ThemedText type="body2" style={{ fontWeight: "600", width: isMobile ? 100 : 220 }} numberOfLines={1}>{tmpl.name}</ThemedText>
                  {!isMobile && <ThemedText type="body2" style={{ color: colors.textSecondary, flex: 1 }} numberOfLines={1}>{tmpl.description}</ThemedText>}
                  <ThemedText type="body2" style={{ fontWeight: "700", width: 30, textAlign: "center" }}>{tmpl.stagesCount ?? 0}</ThemedText>
                  <StatusBadge status={tmpl.status} statusDescription={tmpl.statusDescription} size="small" />
                  <View style={{ flexDirection: "row", gap: 4 }}>
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => openEditTmpl(tmpl)}><Ionicons name="pencil" size={16} color={actionIconColor} /></TouchableOpacity>
                    {!tmpl.isSystem && <TouchableOpacity style={{ padding: 4 }} onPress={() => alert.showConfirm(F.deleteFlow, F.deleteFlowConfirm, () => deleteTmpl(tmpl))}><Ionicons name="trash" size={16} color={actionIconColor} /></TouchableOpacity>}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ═══ Modal crear/editar template ═══ */}
        {tmplModalMode && (
          <SideModal visible={tmplModalVisible} onClose={() => setTmplModalVisible(false)} title={tmplModalMode === "edit" ? (F.editFlow || "Editar Flujo") : (F.createFlow || "Crear Flujo")} subtitle={tmplModalMode === "edit" ? (F.editSubtitle || "Modifica los datos del flujo") : (F.createSubtitle || "Define un nuevo template de flujo")}
            topAlert={tmplError ? <InlineAlert type="error" message={tmplError.message} detail={tmplError.detail} autoClose onDismiss={() => setTmplError(null)} /> : undefined}
            footer={<>
              {tmplModalMode === "edit" && selectedTmpl && !selectedTmpl.isSystem && (
                <Tooltip text="Eliminar" position="left"><TouchableOpacity style={{ padding: 8, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surfaceVariant }} onPress={() => alert.showConfirm("Eliminar", `¿Eliminar "${selectedTmpl.name}"?`, () => deleteTmpl(selectedTmpl))}><Ionicons name="trash" size={18} color={actionIconColor} /></TouchableOpacity></Tooltip>
              )}
              <Button title={t.common.cancel} onPress={() => setTmplModalVisible(false)} variant="outlined" size="md" disabled={tmplSaving} />
              <Button title={tmplModalMode === "edit" ? t.common.save : (F.createFlow || "Crear Flujo")} onPress={saveTmpl} variant="primary" size="md" disabled={tmplSaving} />
            </>}
          >
            <View style={{ padding: modalLayout.headerPadding, gap: 24 }}>
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{F.code} *</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: spacing.sm }} primaryColor={colors.primary}>
                  <Ionicons name="pricetag-outline" size={20} color={colors.textSecondary} />
                  <TextInput style={{ color: colors.text, fontSize: 14, flex: 1 }} placeholder="VENTA_PRODUCTOS" placeholderTextColor={colors.textSecondary} value={tmplForm.code} onChangeText={(v) => setTmplForm((p) => ({ ...p, code: v.toUpperCase().replace(/\s+/g, "_") }))} editable={!tmplSaving} autoCapitalize="characters" />
                </InputWithFocus>
              </View>
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{F.name} *</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: spacing.sm }} primaryColor={colors.primary}>
                  <Ionicons name="text-outline" size={20} color={colors.textSecondary} />
                  <TextInput style={{ color: colors.text, fontSize: 14, flex: 1 }} placeholder="Nombre del flujo" placeholderTextColor={colors.textSecondary} value={tmplForm.name} onChangeText={(v) => setTmplForm((p) => ({ ...p, name: v }))} editable={!tmplSaving} />
                </InputWithFocus>
              </View>
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{F.description}</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: 12, alignItems: "flex-start", minHeight: 96 }} primaryColor={colors.primary}>
                  <TextInput style={{ color: colors.text, fontSize: 14, flex: 1, width: "100%", textAlignVertical: "top" }} placeholder="Descripción del flujo" placeholderTextColor={colors.textSecondary} value={tmplForm.description} onChangeText={(v) => setTmplForm((p) => ({ ...p, description: v }))} multiline editable={!tmplSaving} />
                </InputWithFocus>
              </View>
              <StatusSelector value={tmplForm.status} onChange={(v) => setTmplForm((p) => ({ ...p, status: v }))} label={B.status} required />
            </View>
          </SideModal>
        )}

        {/* ═══ Modal editor de etapas (centrado, dos paneles) ═══ */}
        {stagesTmpl && (
          <CenteredModal visible={stagesVisible} onClose={() => { setStagesVisible(false); setEditStage(null); }} title={F.stagesTitle} subtitle={F.tipMessage}
            footer={undefined}
          >
            {loadingStages ? (
              <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
            ) : (
              <View style={{ flexDirection: isMobile ? "column" : "row", minHeight: 420 }}>
                {/* Panel izquierdo: lista de etapas */}
                <View style={{ flex: 1, borderRightWidth: editStage && !isMobile ? 1 : 0, borderRightColor: colors.border }}>
                  <View style={{ flexDirection: "row", justifyContent: isMobile ? "stretch" : "flex-end", padding: 12, paddingBottom: 8 }}>
                    <Button title={F.newStage} onPress={addStage} variant="outlined" size="sm" disabled={stageSaving} style={isMobile ? { flex: 1 } : undefined}>
                      <Ionicons name="add" size={16} color={colors.primary} style={{ marginRight: 4 }} />
                    </Button>
                  </View>
                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator>
                    <View style={{ padding: 12, paddingTop: 0, gap: 8 }}>
                      {stages.map((stage, index) => {
                        const isActive = editStage?.id === stage.id;

                        // En móvil, si está activa, mostrar formulario inline
                        if (isMobile && isActive && editStage) {
                          return (
                            <View key={stage.id} style={[styles.stageRow, { borderColor: colors.primary, backgroundColor: colors.primary + "10", borderLeftWidth: 3, borderLeftColor: colors.primary, flexDirection: "column", alignItems: "stretch", gap: 16, paddingVertical: 16 }]}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <ThemedText type="body2" style={{ fontWeight: "600" }}>{F.editStage}</ThemedText>
                                <Tooltip text={commonT.delete} position="left">
                                  <TouchableOpacity onPress={() => alert.showConfirm(F.deleteStage, F.deleteStageConfirm, () => deleteStage(editStage))} style={{ padding: 4 }}>
                                    <Ionicons name="trash" size={18} color={actionIconColor} />
                                  </TouchableOpacity>
                                </Tooltip>
                              </View>
                              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 8, paddingVertical: 10, width: 44 }} primaryColor={colors.primary}>
                                  <TextInput style={{ color: colors.text, fontSize: 20, textAlign: "center" }} value={editStage.emoji || ""} onChangeText={(v) => setEditStage((p) => p ? { ...p, emoji: v.slice(0, 2) } : p)} maxLength={2} />
                                </InputWithFocus>
                                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 10, flex: 1 }} primaryColor={colors.primary}>
                                  <TextInput style={{ color: colors.text, fontSize: 14, fontWeight: "700" }} value={editStage.stageCode} onChangeText={(v) => setEditStage((p) => p ? { ...p, stageCode: v.toUpperCase().replace(/\s+/g, "_") } : p)} />
                                </InputWithFocus>
                              </View>
                              <Select label="" placeholder={F.behavior} value={editStage.behaviorId || undefined} options={behaviors.map((b) => ({ value: b.id, label: b.name }))} onSelect={(v) => setEditStage((p) => p ? { ...p, behaviorId: v as string } : p)} />
                              <View style={{ gap: 12 }}>
                                <JsonEditor label="Transition Rules" value={editStage.transitionRules as any} onChange={(v) => setEditStage((p) => p ? { ...p, transitionRules: v } : p)} minHeight={100} />
                                <JsonEditor label="Skip Conditions" value={editStage.skipConditions as any} onChange={(v) => setEditStage((p) => p ? { ...p, skipConditions: v } : p)} minHeight={100} />
                              </View>
                              <View style={{ gap: 6 }}>
                                <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "500" }}>Context Override</ThemedText>
                                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 10, paddingVertical: 10, alignItems: "flex-start", minHeight: 100 }} primaryColor={colors.primary}>
                                  <TextInput style={{ color: colors.text, fontSize: 13, flex: 1, width: "100%", textAlignVertical: "top" }} value={(editStage.contextOverride as any) || ""} onChangeText={(v) => setEditStage((p) => p ? { ...p, contextOverride: v as any } : p)} multiline />
                                </InputWithFocus>
                              </View>
                              <StatusSelector value={editStage.status} onChange={(v) => setEditStage((p) => p ? { ...p, status: v } : p)} label={B.status} />
                              <View style={{ flexDirection: "row", gap: 8 }}>
                                <Button title={commonT.cancel} onPress={() => setEditStage(null)} variant="outlined" size="sm" style={{ flex: 1 }} />
                                <Button title={commonT.save} onPress={() => saveStage(editStage)} variant="primary" size="sm" disabled={stageSaving} style={{ flex: 1 }} />
                              </View>
                            </View>
                          );
                        }

                        return (
                          <View
                            key={stage.id}
                            onMouseDown={(e: any) => handleStageDragStart(e, index)}
                            onMouseEnter={() => { if (dragIndexRef.current !== null && dragIndexRef.current !== index) { dragOverIndexRef.current = index; setDragOverIndex(index); } }}
                            style={[styles.stageRow, {
                              borderColor: isActive ? colors.primary : dragOverIndex === index ? colors.success : colors.border,
                              backgroundColor: isActive ? colors.primary + "10" : dragOverIndex === index ? colors.success + "08" : colors.filterInputBackground,
                              borderLeftWidth: isActive ? 3 : 1,
                              borderLeftColor: isActive ? colors.primary : dragOverIndex === index ? colors.success : colors.border,
                              opacity: dragIndex === index ? 0.4 : 1,
                              cursor: "grab",
                            } as any]}
                          >
                            <TouchableOpacity activeOpacity={0.7} onPress={() => setEditStage({ ...stage })} style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
                            <Ionicons name="reorder-three" size={18} color={colors.textSecondary} />
                            {orderChanged && originalOrder[index] !== stage.id && (
                              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                            )}
                            <ThemedText style={{ fontSize: 22, width: 32, textAlign: "center" }}>{stage.emoji || "⚙️"}</ThemedText>
                            <View style={{ flex: 1 }}>
                              <ThemedText type="body2" style={{ fontWeight: "700" }}>{stage.stageCode}</ThemedText>
                              <ThemedText type="caption" style={{ color: colors.textSecondary }}>{(() => { const b = behaviors.find((x) => x.id === stage.behaviorId); return b?.description || b?.name || ""; })()}</ThemedText>
                            </View>
                          </TouchableOpacity>
                          </View>
                        );
                      })}
                      {stages.length === 0 && <ThemedText type="body2" style={{ color: colors.textSecondary, textAlign: "center", padding: 24 }}>{F.noStages}</ThemedText>}
                      {orderChanged && (
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                          <Button title={commonT.cancel} onPress={cancelReorder} variant="outlined" size="sm" style={{ flex: 1 }} />
                          <Button title={commonT.save} onPress={saveStageOrder} variant="primary" size="sm" disabled={stageSaving} style={{ flex: 1 }} />
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>

                {/* Panel derecho: editor de etapa (solo desktop) */}
                {editStage && !isMobile && (
                  <ScrollView style={{ width: isMobile ? undefined : 380 }} contentContainerStyle={{ padding: 20, gap: 24 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <ThemedText type="h4">{F.editStage}</ThemedText>
                      <Tooltip text={commonT.delete} position="left">
                        <TouchableOpacity onPress={() => alert.showConfirm(F.deleteStage, F.deleteStageConfirm, () => deleteStage(editStage))} style={{ padding: 4 }}>
                          <Ionicons name="trash" size={18} color={actionIconColor} />
                        </TouchableOpacity>
                      </Tooltip>
                    </View>

                    {/* Emoji + Nombre + Comportamiento */}
                    <View style={{ gap: 8 }}>
                      <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{F.stageName}</ThemedText>
                      <View style={{ flexDirection: "row", gap: 8, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                        <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 8, paddingVertical: 12, width: 48 }} primaryColor={colors.primary}>
                          <TextInput style={{ color: colors.text, fontSize: 22, textAlign: "center" }} value={editStage.emoji || ""} onChangeText={(v) => setEditStage((p) => p ? { ...p, emoji: v.slice(0, 2) } : p)} maxLength={2} />
                        </InputWithFocus>
                        <View style={{ flex: 2, minWidth: 80 }}>
                          <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12 }} primaryColor={colors.primary}>
                            <TextInput style={{ color: colors.text, fontSize: 15, fontWeight: "700" }} value={editStage.stageCode} onChangeText={(v) => setEditStage((p) => p ? { ...p, stageCode: v.toUpperCase().replace(/\s+/g, "_") } : p)} />
                          </InputWithFocus>
                        </View>
                        <View style={{ flex: 2, width: isMobile ? "100%" : undefined }}>
                          <Select label="" placeholder={F.behavior} value={editStage.behaviorId || undefined} options={behaviors.map((b) => ({ value: b.id, label: b.name }))} onSelect={(v) => setEditStage((p) => p ? { ...p, behaviorId: v as string } : p)} />
                        </View>
                      </View>
                    </View>

                    {/* Transition Rules + Skip Conditions en fila */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <JsonEditor label="Transition Rules" value={editStage.transitionRules as any} onChange={(v) => setEditStage((p) => p ? { ...p, transitionRules: v } : p)} minHeight={80} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <JsonEditor label="Skip Conditions" value={editStage.skipConditions as any} onChange={(v) => setEditStage((p) => p ? { ...p, skipConditions: v } : p)} minHeight={80} />
                      </View>
                    </View>

                    {/* Context Override (texto) */}
                    <View style={{ gap: 8 }}>
                      <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>Context Override</ThemedText>
                      <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12, alignItems: "flex-start", minHeight: 100 }} primaryColor={colors.primary}>
                        <TextInput style={{ color: colors.text, fontSize: 14, flex: 1, width: "100%", textAlignVertical: "top" }} value={(editStage.contextOverride as any) || ""} onChangeText={(v) => setEditStage((p) => p ? { ...p, contextOverride: v as any } : p)} multiline />
                      </InputWithFocus>
                    </View>

                    {/* Estado — al final */}
                    <StatusSelector value={editStage.status} onChange={(v) => setEditStage((p) => p ? { ...p, status: v } : p)} label={B.status} />

                    {/* Botones */}
                    <View style={{ gap: 8, marginTop: 4 }}>
                      <Button title={commonT.save} onPress={() => saveStage(editStage)} variant="primary" size="md" disabled={stageSaving} />
                      <Button title={commonT.cancel} onPress={() => setEditStage(null)} variant="outlined" size="md" />
                    </View>

                  </ScrollView>
                )}
              </View>
            )}
          </CenteredModal>
        )}

        {/* ═══ Modal editor de comportamiento (SideModal) ═══ */}
        {editBehavior && (
          <SideModal visible={behModalVisible} onClose={() => setBehModalVisible(false)} title="Editar Comportamiento" subtitle={editBehavior.behaviorKey}
            topAlert={behError ? <InlineAlert type="error" message={behError.message} detail={behError.detail} autoClose onDismiss={() => setBehError(null)} /> : undefined}
            footer={<>
              <Button title={t.common.cancel} onPress={() => setBehModalVisible(false)} variant="outlined" size="md" disabled={behSaving} />
              <Button title={t.common.save} onPress={saveBehavior} variant="primary" size="md" disabled={behSaving} />
            </>}
          >
            <View style={{ padding: modalLayout.headerPadding, gap: 18 }}>
              <View style={{ gap: 6 }}>
                <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>Nombre del comportamiento</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12 }} primaryColor={colors.primary}>
                  <TextInput style={{ color: colors.text, fontSize: 14 }} value={editBehavior.name} onChangeText={(v) => setEditBehavior((p) => p ? { ...p, name: v } : p)} editable={!behSaving} />
                </InputWithFocus>
              </View>
              <View style={{ gap: 6 }}>
                <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>Descripción</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12, alignItems: "flex-start", minHeight: 96 }} primaryColor={colors.primary}>
                  <TextInput style={{ color: colors.text, fontSize: 14, flex: 1, width: "100%", textAlignVertical: "top" }} value={editBehavior.description || ""} onChangeText={(v) => setEditBehavior((p) => p ? { ...p, description: v } : p)} multiline editable={!behSaving} />
                </InputWithFocus>
              </View>
              <View style={{ gap: 6 }}>
                <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>Rol</ThemedText>
                <Select label="" placeholder="Seleccionar rol" value={editBehavior.role} options={STAGE_ROLES.map((r) => ({ value: r, label: r }))} onSelect={(v) => setEditBehavior((p) => p ? { ...p, role: v as string } : p)} disabled={behSaving} />
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>APIs asociadas</ThemedText>
                  <ThemedText type="caption" style={{ color: colors.textSecondary }}>{editBehavior.callApiName?.length ?? 0} APIs conectadas</ThemedText>
                </View>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {(editBehavior.callApiName || []).map((api) => (
                    <View key={api} style={[styles.stageBadge, { backgroundColor: colors.primary + "15", flexDirection: "row", alignItems: "center", gap: 4 }]}>
                      <Ionicons name="settings-outline" size={12} color={colors.primary} />
                      <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "500" }}>{api}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>Directrices / Guideline Keys</ThemedText>
                <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                  {(editBehavior.guidelineKeys || []).map((gk) => (
                    <View key={gk} style={[styles.stageBadge, { backgroundColor: colors.warning + "20" }]}>
                      <ThemedText type="caption" style={{ color: colors.warning, fontWeight: "500" }}>{gk}</ThemedText>
                    </View>
                  ))}
                  {(!editBehavior.guidelineKeys || editBehavior.guidelineKeys.length === 0) && <ThemedText type="caption" style={{ color: colors.textSecondary }}>Sin directrices configuradas</ThemedText>}
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText type="caption" style={{ color: colors.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>Configuración técnica (Stage Config)</ThemedText>
                  <TouchableOpacity onPress={() => { try { const formatted = JSON.stringify(editBehavior.stageConfig || {}, null, 2); setEditBehavior((p) => p ? { ...p, stageConfig: JSON.parse(formatted) } : p); } catch {} }}>
                    <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "500" }}>FORMATEAR JSON</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={{ backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 120 }}>
                  <TextInput style={{ color: colors.text, fontSize: 13, fontFamily: "monospace", flex: 1, width: "100%", textAlignVertical: "top" }} value={JSON.stringify(editBehavior.stageConfig || {}, null, 2)} onChangeText={(v) => { try { setEditBehavior((p) => p ? { ...p, stageConfig: JSON.parse(v) } : p); } catch {} }} multiline editable={!behSaving} />
                </View>
              </View>
            </View>
          </SideModal>
        )}
      </View>
    </ThemedView>
  );
}
