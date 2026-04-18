/**
 * Componente para el panel de información del contacto
 */
import { ThemedText } from "@/components/themed-text";
import { InputWithFocus } from "@/components/ui/input-with-focus";
import { Tooltip } from "@/components/ui/tooltip";
import { useCompany } from "@/src/domains/shared";
import {
    DatePicker,
    EmailInput,
    PhoneInput,
} from "@/src/domains/shared/components";
import { ChatOrdersService } from "@/src/features/interacciones/orders/services";
import type { ChatOrderRecord } from "@/src/features/interacciones/orders/types";
import { useTranslation } from "@/src/infrastructure/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { contactInfoPanelStyles } from "./contact-info-panel.styles";
import type { ContactInfoPanelProps } from "./contact-info-panel.types";

type TabType = "cliente" | "agendamiento" | "ordenes" | "pagos";

export const ContactInfoPanel = React.memo(
  ({
    contact,
    availableTags,
    isMobile,
    panelAnim,
    onClose,
    colors,
  }: ContactInfoPanelProps) => {
    const [activeTab, setActiveTab] = useState<TabType>("cliente");
    const [isEditing, setIsEditing] = useState(false);
    const [editedValues, setEditedValues] = useState({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      identification: "",
      birthDate: null as string | null,
    });
    const [saving, setSaving] = useState(false);
    const { company } = useCompany();
    const dateFormat = company?.settings?.dateFormat || "DD/MM/YYYY";
    const { t, language } = useTranslation();
    const locale = language === "en" ? "en-US" : "es-ES";

    // Órdenes del contacto
    const [contactOrders, setContactOrders] = useState<ChatOrderRecord[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<ChatOrderRecord | null>(null);

    const loadContactOrders = useCallback(async () => {
      const cid = company?.id;
      const ctid = contact?.id;
      if (!cid || !ctid) return;
      setLoadingOrders(true);
      try {
        const result = await ChatOrdersService.getOrders({
          companyId: cid,
          contactId: ctid,
          limit: 100,
        });
        setContactOrders(result.data || []);
      } catch {
        setContactOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }, [company?.id, contact?.id]);

    useEffect(() => {
      if (company?.id && contact?.id) {
        loadContactOrders();
      }
    }, [company?.id, contact?.id, loadContactOrders]);

    // Separar: agendamiento = hoy y futuro, órdenes = pasadas, pagos = con pago
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const schedulingOrders = contactOrders.filter((o) => new Date(o.createdAt) >= todayStart);
    const pastOrders = contactOrders.filter((o) => new Date(o.createdAt) < todayStart);
    const paidOrders = contactOrders.filter((o) => o.paymentMessageId != null);

    const ordersCount = contactOrders.length;
    const paymentsCount = paidOrders.length;

    const fmtDate = (iso: string) => {
      try { return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)); }
      catch { return iso; }
    };
    const fmtCurrency = (v: number | null | undefined, cur = "USD") => {
      if (v == null) return "—";
      return new Intl.NumberFormat(locale, { style: "currency", currency: cur, minimumFractionDigits: 2 }).format(v);
    };
    const getAmount = (o: ChatOrderRecord) => o.paymentAmount ?? o.mediaContextDetails?.monto?.valor ?? o.orderPayload?.prices?.[0]?.basePrice ?? null;
    const getCurrency = (o: ChatOrderRecord) => o.paymentCurrency || o.mediaContextDetails?.monto?.moneda || "USD";

    const handleStartEdit = () => {
      setIsEditing(true);
    };

    const handleCancelEdit = () => {
      setIsEditing(false);
      setEditedValues({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: contact.email || "",
        identification: "",
        birthDate: null,
      });
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        // TODO: Implementar guardado del contacto
        // Aquí se debe llamar al servicio para actualizar el contacto
        await new Promise((resolve) => setTimeout(resolve, 500));
        setIsEditing(false);
      } catch (error) {
        // Manejar errores
        console.error("Error al guardar contacto:", error);
      } finally {
        setSaving(false);
      }
    };
    const containerStyle = isMobile
      ? [
          contactInfoPanelStyles.modal,
          {
            backgroundColor: colors.surfaceVariant,
            opacity: panelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                translateX: panelAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 400],
                }),
              },
            ],
          },
        ]
      : [
          contactInfoPanelStyles.panel,
          {
            backgroundColor: colors.surfaceVariant,
            borderLeftWidth: 1,
            borderLeftColor: colors.border,
            width: panelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [350, 0],
            }),
            overflow: "hidden",
          },
        ];

    return (
      <Animated.View style={containerStyle}>
        <ScrollView
          style={contactInfoPanelStyles.scroll}
          contentContainerStyle={
            isMobile ? { paddingBottom: 20, width: "100%" } : undefined
          }
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={!isMobile}
          nestedScrollEnabled={false}
        >
          {/* Header con avatar y nombre */}
          <View style={contactInfoPanelStyles.headerSection}>
            {/* Botón para cerrar el panel en la esquina superior derecha */}
            <TouchableOpacity
              style={contactInfoPanelStyles.headerCloseButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <View
              style={[
                contactInfoPanelStyles.avatarSmall,
                { backgroundColor: colors.primary + "30" },
              ]}
            >
              <Ionicons name="person" size={32} color={colors.primary} />
            </View>
            <ThemedText
              type="body2"
              style={{
                marginTop: 12,
                color: colors.text,
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              {contact.name}
            </ThemedText>

            {/* Información con iconos */}
            <View style={contactInfoPanelStyles.iconsRow}>
              <View style={contactInfoPanelStyles.iconItem}>
                <Ionicons name="call" size={16} color={colors.textSecondary} />
                <ThemedText
                  type="caption"
                  style={{ marginLeft: 6, color: colors.textSecondary }}
                >
                  {contact.phoneNumber}
                </ThemedText>
              </View>
              <View style={contactInfoPanelStyles.iconItem}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="caption"
                  style={{ marginLeft: 6, color: colors.textSecondary }}
                >
                  Agendamientos: {schedulingOrders.length}
                </ThemedText>
              </View>
              <View style={contactInfoPanelStyles.iconItem}>
                <Ionicons
                  name="cart-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="caption"
                  style={{ marginLeft: 6, color: colors.textSecondary }}
                >
                  Órdenes: {ordersCount}
                </ThemedText>
              </View>
              <View style={contactInfoPanelStyles.iconItem}>
                <Ionicons name="card" size={16} color={colors.textSecondary} />
                <ThemedText
                  type="caption"
                  style={{ marginLeft: 6, color: colors.textSecondary }}
                >
                  Pagos: {paymentsCount}
                </ThemedText>
              </View>
            </View>

            {/* Barra de navegación */}
            <View style={contactInfoPanelStyles.navBar}>
              <Tooltip text="Cliente" position="top">
                <TouchableOpacity
                  style={[
                    contactInfoPanelStyles.navItem,
                    activeTab === "cliente" && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setActiveTab("cliente")}
                >
                  <Ionicons
                    name="person"
                    size={20}
                    color={
                      activeTab === "cliente"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </Tooltip>
              <Tooltip text="Agendamiento" position="top">
                <TouchableOpacity
                  style={[
                    contactInfoPanelStyles.navItem,
                    activeTab === "agendamiento" && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setActiveTab("agendamiento")}
                >
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={
                      activeTab === "agendamiento"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </Tooltip>
              <Tooltip text="Ordenes" position="top">
                <TouchableOpacity
                  style={[
                    contactInfoPanelStyles.navItem,
                    activeTab === "ordenes" && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setActiveTab("ordenes")}
                >
                  <Ionicons
                    name="cart"
                    size={20}
                    color={
                      activeTab === "ordenes"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </Tooltip>
              <Tooltip text="Pagos" position="top">
                <TouchableOpacity
                  style={[
                    contactInfoPanelStyles.navItem,
                    activeTab === "pagos" && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setActiveTab("pagos")}
                >
                  <Ionicons
                    name="card"
                    size={20}
                    color={
                      activeTab === "pagos"
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              </Tooltip>
            </View>
          </View>

          {/* Contenido según el tab activo */}
          {activeTab === "cliente" && (
            <>
              {/* Detalles del cliente */}
              <View style={contactInfoPanelStyles.section}>
                <View
                  style={[
                    contactInfoPanelStyles.sectionHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <ThemedText
                    type="body2"
                    style={{ color: colors.text, fontWeight: "600" }}
                  >
                    Detalles del cliente
                  </ThemedText>
                  {!isEditing ? (
                    <TouchableOpacity onPress={handleStartEdit}>
                      <Ionicons
                        name="pencil"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleCancelEdit}
                      disabled={saving}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={contactInfoPanelStyles.details}>
                  <View style={contactInfoPanelStyles.detailRow}>
                    <ThemedText
                      type="body2"
                      style={[
                        contactInfoPanelStyles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Nombres:
                    </ThemedText>
                    {isEditing ? (
                      <InputWithFocus
                        containerStyle={[
                          styles.editInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceVariant,
                          },
                        ]}
                        primaryColor={colors.primary}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={editedValues.name}
                          onChangeText={(text) =>
                            setEditedValues({ ...editedValues, name: text })
                          }
                          placeholder="Nombre"
                          placeholderTextColor={colors.textSecondary}
                          editable={!saving}
                        />
                      </InputWithFocus>
                    ) : (
                      <ThemedText
                        type="body2"
                        style={[
                          contactInfoPanelStyles.detailValue,
                          { color: colors.text },
                        ]}
                      >
                        {contact.name}
                      </ThemedText>
                    )}
                  </View>
                  <View style={contactInfoPanelStyles.detailRow}>
                    <ThemedText
                      type="body2"
                      style={[
                        contactInfoPanelStyles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Teléfono:
                    </ThemedText>
                    {isEditing ? (
                      <PhoneInput
                        value={editedValues.phoneNumber}
                        onChangeText={(text) =>
                          setEditedValues({
                            ...editedValues,
                            phoneNumber: text,
                          })
                        }
                        placeholder="Teléfono"
                        disabled={saving}
                        containerStyle={[
                          styles.editInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceVariant,
                          },
                        ]}
                      />
                    ) : (
                      <ThemedText
                        type="body2"
                        style={[
                          contactInfoPanelStyles.detailValue,
                          { color: colors.text },
                        ]}
                      >
                        {contact.phoneNumber}
                      </ThemedText>
                    )}
                  </View>
                  <View style={contactInfoPanelStyles.detailRow}>
                    <ThemedText
                      type="body2"
                      style={[
                        contactInfoPanelStyles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Email:
                    </ThemedText>
                    {isEditing ? (
                      <EmailInput
                        value={editedValues.email}
                        onChangeText={(text) =>
                          setEditedValues({ ...editedValues, email: text })
                        }
                        placeholder="Email"
                        disabled={saving}
                        containerStyle={[
                          styles.editInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceVariant,
                          },
                        ]}
                      />
                    ) : (
                      <ThemedText
                        type="body2"
                        style={[
                          contactInfoPanelStyles.detailValue,
                          { color: colors.text },
                        ]}
                      >
                        {contact.email || ""}
                      </ThemedText>
                    )}
                  </View>
                  <View style={contactInfoPanelStyles.detailRow}>
                    <ThemedText
                      type="body2"
                      style={[
                        contactInfoPanelStyles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Identificación:
                    </ThemedText>
                    {isEditing ? (
                      <InputWithFocus
                        containerStyle={[
                          styles.editInput,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceVariant,
                          },
                        ]}
                        primaryColor={colors.primary}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={editedValues.identification}
                          onChangeText={(text) =>
                            setEditedValues({
                              ...editedValues,
                              identification: text,
                            })
                          }
                          placeholder="Identificación"
                          placeholderTextColor={colors.textSecondary}
                          editable={!saving}
                        />
                      </InputWithFocus>
                    ) : (
                      <ThemedText
                        type="body2"
                        style={[
                          contactInfoPanelStyles.detailValue,
                          { color: colors.text },
                        ]}
                      >
                        {editedValues.identification || ""}
                      </ThemedText>
                    )}
                  </View>
                  <View style={contactInfoPanelStyles.detailRow}>
                    <ThemedText
                      type="body2"
                      style={[
                        contactInfoPanelStyles.detailLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      F Nacimiento:
                    </ThemedText>
                    {isEditing ? (
                      <View style={contactInfoPanelStyles.datePickerContainer}>
                        <DatePicker
                          value={editedValues.birthDate}
                          onChange={(date) =>
                            setEditedValues({
                              ...editedValues,
                              birthDate: date,
                            })
                          }
                          displayFormat={dateFormat}
                          placeholder={dateFormat}
                          disabled={saving}
                        />
                      </View>
                    ) : (
                      <ThemedText
                        type="body2"
                        style={[
                          contactInfoPanelStyles.detailValue,
                          { color: colors.text },
                        ]}
                      >
                        {editedValues.birthDate || ""}
                      </ThemedText>
                    )}
                  </View>
                </View>
                {isEditing && (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        {
                          borderColor: colors.primary,
                          backgroundColor: "transparent",
                        },
                      ]}
                      onPress={handleCancelEdit}
                      disabled={saving}
                    >
                      <ThemedText
                        type="body2"
                        style={{ color: colors.primary }}
                      >
                        Cancelar
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.editButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <ThemedText
                          type="body2"
                          style={{ color: colors.contrastText }}
                        >
                          Guardar
                        </ThemedText>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                {!isEditing && (
                  <TouchableOpacity style={contactInfoPanelStyles.seeMore}>
                    <ThemedText
                      type="caption"
                      style={{ color: colors.primary }}
                    >
                      Ver más
                    </ThemedText>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Etiquetas */}
              <View style={contactInfoPanelStyles.section}>
                <View
                  style={[
                    contactInfoPanelStyles.sectionHeader,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <ThemedText
                    type="body2"
                    style={{ color: colors.text, fontWeight: "600" }}
                  >
                    Etiquetas
                  </ThemedText>
                  <TouchableOpacity>
                    <Ionicons
                      name="pencil"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <View style={contactInfoPanelStyles.tagsContainer}>
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.map((tagId) => {
                      const tag = availableTags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <View
                          key={tagId}
                          style={[
                            contactInfoPanelStyles.infoTag,
                            { backgroundColor: tag.color },
                          ]}
                        >
                          <ThemedText
                            type="caption"
                            style={{ color: colors.contrastText }}
                          >
                            {tag.label}
                          </ThemedText>
                        </View>
                      );
                    })
                  ) : (
                    <ThemedText
                      type="caption"
                      style={{ color: colors.textSecondary }}
                    >
                      Sin etiquetas
                    </ThemedText>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Panel de Agendamiento */}
          {activeTab === "agendamiento" && (
            <View style={contactInfoPanelStyles.section}>
              <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="body2" style={{ color: colors.text, fontWeight: "600" }}>Agendamiento</ThemedText>
              </View>
              {loadingOrders ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : schedulingOrders.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Ionicons name="calendar-outline" size={36} color={colors.textSecondary} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
                    {t.pages?.chatOrders?.emptyMessage || "Sin registros"}
                  </ThemedText>
                </View>
              ) : (
                schedulingOrders.map((o) => (
                  <TouchableOpacity key={o.id} onPress={() => setSelectedOrderDetail(o)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, flex: 1 }} numberOfLines={1}>
                        {o.offeringName || o.orderPayload?.name || "—"}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                        {fmtCurrency(getAmount(o), getCurrency(o))}
                      </ThemedText>
                    </View>
                    {o.customerData?.raw && o.customerData.raw.length > 0 && (
                      <ThemedText type="caption" style={{ color: colors.primary, marginTop: 2 }} numberOfLines={1}>
                        {o.customerData.raw.join(" · ")}
                      </ThemedText>
                    )}
                    <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {fmtDate(o.createdAt)}{o.selectedBranch?.name ? ` · ${o.selectedBranch.name}` : ""}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Panel de Ordenes */}
          {activeTab === "ordenes" && (
            <View style={contactInfoPanelStyles.section}>
              <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="body2" style={{ color: colors.text, fontWeight: "600" }}>Órdenes</ThemedText>
              </View>
              {loadingOrders ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : pastOrders.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Ionicons name="cart-outline" size={36} color={colors.textSecondary} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>{t.pages?.chatOrders?.emptyMessage || "Sin registros"}</ThemedText>
                </View>
              ) : (
                pastOrders.map((o) => (
                  <TouchableOpacity key={o.id} onPress={() => setSelectedOrderDetail(o)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text, flex: 1 }} numberOfLines={1}>
                        {o.offeringName || o.orderPayload?.name || "—"}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                        {fmtCurrency(getAmount(o), getCurrency(o))}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {fmtDate(o.createdAt)}{o.selectedBranch?.name ? ` · ${o.selectedBranch.name}` : ""}{o.offeringCode ? ` · ${o.offeringCode}` : ""}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {/* Panel de Pagos */}
          {activeTab === "pagos" && (
            <View style={contactInfoPanelStyles.section}>
              <View style={[contactInfoPanelStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                <ThemedText type="body2" style={{ color: colors.text, fontWeight: "600" }}>
                  Pagos
                </ThemedText>
              </View>
              {loadingOrders ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : paidOrders.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 30 }}>
                  <Ionicons name="card-outline" size={36} color={colors.textSecondary} />
                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 8 }}>
                    {t.pages?.chatOrders?.emptyMessage || "Sin registros"}
                  </ThemedText>
                </View>
              ) : (
                paidOrders.map((o) => (
                  <TouchableOpacity key={o.id} onPress={() => setSelectedOrderDetail(o)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="body2" style={{ fontWeight: "600", color: colors.text }} numberOfLines={1}>
                          {o.mediaContextDetails?.banco || o.offeringName || o.orderPayload?.name || "—"}
                        </ThemedText>
                        {o.mediaIdentifier && (
                          <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600" }}>
                            #{o.mediaIdentifier}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                        {fmtCurrency(o.paymentAmount ?? o.mediaContextDetails?.monto?.valor, getCurrency(o))}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: colors.textSecondary, marginTop: 2 }}>
                      {fmtDate(o.createdAt)}{o.mediaContextDetails?.ordenante ? ` · ${o.mediaContextDetails.ordenante}` : ""}
                    </ThemedText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal de detalle de orden */}
        {selectedOrderDetail && (
          <Modal visible={!!selectedOrderDetail} transparent animationType="fade" onRequestClose={() => setSelectedOrderDetail(null)}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 }} onPress={() => setSelectedOrderDetail(null)}>
              <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: colors.background, borderRadius: 12, width: "100%", maxWidth: 400, maxHeight: "80%", padding: 20 }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <ThemedText type="h4" style={{ color: colors.text, fontWeight: "700" }}>
                      {selectedOrderDetail.offeringName || selectedOrderDetail.orderPayload?.name || "Detalle"}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setSelectedOrderDetail(null)}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {selectedOrderDetail.offeringCode && (
                    <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600", marginBottom: 8 }}>{selectedOrderDetail.offeringCode}</ThemedText>
                  )}
                  <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 12 }}>{fmtDate(selectedOrderDetail.createdAt)}</ThemedText>
                  {selectedOrderDetail.selectedBranch?.name && (
                    <View style={{ marginBottom: 12 }}>
                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>Sucursal</ThemedText>
                      <ThemedText type="body2" style={{ color: colors.text, fontWeight: "600" }}>{selectedOrderDetail.selectedBranch.name}</ThemedText>
                      {selectedOrderDetail.selectedBranch.address?.street && (
                        <ThemedText type="caption" style={{ color: colors.textSecondary }}>{selectedOrderDetail.selectedBranch.address.street}</ThemedText>
                      )}
                    </View>
                  )}
                  {selectedOrderDetail.customerData?.raw && selectedOrderDetail.customerData.raw.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <ThemedText type="caption" style={{ color: colors.textSecondary }}>Agendamiento</ThemedText>
                      {selectedOrderDetail.customerData.raw.map((item, idx) => (
                        <ThemedText key={idx} type="body2" style={{ color: colors.text }}>{item}</ThemedText>
                      ))}
                    </View>
                  )}
                  <View style={{ marginBottom: 12 }}>
                    <ThemedText type="caption" style={{ color: colors.textSecondary }}>Monto</ThemedText>
                    <ThemedText type="h4" style={{ color: colors.primary, fontWeight: "700" }}>
                      {fmtCurrency(getAmount(selectedOrderDetail), getCurrency(selectedOrderDetail))}
                    </ThemedText>
                  </View>
                  {selectedOrderDetail.mediaContextDetails && (
                    <View style={{ marginBottom: 12 }}>
                      <ThemedText type="caption" style={{ color: colors.textSecondary, marginBottom: 4 }}>Comprobante</ThemedText>
                      {selectedOrderDetail.mediaContextDetails.banco && (
                        <ThemedText type="body2" style={{ color: colors.text }}>Banco: {selectedOrderDetail.mediaContextDetails.banco}</ThemedText>
                      )}
                      {selectedOrderDetail.mediaContextDetails.ordenante && (
                        <ThemedText type="body2" style={{ color: colors.text }}>Ordenante: {selectedOrderDetail.mediaContextDetails.ordenante}</ThemedText>
                      )}
                      {selectedOrderDetail.mediaIdentifier && (
                        <ThemedText type="body2" style={{ color: colors.primary }}>#{selectedOrderDetail.mediaIdentifier}</ThemedText>
                      )}
                      {selectedOrderDetail.mediaContextDetails.monto && (
                        <ThemedText type="body2" style={{ color: colors.text, fontWeight: "700" }}>
                          {selectedOrderDetail.mediaContextDetails.monto.texto || fmtCurrency(selectedOrderDetail.mediaContextDetails.monto.valor, selectedOrderDetail.mediaContextDetails.monto.moneda || "USD")}
                        </ThemedText>
                      )}
                    </View>
                  )}
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </Animated.View>
    );
  },
);

ContactInfoPanel.displayName = "ContactInfoPanel";

const styles = StyleSheet.create({
  editInput: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  input: {
    fontSize: 14,
    minHeight: 20,
    padding: 0,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
});
