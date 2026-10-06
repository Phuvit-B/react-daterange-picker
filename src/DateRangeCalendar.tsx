import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { addMonths, compareDay, inRange, monthGrid, nextRange, sameDay, startOfDay, clampRange, toISODate, type DateRange } from "./calendar";
import { injectStyles } from "./styles";

export type DateRangeCalendarProps = {
  value: DateRange;
  onChange: (value: DateRange) => void;
  /** Side-by-side months. Default 2. */
  months?: number;
  /** BCP-47 tag for month/weekday names. Defaults to the browser locale. */
  locale?: string;
  /** 0 = Sunday. */
  weekStartsOn?: number;
  minDate?: Date;
  maxDate?: Date;
  shouldDisableDate?: (day: Date) => boolean;
  /** Days to mark — a list, or a test to run per day (holidays, days with appointments…). */
  highlightDates?: Date[] | ((day: Date) => boolean);
  /** What to draw on a marked day. Defaults to a small dot in `--drp-highlight`. */
  highlightIcon?: ReactNode;
  /** What the mark means, appended to the day's spoken label. Silent when omitted. */
  highlightLabel?: string;
  defaultMonth?: Date;
  className?: string;
  /** Handy for one-off theming: style={{ "--drp-accent": "#e91e63" } as CSSProperties}. */
  style?: CSSProperties;
};

export function DateRangeCalendar({
  value, onChange, months = 2, locale, weekStartsOn = 0,
  minDate, maxDate, shouldDisableDate, defaultMonth, className = "", style,
  highlightDates, highlightIcon, highlightLabel,
}: DateRangeCalendarProps) {
  injectStyles();
  const [cursor, setCursor] = useState(() => addMonths(defaultMonth ?? value[0] ?? new Date(), 0));
  const [hover, setHover] = useState<Date | null>(null);
  const [dir, setDir] = useState(0);
  const today = useMemo(() => startOfDay(new Date()), []);

  const dayName = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "narrow" }), [locale]);
  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const fullDate = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale]);

  const [start, end] = value;
  // While picking the second date, preview the range the pointer is over.
  const preview: DateRange = start && !end && hover
    ? (compareDay(hover, start) < 0 ? [hover, start] : [start, hover])
    : value;

  // Two months side by side don't fit a phone, and stacking them makes a very long page.
  // Show one and let them swipe. Falls back to the asked-for count when there's no window.
  const mq = useMemo(
    () => (typeof window === "undefined" ? null : window.matchMedia("(max-width: 560px)")),
    []
  );
  const narrow = useSyncExternalStore(
    (cb) => {
      mq?.addEventListener("change", cb);
      return () => mq?.removeEventListener("change", cb);
    },
    () => !!mq?.matches,
    () => false
  );
  const shown = narrow ? 1 : months;

  const isHighlighted = useMemo(() => {
    if (!highlightDates) return () => false;
    if (typeof highlightDates === "function") return highlightDates;
    const days = new Set(highlightDates.map(toISODate));
    return (d: Date) => days.has(toISODate(d));
  }, [highlightDates]);

  const isDisabled = (d: Date) => !clampRange(d, minDate, maxDate) || !!shouldDisableDate?.(d);
  const step = (n: number) => { setDir(n); setCursor((c) => addMonths(c, n)); };

  // Hide a nav arrow once every month it could reach is out of bounds.
  const prevBlocked = !!minDate && compareDay(addMonths(cursor, -1), new Date(minDate.getFullYear(), minDate.getMonth(), 1)) < 0;
  const nextBlocked = !!maxDate && compareDay(addMonths(cursor, shown), new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) > 0;

  // 2024-09-01 was a Sunday, so day-of-month 1..7 maps cleanly onto weekday 0..6.
  const dows = useMemo(
    () => Array.from({ length: 7 }, (_, i) => dayName.format(new Date(2024, 8, 1 + ((weekStartsOn + i) % 7)))),
    [dayName, weekStartsOn]
  );

  // Swipe to change month. Touch and pen only — on a mouse a drag is a text selection,
  // not a gesture, and nobody expects the calendar to move.
  const from = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    swiped.current = false;
    from.current = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const origin = from.current;
    from.current = null;
    if (!origin) return;
    const dx = e.clientX - origin.x;
    const dy = e.clientY - origin.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return; // a tap, or a page scroll
    const n = dx < 0 ? 1 : -1;
    if ((n > 0 && nextBlocked) || (n < 0 && prevBlocked)) return;
    swiped.current = true;
    step(n);
  };

  return (
    <div className={`drp ${className}`.trim()} style={style} data-dir={dir || undefined}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      // the finger lifts on top of a day; without this the swipe would also pick a date
      onClickCapture={(e) => { if (swiped.current) { e.stopPropagation(); swiped.current = false; } }}>
      {Array.from({ length: shown }, (_, m) => {
        const month = addMonths(cursor, m);
        return (
          <div className="drp-month" key={m}>
            <div className="drp-head">
              <button className="drp-nav" onClick={() => step(-1)} disabled={m > 0 || prevBlocked}
                style={{ visibility: m > 0 ? "hidden" : undefined }} aria-label="Previous month" type="button">‹</button>
              <span className={dir ? "drp-anim" : undefined} key={+month} aria-live="polite">{monthName.format(month)}</span>
              <button className="drp-nav" onClick={() => step(1)} disabled={m < shown - 1 || nextBlocked}
                style={{ visibility: m < shown - 1 ? "hidden" : undefined }} aria-label="Next month" type="button">›</button>
            </div>
            <div className={`drp-grid${dir ? " drp-anim" : ""}`} key={+month} role="grid">
              {dows.map((d, i) => <div className="drp-dow" key={i} aria-hidden>{d}</div>)}
              {monthGrid(month, weekStartsOn).map((day) => {
                const outside = day.getMonth() !== month.getMonth();
                const selected = (!!start && sameDay(day, start)) || (!!end && sameDay(day, end));
                const band = !outside && inRange(day, preview);
                const [ps, pe] = preview;
                const marked = !outside && isHighlighted(day);
                const label = fullDate.format(day) + (marked && highlightLabel ? `, ${highlightLabel}` : "");
                return (
                  <div className={`drp-cell${band ? " in" : ""}${band && ps && sameDay(day, ps) ? " s" : ""}${band && pe && sameDay(day, pe) ? " e" : ""}`}
                    key={+day}>
                    <button type="button"
                      className={`drp-day${outside ? " out" : ""}${sameDay(day, today) ? " today" : ""}${marked && !highlightIcon ? " hl" : ""}`}
                      disabled={outside || isDisabled(day)}
                      aria-selected={selected}
                      aria-label={label}
                      onClick={() => onChange(nextRange(value, day))}
                      onPointerEnter={() => setHover(day)}
                      onFocus={() => setHover(day)}
                      onPointerLeave={() => setHover(null)}>
                      {day.getDate()}
                      {marked && highlightIcon ? <span className="drp-mark" aria-hidden>{highlightIcon}</span> : null}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
