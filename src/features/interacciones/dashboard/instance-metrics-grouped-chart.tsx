/**
 * Barras verticales agrupadas por instancia (una tanda de métricas por canal).
 * Se estira al ancho del contenedor cuando hay espacio de sobra.
 */

import { ThemedText } from "@/components/themed-text";
import type { InteraccionesDashboardPeriodInstanceRow } from "@/src/domains/interacciones";
import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, ScrollView, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

export type InstanceChartSeries = {
  label: string;
  color: string;
  getValue: (r: InteraccionesDashboardPeriodInstanceRow) => number;
};

type Props = {
  rows: InteraccionesDashboardPeriodInstanceRow[];
  series: InstanceChartSeries[];
  formatInt: (n: number) => string;
  axisColor: string;
  gridColor: string;
};

const PADDING = { l: 44, r: 12, t: 6, b: 48 };
const CHART_H = 288;
const BAR_W = 11;
const BAR_GAP = 5;
const GROUP_GAP = 28;

function shortenInstanceLabel(id: string): string {
  const t = id.trim();
  if (t.length <= 14) return t;
  return `…${t.slice(-11)}`;
}

export function InstanceMetricsGroupedChart({
  rows,
  series,
  formatInt,
  axisColor,
  gridColor,
}: Props) {
  const [containerW, setContainerW] = useState(0);

  const onChartLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerW) > 0.5) {
      setContainerW(w);
    }
  };

  const m = series.length;
  const n = rows.length;

  const maxRaw = useMemo(() => {
    let mx = 0;
    for (const r of rows) {
      for (const s of series) {
        mx = Math.max(mx, s.getValue(r));
      }
    }
    return mx;
  }, [rows, series]);

  const maxY = Math.max(1, Math.ceil(maxRaw * 1.08));

  const layoutGeom = useMemo(() => {
    const minGroupW = m * BAR_W + Math.max(0, m - 1) * BAR_GAP;
    const minPlotW =
      n * minGroupW + Math.max(0, n - 1) * GROUP_GAP;
    const minSvgW = PADDING.l + minPlotW + PADDING.r;

    const inner = Math.max(0, containerW);
    const availPlot = inner - PADDING.l - PADDING.r;

    let scale = 1;
    let plotW = minPlotW;
    let svgW = minSvgW;
    let needsScroll = false;

    if (inner > 0 && n > 0) {
      if (availPlot >= minPlotW) {
        scale = availPlot / minPlotW;
        plotW = availPlot;
        svgW = inner;
      } else {
        needsScroll = true;
      }
    }

    const barW = BAR_W * scale;
    const barGap = BAR_GAP * scale;
    const groupGap = GROUP_GAP * scale;
    const groupW = m * barW + Math.max(0, m - 1) * barGap;
    const plotRight = PADDING.l + plotW;

    const axisFont = Math.min(14, Math.max(11, 11 * Math.sqrt(scale)));
    const xLabelFont = Math.min(13, Math.max(10, 10 * Math.sqrt(scale)));

    return {
      scale,
      plotW,
      svgW,
      barW,
      barGap,
      groupGap,
      groupW,
      plotRight,
      needsScroll,
      minSvgW,
      axisFont,
      xLabelFont,
    };
  }, [containerW, m, n, series]);

  const plotH = CHART_H - PADDING.t - PADDING.b;
  const yScale = (v: number) => (v / maxY) * plotH;

  const ticks = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps }, (_, i) => (maxY * i) / (steps - 1));
  }, [maxY]);

  const {
    svgW,
    barW,
    barGap,
    groupGap,
    groupW,
    plotRight,
    needsScroll,
    minSvgW,
    axisFont,
    xLabelFont,
  } = layoutGeom;

  const svgChart = (
    <Svg width={svgW} height={CHART_H}>
      {ticks.map((tk) => {
        const y = PADDING.t + plotH - yScale(tk);
        return (
          <G key={`tick-${tk}`}>
            <Line
              x1={PADDING.l}
              y1={y}
              x2={plotRight}
              y2={y}
              stroke={gridColor}
              strokeWidth={1}
              opacity={0.9}
            />
            <SvgText
              x={PADDING.l - 8}
              y={y + 4}
              fontSize={axisFont}
              fill={axisColor}
              textAnchor="end"
            >
              {formatInt(Math.round(tk))}
            </SvgText>
          </G>
        );
      })}
      {rows.map((row, gi) => {
        const gx = PADDING.l + gi * (groupW + groupGap);
        return series.map((s, si) => {
          const v = Math.max(0, s.getValue(row));
          const h = yScale(v);
          const x = gx + si * (barW + barGap);
          const y = PADDING.t + plotH - h;
          return (
            <Rect
              key={`${row.channelInstance}-${si}`}
              x={x}
              y={y}
              width={barW}
              height={Math.max(h, 0)}
              fill={s.color}
              rx={Math.min(3, barW / 3)}
              ry={Math.min(3, barW / 3)}
            />
          );
        });
      })}
      {rows.map((row, gi) => {
        const cx = PADDING.l + gi * (groupW + groupGap) + groupW / 2;
        const label = shortenInstanceLabel(row.channelInstance);
        return (
          <SvgText
            key={`xl-${row.channelInstance}`}
            x={cx}
            y={CHART_H - 16}
            fontSize={xLabelFont}
            fill={axisColor}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );

  return (
    <View style={{ width: "100%", alignSelf: "stretch" }} onLayout={onChartLayout}>
      {needsScroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          nestedScrollEnabled
          style={{ width: "100%" }}
          contentContainerStyle={{ minWidth: minSvgW }}
        >
          {svgChart}
        </ScrollView>
      ) : (
        <View style={{ width: "100%", alignItems: "stretch" }}>{svgChart}</View>
      )}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 12,
          marginTop: 10,
        }}
      >
        {series.map((s) => (
          <View
            key={s.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: s.color,
              }}
            />
            <ThemedText type="caption">{s.label}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}
