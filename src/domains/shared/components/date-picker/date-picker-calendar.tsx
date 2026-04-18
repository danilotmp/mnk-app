/**
 * Calendario custom para DatePicker
 * Vistas: días del mes, selector de meses, selector de años
 */

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/src/infrastructure/i18n";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";

type CalendarView = "days" | "months" | "years";

interface DatePickerCalendarProps {
  visible: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_ES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];
const DAYS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Lunes = 0
}

export function DatePickerCalendar({ visible, onClose, value, onChange, minDate, maxDate }: DatePickerCalendarProps) {
  const { colors, borderRadius, spacing } = useTheme();
  const { language } = useTranslation();
  const months = language === "en" ? MONTHS_EN : MONTHS_ES;
  const dayHeaders = language === "en" ? DAYS_EN : DAYS_ES;

  const parsed = value ? new Date(value + "T00:00:00") : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());
  const [view, setView] = useState<CalendarView>("days");

  const selectedDay = value ? new Date(value + "T00:00:00").getDate() : -1;
  const selectedMonth = value ? new Date(value + "T00:00:00").getMonth() : -1;
  const selectedYear = value ? new Date(value + "T00:00:00").getFullYear() : -1;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const daysGrid = useMemo(() => {
    const total = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  const yearRange = useMemo(() => {
    const base = viewYear - (viewYear % 12);
    return Array.from({ length: 12 }, (_, i) => base + i);
  }, [viewYear]);

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    onClose();
  };

  const handleSelectMonth = (month: number) => {
    setViewMonth(month);
    setView("days");
  };

  const handleSelectYear = (year: number) => {
    setViewYear(year);
    setView("months");
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
    card: { backgroundColor: colors.background, borderRadius: borderRadius.lg, width: 320, maxHeight: 420, overflow: "hidden", borderWidth: 1, borderColor: colors.borderLight },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    headerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    headerSub: { fontSize: 12, color: colors.textSecondary },
    arrow: { padding: 6 },
    grid: { flexDirection: "row", flexWrap: "wrap", padding: 8 },
    dayHeader: { width: "14.28%", alignItems: "center", paddingVertical: 6 },
    dayHeaderText: { fontSize: 12, fontWeight: "600", color: colors.textSecondary },
    dayCell: { width: "14.28%", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
    dayCellInner: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    dayText: { fontSize: 14, color: colors.text },
    dayTextSelected: { color: "#fff", fontWeight: "700" },
    dayTextToday: { color: colors.primary, fontWeight: "700" },
    selectedBg: { backgroundColor: colors.primary },
    todayBorder: { borderWidth: 1, borderColor: colors.primary },
    monthCell: { width: "33.33%", alignItems: "center", justifyContent: "center", paddingVertical: 16 },
    monthCellInner: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: borderRadius.md },
    monthText: { fontSize: 15, color: colors.text, fontWeight: "500" },
    monthTextSelected: { color: "#fff", fontWeight: "700" },
    yearCell: { width: "33.33%", alignItems: "center", justifyContent: "center", paddingVertical: 14 },
    yearCellInner: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: borderRadius.md },
    yearText: { fontSize: 16, color: colors.text },
    yearTextSelected: { color: "#fff", fontWeight: "700" },
    footer: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.borderLight },
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={s.card}>
          {/* Header */}
          <View style={s.header}>
            {view === "days" ? (
              <>
                <TouchableOpacity onPress={prevMonth} style={s.arrow}><Ionicons name="chevron-back" size={20} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setView("months")}>
                  <ThemedText style={s.headerTitle}>{months[viewMonth]} {viewYear}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={nextMonth} style={s.arrow}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></TouchableOpacity>
              </>
            ) : view === "months" ? (
              <>
                <TouchableOpacity onPress={() => setViewYear(viewYear - 1)} style={s.arrow}><Ionicons name="chevron-back" size={20} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity onPress={() => setView("years")}>
                  <ThemedText style={s.headerTitle}>{viewYear}</ThemedText>
                  <ThemedText style={s.headerSub}>{language === "en" ? "Select month" : "Seleccionar mes"}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewYear(viewYear + 1)} style={s.arrow}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setViewYear(viewYear - 12)} style={s.arrow}><Ionicons name="chevron-back" size={20} color={colors.primary} /></TouchableOpacity>
                <View>
                  <ThemedText style={s.headerTitle}>{yearRange[0]} – {yearRange[yearRange.length - 1]}</ThemedText>
                  <ThemedText style={s.headerSub}>{language === "en" ? "Select year" : "Seleccionar año"}</ThemedText>
                </View>
                <TouchableOpacity onPress={() => setViewYear(viewYear + 12)} style={s.arrow}><Ionicons name="chevron-forward" size={20} color={colors.primary} /></TouchableOpacity>
              </>
            )}
          </View>

          {/* Body */}
          {view === "days" && (
            <View style={s.grid}>
              {dayHeaders.map((d) => (
                <View key={d} style={s.dayHeader}><ThemedText style={s.dayHeaderText}>{d}</ThemedText></View>
              ))}
              {daysGrid.map((day, i) => (
                <View key={i} style={s.dayCell}>
                  {day ? (
                    <TouchableOpacity
                      style={[
                        s.dayCellInner,
                        day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear && s.selectedBg,
                        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === todayStr && day !== selectedDay && s.todayBorder,
                      ]}
                      onPress={() => handleSelectDay(day)}
                    >
                      <ThemedText style={[
                        s.dayText,
                        day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear && s.dayTextSelected,
                        `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` === todayStr && day !== selectedDay && s.dayTextToday,
                      ]}>{day}</ThemedText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {view === "months" && (
            <View style={s.grid}>
              {months.map((m, i) => (
                <View key={i} style={s.monthCell}>
                  <TouchableOpacity
                    style={[s.monthCellInner, i === selectedMonth && viewYear === selectedYear && s.selectedBg]}
                    onPress={() => handleSelectMonth(i)}
                  >
                    <ThemedText style={[s.monthText, i === selectedMonth && viewYear === selectedYear && s.monthTextSelected]}>{m}</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {view === "years" && (
            <View style={s.grid}>
              {yearRange.map((y) => (
                <View key={y} style={s.yearCell}>
                  <TouchableOpacity
                    style={[s.yearCellInner, y === selectedYear && s.selectedBg]}
                    onPress={() => handleSelectYear(y)}
                  >
                    <ThemedText style={[s.yearText, y === selectedYear && s.yearTextSelected]}>{y}</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity onPress={() => { onChange(""); onClose(); }}>
              <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>{language === "en" ? "Clear" : "Borrar"}</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onChange(todayStr); onClose(); }}>
              <ThemedText style={{ color: colors.primary, fontWeight: "600" }}>{language === "en" ? "Today" : "Hoy"}</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
