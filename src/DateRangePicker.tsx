import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DateRangeCalendar, type DateRangeCalendarProps } from "./DateRangeCalendar";
import { injectStyles } from "./styles";
import type { DateRange } from "./calendar";

export type DateRangePickerProps = DateRangeCalendarProps & {
  placeholder?: string;
  /**
   * Field text. Pass Intl options to restyle the date and keep the smart range
   * collapsing ("6–14 ต.ค. 2569"), or a function to take over the endpoint entirely.
   */
  format?: Intl.DateTimeFormatOptions | ((d: Date) => string);
  /** Close the popover as soon as both ends are picked. Default true. */
  closeOnComplete?: boolean;
  /** Drawn at the trailing edge of the field — a calendar glyph, your own SVG, anything. */
  icon?: ReactNode;
};

export function DateRangePicker({
  placeholder = "Select date range",
  format,
  closeOnComplete = true,
  icon,
  className = "",
  style,
  ...calendar
}: DateRangePickerProps) {
  injectStyles();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const custom = typeof format === "function" ? format : undefined;
  // Replace the defaults rather than merging them: Intl rejects dateStyle next to day/month/year.
  const opts: Intl.DateTimeFormatOptions = typeof format === "object" ? format : { dateStyle: "medium" };
  const dtf = useMemo(
    () => new Intl.DateTimeFormat(calendar.locale, opts),
    // Inline options objects are new every render; compare by value or we rebuild Intl each time.
    [calendar.locale, JSON.stringify(opts)]
  );

  const [start, end] = calendar.value;
  const one = custom ?? ((d: Date) => dtf.format(d));
  // formatRange drops what both ends share: "6–14 ต.ค. 2569" rather than printing the month twice.
  const label = !start
    ? placeholder
    : !end
      ? `${one(start)} – …`
      : custom
        ? `${custom(start)} – ${custom(end)}`
        : dtf.formatRange(start, end);

  const handleChange = (next: DateRange) => {
    calendar.onChange(next);
    if (closeOnComplete && next[0] && next[1]) setOpen(false);
  };

  return (
    <div className={`drp-field ${className}`.trim()} style={style} ref={root}>
      <button type="button" className="drp-input" onClick={() => setOpen((o) => !o)}
        data-empty={start ? undefined : ""} aria-haspopup="dialog" aria-expanded={open}>
        <span className="drp-value">{label}</span>
        {icon ? <span className="drp-field-icon" aria-hidden>{icon}</span> : null}
      </button>
      {open && (
        <div className="drp-pop" role="dialog" aria-label="Choose date range">
          <DateRangeCalendar {...calendar} onChange={handleChange} />
        </div>
      )}
    </div>
  );
}
