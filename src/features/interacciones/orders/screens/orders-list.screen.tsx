/**
 * Pantalla de Gestión de Órdenes de Chat IA
 * Desktop: DataTable | Móvil: Cards | Detalle: SideModal
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SideModal } from "@/components/ui/side-modal";
import { Tooltip } from "@/components/ui/tooltip";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import { useCompany } from "@/src/domains/shared";
import { DataTable } from "@/src/domains/shared/components/data-table/data-table";
import type { TableColumn } from "@/src/domains/shared/components/data-table/data-table.types";
import { DatePicker } from "@/src/domains/shared/components/date-picker/date-picker";
import { SearchFilterBar } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar";
import type { FilterConfig } from "@/src/domains/shared/components/search-filter-bar/search-filter-bar.types";
import { ImageWithToken } from "@/src/features/interacciones/chat/components/image-with-token/image-with-token";
import { apiClient } from "@/src/infrastructure/api";
import { useTranslation } from "@/src/infrastructure/i18n";
import { useAlert } from "@/src/infrastructure/messages/alert.service";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { ChatOrdersService } from "../services";
import type { ChatOrderRecord, ChatOrderReviewStatus } from "../types";
import { createOrdersListScreenStyles } from "./orders-list.screen.styles";

// ─── Helpers ───

function formatDate(
  iso: string | null | undefined,
  locale: string,
): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCurrency(
  value: number | undefined | null,
  currency = "USD",
  locale = "es-ES",
): string {
  if (value == null) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function getFinalPrice(order: ChatOrderRecord): number | null {
  const promo = order.orderPayload?.promotions?.[0];
  if (promo?.promotionPrice != null) return promo.promotionPrice;
  return order.orderPayload?.prices?.[0]?.basePrice ?? null;
}

function getBasePrice(order: ChatOrderRecord): number | null {
  return order.orderPayload?.prices?.[0]?.basePrice ?? null;
}

function getListAmount(order: ChatOrderRecord): number | null {
  if (order.paymentAmount != null) return order.paymentAmount;
  if (order.mediaContextDetails?.monto?.valor != null)
    return order.mediaContextDetails.monto.valor;
  return getFinalPrice(order);
}

function getListCurrency(order: ChatOrderRecord): string {
  return (
    order.paymentCurrency ||
    order.mediaContextDetails?.monto?.moneda ||
    "USD"
  );
}

function getListProductName(order: ChatOrderRecord): string {
  return order.offeringName || order.orderPayload?.name || "—";
}

function getListProductCode(order: ChatOrderRecord): string | null {
  return order.offeringCode || order.orderPayload?.code || null;
}

function getReviewColor(
  status: ChatOrderReviewStatus | null | undefined,
  colors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  },
): { fg: string; bg: string } {
  switch (status) {
    case "APPROVED":
      return { fg: colors.success, bg: colors.success + "20" };
    case "REJECTED":
      return { fg: colors.error, bg: colors.error + "20" };
    case "REVIEWED":
      return { fg: colors.info, bg: colors.info + "20" };
    default:
      return { fg: colors.warning, bg: colors.warning + "20" };
  }
}

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

// ─── Componente ───

export default function OrdersListScreen() {
  const { colors, spacing, borderRadius, shadows, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const { t, language } = useTranslation();
  const O = t.pages?.chatOrders;
  const router = useRouter();
  const alert = useAlert();
  const { company } = useCompany();
  const locale = language === "en" ? "en-US" : "es-ES";

  const styles = useMemo(
    () =>
      createOrdersListScreenStyles(
        { colors, spacing, borderRadius, shadows },
        isMobile,
      ),
    [colors, spacing, borderRadius, shadows, isMobile],
  );

  const [orders, setOrders] = useState<ChatOrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [localFilter, setLocalFilter] = useState("");
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowISO = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10); }, []);
  const [activePeriod, setActivePeriod] = useState<string | null>("today");
  const [filters, setFilters] = useState<{
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    reviewStatus?: string;
    hasPay?: string;
  }>({ dateFrom: todayISO, dateTo: tomorrowISO });
  const [selectedOrder, setSelectedOrder] =
    useState<ChatOrderRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrl, setImageViewerUrl] = useState<string | null>(null);
  const [imageViewerLoading, setImageViewerLoading] = useState(false);
  const [editReviewStatus, setEditReviewStatus] = useState<string>("");
  const [editComments, setEditComments] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const limit = 10;

  const loadOrders = useCallback(
    async (opts?: { pull?: boolean; p?: number; search?: string }) => {
      const pull = opts?.pull === true;
      const currentPage = opts?.p ?? page;
      const currentSearch = opts?.search ?? filters.search;
      if (!company?.id) {
        setLoading(false);
        return;
      }
      if (pull) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await ChatOrdersService.getOrders({
          companyId: company.id,
          page: currentPage,
          limit,
          search: currentSearch || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
          reviewStatus: filters.reviewStatus || undefined,
          hasPay: filters.hasPay === "true" ? true : filters.hasPay === "false" ? false : undefined,
        });
        setOrders(result.data);
        setTotal(result.meta.total);
        setTotalPages(result.meta.totalPages);
      } catch {
        setOrders([]);
      } finally {
        if (pull) setRefreshing(false);
        else setLoading(false);
      }
    },
    [company?.id, page, filters],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /** Filtro local */
  const handleLocalFilterChange = useCallback((value: string) => {
    setLocalFilter(value);
  }, []);

  /** Chips de periodo rápido */
  const handlePeriodChip = useCallback((key: string) => {
    setActivePeriod(key);
    setPage(1);
    const now = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const nextDay = (d: Date) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; };
    switch (key) {
      case "today":
        setFilters((prev) => ({ ...prev, dateFrom: fmt(now), dateTo: fmt(nextDay(now)) }));
        break;
      case "yesterday": {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        setFilters((prev) => ({ ...prev, dateFrom: fmt(y), dateTo: fmt(now) }));
        break;
      }
      case "thisWeek": {
        const day = now.getDay();
        const mon = new Date(now);
        mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        setFilters((prev) => ({ ...prev, dateFrom: fmt(mon), dateTo: fmt(nextDay(now)) }));
        break;
      }
      case "thisMonth": {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        setFilters((prev) => ({ ...prev, dateFrom: fmt(first), dateTo: fmt(nextDay(now)) }));
        break;
      }
      case "lastMonth": {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        setFilters((prev) => ({ ...prev, dateFrom: fmt(first), dateTo: fmt(nextDay(last)) }));
        break;
      }
      case "all":
        setFilters((prev) => ({ ...prev, dateFrom: undefined, dateTo: undefined }));
        break;
    }
  }, []);

  /** Búsqueda remota */
  const handleSearchSubmit = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setLocalFilter("");
    setPage(1);
  }, []);

  /** Data filtrada localmente */
  const filteredOrders = useMemo(() => {
    if (!localFilter.trim()) return orders;
    const q = localFilter.toLowerCase().trim();
    return orders.filter((o) => {
      const name = (o.contactName || "").toLowerCase();
      const phone = (o.contactPhone || "").toLowerCase();
      const product = getListProductName(o).toLowerCase();
      const code = (getListProductCode(o) || "").toLowerCase();
      const branch = (o.selectedBranch?.name || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || product.includes(q) || code.includes(q) || branch.includes(q);
    });
  }, [orders, localFilter]);

  const handlePageChange = useCallback(
    (p: number) => {
      setPage(p);
      loadOrders({ p });
    },
    [loadOrders],
  );

  const openDetail = useCallback((o: ChatOrderRecord) => {
    setSelectedOrder(o);
    setEditReviewStatus(o.reviewStatus || "PENDING");
    setEditComments(o.comments || "");
    setDetailVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedOrder(null);
  }, []);

  const handleContactClient = useCallback((order: ChatOrderRecord) => {
    if (!order.contactPhone) return;
    router.push(`/interacciones/chat?phone=${encodeURIComponent(order.contactPhone)}` as any);
    closeDetail();
  }, [router, closeDetail]);

  const handleExport = useCallback(async () => {
    if (!company?.id) return;
    setExporting(true);
    try {
      await ChatOrdersService.exportToExcel(company.id);
    } catch {
      alert.showError(O?.exportError || "Error");
    } finally {
      setExporting(false);
    }
  }, [company?.id, alert, O]);

  /** Tabla: abre modal con imagen */
  const handleShowReceipt = useCallback(async (order: ChatOrderRecord) => {
    const msgId = order.paymentMessageId || order.confirmationMessageId;
    if (!msgId || !order.contactId) return;
    setImageViewerLoading(true);
    setImageViewerVisible(true);
    setImageViewerUrl(null);
    try {
      const msg = await ChatOrdersService.getMessageByContact(order.contactId, msgId);
      const att = msg?.attachments?.[0];
      if (att) {
        setImageViewerUrl(ChatOrdersService.getAttachmentUrl(msgId, att.id));
      }
    } catch {
      alert.showError(O?.receiptError || "Error");
      setImageViewerVisible(false);
    } finally {
      setImageViewerLoading(false);
    }
  }, [alert, O]);

  /** Detalle: descarga el archivo */
  const handleDownloadReceipt = useCallback(async (order: ChatOrderRecord) => {
    const msgId = order.paymentMessageId || order.confirmationMessageId;
    if (!msgId || !order.contactId) return;
    try {
      const msg = await ChatOrdersService.getMessageByContact(order.contactId, msgId);
      const att = msg?.attachments?.[0];
      if (!att) return;
      const url = ChatOrdersService.getAttachmentUrl(msgId, att.id);
      const tokens = await apiClient.getTokens();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tokens?.accessToken || ""}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const filename = att.fileName || `comprobante_${order.mediaIdentifier || msgId}`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch {
      alert.showError(O?.receiptError || "Error");
    }
  }, [alert, O]);

  const handleSaveReview = useCallback(async () => {
    if (!selectedOrder) return;
    setSavingReview(true);
    try {
      const updated = await ChatOrdersService.updateReview(selectedOrder.id, {
        reviewStatus: editReviewStatus,
        comments: editComments,
      });
      setSelectedOrder({ ...selectedOrder, ...updated });
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      alert.showSuccess(O?.reviewSaved || "Guardado");
    } catch {
      alert.showError(O?.reviewSaveError || "Error");
    } finally {
      setSavingReview(false);
    }
  }, [selectedOrder, editReviewStatus, editComments, alert, O]);

  const reviewStatusOptions = useMemo(() => [
    { value: "PENDING", label: O?.reviewPending || "Pendiente" },
    { value: "REVIEWED", label: O?.reviewReviewed || "Revisado" },
    { value: "APPROVED", label: O?.reviewApproved || "Aprobado" },
    { value: "REJECTED", label: O?.reviewRejected || "Rechazado" },
  ], [O]);

  const handleAdvancedFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ dateFrom: todayISO, dateTo: tomorrowISO });
    setLocalFilter("");
    setPage(1);
  }, [todayISO]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "dateFrom",
      label: O?.filterDateFrom || "Desde",
      type: "date" as const,
      placeholder: "YYYY-MM-DD",
    },
    {
      key: "dateTo",
      label: O?.filterDateTo || "Hasta",
      type: "date" as const,
      placeholder: "YYYY-MM-DD",
    },
    {
      key: "reviewStatus",
      label: O?.reviewStatusLabel || "Revisión",
      type: "select" as const,
      options: [
        { key: "all", value: "", label: O?.filterAll || "Todos" },
        { key: "PENDING", value: "PENDING", label: O?.reviewPending || "Pendiente" },
        { key: "REVIEWED", value: "REVIEWED", label: O?.reviewReviewed || "Revisado" },
        { key: "APPROVED", value: "APPROVED", label: O?.reviewApproved || "Aprobado" },
        { key: "REJECTED", value: "REJECTED", label: O?.reviewRejected || "Rechazado" },
      ],
    },
    {
      key: "hasPay",
      label: O?.filterHasPay || "Pago",
      type: "select" as const,
      options: [
        { key: "all", value: "", label: O?.filterAll || "Todos" },
        { key: "true", value: "true", label: O?.filterWithPay || "Con pago" },
        { key: "false", value: "false", label: O?.filterWithoutPay || "Sin pago" },
      ],
    },
  ], [O]);

  const totalAmount = useMemo(
    () => orders.reduce((s, o) => s + (getListAmount(o) ?? 0), 0),
    [orders],
  );

  // ─── Review badge ───
  const renderReviewBadge = useCallback(
    (order: ChatOrderRecord) => {
      const rs = order.reviewStatus || "PENDING";
      const cfg = getReviewColor(rs, colors);
      const map: Record<string, string | undefined> = {
        PENDING: O?.reviewPending,
        REVIEWED: O?.reviewReviewed,
        APPROVED: O?.reviewApproved,
        REJECTED: O?.reviewRejected,
      };
      return (
        <View
          style={[styles.statusBadge, { backgroundColor: cfg.bg }]}
        >
          <ThemedText
            style={[styles.statusBadgeText, { color: cfg.fg }]}
            numberOfLines={1}
          >
            {map[rs] || rs}
          </ThemedText>
        </View>
      );
    },
    [colors, styles, O],
  );

  const renderPaymentBadge = useCallback(
    (order: ChatOrderRecord) => {
      const paid = order.paymentMessageId != null;
      return (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: paid
                ? colors.success + "20"
                : colors.warning + "20",
            },
          ]}
        >
          <ThemedText
            style={[
              styles.statusBadgeText,
              { color: paid ? colors.success : colors.warning },
            ]}
            numberOfLines={1}
          >
            {paid ? O?.statusPaid : O?.statusPending}
          </ThemedText>
        </View>
      );
    },
    [colors, styles, O],
  );

  // ─── DataTable columns (desktop) ───
  const tableColumns: TableColumn<ChatOrderRecord>[] = useMemo(
    () => [
      {
        key: "contactName",
        label: O?.colClient || "Cliente",
        width: "20%",
        render: (item) => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.primary + "25",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ThemedText
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: colors.primary,
                }}
              >
                {getInitials(item.contactName)}
              </ThemedText>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <ThemedText
                type="body2"
                style={{ fontWeight: "600", fontSize: 14 }}
                numberOfLines={2}
              >
                {item.contactName || "—"}
              </ThemedText>
              {item.contactPhone && (
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {item.contactPhone}
                </ThemedText>
              )}
            </View>
          </View>
        ),
      },
      {
        key: "offeringName",
        label: O?.colProduct || "Producto",
        width: "20%",
        render: (item) => (
          <View>
            <ThemedText type="body2" numberOfLines={1} style={{ fontWeight: "500" }}>
              {getListProductName(item)}
            </ThemedText>
            {getListProductCode(item) && (
              <ThemedText
                type="caption"
                style={{ color: colors.primary, fontWeight: "600" }}
              >
                {getListProductCode(item)}
              </ThemedText>
            )}
          </View>
        ),
      },
      {
        key: "selectedBranch",
        label: O?.colBranch || "Sucursal",
        width: "10%",
        render: (item) => (
          <ThemedText type="body2" numberOfLines={1}>
            {item.selectedBranch?.name || "—"}
          </ThemedText>
        ),
      },
      {
        key: "customerData",
        label: O?.colScheduling || "Agendamiento",
        width: 140,
        render: (item) => {
          if (!item.customerData?.raw?.length) return null;
          return (
            <ThemedText type="caption" style={{ color: colors.text }} numberOfLines={2}>
              {item.customerData.raw.join(" · ")}
            </ThemedText>
          );
        },
      },
      {
        key: "receipt",
        label: O?.colReceipt || "Comprobante",
        width: 140,
        align: "left",
        render: (item) => {
          const hasReceipt = item.paymentMessageId || item.confirmationMessageId;
          return hasReceipt && item.mediaIdentifier ? (
            <TouchableOpacity
              onPress={() => handleShowReceipt(item)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons name="document-attach-outline" size={16} color={colors.primary} />
              <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600" }} numberOfLines={1}>
                {item.mediaIdentifier || "—"}
              </ThemedText>
            </TouchableOpacity>
          ) : null;
        },
      },
      {
        key: "paymentAmount",
        label: O?.colAmount || "Monto",
        width: "20%",
        align: "right",
        render: (item) => (
          <ThemedText
            type="body2"
            style={{
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
              textAlign: "right",
              width: "100%",
            }}
          >
            {formatCurrency(getListAmount(item), getListCurrency(item), locale)}
          </ThemedText>
        ),
      },
      {
        key: "reviewStatus",
        label: O?.colStatus || "Estado",
        width: "20%",
        align: "left",
        render: (item) => (
          <View
            style={{
              flexDirection: "column",
              gap: 4,
              alignItems: "flex-start",
            }}
          >
            {renderReviewBadge(item)}
            {renderPaymentBadge(item)}
          </View>
        ),
      },
      {
        key: "createdAt",
        label: O?.colDate || "Fecha",
        width: 110,
        align: "right",
        render: (item) => (
          <ThemedText type="caption" style={{ color: colors.textSecondary, textAlign: "right", width: "100%" }}>
            {formatDate(item.createdAt, locale)}
          </ThemedText>
        ),
      },
      {
        key: "reviewStatusCol",
        label: O?.colReview || "Revisión",
        width: 120,
        align: "left",
        render: (item) => renderReviewBadge(item),
      },
    ],
    [O, colors, locale, renderReviewBadge, renderPaymentBadge],
  );

  // ─── Render ───

  if (!company?.id) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerMessage}>
          <ThemedText type="body1">{O?.emptyNoCompany}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrders({ pull: true })}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common?.back}
          >
            <Ionicons
              name="chevron-back"
              size={26}
              color={colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <ThemedText style={styles.pageTitle}>{O?.title}</ThemedText>
            <ThemedText style={styles.pageSubtitle}>
              {O?.subtitle}
            </ThemedText>
          </View>
        </View>

        {/* KPIs (izq) + Filtros de fecha (der) — en móvil apilados */}
        <View style={{
          flexDirection: isMobile ? "column" : "row",
          gap: spacing.md,
          paddingHorizontal: isMobile ? spacing.md : spacing.lg,
          marginBottom: spacing.md,
        }}>
          {/* KPI Cards */}
          <View style={{ flex: isMobile ? undefined : 1, flexDirection: "row", gap: spacing.md }}>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <ThemedText style={styles.kpiLabel}>{O?.kpiTotalOrders}</ThemedText>
              <ThemedText style={styles.kpiValue}>{total}</ThemedText>
            </View>
            <View style={[styles.kpiCard, { flex: 1 }]}>
              <ThemedText style={styles.kpiLabel}>{O?.kpiTotalAmount}</ThemedText>
              <ThemedText style={styles.kpiValue}>{formatCurrency(totalAmount, "USD", locale)}</ThemedText>
            </View>
          </View>

          {/* Filtros de fecha */}
          <View style={{
            flex: isMobile ? undefined : 1,
            backgroundColor: colors.background,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
            padding: spacing.md,
            ...shadows.sm,
          }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {([
                  { key: "today", label: O?.periodToday || "Hoy" },
                  { key: "yesterday", label: O?.periodYesterday || "Ayer" },
                  { key: "thisWeek", label: O?.periodThisWeek || "Esta semana" },
                  { key: "thisMonth", label: O?.periodThisMonth || "Este mes" },
                  { key: "lastMonth", label: O?.periodLastMonth || "Mes anterior" },
                  { key: "all", label: O?.periodAll || "Todo" },
                ] as const).map((chip) => {
                  const isActive = activePeriod === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      onPress={() => handlePeriodChip(chip.key)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: borderRadius.md,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.border,
                        backgroundColor: isActive ? colors.primary + "18" : "transparent",
                      }}
                    >
                      <ThemedText style={{
                        fontSize: 13,
                        fontWeight: isActive ? "600" : "400",
                        color: isActive ? colors.primary : colors.text,
                      }}>
                        {chip.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <DatePicker
                  value={filters.dateFrom || null}
                  onChange={(v) => { setFilters((prev) => ({ ...prev, dateFrom: v || undefined })); setActivePeriod(null); }}
                  placeholder={O?.filterDateFrom}
                  displayFormat="YYYY-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <DatePicker
                  value={filters.dateTo || null}
                  onChange={(v) => { setFilters((prev) => ({ ...prev, dateTo: v || undefined })); setActivePeriod(null); }}
                  placeholder={O?.filterDateTo}
                  displayFormat="YYYY-MM-DD"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Búsqueda + Selects + Exportar */}
        <View style={{ paddingHorizontal: isMobile ? spacing.md : spacing.lg, marginBottom: spacing.md }}>
          <View style={{ flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: spacing.sm }}>
            <View style={{ flex: isMobile ? undefined : 1 }}>
              <Select
                placeholder={O?.reviewStatusLabel}
                value={filters.reviewStatus || ""}
                options={[
                  { value: "", label: O?.filterAll || "Todos" },
                  { value: "PENDING", label: O?.reviewPending || "Pendiente" },
                  { value: "REVIEWED", label: O?.reviewReviewed || "Revisado" },
                  { value: "APPROVED", label: O?.reviewApproved || "Aprobado" },
                  { value: "REJECTED", label: O?.reviewRejected || "Rechazado" },
                ]}
                onSelect={(v) => { setFilters((prev) => ({ ...prev, reviewStatus: (v as string) || undefined })); setPage(1); }}
                triggerStyle={{ backgroundColor: colors.surfaceVariant }}
              />
            </View>
            <View style={{ flex: isMobile ? undefined : 1 }}>
              <Select
                placeholder={O?.filterHasPay}
                value={filters.hasPay || ""}
                options={[
                  { value: "", label: O?.filterAll || "Todos" },
                  { value: "true", label: O?.filterWithPay || "Con pago" },
                  { value: "false", label: O?.filterWithoutPay || "Sin pago" },
                ]}
                onSelect={(v) => { setFilters((prev) => ({ ...prev, hasPay: (v as string) || undefined })); setPage(1); }}
                triggerStyle={{ backgroundColor: colors.surfaceVariant }}
              />
            </View>
            <View style={{ flex: isMobile ? undefined : 2 }}>
              <SearchFilterBar
                filterValue={localFilter}
                onFilterChange={handleLocalFilterChange}
                onSearchSubmit={handleSearchSubmit}
                filterPlaceholder={O?.searchPlaceholder}
                filteredCount={localFilter.trim() ? filteredOrders.length : undefined}
                totalCount={total}
              />
            </View>
            {Platform.OS === "web" && (
              <Tooltip text={O?.exportExcel} position="left">
                <TouchableOpacity
                  style={[styles.exportButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={handleExport}
                  disabled={exporting || orders.length === 0}
                  activeOpacity={0.8}
                >
                  {exporting ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="download-outline" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </Tooltip>
            )}
          </View>
        </View>

        {/* Contenido: Desktop = DataTable, Móvil = Cards */}
        {loading && orders.length === 0 ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body2">{O?.loading}</ThemedText>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.centerMessage}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textSecondary}
            />
            <ThemedText
              type="body2"
              style={{ color: colors.textSecondary }}
            >
              {O?.emptyMessage}
            </ThemedText>
          </View>
        ) : isMobile ? (
          /* ─── Móvil: Cards ─── */
          <>
            <View style={styles.listContainer}>
              {filteredOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderCardHeader}>
                    <ThemedText
                      style={styles.orderCardName}
                      numberOfLines={1}
                    >
                      {order.contactName || order.contactPhone || "—"}
                    </ThemedText>
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      {renderReviewBadge(order)}
                      {renderPaymentBadge(order)}
                    </View>
                  </View>
                  <ThemedText style={styles.orderCardDate}>
                    {formatDate(order.createdAt, locale)}
                  </ThemedText>
                  <View
                    style={[
                      styles.orderCardRow,
                      { marginTop: spacing.sm },
                    ]}
                  >
                    <Ionicons
                      name="medkit-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <View>
                      <ThemedText style={styles.orderCardRowLabel}>
                        {O?.cardProduct}
                      </ThemedText>
                      <ThemedText style={styles.orderCardRowValue}>
                        {getListProductName(order)}
                        {getListProductCode(order)
                          ? ` (${getListProductCode(order)})`
                          : ""}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.orderCardRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.primary}
                    />
                    <View>
                      <ThemedText style={styles.orderCardRowLabel}>
                        {O?.cardBranch}
                      </ThemedText>
                      <ThemedText style={styles.orderCardRowValue}>
                        {order.selectedBranch?.name || "—"}
                      </ThemedText>
                    </View>
                  </View>
                  {getListAmount(order) != null && (
                    <View style={styles.orderCardRow}>
                      <Ionicons
                        name="cash-outline"
                        size={16}
                        color={colors.primary}
                      />
                      <View>
                        <ThemedText style={styles.orderCardRowLabel}>
                          {O?.cardAmount}
                        </ThemedText>
                        <ThemedText style={styles.orderCardRowValue}>
                          {formatCurrency(
                            getListAmount(order),
                            getListCurrency(order),
                            locale,
                          )}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                  <View style={styles.orderCardFooter}>
                    <TouchableOpacity
                      style={styles.detailButton}
                      onPress={() => openDetail(order)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="eye-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <ThemedText style={styles.detailButtonText}>
                        {O?.viewDetails}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    page <= 1 && styles.paginationButtonDisabled,
                  ]}
                  onPress={() => page > 1 && handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.paginationText}>
                  {page} / {totalPages}
                </ThemedText>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    page >= totalPages && styles.paginationButtonDisabled,
                  ]}
                  onPress={() =>
                    page < totalPages && handlePageChange(page + 1)
                  }
                  disabled={page >= totalPages}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          /* ─── Desktop: DataTable ─── */
          <View style={{ paddingHorizontal: spacing.lg }}>
            <DataTable
              data={filteredOrders}
              columns={tableColumns}
              loading={loading}
              emptyMessage={O?.emptyMessage}
              keyExtractor={(item) => item.id}
              showPagination
              pagination={{
                page,
                limit,
                total: localFilter.trim() ? filteredOrders.length : total,
                totalPages: localFilter.trim()
                  ? Math.ceil(filteredOrders.length / limit)
                  : totalPages,
                hasNext: localFilter.trim()
                  ? page < Math.ceil(filteredOrders.length / limit)
                  : page < totalPages,
                hasPrev: page > 1,
                onPageChange: handlePageChange,
              }}
              actions={[
                {
                  id: "view",
                  icon: "eye",
                  tooltip: O?.viewDetails || "Ver",
                  onPress: openDetail,
                },
              ]}
              actionsColumnWidth="4%"
              actionsColumnLabel=""
              enableRowClick
              onRowPress={(item) => openDetail(item)}
            />
          </View>
        )}
      </ScrollView>

      {/* ─── Modal de detalle ─── */}
      {selectedOrder && (
        <SideModal
          visible={detailVisible}
          onClose={closeDetail}
          title={O?.detailTitle}
          subtitle={O?.detailSubtitle}
          footer={
            <View style={styles.modalFooter}>
              <Button
                title={O?.close}
                onPress={closeDetail}
                variant="outlined"
                size="md"
              />
              {selectedOrder.contactPhone && (
                <Button
                  onPress={() => handleContactClient(selectedOrder)}
                  variant="primary"
                  size="md"
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={colors.contrastText}
                    style={{ marginRight: 6 }}
                  />
                  <ThemedText
                    type="body2"
                    style={{
                      color: colors.contrastText,
                      fontWeight: "600",
                    }}
                  >
                    {O?.contactClient}
                  </ThemedText>
                </Button>
              )}
            </View>
          }
        >
          <View style={{ gap: spacing.lg, paddingHorizontal: spacing.lg }}>
            {/* Hero */}
            <View style={styles.detailHero}>
              <View style={styles.detailHeroRow}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    {renderReviewBadge(selectedOrder)}
                    {renderPaymentBadge(selectedOrder)}
                  </View>
                  <ThemedText style={styles.detailHeroOrderId}>
                    #
                    {selectedOrder.mediaIdentifier ||
                      selectedOrder.id.substring(0, 8)}
                  </ThemedText>
                  <ThemedText style={styles.detailHeroDate}>
                    {O?.detailCreatedAt}:{" "}
                    {formatDate(selectedOrder.createdAt, locale)}
                  </ThemedText>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <ThemedText style={styles.detailHeroTotalLabel}>
                    {O?.detailTotal}
                  </ThemedText>
                  <ThemedText style={styles.detailHeroTotalValue}>
                    {formatCurrency(
                      selectedOrder.paymentAmount ??
                        selectedOrder.mediaContextDetails?.monto?.valor ??
                        getFinalPrice(selectedOrder),
                      selectedOrder.paymentCurrency ||
                        selectedOrder.mediaContextDetails?.monto?.moneda ||
                        "USD",
                      locale,
                    )}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Cliente */}
            <View>
              <View style={styles.detailSectionTitle}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                />
                <ThemedText style={styles.detailSectionTitleText}>
                  {O?.sectionClient}
                </ThemedText>
              </View>
              <View style={styles.detailCard}>
                <ThemedText
                  style={[
                    styles.detailValue,
                    { fontSize: 15, marginBottom: 4 },
                  ]}
                >
                  {selectedOrder.contactName || "—"}
                </ThemedText>
                {selectedOrder.contactPhone && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons
                      name="call-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <ThemedText style={styles.detailLabel}>
                      {selectedOrder.contactPhone}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* Datos de Agendamiento */}
            {selectedOrder.customerData?.raw && selectedOrder.customerData.raw.length > 0 && (
              <View>
                <View style={styles.detailSectionTitle}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <ThemedText style={styles.detailSectionTitleText}>{O?.sectionScheduling}</ThemedText>
                </View>
                <View style={styles.detailCard}>
                  {selectedOrder.customerData.raw.map((item, idx) => (
                    <ThemedText key={idx} style={[styles.detailValue, { marginBottom: 4 }]}>{item}</ThemedText>
                  ))}
                </View>
              </View>
            )}

            {/* Producto (JSON) */}
            {selectedOrder.orderPayload && (
              <View>
                <View style={styles.detailSectionTitle}>
                  <Ionicons
                    name="cube-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <ThemedText style={styles.detailSectionTitleText}>
                    {O?.sectionProduct}
                  </ThemedText>
                </View>
                <View style={styles.detailCard}>
                  <View style={styles.productRow}>
                    <ThemedText style={styles.productName}>
                      {selectedOrder.orderPayload.name || "—"}
                    </ThemedText>
                    {selectedOrder.orderPayload.code && (
                      <ThemedText style={styles.productCode}>
                        {selectedOrder.orderPayload.code}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.productPriceRow}>
                    <ThemedText style={styles.productPrice}>
                      {formatCurrency(
                        getFinalPrice(selectedOrder),
                        "USD",
                        locale,
                      )}
                    </ThemedText>
                    {selectedOrder.orderPayload.promotions?.[0] &&
                      getBasePrice(selectedOrder) !==
                        getFinalPrice(selectedOrder) && (
                        <>
                          <ThemedText style={styles.productOriginalPrice}>
                            {formatCurrency(
                              getBasePrice(selectedOrder),
                              "USD",
                              locale,
                            )}
                          </ThemedText>
                          <View style={styles.promotionBadge}>
                            <ThemedText style={styles.promotionBadgeText}>
                              {selectedOrder.orderPayload.promotions[0]
                                .description || O?.discount}
                            </ThemedText>
                          </View>
                        </>
                      )}
                  </View>
                  {selectedOrder.orderPayload.conditions &&
                    selectedOrder.orderPayload.conditions.length > 0 && (
                      <View style={{ marginTop: spacing.sm }}>
                        <ThemedText
                          style={[
                            styles.detailLabel,
                            { marginBottom: 4 },
                          ]}
                        >
                          {O?.conditions}:
                        </ThemedText>
                        {selectedOrder.orderPayload.conditions.map(
                          (c, i) => (
                            <ThemedText
                              key={i}
                              style={[
                                styles.detailLabel,
                                { marginLeft: 8 },
                              ]}
                            >
                              • {c.description}
                            </ThemedText>
                          ),
                        )}
                      </View>
                    )}
                </View>
              </View>
            )}

            {/* Sucursal */}
            {selectedOrder.selectedBranch && (
              <View>
                <View style={styles.detailSectionTitle}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <ThemedText style={styles.detailSectionTitleText}>
                    {O?.sectionBranch}
                  </ThemedText>
                </View>
                <View style={styles.detailCard}>
                  <ThemedText
                    style={[
                      styles.detailValue,
                      { fontSize: 15, marginBottom: 4 },
                    ]}
                  >
                    {selectedOrder.selectedBranch.name || "—"}
                  </ThemedText>
                  {selectedOrder.selectedBranch.address?.street && (
                    <ThemedText style={styles.detailLabel}>
                      {selectedOrder.selectedBranch.address.street}
                      {selectedOrder.selectedBranch.address.city
                        ? `, ${selectedOrder.selectedBranch.address.city}`
                        : ""}
                    </ThemedText>
                  )}
                  {selectedOrder.selectedBranch.address?.location && (
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 6,
                      }}
                      onPress={() => {
                        const loc =
                          selectedOrder.selectedBranch?.address?.location;
                        if (loc)
                          Linking.openURL(
                            loc.startsWith("http")
                              ? loc
                              : `https://${loc}`,
                          ).catch(() => {});
                      }}
                    >
                      <Ionicons
                        name="navigate-outline"
                        size={14}
                        color={colors.primary}
                      />
                      <ThemedText
                        style={{ fontSize: 12, color: colors.primary }}
                      >
                        {O?.openMap}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Comprobante de Pago (JSON) */}
            {selectedOrder.mediaContextDetails && (
              <View>
                <View style={styles.detailSectionTitle}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <ThemedText style={[styles.detailSectionTitleText, { flex: 1 }]}>
                    {O?.sectionPayment}
                  </ThemedText>
                  {(selectedOrder.paymentMessageId || selectedOrder.confirmationMessageId) && (
                    <TouchableOpacity
                      onPress={() => handleDownloadReceipt(selectedOrder)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      <Ionicons name="download-outline" size={16} color={colors.primary} />
                      <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600" }}>
                        {O?.viewReceipt}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.detailCard}>
                  {selectedOrder.mediaContextDetails.banco && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentBank}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.banco}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.ordenante && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentSender}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.ordenante}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.beneficiario && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentBeneficiary}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.beneficiario}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.cuentaOrigen && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentSourceAccount}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.cuentaOrigen}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.cuentaDestino && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentDestAccount}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.cuentaDestino}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.fecha && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentDate}
                      </ThemedText>
                      <ThemedText style={styles.detailValue}>
                        {selectedOrder.mediaContextDetails.fecha}
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.numeroComprobante && (
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>
                        {O?.paymentReceipt}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.detailValue,
                          { color: colors.primary },
                        ]}
                      >
                        #
                        {
                          selectedOrder.mediaContextDetails
                            .numeroComprobante
                        }
                      </ThemedText>
                    </View>
                  )}
                  {selectedOrder.mediaContextDetails.monto && (
                    <View
                      style={[
                        styles.detailRow,
                        {
                          marginTop: spacing.sm,
                          paddingTop: spacing.sm,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.detailLabel,
                          { fontWeight: "600" },
                        ]}
                      >
                        {O?.paymentAmount}
                      </ThemedText>
                      <ThemedText
                        style={[
                          styles.detailValue,
                          { fontSize: 16, color: colors.primary },
                        ]}
                      >
                        {selectedOrder.mediaContextDetails.monto.texto ||
                          formatCurrency(
                            selectedOrder.mediaContextDetails.monto.valor,
                            selectedOrder.mediaContextDetails.monto
                              .moneda || "USD",
                            locale,
                          )}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Revisión */}
            <View>
              <View style={styles.detailSectionTitle}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <ThemedText style={styles.detailSectionTitleText}>
                  {O?.sectionReview}
                </ThemedText>
              </View>
              <View style={styles.detailCard}>
                {selectedOrder.reviewStatus === "APPROVED" || selectedOrder.reviewStatus === "REJECTED" ? (
                  /* Solo lectura */
                  <>
                    <View style={styles.detailRow}>
                      <ThemedText style={styles.detailLabel}>{O?.reviewStatusLabel}</ThemedText>
                      {renderReviewBadge(selectedOrder)}
                    </View>
                    {selectedOrder.comments && (
                      <View style={{ marginTop: spacing.sm }}>
                        <ThemedText style={[styles.detailLabel, { marginBottom: 4 }]}>{O?.commentsLabel}</ThemedText>
                        <ThemedText style={[styles.detailValue, { fontWeight: "400" }]}>{selectedOrder.comments}</ThemedText>
                      </View>
                    )}
                  </>
                ) : (
                  /* Editable */
                  <>
                    <Select
                      label={O?.reviewStatusLabel}
                      value={editReviewStatus}
                      options={reviewStatusOptions}
                      onSelect={(val) => setEditReviewStatus(val as string)}
                      triggerStyle={{ backgroundColor: colors.background }}
                    />
                    <View style={{ marginTop: spacing.md }}>
                      <ThemedText type="body2" style={{ fontWeight: "500", color: colors.text, marginBottom: spacing.sm }}>
                        {O?.commentsLabel}
                      </ThemedText>
                      <TextInput
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 8,
                          padding: spacing.md,
                          color: colors.text,
                          fontSize: 14,
                          minHeight: 80,
                          textAlignVertical: "top",
                        }}
                        value={editComments}
                        onChangeText={setEditComments}
                        placeholder={O?.commentsPlaceholder}
                        placeholderTextColor={colors.textSecondary}
                        multiline
                      />
                    </View>
                    <View style={{ marginTop: spacing.md }}>
                      <Button
                        title={savingReview ? (O?.saving || "...") : (O?.saveReview || "Guardar")}
                        onPress={handleSaveReview}
                        variant="primary"
                        size="md"
                        disabled={savingReview}
                      />
                    </View>
                  </>
                )}
                {selectedOrder.reviewedBy && (
                  <View style={[styles.detailRow, { marginTop: spacing.sm }]}>
                    <ThemedText style={styles.detailLabel}>{O?.reviewedByLabel}</ThemedText>
                    <ThemedText style={styles.detailValue}>{selectedOrder.reviewedBy}</ThemedText>
                  </View>
                )}
                {selectedOrder.reviewedAt && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>{O?.reviewedAtLabel}</ThemedText>
                    <ThemedText style={styles.detailValue}>{formatDate(selectedOrder.reviewedAt, locale)}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SideModal>
      )}

      {/* Modal visor de comprobante */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setImageViewerVisible(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ maxWidth: "90%", maxHeight: "90%", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(false)}
              style={{ position: "absolute", top: -40, right: 0, zIndex: 10, padding: 8 }}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
            {imageViewerLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : imageViewerUrl ? (
              <ImageWithToken
                uri={imageViewerUrl}
                style={{ width: 600, height: 600, borderRadius: 8 }}
              />
            ) : (
              <ThemedText style={{ color: "#fff" }}>{O?.noReceiptImage}</ThemedText>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}
