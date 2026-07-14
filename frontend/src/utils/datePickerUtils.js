import {
  addDays,
  addMonths,
  addYears,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getMonth,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  setMonth,
  setYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse `YYYY-MM-DD` to a local Date (noon avoids DST edge cases). */
export function parseISODate(value) {
  if (!value || typeof value !== "string") return null;
  const iso = value.slice(0, 10);
  if (!ISO_DATE_RE.test(iso)) return null;
  const date = parseISO(`${iso}T12:00:00`);
  return isValid(date) ? date : null;
}

/** Format a Date as `YYYY-MM-DD`. */
export function toISODate(date) {
  if (!date || !isValid(date)) return "";
  return format(date, "yyyy-MM-dd");
}

/** Format ISO or Date as `DD/MM/YYYY` for display. */
export function formatISODateBR(value) {
  const date = value instanceof Date ? value : parseISODate(value);
  if (!date) return "";
  return format(date, "dd/MM/yyyy");
}

/** Month title, e.g. "julho de 2026". */
export function formatMonthYear(date) {
  if (!date || !isValid(date)) return "";
  return format(date, "MMMM 'de' yyyy", { locale: ptBR });
}

/** Short month labels for the month grid (jan…dez). */
export function getMonthShortLabels() {
  return Array.from({ length: 12 }, (_, month) =>
    format(new Date(2020, month, 1), "MMM", { locale: ptBR }).replace(".", ""),
  );
}

/** 12-year window centered around `anchorYear` (e.g. 2020–2031). */
export function getYearOptions(anchorYear, span = 12) {
  const start = Math.floor(anchorYear / span) * span;
  return Array.from({ length: span }, (_, i) => start + i);
}

export function formatYearRange(years) {
  if (!years?.length) return "";
  return `${years[0]} – ${years[years.length - 1]}`;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function getWeekdayLabels() {
  return WEEKDAY_LABELS;
}

/**
 * Build a Sunday-start calendar grid for the visible month.
 * Returns Date[] (typically 35 or 42 cells).
 */
export function getMonthCalendarDays(monthDate) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function isDateOutsideMonth(day, monthDate) {
  return !isSameMonth(day, monthDate);
}

export function isDateDisabled(day, min, max) {
  const dayStart = startOfDay(day);
  if (min) {
    const minDate = parseISODate(min);
    if (minDate && isBefore(dayStart, startOfDay(minDate))) return true;
  }
  if (max) {
    const maxDate = parseISODate(max);
    if (maxDate && isAfter(dayStart, startOfDay(maxDate))) return true;
  }
  return false;
}

export function isSameISODate(day, isoValue) {
  const selected = parseISODate(isoValue);
  if (!selected) return false;
  return isSameDay(day, selected);
}

export function isToday(day) {
  return isSameDay(day, new Date());
}

export {
  addMonths,
  addYears,
  addDays,
  getMonth,
  getYear,
  setMonth,
  setYear,
  startOfMonth,
};
