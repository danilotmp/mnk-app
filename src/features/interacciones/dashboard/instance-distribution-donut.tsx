/**
 * Donut chart: participación por instancia sobre total de transacciones (mismos datos que barras).
 */

import { ThemedText } from "@/components/themed-text";
import React, { useMemo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Anillo entre rInner y rOuter, de startDeg a endDeg (grados, 0 = derecha, -90 = arriba). */
function ringSegment(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number,
): string {
  const sr = toRad(startDeg);
  const er = toRad(endDeg);
  const x1 = cx + rOuter * Math.cos(sr);
  const y1 = cy + rOuter * Math.sin(sr);
  const x2 = cx + rOuter * Math.cos(er);
  const y2 = cy + rOuter * Math.sin(er);
  const x3 = cx + rInner * Math.cos(er);
  const y3 = cy + rInner * Math.sin(er);
  const x4 = cx + rInner * Math.cos(sr);
  const y4 = cy + rInner * Math.sin(sr);
  const sweep = endDeg - startDeg;
  const large = sweep > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

export type DonutSliceInput = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  slices: DonutSliceInput[];
  total: number;
  size?: number;
  centerLabel: string;
  centerSubLabel?: string;
  trackColor: string;
};

export function InstanceDistributionDonut({
  slices,
  total,
  size = 200,
  centerLabel,
  centerSubLabel,
  trackColor,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.42;
  const rInner = size * 0.26;

  const paths = useMemo(() => {
    if (total <= 0 || slices.length === 0) {
      return [] as { d: string; color: string; key: string }[];
    }
    const n = slices.length;
    /** Una sola instancia: el total es 100 % visual; un arco SVG de 360° no dibuja bien, usamos dos medios anillos. */
    if (n === 1) {
      const s = slices[0];
      if (s.value <= 0) {
        return [];
      }
      return [
        {
          key: `${s.label}-ring-a`,
          color: s.color,
          d: ringSegment(cx, cy, rInner, rOuter, -90, 90),
        },
        {
          key: `${s.label}-ring-b`,
          color: s.color,
          d: ringSegment(cx, cy, rInner, rOuter, 90, 270),
        },
      ];
    }

    const out: { d: string; color: string; key: string }[] = [];
    let angle = -90;
    for (let i = 0; i < n; i++) {
      const s = slices[i];
      const sweep =
        i === n - 1 ? 270 - angle : (s.value / total) * 360;
      if (sweep <= 0.01) continue;
      const end = angle + sweep;
      out.push({
        key: `${s.label}-${i}`,
        color: s.color,
        d: ringSegment(cx, cy, rInner, rOuter, angle, end),
      });
      angle = end;
    }
    return out;
  }, [slices, total, cx, cy, rInner, rOuter]);

  const showEmptyRing = total <= 0 || paths.length === 0;

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {showEmptyRing ? (
            <Path
              d={ringSegment(cx, cy, rInner, rOuter, -90, 269.5)}
              fill={trackColor}
            />
          ) : (
            paths.map((p) => <Path key={p.key} d={p.d} fill={p.color} />)
          )}
        </Svg>
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <ThemedText
            style={{
              fontSize: size * 0.14,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}
          >
            {centerLabel}
          </ThemedText>
          {centerSubLabel ? (
            <ThemedText
              type="caption"
              numberOfLines={2}
              style={{ textAlign: "center", marginTop: 4, paddingHorizontal: 8 }}
            >
              {centerSubLabel}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function DonutLegendRow({
  label,
  color,
  pctText,
}: {
  label: string;
  color: string;
  pctText: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 8,
        minWidth: 0,
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <ThemedText
        type="body2"
        numberOfLines={1}
        style={{ flex: 1, minWidth: 0 }}
      >
        {label}
      </ThemedText>
      <ThemedText
        type="caption"
        style={{ fontVariant: ["tabular-nums"], flexShrink: 0 }}
      >
        {pctText}
      </ThemedText>
    </View>
  );
}
