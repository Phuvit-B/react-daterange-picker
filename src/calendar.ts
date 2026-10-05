export type DateRange = [Date | null, Date | null];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Calendar-day difference, immune to DST (both sides normalized to local midnight). */
export const compareDay = (a: Date, b: Date) => +startOfDay(a) - +startOfDay(b);

/** 42 cells (6 weeks) covering `month`, so every grid is the same height. */
export function monthGrid(month: Date, weekStartsOn = 0): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() - weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, i) =>
    new Date(month.getFullYear(), month.getMonth(), 1 - offset + i)
  );
}

/** Second click decides direction: clicking before the anchor flips the range. */
export function nextRange([start, end]: DateRange, day: Date): DateRange {
  const d = startOfDay(day);
  if (!start || end) return [d, null];
  return compareDay(d, start) < 0 ? [d, start] : [start, d];
}

export function inRange(day: Date, [start, end]: DateRange) {
  if (!start || !end) return false;
  return compareDay(day, start) >= 0 && compareDay(day, end) <= 0;
}

export const clampRange = (d: Date, min?: Date, max?: Date) =>
  (!min || compareDay(d, min) >= 0) && (!max || compareDay(d, max) <= 0);

/**
 * YYYY-MM-DD in the user's own timezone. `toISOString().slice(0,10)` looks like it does
 * this but converts to UTC first, so east of Greenwich it reports the previous day.
 */
export const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const TOKENS = /YYYY|YY|BBBB|BB|MMMM|MMM|MM|M|DDDD|DDD|DD|D/g;

/**
 * Builds a `format` function from a pattern, for when you want the exact order and
 * separators rather than the locale's. Month and weekday names still come from `locale`.
 *
 *   pattern("DD/MM/BBBB")            -> 06/10/2569
 *   pattern("D MMMM BBBB", "th")     -> 6 ตุลาคม 2569
 *   pattern("MM/DD/YYYY")            -> 10/06/2026
 *
 * Tokens: YYYY YY (CE year) · BBBB BB (BE year, +543) · MMMM MMM MM M (month) ·
 * DDDD DDD (weekday name) · DD D (day). Everything else is copied through, so a literal
 * letter that collides with a token needs a function instead of a pattern.
 */
export function pattern(p: string, locale?: string) {
  const name = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, opts).format(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (d: Date) =>
    p.replace(TOKENS, (t) => {
      switch (t) {
        case "YYYY": return String(d.getFullYear());
        case "YY": return pad(d.getFullYear() % 100);
        case "BBBB": return String(d.getFullYear() + 543);
        case "BB": return pad((d.getFullYear() + 543) % 100);
        case "MMMM": return name(d, { month: "long" });
        case "MMM": return name(d, { month: "short" });
        case "MM": return pad(d.getMonth() + 1);
        case "M": return String(d.getMonth() + 1);
        case "DDDD": return name(d, { weekday: "long" });
        case "DDD": return name(d, { weekday: "short" });
        case "DD": return pad(d.getDate());
        default: return String(d.getDate());
      }
    });
}
