/**
 * Modal genérico de Promociones (CRUD)
 * scope=general: promociones generales de la empresa
 * scope=specific + preloadedPromotions: promociones específicas de una oferta
 */

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { CenteredModal } from "@/components/ui/centered-modal";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/use-theme";
import { CustomSwitch } from "@/src/domains/shared/components/custom-switch/custom-switch";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, TextInput, TouchableOpacity, View } from "react-native";
import { PromotionsService } from "./promotions-modal.service";
import { createPromotionsModalStyles } from "./promotions-modal.styles";
import type { Promotion, PromotionsModalProps } from "./promotions-modal.types";

export function PromotionsModal({
  visible, onClose, companyId, scope, offeringId, offeringLabel, preloadedPromotions,
}: PromotionsModalProps) {
  const { colors, spacing, borderRadius, isDark } = useTheme();
  const { t } = useTranslation();
  const alert = useAlert();
  const P = (t as any).promotions || {};
  const styles = useMemo(() => createPromotionsModalStyles({ colors, spacing, borderRadius }), [colors, spacing, borderRadius]);
  const actionColor = isDark ? colors.primaryDark : colors.primary;

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formStatus, setFormStatus] = useState(1);

  const resetForm = () => { setFormName(""); setFormDesc(""); setFormType("percentage"); setFormValue(""); setFormFrom(""); setFormTo(""); setFormStatus(1); };

  const loadPromotions = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      if (scope === "specific" && preloadedPromotions) {
        setPromotions(preloadedPromotions.filter((p) => p.scope === "specific"));
      } else {
        const data = await PromotionsService.getAll(companyId, scope);
        setPromotions(data.filter((p) => (p.status ?? 1) >= 0));
      }
    } catch { setPromotions([]); }
    finally { setLoading(false); }
  }, [companyId, scope, preloadedPromotions]);

  useEffect(() => {
    if (visible) { loadPromotions(); setEditingId(null); setIsCreating(false); resetForm(); }
  }, [visible, loadPromotions]);

  const handleCreate = useCallback(async () => {
    if (!formName.trim() || !formValue.trim()) return;
    setSaving(true);
    try {
      await PromotionsService.create({
        companyId, name: formName.trim(), description: formDesc.trim() || undefined,
        discountType: formType, discountValue: Number(formValue),
        validFrom: formFrom || new Date().toISOString().slice(0, 10),
        validTo: formTo || null, scope, status: formStatus,
        offeringIds: offeringId ? [offeringId] : [],
      });
      alert.showSuccess(P.created || "Promoción creada");
      setIsCreating(false); resetForm(); loadPromotions();
    } catch (e: any) { alert.showError(e?.message || P.errorCreate || "Error"); }
    finally { setSaving(false); }
  }, [companyId, formName, formDesc, formType, formValue, formFrom, formTo, formStatus, scope, offeringId, alert, P, loadPromotions]);

  const handleUpdate = useCallback(async () => {
    if (!editingId || !formName.trim()) return;
    setSaving(true);
    try {
      await PromotionsService.update(editingId, {
        name: formName.trim(), description: formDesc.trim() || undefined,
        discountType: formType, discountValue: Number(formValue),
        validFrom: formFrom || undefined, validTo: formTo || null, status: formStatus,
      });
      alert.showSuccess(P.updated || "Promoción actualizada");
      setEditingId(null); resetForm(); loadPromotions();
    } catch (e: any) { alert.showError(e?.message || P.errorUpdate || "Error"); }
    finally { setSaving(false); }
  }, [editingId, formName, formDesc, formType, formValue, formFrom, formTo, formStatus, alert, P, loadPromotions]);

  const handleDelete = useCallback(async (id: string) => {
    alert.showConfirm(P.deleteTitle || "Eliminar", P.deleteMessage || "¿Eliminar esta promoción?", async () => {
      try { await PromotionsService.remove(id); alert.showSuccess(P.deleted || "Eliminada"); loadPromotions(); }
      catch (e: any) { alert.showError(e?.message || P.errorDelete || "Error"); }
    });
  }, [alert, P, loadPromotions]);

  const handleStartEdit = useCallback((p: Promotion) => {
    setEditingId(p.id); setFormName(p.name); setFormDesc(p.description || "");
    setFormType(p.discountType); setFormValue(String(p.discountValue));
    setFormFrom(p.validFrom || ""); setFormTo(p.validTo || "");
    setFormStatus(p.status ?? 1); setIsCreating(false);
  }, []);

  const handleStartCreate = useCallback(() => { setIsCreating(true); setEditingId(null); resetForm(); }, []);
  const handleCancel = useCallback(() => { setEditingId(null); setIsCreating(false); resetForm(); }, []);

  const formatDiscount = (p: Promotion) => p.discountType === "percentage" ? `${p.discountValue}%` : `$${p.discountValue}`;

  const title = scope === "general" ? (P.titleGeneral || "Promociones generales") : (P.titleSpecific || "Promociones de la oferta");

  const renderForm = () => (
    <View style={styles.formRow}>
      <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 4 }}>{P.nameLabel || "Nombre *"}</ThemedText>
      <InputWithFocus containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]} primaryColor={colors.primary}>
        <TextInput style={[styles.formInputText, { color: colors.text }]} value={formName} onChangeText={setFormName} placeholder={P.namePlaceholder || "Nombre de la promoción"} placeholderTextColor={colors.textSecondary} />
      </InputWithFocus>
      <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 4, marginTop: spacing.sm }}>{P.descLabel || "Descripción"}</ThemedText>
      <InputWithFocus containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]} primaryColor={colors.primary}>
        <TextInput style={[styles.formInputText, { color: colors.text }]} value={formDesc} onChangeText={setFormDesc} placeholder={P.descPlaceholder || "Descripción (opcional)"} placeholderTextColor={colors.textSecondary} multiline />
      </InputWithFocus>
      <View style={[styles.formFieldsRow, { marginTop: spacing.sm }]}>
        <View style={styles.formField}>
          <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>{P.discountType || "Tipo de descuento *"}</ThemedText>
          <Select value={formType} options={[{ value: "percentage", label: P.percentage || "Porcentaje (%)" }, { value: "fixed", label: P.fixed || "Fijo ($)" }]} onSelect={(v) => setFormType(v as any)} triggerStyle={{ backgroundColor: colors.filterInputBackground }} />
        </View>
        <View style={styles.formField}>
          <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>{P.value || "Valor *"}</ThemedText>
          <InputWithFocus containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]} primaryColor={colors.primary}>
            <TextInput style={[styles.formInputText, { color: colors.text }]} value={formValue} onChangeText={setFormValue} placeholder="10" placeholderTextColor={colors.textSecondary} keyboardType="numeric" />
          </InputWithFocus>
        </View>
      </View>
      <View style={[styles.formFieldsRow, { marginTop: spacing.sm }]}>
        <View style={styles.formField}>
          <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>{P.validFrom || "Desde *"}</ThemedText>
          <InputWithFocus containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]} primaryColor={colors.primary}>
            <TextInput style={[styles.formInputText, { color: colors.text }]} value={formFrom} onChangeText={setFormFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
          </InputWithFocus>
        </View>
        <View style={styles.formField}>
          <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>{P.validTo || "Hasta"}</ThemedText>
          <InputWithFocus containerStyle={[styles.formInputContainer, { backgroundColor: colors.filterInputBackground, borderColor: colors.border }]} primaryColor={colors.primary}>
            <TextInput style={[styles.formInputText, { color: colors.text }]} value={formTo} onChangeText={setFormTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textSecondary} />
          </InputWithFocus>
        </View>
      </View>
      <View style={[styles.statusRow, { marginTop: spacing.sm }]}>
        <CustomSwitch value={formStatus === 1} onValueChange={(v) => setFormStatus(v ? 1 : 0)} label={formStatus === 1 ? (P.active || "Activa") : (P.inactive || "Inactiva")} />
      </View>
      <View style={styles.formActions}>
        {editingId && <Button title={P.delete || "Eliminar"} onPress={() => handleDelete(editingId)} variant="ghost" size="md" disabled={saving} />}
        <Button title={P.cancel || "Cancelar"} onPress={handleCancel} variant="outlined" size="md" disabled={saving} />
        <Button title={saving ? "..." : (editingId ? (P.save || "Guardar") : (P.create || "Crear"))} onPress={editingId ? handleUpdate : handleCreate} variant="primary" size="md" disabled={saving || !formName.trim() || !formValue.trim()} textStyle={{ color: "#FFFFFF" }} />
      </View>
    </View>
  );

  return (
    <CenteredModal visible={visible} onClose={onClose} title={title}
      subtitle={scope === "specific" ? (offeringLabel || P.subtitleSpecific || "Promociones de esta oferta") : (P.subtitleGeneral || "Promociones que aplican a todas las ofertas")}
      footer={<View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm }}><Button title={P.close || "Cerrar"} onPress={onClose} variant="outlined" size="md" /></View>}
    >
      <View style={styles.content}>
        {loading ? (
          <View style={styles.emptyState}><ActivityIndicator size="small" color={colors.primary} /></View>
        ) : (
          <>
            {promotions.length === 0 && !isCreating ? (
              <View style={styles.emptyState}>
                <Ionicons name="pricetag-outline" size={36} color={colors.textSecondary} />
                <ThemedText type="body2" style={{ color: colors.textSecondary }}>{P.empty || "Sin promociones"}</ThemedText>
              </View>
            ) : (
              promotions.map((p) => editingId === p.id ? (
                <View key={p.id}>{renderForm()}</View>
              ) : (
                <View key={p.id} style={styles.promoRow}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: (p.status ?? 1) === 1 ? colors.success : colors.textSecondary, marginRight: 4 }} />
                  <View style={styles.promoInfo}>
                    <ThemedText style={styles.promoName} numberOfLines={1}>{p.name}</ThemedText>
                    <ThemedText style={styles.promoDetail} numberOfLines={1}>
                      {formatDiscount(p)} · {p.validFrom || "—"}{p.validTo ? ` → ${p.validTo}` : ""}
                    </ThemedText>
                  </View>
                  <View style={styles.promoActions}>
                    <Tooltip text={P.edit || "Editar"} position="left">
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleStartEdit(p)}>
                        <Ionicons name="pencil" size={18} color={actionColor} />
                      </TouchableOpacity>
                    </Tooltip>
                  </View>
                </View>
              ))
            )}
            {isCreating ? renderForm() : (
              <TouchableOpacity onPress={handleStartCreate} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.sm }}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <ThemedText type="body2" style={{ color: colors.primary, fontWeight: "600" }}>{P.addPromotion || "Agregar promoción"}</ThemedText>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </CenteredModal>
  );
}
