/** Option row for batch = ISO week + year (e.g. W05 / 2026). */
export interface BatchWeekSelectOption {
  label: string;
  value: string;
}

/**
 * ISO week-numbering year and week number (1–53) for a calendar date (local timezone).
 */
export function getIsoWeekYearAndWeek(date: Date): { isoYear: number; week: number } {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3);
  const isoYear = t.getFullYear();
  const jan4 = new Date(isoYear, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const week1Thursday = new Date(isoYear, 0, 4 - jan4Day + 3);
  const diffDays = Math.round((t.getTime() - week1Thursday.getTime()) / 86400000);
  const week = 1 + Math.floor(diffDays / 7);
  return { isoYear, week };
}

export function formatBatchWeekValue(isoYear: number, week: number): string {
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

export function getCurrentBatchWeekValue(): string {
  const { isoYear, week } = getIsoWeekYearAndWeek(new Date());
  return formatBatchWeekValue(isoYear, week);
}

function getMondayOnOrBefore(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  return d;
}

/**
 * Distinct ISO weeks whose ISO year is between `currentYear - yearsBack` and
 * `currentYear + yearsForward` (inclusive).
 */
export function buildBatchWeekSelectOptions(
  yearsBack = 1,
  yearsForward = 1,
): BatchWeekSelectOption[] {
  const now = new Date();
  const startYear = now.getFullYear() - yearsBack;
  const endYear = now.getFullYear() + yearsForward;
  const start = getMondayOnOrBefore(new Date(startYear, 0, 1));
  const endGuard = new Date(endYear + 1, 0, 14);
  const seen = new Set<string>();
  const out: BatchWeekSelectOption[] = [];
  for (let cur = new Date(start); cur <= endGuard; cur.setDate(cur.getDate() + 7)) {
    const { isoYear, week } = getIsoWeekYearAndWeek(cur);
    if (isoYear < startYear || isoYear > endYear) {
      continue;
    }
    const value = formatBatchWeekValue(isoYear, week);
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push({
      label: `W${String(week).padStart(2, '0')} / ${isoYear}`,
      value,
    });
  }
  return out.sort((a, b) => a.value.localeCompare(b.value));
}

export const BATCH_WEEK_SELECT_OPTIONS: BatchWeekSelectOption[] = buildBatchWeekSelectOptions(1, 1);
