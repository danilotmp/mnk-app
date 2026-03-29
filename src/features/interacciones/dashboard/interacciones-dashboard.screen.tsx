/**
 * Dashboard de interacciones (Chat IA / WhatsApp) — datos de GET /interacciones/dashboard/period.
 */

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useResponsive } from "@/hooks/use-responsive";
import { useTheme } from "@/hooks/use-theme";
import type {
  InteraccionesDashboardPeriodData,
  InteraccionesDashboardPeriodInstanceRow,
} from "@/src/domains/interacciones";
import { InteraccionesService } from "@/src/domains/interacciones";
import { useCompany } from "@/src/domains/shared";
import { useTranslation } from "@/src/infrastructure/i18n";
import { extractErrorDetail } from "@/src/infrastructure/messages/error-utils";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { createInteraccionesDashboardStyles } from "./interacciones-dashboard.screen.styles";
import {
  DonutLegendRow,
  InstanceDistributionDonut,
} from "./instance-distribution-donut";
import { InstanceMetricsGroupedChart } from "./instance-metrics-grouped-chart";
import {
  buildLast12MonthsUtc,
  buildYearOptionsFromMonths,
  mergeDashboardPeriodByYear,
  type UtcMonthOption,
} from "./interacciones-dashboard.utils";

type PeriodViewMode = "month" | "year";

