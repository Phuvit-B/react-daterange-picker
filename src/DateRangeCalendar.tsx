import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { addMonths, compareDay, inRange, monthGrid, monthBlocked, nextRange, sameDay, startOfDay, clampRange, toISODate, yearSpan, type DateRange } from "./calendar";
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
  /**
   * Quick-pick buttons beside the months. Build ranges with lastDays / lastMonths, or pass any
   * [start, end]: [{ label: "7 วัน", value: lastDays(7) }, { label: "1 เดือน", value: lastMonths(1) }]
   */
  presets?: { label: string; value: DateRange }[];
  /** Click the month title to jump to a month from a grid. Default true. */
  pickMonth?: boolean;
  /** Click the year to jump to a year from a grid. Default true. */
  pickYear?: boolean;
  className?: string;
  /** Handy for one-off theming: style={{ "--drp-accent": "#e91e63" } as CSSProperties}. */
  style?: CSSProperties;
};

export function DateRangeCalendar({
  value, onChange, months = 2, locale, weekStartsOn = 0,
  minDate, maxDate, shouldDisableDate, defaultMonth, className = "", style,
  highlightDates, highlightIcon, highlightLabel, pickMonth = true, pickYear = true, presets,
}: DateRangeCalendarProps) {
  injectStyles();
  const [cursor, setCursor] = useState(() => addMonths(defaultMonth ?? value[0] ?? new Date(), 0));
  const [hover, setHover] = useState<Date | null>(null);
  const [dir, setDir] = useState(0);
  // Title → month grid (its header year → year grid → back to months) → days.
  // Either grid can be switched off; with only years, a year goes straight back to days.
  const [view, setView] = useState<"day" | "year" | "month">("day");
  // Which month column the grid was opened from: the picked month lands back in that column.
  const [col, setCol] = useState(0);
  const pickBox = useRef<HTMLDivElement>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const dayName = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "narrow" }), [locale]);
  const monthName = useMemo(() => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }), [locale]);
  const fullDate = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "full" }), [locale]);
  const shortMonth = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short" }), [locale]);
  // Only the year part: "th" says "พ.ศ. 2569" for { year }, the grid wants just "2569".
  const yearDtf = useMemo(() => new Intl.DateTimeFormat(locale, { year: "numeric" }), [locale]);
  const yearName = (y: number) =>
    yearDtf.formatToParts(new Date(y, 0, 1)).find((p) => p.type === "year")?.value ?? String(y);

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
    if (view !== "day" || (n > 0 && nextBlocked) || (n < 0 && prevBlocked)) return;
    swiped.current = true;
    step(n);
  };

  // Opening a grid: centre the current year/month in the scroll box and put focus on it,
  // so arrows start from there. scrollTop rather than scrollIntoView, which would also
  // scroll the page.
  useEffect(() => {
    const box = pickBox.current;
    const on = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!box || !on) return;
    // Rects, not offsetTop: offsetTop counts from the nearest positioned ancestor (the
    // popover), so the header above the grid pushed the active year off the bottom.
    box.scrollTop += on.getBoundingClientRect().top - box.getBoundingClientRect().top - (box.clientHeight - on.offsetHeight) / 2;
    on.focus({ preventScroll: true });
  }, [view]);

  const pick = (to: "day" | "year" | "month", next?: Date) => {
    setDir(0);
    if (next) setCursor(addMonths(next, -col));
    setView(to);
  };

  // Arrow keys walk the grid; Escape backs out to days instead of closing the popover.
  const onGridKey = (cols: number) => (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.stopPropagation(); pick("day"); return; }
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key];
    if (!move) return;
    e.preventDefault();
    const opts = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".drp-opt"));
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    for (let j = i + move; j >= 0 && j < opts.length; j += move) {
      if (!opts[j].disabled) { opts[j].focus(); break; }
    }
  };

  const caret = <span className={`drp-caret${view !== "day" ? " up" : ""}`} aria-hidden>▾</span>;

  if (view !== "day") {
    const base = addMonths(cursor, col);
    const y = base.getFullYear();
    return (
      <div className={`drp ${className}`.trim()} style={style}>
        <div className="drp-month drp-picker">
          <div className="drp-head">
            {view === "month" && !pickYear ? (
              <span className="drp-title static">{yearName(y)}</span>
            ) : (
              <button type="button" className="drp-title"
                aria-label={view === "month" ? "Choose year" : pickMonth ? "Back to months" : "Back to days"}
                onClick={() => pick(view === "month" ? "year" : pickMonth ? "month" : "day")}>
                {view === "month" ? yearName(y) : monthName.format(base)}{caret}
              </button>
            )}
          </div>
          {view === "year" ? (
            <div className="drp-opts drp-years" ref={pickBox} role="listbox" aria-label="Year" onKeyDown={onGridKey(4)}>
              {yearSpan(base, minDate, maxDate).map((yy) => {
                const blocked = (!!minDate && yy < minDate.getFullYear()) || (!!maxDate && yy > maxDate.getFullYear());
                return (
                  <button type="button" key={yy} className="drp-opt" role="option" aria-selected={yy === y}
                    disabled={blocked} onClick={() => pick(pickMonth ? "month" : "day", new Date(yy, base.getMonth(), 1))}>
                    {yearName(yy)}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="drp-opts drp-months" ref={pickBox} role="listbox" aria-label="Month" onKeyDown={onGridKey(3)}>
              {Array.from({ length: 12 }, (_, mm) => (
                <button type="button" key={mm} className="drp-opt" role="option" aria-selected={mm === base.getMonth()}
                  disabled={monthBlocked(y, mm, minDate, maxDate)} onClick={() => pick("day", new Date(y, mm, 1))}>
                  {shortMonth.format(new Date(y, mm, 1))}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`drp ${className}`.trim()} style={style} data-dir={dir || undefined}
      onPointerDown={onPointerDown} onPointerUp={onPointerUp}
      // the finger lifts on top of a day; without this the swipe would also pick a date
      onClickCapture={(e) => { if (swiped.current) { e.stopPropagation(); swiped.current = false; } }}>
      {presets?.length ? (
        <div className="drp-presets" role="group" aria-label="Quick ranges">
          {presets.map((p) => {
            const [ps, pe] = p.value;
            const on = !!(start && end && ps && pe && sameDay(start, ps) && sameDay(end, pe));
            return (
              <button type="button" key={p.label} className="drp-preset" aria-pressed={on}
                onClick={() => {
                  // land on the month holding the range's end, so "today" is in view
                  if (pe) { setDir(0); setCursor(addMonths(pe, 1 - shown)); }
                  onChange(p.value);
                }}>
                {p.label}
              </button>
            );
          })}
        </div>
      ) : null}
      {Array.from({ length: shown }, (_, m) => {
        const month = addMonths(cursor, m);
        return (
          <div className="drp-month" key={m}>
            <div className="drp-head">
              <button className="drp-nav" onClick={() => step(-1)} disabled={m > 0 || prevBlocked}
                style={{ visibility: m > 0 ? "hidden" : undefined }} aria-label="Previous month" type="button">‹</button>
              {pickMonth || pickYear ? (
                <button type="button" className="drp-title" onClick={() => { setCol(m); pick(pickMonth ? "month" : "year"); }}
                  aria-label={`${monthName.format(month)}, choose ${pickMonth ? "month" : "year"}`}>
                  <span className={dir ? "drp-anim" : undefined} key={+month} aria-live="polite">{monthName.format(month)}</span>{caret}
                </button>
              ) : (
                <span className={dir ? "drp-anim" : undefined} key={+month} aria-live="polite">{monthName.format(month)}</span>
              )}
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
