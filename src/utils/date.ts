import { MONTH_NAMES_ID, DAY_NAMES_ID } from '../types';

/** Format date to Indonesian: "Jumat, 04 April 2025" */
export function formatDateIndonesian(date: Date): string {
  const dayName = DAY_NAMES_ID[date.getDay()];
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES_ID[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

/** Format date short: "4 Apr 2025" */
export function formatDateShort(date: Date): string {
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/** Get ISO date string: "2025-04-04" */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse ISO date string to Date */
export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Get year-month key: "2025-04" */
export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

/** Get days in month */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Get all dates in a month */
export function getMonthDates(year: number, month: number): string[] {
  const days = getDaysInMonth(year, month);
  const dates: string[] = [];
  for (let d = 1; d <= days; d++) {
    dates.push(toISODate(new Date(year, month, d)));
  }
  return dates;
}

/** Get week number within month (1-based) */
export function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
}

/** Format month-year: "April 2025" */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTH_NAMES_ID[month]} ${year}`;
}
