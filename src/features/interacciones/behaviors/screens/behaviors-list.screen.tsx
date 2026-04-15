/**
 * Pantalla de administración de Comportamientos del sistema
 * Diseño: Grid de cards con icono, nombre, descripción, rol, APIs
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/ui/inline-alert";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { SideModal } from "@/components/ui/side-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { DynamicIcon } from "@/src/domains/shared/components";
import { JsonEditor } from "@/src/domains/shared/components/json-editor/json-editor";
import { StatusSelector } from "@/src/domains/shared/components/status-selector/status-selector";
import { FlowsService } from "@/src/features/interacciones/flows/services";
import type { FlowBehavior } from "@/src/features/interacciones/flows/types";
import { AVAILABLE_APIS, STAGE_ROLES } from "@/src/features/interacciones/flows/types";
import { useRouteAccessGuard } from "@/src/infrastructure/access";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { extractErrorInfo } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { createBehaviorsListScreenStyles } from "./behaviors-list.screen.styles";

/** Icono por behaviorKey */
const BEHAVIOR_ICONS: Record<string, string> = {
  INFO: "information-circle-outline",
  SEARCH: "search-outline",
  PRESENT: "easel-outline",
  COLLECT: "clipboard-outline",
  VALIDATE: "shield-checkmark-outline",
  CONFIRM: "checkmark-circle-outline",
  CLOSE: "close-circle-outline",
};