export default function InteraccionesDashboardScreen() {
  const { colors, spacing, borderRadius, shadows } = useTheme();
  const { isMobile } = useResponsive();
  const { t, language } = useTranslation();
  const D = t.pages.interaccionesDashboard;
  const { company } = useCompany();
  const router = useRouter();

  const locale = language === "en" ? "en-US" : "es-ES";
  const monthOptions = useMemo(
    () => buildLast12MonthsUtc(locale),
    [locale],
  );
  const yearOptions = useMemo(
    () => buildYearOptionsFromMonths(monthOptions),
    [monthOptions],
  );

  const [periodView, setPeriodView] = useState<PeriodViewMode>("month");
  const [selectedAnnualYear, setSelectedAnnualYear] = useState(() =>
    new Date().getUTCFullYear(),
  );
  const [yearModalVisible, setYearModalVisible] = useState(false);

  const [selectedKey, setSelectedKey] = useState(() => monthOptions[0]?.key ?? "");
  const selectedPeriod: UtcMonthOption | undefined = useMemo(
    () => monthOptions.find((m) => m.key === selectedKey) ?? monthOptions[0],
    [monthOptions, selectedKey],
  );

  useEffect(() => {
    if (monthOptions.length && !monthOptions.some((m) => m.key === selectedKey)) {
      setSelectedKey(monthOptions[0].key);
    }
  }, [monthOptions, selectedKey]);

  useEffect(() => {
    setData(null);
    setChannelDirectory([]);
  }, [selectedPeriod?.key, periodView, selectedAnnualYear]);

  const [instanceFilter, setInstanceFilter] = useState<string | null>(null);
  const [data, setData] = useState<InteraccionesDashboardPeriodData | null>(
    null,
  );
  /** Instancias vistas sin filtro por canal (para chips aunque el API devuelva una sola fila). */
  const [channelDirectory, setChannelDirectory] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthScrollRef = useRef<ScrollView>(null);
  const monthScrollX = useRef(0);
  const scrollMonthsBy = useCallback((dir: -1 | 1) => {
    const step = 168;
    const cur = monthScrollX.current;
    const next = dir < 0 ? Math.max(0, cur - step) : cur + step;
    monthScrollRef.current?.scrollTo({ x: next, animated: true });
  }, []);

  const styles = useMemo(
    () =>
      createInteraccionesDashboardStyles(
        { colors, spacing, borderRadius, shadows },
        isMobile,
      ),
    [colors, spacing, borderRadius, shadows, isMobile],
  );

  const barColors: string[] = [
    colors.primary,
    colors.accent,
    colors.secondary,
    colors.info,
    colors.warning,
  ];

  const load = useCallback(
    async (opts?: { pull?: boolean }) => {
      const pull = opts?.pull === true;
      if (!company?.id?.trim()) {
        setData(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }
      if (periodView === "month") {
        if (!selectedPeriod) {
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } else if (!selectedAnnualYear) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setError(null);
      if (pull) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const cid = company.id.trim();
      const ch = instanceFilter?.trim() || undefined;
      try {
        if (periodView === "year") {
          const year = selectedAnnualYear;
          const monthly = await Promise.all(
            Array.from({ length: 12 }, (_, i) =>
              InteraccionesService.getDashboardPeriod({
                companyId: cid,
                year,
                month: i + 1,
                channelInstance: ch,
              }),
            ),
          );
          const note = D.annualUtcNote.replace("{year}", String(year));
          const merged = mergeDashboardPeriodByYear(monthly, year, note);
          setData(merged);
          if (!ch) {
            const uniq = new Set<string>();
            for (const part of monthly) {
              for (const row of part.instances ?? []) {
                const k = row.channelInstance.trim();
                if (k) uniq.add(k);
              }
            }
            setChannelDirectory([...uniq].sort((a, b) => a.localeCompare(b)));
          }
        } else {
          const sp = selectedPeriod;
          if (!sp) {
            return;
          }
          const d = await InteraccionesService.getDashboardPeriod({
            companyId: cid,
            year: sp.year,
            month: sp.month,
            channelInstance: ch,
          });
          setData(d);
          if (!ch && d.instances?.length) {
            const uniq = [
              ...new Set(d.instances.map((r) => r.channelInstance)),
            ].filter(Boolean) as string[];
            uniq.sort((a, b) => a.localeCompare(b));
            setChannelDirectory(uniq);
          }
        }
      } catch (e: unknown) {
        setData(null);
        setError(extractErrorDetail(e) || D.errorLoad);
      } finally {
        if (pull) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [
      company?.id,
      periodView,
      selectedAnnualYear,
      selectedPeriod,
      instanceFilter,
      D.errorLoad,
      D.annualUtcNote,
    ],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    load({ pull: true });
  }, [load]);

  const rows = useMemo(() => {
    const list = data?.instances ?? [];
    return [...list].sort(
      (a, b) => b.transactionsCount - a.transactionsCount,
    );
  }, [data]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        tx: acc.tx + r.transactionsCount,
        docs: acc.docs + r.countDocuments,
        ops: acc.ops + r.operationsCount,
        pay: acc.pay + r.paymentsCount,
        exec: acc.exec + r.executionsCount,
      }),
      { tx: 0, docs: 0, ops: 0, pay: 0, exec: 0 },
    );
  }, [rows]);

  const donutSlices = useMemo(
    () =>
      rows.slice(0, 12).map((row, idx) => ({
        label: row.channelInstance,
        value: row.transactionsCount,
        color: barColors[idx % barColors.length],
      })),
    [rows, barColors],
  );

  const instanceIdsForChips = useMemo(() => {
    if (channelDirectory.length > 0) {
      return channelDirectory;
    }
    const base = data?.instances ?? [];
    const uniq = [...new Set(base.map((r) => r.channelInstance))].filter(
      Boolean,
    ) as string[];
    return uniq.sort((a, b) => a.localeCompare(b));
  }, [channelDirectory, data]);

  useEffect(() => {
    if (
      instanceFilter &&
      instanceIdsForChips.length > 0 &&
      !instanceIdsForChips.includes(instanceFilter)
    ) {
      setInstanceFilter(null);
    }
  }, [instanceFilter, instanceIdsForChips]);

  const instanceChartSeries = useMemo(
    () => [
      {
        label: D.metricTransactions,
        color: barColors[0],
        getValue: (r: InteraccionesDashboardPeriodInstanceRow) =>
          r.transactionsCount,
      },
      {
        label: D.metricDocuments,
        color: barColors[1],
        getValue: (r: InteraccionesDashboardPeriodInstanceRow) =>
          r.countDocuments,
      },
      {
        label: D.metricOperations,
        color: barColors[2],
        getValue: (r: InteraccionesDashboardPeriodInstanceRow) =>
          r.operationsCount,
      },
      {
        label: D.metricPayments,
        color: barColors[3],
        getValue: (r: InteraccionesDashboardPeriodInstanceRow) =>
          r.paymentsCount,
      },
      {
        label: D.metricExecutions,
        color: barColors[4],
        getValue: (r: InteraccionesDashboardPeriodInstanceRow) =>
          r.executionsCount,
      },
    ],
    [
      D.metricTransactions,
      D.metricDocuments,
      D.metricOperations,
      D.metricPayments,
      D.metricExecutions,
      barColors,
    ],
  );

  const formatInt = (n: number) =>
    new Intl.NumberFormat(locale).format(Math.max(0, Math.floor(n)));

  if (!company?.id?.trim()) {
    return (
      <ThemedView style={{ flex: 1, padding: spacing.lg }}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerMessage}>
          <ThemedText type="body1">{D.emptyNoCompany}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isMobile ? spacing.md : spacing.lg,
            paddingTop: spacing.md,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Ionicons name="chevron-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.titleBlock}>
            <ThemedText style={styles.pageTitle}>{D.title}</ThemedText>
            <ThemedText style={styles.pageSubtitle}>{D.subtitle}</ThemedText>
          </View>
        </View>

        {data && rows.length > 0 ? (
            <View style={styles.kpiChartRow}>
              <View style={styles.kpiChartColumnMetrics}>
                <View style={styles.sectionCardMetrics}>
                  <ThemedText style={styles.sectionTitleMetricsTight}>
                    {D.sectionByInstance}
                  </ThemedText>
                  <ThemedText style={styles.barChartPeriodFootnote}>
                    {periodView === "year"
                      ? D.periodSummaryFootnoteYear.replace(
                          "{year}",
                          String(selectedAnnualYear),
                        )
                      : D.periodSummaryFootnoteMonth}
                  </ThemedText>
                  <InstanceMetricsGroupedChart
                    rows={rows}
                    series={instanceChartSeries}
                    formatInt={formatInt}
                    axisColor={colors.text}
                    gridColor={colors.borderLight}
                  />
                </View>
              </View>
              <View style={styles.heroColumnChart}>
                <View style={styles.chartCard}>
                  <ThemedText style={styles.sectionTitle}>
                    {D.sectionDistribution}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{
                      color: colors.textSecondary,
                      marginBottom: spacing.md,
                    }}
                  >
                    {D.sectionDistributionHint}
                  </ThemedText>
                  <InstanceDistributionDonut
                    slices={donutSlices}
                    total={totals.tx}
                    size={isMobile ? 188 : 220}
                    centerLabel={formatInt(totals.tx)}
                    centerSubLabel={D.kpiTransactions}
                    trackColor={colors.surfaceVariant}
                  />
                  {rows.slice(0, 12).map((row, idx) => {
                    const pctText =
                      totals.tx > 0
                        ? new Intl.NumberFormat(locale, {
                            style: "percent",
                            maximumFractionDigits: 2,
                            minimumFractionDigits: 0,
                          }).format(row.transactionsCount / totals.tx)
                        : "—";
                    return (
                      <DonutLegendRow
                        key={row.channelInstance + String(idx)}
                        label={row.channelInstance}
                        color={barColors[idx % barColors.length]}
                        pctText={pctText}
                      />
                    );
                  })}
                </View>
              </View>
            </View>
        ) : null}

        <View style={styles.heroRow}>
          <View style={styles.heroColumnFilters}>
            <View style={styles.filterCard}>
              <ThemedText style={styles.periodLabel}>{D.periodLabel}</ThemedText>
              <View style={styles.periodRow}>
                <TouchableOpacity
                  style={styles.yearDropdownTrigger}
                  activeOpacity={0.85}
                  onPress={() => setYearModalVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={D.periodYearDropdownA11y}
                >
                  <ThemedText
                    numberOfLines={1}
                    style={styles.yearDropdownLabel}
                  >
                    {periodView === "year"
                      ? `${selectedAnnualYear} · ${D.periodYearFull}`
                      : D.periodModeByMonth}
                  </ThemedText>
                  <Ionicons
                    name="chevron-down"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                {periodView === "month" ? (
                  <View style={styles.monthCarouselRow}>
                    <TouchableOpacity
                      style={styles.monthCarouselArrow}
                      onPress={() => scrollMonthsBy(-1)}
                      accessibilityRole="button"
                      accessibilityLabel={D.monthCarouselPrevA11y}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={22}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <View style={styles.monthCarouselClip}>
                      <ScrollView
                        ref={monthScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.monthChipsScroll}
                        contentContainerStyle={styles.monthChipsRow}
                        onScroll={(e) => {
                          monthScrollX.current =
                            e.nativeEvent.contentOffset.x;
                        }}
                        scrollEventThrottle={16}
                      >
                        {monthOptions.map((m) => {
                          const sel = m.key === selectedPeriod?.key;
                          return (
                            <TouchableOpacity
                              key={m.key}
                              style={[
                                styles.monthChip,
                                sel && styles.monthChipSelected,
                              ]}
                              onPress={() => setSelectedKey(m.key)}
                              activeOpacity={0.85}
                            >
                              <ThemedText
                                style={[
                                  styles.monthChipText,
                                  sel && styles.monthChipTextSelected,
                                ]}
                              >
                                {m.label}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <TouchableOpacity
                      style={styles.monthCarouselArrow}
                      onPress={() => scrollMonthsBy(1)}
                      accessibilityRole="button"
                      accessibilityLabel={D.monthCarouselNextA11y}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={22}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <ThemedText
                    type="caption"
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      color: colors.textSecondary,
                      alignSelf: "center",
                    }}
                  >
                    {D.annualChipsPlaceholder.replace(
                      "{year}",
                      String(selectedAnnualYear),
                    )}
                  </ThemedText>
                )}
              </View>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginTop: spacing.sm }}
              >
                {periodView === "month"
                  ? D.monthRangeHint
                  : D.annualDataHint.replace(
                      "{year}",
                      String(selectedAnnualYear),
                    )}
              </ThemedText>

              <ThemedText
                style={[styles.periodLabel, { marginTop: spacing.md }]}
              >
                {D.filterInstanceLabel}
              </ThemedText>
              <View style={styles.instanceChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.monthChip,
                    instanceFilter === null && styles.monthChipSelected,
                  ]}
                  onPress={() => setInstanceFilter(null)}
                >
                  <ThemedText
                    style={[
                      styles.monthChipText,
                      instanceFilter === null && styles.monthChipTextSelected,
                    ]}
                  >
                    {D.filterInstanceAll}
                  </ThemedText>
                </TouchableOpacity>
                {instanceIdsForChips.map((id) => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.monthChip,
                      instanceFilter === id && styles.monthChipSelected,
                    ]}
                    onPress={() => setInstanceFilter(id)}
                  >
                    <ThemedText
                      numberOfLines={1}
                      style={[
                        styles.monthChipText,
                        instanceFilter === id && styles.monthChipTextSelected,
                      ]}
                    >
                      {id}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.kpiChartColumnKpis}>
            <View style={styles.kpiGridCompact}>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(totals.tx)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiTransactions}
                </ThemedText>
              </View>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(totals.docs)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiDocuments}
                </ThemedText>
              </View>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(totals.ops)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiOperations}
                </ThemedText>
              </View>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(totals.pay)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiPayments}
                </ThemedText>
              </View>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(totals.exec)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiExecutions}
                </ThemedText>
              </View>
              <View style={styles.kpiCardCompact}>
                <ThemedText style={styles.kpiValueCompact}>
                  {formatInt(rows.length)}
                </ThemedText>
                <ThemedText style={styles.kpiLabelCompact}>
                  {D.kpiInstances}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {loading && !data ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator size="large" color={colors.primary} />
            <ThemedText type="body2" style={{ marginTop: spacing.md }}>
              {D.loading}
            </ThemedText>
          </View>
        ) : null}

        {error ? (
          <View style={[styles.sectionCard, styles.centerMessage]}>
            <ThemedText type="body1" style={{ color: colors.error }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        {!loading && !error && data && rows.length === 0 ? (
          <View style={[styles.sectionCard, styles.centerMessage]}>
            <ThemedText type="body1">{D.emptyNoData}</ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={yearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.yearModalRoot}>
          <Pressable
            style={styles.yearModalBackdrop}
            onPress={() => setYearModalVisible(false)}
          />
          <View style={styles.yearModalCenterWrap}>
            <View style={styles.yearModalSheet}>
              <ThemedText style={styles.yearModalTitle}>
                {D.yearPickerTitle}
              </ThemedText>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity
                  style={[
                    styles.yearModalOption,
                    periodView === "month" && styles.yearModalOptionSelected,
                  ]}
                  onPress={() => {
                    setPeriodView("month");
                    setYearModalVisible(false);
                  }}
                  activeOpacity={0.85}
                >
                  <ThemedText style={styles.yearModalOptionText}>
                    {D.periodModeByMonth}
                  </ThemedText>
                  {periodView === "month" ? (
                    <Ionicons
                      name="checkmark"
                      size={22}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
                {yearOptions.map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[
                      styles.yearModalOption,
                      periodView === "year" &&
                        selectedAnnualYear === y &&
                        styles.yearModalOptionSelected,
                    ]}
                    onPress={() => {
                      setPeriodView("year");
                      setSelectedAnnualYear(y);
                      setYearModalVisible(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <ThemedText style={styles.yearModalOptionText}>
                      {y} — {D.periodYearFull}
                    </ThemedText>
                    {periodView === "year" && selectedAnnualYear === y ? (
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}
