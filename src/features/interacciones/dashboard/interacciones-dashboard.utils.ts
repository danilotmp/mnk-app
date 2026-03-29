/**
 * Utilidades para la pantalla Dashboard de interacciones (periodo UTC).
 */

import type {
  InteraccionesDashboardPeriodData,
  InteraccionesDashboardPeriodInstanceRow,
} from "@/src/domains/interacciones";

export type UtcMonthOption = {
  year: number;
  month: number;
  key: string;
  label: string;
};

/**
 * Últimos 12 meses calendario UTC (el primero es el mes en curso).
 */
export function buildLast12MonthsUtc(
  locale: string,
  now: Date = new Date(),
): UtcMonthOption[] {
  const out: UtcMonthOption[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const label = new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    })
      .format(new Date(Date.UTC(year, month - 1, 15)))
      .replaceAll(".", "")
      .trim();
    out.push({
      year,
      month,
      key: `${year}-${String(month).padStart(2, "0")}`,
      label,
    });
  }
  return out;
}

/** Años únicos presentes en los últimos 12 meses + año UTC actual y anterior. */
export function buildYearOptionsFromMonths(months: UtcMonthOption[]): number[] {
  const set = new Set<number>();
  for (const m of months) {
    set.add(m.year);
  }
  const now = new Date();
  const y = now.getUTCFullYear();
  set.add(y);
  set.add(y - 1);
  return [...set].sort((a, b) => b - a);
}

/**
 * Combina 12 respuestas mensuales en una sola vista anual (suma por channelInstance).
 */
export function mergeDashboardPeriodByYear(
  parts: InteraccionesDashboardPeriodData[],
  year: number,
  timezoneNote?: string,
): InteraccionesDashboardPeriodData {
  const map = new Map<string, InteraccionesDashboardPeriodInstanceRow>();
  for (const part of parts) {
    for (const row of part.instances ?? []) {
      const key = row.channelInstance.trim();
      if (!key) continue;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, { ...row, channelInstance: key });
      } else {
        map.set(key, {
          channelInstance: key,
          transactionsCount: cur.transactionsCount + row.transactionsCount,
          countDocuments: cur.countDocuments + row.countDocuments,
          operationsCount: cur.operationsCount + row.operationsCount,
          paymentsCount: cur.paymentsCount + row.paymentsCount,
          executionsCount: cur.executionsCount + row.executionsCount,
        });
      }
    }
  }
  return {
    periodYear: year,
    instances: Array.from(map.values()),
    ...(timezoneNote ? { timezoneNote } : {}),
  };
}
