/**
 * Modal genérico de Condiciones (CRUD)
 * - Sin offeringId: gestiona condiciones generales de la empresa
 * - Con offeringId: muestra todas y permite asociar/desasociar a la oferta
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { CenteredModal } from "@/components/ui/centered-modal";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { CustomSwitch } from "@/src/domains/shared/components/custom-switch/custom-switch";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConditionsService } from "./conditions-modal.service";
import { createConditionsModalStyles } from "./conditions-modal.styles";
import type { Condition, ConditionsModalProps } from "./conditions-modal.types";

export function ConditionsModal({
  visible,
  onClose,
  companyId,
  scope,
  offeringId,
  offeringConditionIds = [],
  onOfferingConditionsChange,
  preloadedConditions,
  offeringLabel,
}: ConditionsModalProps) {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const C = (t as any).conditions || {};
  const styles = useMemo(
    () => createConditionsModalStyles({ colors, spacing, borderRadius }),
    [colors, spacing, borderRadius],
  );
  const actionColor = isDark ? colors.primaryDark : colors.primary;

  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState("");
  const [formMandatory, setFormMandatory] = useState(false);
  const [formStatus, setFormStatus] = useState(1);
  const [saving, setSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(offeringConditionIds));

  useEffect(() => {
    setSelectedIds(new Set(offeringConditionIds));
  }, [offeringConditionIds]);

  const loadConditions = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (scope === "specific" && preloadedConditions) {
        // Filtrar las condiciones del offering por scope=specific
        setConditions(preloadedConditions.filter((c) => c.scope === "specific"));
      } else {
        const data = await ConditionsService.getAll(companyId, scope);
        setConditions(data);
      }
    } catch {
      setConditions([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, scope, preloadedConditions]);

  useEffect(() => {
    if (visible) {
      loadConditions();
      setEditingId(null);
      setIsCreating(false);
      setFormText("");
      setFormMandatory(false);
    }
  }, [visible, loadConditions]);

  const handleCreate = useCallback(async () => {
    if (!formText.trim()) return;
    setSaving(true);
    try {
      await ConditionsService.create({ companyId, description: formText.trim(), isMandatory: formMandatory, scope, status: formStatus });
      alert.showSuccess(C.created || "Condición creada");
      setIsCreating(false);
      setFormText("");
      setFormMandatory(false);
      loadConditions();
    } catch (e: any) {
      alert.showError(e?.message || C.errorCreate || "Error");
    } finally {
      setSaving(false);
    }
  }, [companyId, formText, formMandatory, alert, C, loadConditions]);

  const handleUpdate = useCallback(async () => {
    if (!editingId || !formText.trim()) return;
    setSaving(true);
    try {
      await ConditionsService.update(editingId, { description: formText.trim(), isMandatory: formMandatory, status: formStatus });
      alert.showSuccess(C.updated || "Condición actualizada");
      setEditingId(null);
      setFormText("");
      setFormMandatory(false);
      loadConditions();
    } catch (e: any) {
      alert.showError(e?.message || C.errorUpdate || "Error");
    } finally {
      setSaving(false);
    }
  }, [editingId, formText, formMandatory, alert, C, loadConditions]);

  const handleDelete = useCallback(async (id: string) => {
    alert.showConfirm(
      C.deleteTitle || "Eliminar",
      C.deleteMessage || "¿Eliminar esta condición?",
      async () => {
        try {
          await ConditionsService.remove(id);
          alert.showSuccess(C.deleted || "Eliminada");
          loadConditions();
        } catch (e: any) {
          alert.showError(e?.message || C.errorDelete || "Error");
        }
      },
    );
  }, [alert, C, loadConditions]);

  const handleStartEdit = useCallback((c: Condition) => {
    setEditingId(c.id);
    setFormText(c.description);
    setFormMandatory(c.isMandatory ?? false);
    setFormStatus(c.status ?? 1);
    setIsCreating(false);
  }, []);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
    setEditingId(null);
    setFormText("");
    setFormMandatory(false);
    setFormStatus(1);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingId(null);
    setIsCreating(false);
    setFormText("");
    setFormMandatory(false);
    setFormStatus(1);
  }, []);

  const handleToggleCondition = useCallback((conditionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(conditionId)) next.delete(conditionId);
      else next.add(conditionId);
      onOfferingConditionsChange?.([...next]);
      return next;
    });
  }, [onOfferingConditionsChange]);

  const isOfferingMode = !!offeringId;
  const title = scope === "general"
    ? (C.titleGeneral || "Condiciones generales")
    : (C.titleOffering || "Condiciones de la oferta");

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={scope === "general" ? (C.subtitleGeneral || "Condiciones que aplican a todas las ofertas") : (offeringLabel || C.subtitleOffering || "Condiciones de esta oferta")}
      footer={
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}>
          <Button title={C.close || "Cerrar"} onPress={onClose} variant="outlined" size="md" />
        </View>
      }
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Lista de condiciones */}
            {conditions.length === 0 && !isCreating ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={36} color={colors.textSecondary} />
                <ThemedText type="body2" style={{ color: colors.textSecondary }}>
                  {C.empty || "Sin condiciones"}
                </ThemedText>
              </View>
            ) : (
              conditions.map((c) => {
                if (editingId === c.id) {
                  return (
                    <View key={c.id} style={styles.formRow}>
                      <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 4 }}>{C.descriptionLabel || "Descripción *"}</ThemedText>
                      <InputWithFocus
                        containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]}
                        primaryColor={colors.primary}
                      >
                        <TextInput style={[styles.formInputText, { color: colors.text }]} value={formText} onChangeText={setFormText} placeholder={C.placeholder || "Descripción de la condición"} placeholderTextColor={colors.textSecondary} multiline />
                      </InputWithFocus>
                      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.sm, width: "100%" }}>
                        <CustomSwitch value={formMandatory} onValueChange={setFormMandatory} label={C.mandatory || "Obligatoria"} />
                        <View style={{ width: spacing.lg }} />
                        <CustomSwitch value={formStatus === 1} onValueChange={(v) => setFormStatus(v ? 1 : 0)} label={formStatus === 1 ? (C.active || "Activa") : (C.inactive || "Inactiva")} />
                      </View>
                      <View style={styles.formActions}>
                        {editingId && <Button title={C.delete || "Eliminar"} onPress={() => handleDelete(editingId)} variant="ghost" size="md" disabled={saving} />}
                        <Button title={C.cancel || "Cancelar"} onPress={handleCancel} variant="outlined" size="md" disabled={saving} />
                        <Button title={saving ? "..." : (C.save || "Guardar")} onPress={handleUpdate} variant="primary" size="md" disabled={saving} textStyle={{ color: "#FFFFFF" }} />
                      </View>
                    </View>
                  );
                }

                return isOfferingMode && scope === "general" ? (
                  <View key={c.id} style={styles.offeringToggleRow}>
                    <ThemedText style={styles.conditionText} numberOfLines={2}>{c.description}</ThemedText>
                    <CustomSwitch
                      value={selectedIds.has(c.id)}
                      onValueChange={() => handleToggleCondition(c.id)}
                      label=""
                    />
                  </View>
                ) : (
                  <View key={c.id} style={styles.conditionRow}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: (c.status ?? 1) === 1 ? colors.success : colors.textSecondary, marginRight: 8 }} />
                    <ThemedText style={styles.conditionText} numberOfLines={2}>{c.description}</ThemedText>
                    <View style={styles.conditionActions}>
                      <Tooltip text={C.edit || "Editar"} position="left">
                        <TouchableOpacity style={styles.actionBtn} onPress={() => handleStartEdit(c)}>
                          <Ionicons name="pencil" size={18} color={actionColor} />
                        </TouchableOpacity>
                      </Tooltip>
                    </View>
                  </View>
                );
              })
            )}

            {/* Formulario de creación */}
            {isCreating ? (
              <View style={styles.formRow}>
                <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 4 }}>{C.descriptionLabel || "Descripción *"}</ThemedText>
                <InputWithFocus
                  containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]}
                  primaryColor={colors.primary}
                >
                  <TextInput style={[styles.formInputText, { color: colors.text }]} value={formText} onChangeText={setFormText} placeholder={C.placeholder || "Descripción de la condición"} placeholderTextColor={colors.textSecondary} multiline />
                </InputWithFocus>
                <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.sm, width: "100%" }}>
                  <CustomSwitch value={formMandatory} onValueChange={setFormMandatory} label={C.mandatory || "Obligatoria"} />
                  <View style={{ width: spacing.lg }} />
                  <CustomSwitch value={formStatus === 1} onValueChange={(v) => setFormStatus(v ? 1 : 0)} label={formStatus === 1 ? (C.active || "Activa") : (C.inactive || "Inactiva")} />
                </View>
                <View style={styles.formActions}>
                  <Button title={C.cancel || "Cancelar"} onPress={handleCancel} variant="outlined" size="md" disabled={saving} />
                  <Button title={saving ? "..." : (C.create || "Crear")} onPress={handleCreate} variant="primary" size="md" disabled={saving || !formText.trim()} textStyle={{ color: "#FFFFFF" }} />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleStartCreate}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.sm }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <ThemedText type="body2" style={{ color: colors.primary, fontWeight: "600" }}>
                  {C.addCondition || "Agregar condición"}
                </ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </CenteredModal>
  );
}