export function BehaviorsListScreen() {
  const { colors, isDark, spacing, typography, pageLayout, borderRadius, modalLayout } = useTheme();
  const { t } = useTranslation();
  const actionIconColor = isDark ? colors.primaryDark : colors.primary;
  const pathname = usePathname();
  const alert = useAlert();
  const { isMobile } = useResponsive();
  const styles = useMemo(() => createBehaviorsListScreenStyles({ colors, spacing, typography, pageLayout, borderRadius }, isMobile), [colors, spacing, typography, pageLayout, borderRadius, isMobile]);
  const { loading: accessLoading, allowed: hasAccess, handleApiError, isScreenFocused } = useRouteAccessGuard(pathname);
  const B = t.pages.behaviors;
  const commonT = t.common;

  const [behaviors, setBehaviors] = useState<FlowBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [localFilter, setLocalFilter] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editBeh, setEditBeh] = useState<FlowBehavior | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<{ message: string; detail?: string } | null>(null);
  const [newApiInput, setNewApiInput] = useState("");
  const [newGuidelineInput, setNewGuidelineInput] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [showGuidelineInput, setShowGuidelineInput] = useState(false);

  const loadBehaviors = useCallback(async () => {
    try { setLoading(true); const data = await FlowsService.getBehaviors(); setBehaviors(data); }
    catch (err: any) { if (handleApiError(err)) return; alert.showError(B.noData); }
    finally { setLoading(false); }
  }, [alert, handleApiError]);

  useEffect(() => { if (isScreenFocused && hasAccess && !accessLoading) loadBehaviors(); }, [accessLoading, hasAccess, isScreenFocused]);

  const openEdit = (b: FlowBehavior) => { setEditBeh({ ...b }); setModalError(null); setShowApiInput(false); setShowGuidelineInput(false); setNewApiInput(""); setNewGuidelineInput(""); setModalVisible(true); };

  const handleSave = async () => {
    if (!editBeh) return; setSaving(true);
    try {
      if (editBeh.id) {
        await FlowsService.updateBehavior(editBeh.id, { name: editBeh.name, description: editBeh.description, role: editBeh.role, callApiName: editBeh.callApiName, guidelineKeys: editBeh.guidelineKeys, stageConfig: editBeh.stageConfig, skipAgent: editBeh.skipAgent, status: editBeh.status });
      } else {
        await FlowsService.createBehavior({ behaviorKey: editBeh.behaviorKey, name: editBeh.name, description: editBeh.description, role: editBeh.role, callApiName: editBeh.callApiName, guidelineKeys: editBeh.guidelineKeys, stageConfig: editBeh.stageConfig, skipAgent: editBeh.skipAgent, status: editBeh.status });
      }
      alert.showSuccess(B.behaviorUpdated); setModalVisible(false); loadBehaviors();
    } catch (err: any) { const { message, detail } = extractErrorInfo(err, "Error"); setModalError({ message, detail }); }
    finally { setSaving(false); }
  };

  const addApi = () => { if (!newApiInput.trim()) return; setEditBeh((p) => p ? { ...p, callApiName: [...(p.callApiName || []), newApiInput.trim()] } : p); setNewApiInput(""); setShowApiInput(false); };
  const removeApi = (api: string) => { setEditBeh((p) => p ? { ...p, callApiName: (p.callApiName || []).filter((a) => a !== api) } : p); };
  const addGuideline = () => { if (!newGuidelineInput.trim()) return; setEditBeh((p) => p ? { ...p, guidelineKeys: [...(p.guidelineKeys || []), newGuidelineInput.trim().toUpperCase()] } : p); setNewGuidelineInput(""); setShowGuidelineInput(false); };
  const removeGuideline = (gk: string) => { setEditBeh((p) => p ? { ...p, guidelineKeys: (p.guidelineKeys || []).filter((g) => g !== gk) } : p); };
  const formatJson = (value: object | null | undefined, field: "stageConfig") => { try { const f = JSON.stringify(value || {}, null, 2); setEditBeh((p) => p ? { ...p, [field]: JSON.parse(f) } : p); } catch {} };

  const filtered = useMemo(() => {
    if (!localFilter.trim()) return behaviors;
    const f = localFilter.toLowerCase().trim();
    return behaviors.filter((b) => b.behaviorKey.toLowerCase().includes(f) || (b.name || "").toLowerCase().includes(f));
  }, [behaviors, localFilter]);

  if (accessLoading) return <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></ThemedView>;
  if (!hasAccess) return null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={[styles.content, isMobile && styles.contentMobile]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <View style={styles.headerRow}>
              <DynamicIcon name="Ionicons:flash" size={isMobile ? pageLayout.iconTitleMobile : pageLayout.iconTitle} color={colors.primary} />
              <ThemedText type="h2" style={isMobile ? styles.titleMobile : styles.title}>{B.title}</ThemedText>
            </View>
            <ThemedText type="body1" style={styles.subtitle}>{B.subtitle}</ThemedText>
          </View>
        </View>

        {/* Grid de cards */}
        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, paddingBottom: 24 }}>
            {filtered.map((beh) => {
              const iconName = BEHAVIOR_ICONS[beh.behaviorKey] || "cog-outline";
              return (
                <TouchableOpacity key={beh.id} activeOpacity={0.7} onPress={() => openEdit(beh)} style={{ width: isMobile ? "100%" : "31%", minWidth: isMobile ? undefined : 280 }}>
                  <Card variant="outlined" style={{ padding: 0, borderColor: colors.border, borderRadius: borderRadius.lg, overflow: "hidden", height: 260 }}>
                    <View style={{ padding: 20, flex: 1, justifyContent: "space-between" }}>
                      {/* Top: icono + estado */}
                      <View>
                        {/* Icono + estado */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                          <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: colors.primary + "15", justifyContent: "center", alignItems: "center" }}>
                            <Ionicons name={iconName as any} size={24} color={colors.primary} />
                          </View>
                          <StatusBadge status={beh.status} statusDescription={beh.statusDescription || (beh.status === 1 ? "Activo" : "Inactivo")} size="small" />
                        </View>

                        {/* Nombre */}
                        <ThemedText type="h4" style={{ fontWeight: "800", marginBottom: 6 }}>{beh.behaviorKey}</ThemedText>

                        {/* Descripción */}
                        <ThemedText type="body2" style={{ color: colors.textSecondary, lineHeight: 18 }} numberOfLines={2}>{beh.description}</ThemedText>
                      </View>

                      {/* Bottom: rol + skipAgent + APIs + directrices */}
                      <View style={{ gap: 8, marginTop: 6 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <ThemedText type="caption" style={{ color: colors.textSecondary }}>{B.role}:</ThemedText>
                            <ThemedText type="caption" style={{ fontWeight: "700" }}>{beh.role}</ThemedText>
                          </View>
                          {beh.skipAgent && (
                            <View style={{ backgroundColor: colors.warning + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                              <ThemedText type="caption" style={{ color: colors.warning, fontWeight: "600", fontSize: 10 }}>{B.skipAgent}</ThemedText>
                            </View>
                          )}
                        </View>

                        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                          {(beh.callApiName || []).map((api) => (
                            <View key={api} style={{ backgroundColor: colors.primary + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 }}>
                              <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "500", fontSize: 11 }}>{api}</ThemedText>
                            </View>
                          ))}
                        </View>

                        {(beh.guidelineKeys || []).length > 0 && (
                          <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                            {(beh.guidelineKeys || []).slice(0, 2).map((gk) => (
                              <View key={gk} style={{ backgroundColor: colors.secondary + "15", borderWidth: 1, borderColor: colors.secondary + "30", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 }}>
                                <ThemedText type="caption" style={{ color: colors.secondary, fontWeight: "500", fontSize: 11 }}>{gk}</ThemedText>
                              </View>
                            ))}
                            {(beh.guidelineKeys || []).length > 2 && (
                              <ThemedText type="caption" style={{ color: colors.textSecondary, alignSelf: "center" }}>+{(beh.guidelineKeys || []).length - 2}</ThemedText>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}

            {/* Card para agregar nuevo */}
            <View style={{ width: isMobile ? "100%" : "31%", minWidth: isMobile ? undefined : 280 }}>
              <Card variant="outlined" style={{ padding: 0, borderColor: colors.border + "60", borderRadius: borderRadius.lg, overflow: "hidden", height: 260, borderStyle: "dashed" }}>
                <TouchableOpacity activeOpacity={0.6} style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }} onPress={() => openEdit({ id: "", behaviorKey: "", name: "", description: "", role: "ASESOR", callApiName: [], guidelineKeys: [], skipAgent: false, stageConfig: null, isSystem: false, status: 1 } as FlowBehavior)}>
                  <Ionicons name="add-circle-outline" size={40} color={colors.textSecondary + "60"} />
                  <ThemedText type="body2" style={{ color: colors.textSecondary }}>{B.title}</ThemedText>
                </TouchableOpacity>
              </Card>
            </View>
          </View>
        )}

        {/* Modal edición */}
        {editBeh && (
          <SideModal visible={modalVisible} onClose={() => setModalVisible(false)} title={editBeh.id ? `${commonT.edit} ${editBeh.behaviorKey}` : commonT.create} subtitle={editBeh.id ? (editBeh.description || "") : B.subtitle}
            topAlert={modalError ? <InlineAlert type="error" message={modalError.message} detail={modalError.detail} autoClose onDismiss={() => setModalError(null)} /> : undefined}
            footer={<>
              <Button title={commonT.cancel} onPress={() => setModalVisible(false)} variant="outlined" size="md" disabled={saving} />
              <Button title={commonT.save} onPress={handleSave} variant="primary" size="md" disabled={saving} />
            </>}
          >
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: modalLayout.headerPadding, gap: 24 }}>
              {/* Clave — solo en creación */}
              {!editBeh.id && (
                <View style={{ gap: 8 }}>
                  <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.behaviorKey}</ThemedText>
                  <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12 }} primaryColor={colors.primary}>
                    <TextInput style={{ color: colors.text, fontSize: 14, fontWeight: "600" }} value={editBeh.behaviorKey} onChangeText={(v) => setEditBeh((p) => p ? { ...p, behaviorKey: v.toUpperCase().replace(/\s+/g, "_") } : p)} autoCapitalize="characters" editable={!saving} />
                  </InputWithFocus>
                </View>
              )}

              {/* Nombre */}
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.name}</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12 }} primaryColor={colors.primary}>
                  <TextInput style={{ color: colors.text, fontSize: 14 }} value={editBeh.name} onChangeText={(v) => setEditBeh((p) => p ? { ...p, name: v } : p)} editable={!saving} />
                </InputWithFocus>
              </View>

              {/* Descripción */}
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.description}</ThemedText>
                <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 12, paddingVertical: 12, alignItems: "flex-start", minHeight: 96 }} primaryColor={colors.primary}>
                  <TextInput style={{ color: colors.text, fontSize: 14, flex: 1, width: "100%", textAlignVertical: "top" }} value={editBeh.description || ""} onChangeText={(v) => setEditBeh((p) => p ? { ...p, description: v } : p)} multiline editable={!saving} />
                </InputWithFocus>
              </View>

              {/* Rol */}
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.role}</ThemedText>
                <Select label="" placeholder={B.selectRole} value={editBeh.role} options={STAGE_ROLES.map((r) => ({ value: r, label: r }))} onSelect={(v) => setEditBeh((p) => p ? { ...p, role: v as string } : p)} disabled={saving} />
              </View>

              {/* Skip Agent */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.skipAgent}</ThemedText>
                  <ThemedText type="body2" style={{ color: colors.textSecondary, marginTop: 2 }}>{B.skipAgentDescription}</ThemedText>
                </View>
                <TouchableOpacity style={{ width: 48, height: 28, borderRadius: 14, justifyContent: "center", paddingHorizontal: 2, backgroundColor: editBeh.skipAgent ? colors.primary : colors.border }} onPress={() => setEditBeh((p) => p ? { ...p, skipAgent: !p.skipAgent } : p)} disabled={saving}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#fff", alignSelf: editBeh.skipAgent ? "flex-end" : "flex-start" }} />
                </TouchableOpacity>
              </View>

              {/* APIs */}
              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.apis}</ThemedText>
                  <ThemedText type="body2" style={{ color: colors.textSecondary }}>{editBeh.callApiName?.length ?? 0} {B.apisConnected}</ThemedText>
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {(editBeh.callApiName || []).map((api) => (
                    <TouchableOpacity key={api} onPress={() => removeApi(api)} disabled={saving}>
                      <View style={{ backgroundColor: colors.primary + "15", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                        <Ionicons name="settings-outline" size={14} color={colors.primary} />
                        <ThemedText type="body2" style={{ color: colors.primary, fontWeight: "500" }}>{api}</ThemedText>
                        <Ionicons name="close" size={14} color={colors.primary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {AVAILABLE_APIS.filter((a) => !(editBeh.callApiName || []).includes(a.value)).map((api) => (
                    <TouchableOpacity key={api.value} onPress={() => setEditBeh((p) => p ? { ...p, callApiName: [...(p.callApiName || []), api.value] } : p)} disabled={saving}>
                      <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: colors.textSecondary + "40", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                        <Ionicons name="add" size={14} color={colors.textSecondary} />
                        <ThemedText type="body2" style={{ color: colors.textSecondary }}>{api.value}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Directrices */}
              <View style={{ gap: 8 }}>
                <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text }}>{B.guidelines}</ThemedText>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {(editBeh.guidelineKeys || []).map((gk) => (
                    <TouchableOpacity key={gk} onPress={() => removeGuideline(gk)} disabled={saving}>
                      <View style={{ backgroundColor: colors.secondary + "15", borderWidth: 1, borderColor: colors.secondary + "30", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                        <ThemedText type="body2" style={{ color: colors.secondary, fontWeight: "600" }}>{gk}</ThemedText>
                        <Ionicons name="close" size={14} color={colors.secondary} />
                      </View>
                    </TouchableOpacity>
                  ))}
                  {showGuidelineInput ? (
                    <InputWithFocus containerStyle={{ backgroundColor: colors.filterInputBackground, borderColor: colors.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, minWidth: 140 }} primaryColor={colors.primary}>
                      <TextInput style={{ color: colors.text, fontSize: 13 }} placeholder={B.newGuideline} placeholderTextColor={colors.textSecondary} value={newGuidelineInput} onChangeText={setNewGuidelineInput} onSubmitEditing={addGuideline} onBlur={() => { if (!newGuidelineInput.trim()) setShowGuidelineInput(false); }} autoFocus autoCapitalize="characters" editable={!saving} />
                    </InputWithFocus>
                  ) : (
                    <TouchableOpacity onPress={() => setShowGuidelineInput(true)} style={{ padding: 4 }}>
                      <Ionicons name="add-circle-outline" size={28} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Stage Config */}
              <JsonEditor label={B.stageConfig} value={editBeh.stageConfig} onChange={(v) => setEditBeh((p) => p ? { ...p, stageConfig: v } : p)} minHeight={120} disabled={saving} />

              {/* Estado */}
              <StatusSelector value={editBeh.status} onChange={(v) => setEditBeh((p) => p ? { ...p, status: v } : p)} label={B.status} />
            </ScrollView>
          </SideModal>
        )}
      </ScrollView>
    </ThemedView>
  );
}
