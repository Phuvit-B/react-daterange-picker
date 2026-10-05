import { createRoot } from "react-dom/client";
import { useState, type CSSProperties } from "react";
import { DateRangeCalendar, DateRangePicker, pattern, toISODate, type DateRange } from "../src";
import "./themes.css";
import "./theme-well.css";

// Buddhist is the default calendar for Thai, so plain "th" already shows พ.ศ.
const TH = "th";

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

function Demo({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}

function App() {
  const [a, setA] = useState<DateRange>([null, null]);
  const [b, setB] = useState<DateRange>([new Date(2026, 9, 6), new Date(2026, 9, 14)]);
  const noWeekends = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
  // pretend these came back from an API
  const booked = [9, 10, 13, 20, 21].map((n) => new Date(2026, 9, n));

  return (
    <>
      <Demo title='--drp-field-width: 100% in a 420px column — empty vs filled must match'>
        <div style={{ width: 420, display: "grid", gap: 10 }}>
          <DateRangePicker value={[null, null]} onChange={() => {}}
            style={{ "--drp-field-width": "100%" } as CSSProperties} />
          <DateRangePicker value={b} onChange={setB}
            style={{ "--drp-field-width": "100%" } as CSSProperties} />
        </div>
      </Demo>

      <Demo title="Default">
        <DateRangePicker value={a} onChange={setA} />
      </Demo>

      <Demo title='พ.ศ. — locale="th" + .theme-thai'>
        <DateRangePicker value={b} onChange={setB} locale={TH}
          className="theme-thai" placeholder="เลือกช่วงวันที่" />
      </Demo>

      <Demo title='ค.ศ. with Thai months — locale="th-u-ca-gregory"'>
        <DateRangePicker value={b} onChange={setB} locale="th-u-ca-gregory"
          className="theme-thai" placeholder="เลือกช่วงวันที่" />
      </Demo>

      <Demo title='Thai digits — locale="th-u-nu-thai"'>
        <DateRangePicker value={b} onChange={setB} locale="th-u-nu-thai"
          className="theme-thai" placeholder="เลือกช่วงวันที่" />
      </Demo>

      <Demo title='format={{ dateStyle: "full" }}'>
        <DateRangePicker value={b} onChange={setB} format={{ dateStyle: "full" }} />
      </Demo>

      <Demo title='format={{ day: "2-digit", month: "2-digit", year: "numeric" }}'>
        <DateRangePicker value={b} onChange={setB} locale={TH} className="theme-thai"
          format={{ day: "2-digit", month: "2-digit", year: "numeric" }} />
      </Demo>

      <Demo title='format={pattern("DD/MM/BBBB")}'>
        <DateRangePicker value={b} onChange={setB} locale={TH} className="theme-thai"
          format={pattern("DD/MM/BBBB")} />
      </Demo>

      <Demo title={'format={pattern("D MMMM BBBB", "th")}'}>
        <DateRangePicker value={b} onChange={setB} locale={TH} className="theme-thai"
          format={pattern("D MMMM BBBB", "th")} />
      </Demo>

      <Demo title='format={pattern("MM/DD/YYYY")}'>
        <DateRangePicker value={b} onChange={setB} format={pattern("MM/DD/YYYY")} />
      </Demo>

      <Demo title="format={toISODate}">
        <DateRangePicker value={b} onChange={setB} format={toISODate} />
      </Demo>

      <Demo title=".well — built from well-dtm-provider-portal/src/styles/theme.json">
        <DateRangePicker value={b} onChange={setB} locale={TH} className="well"
          placeholder="ระบุวันที่" format={pattern("DD/MM/BBBB")} />
      </Demo>

      <Demo title="highlightDates — a dot on days with appointments">
        <DateRangeCalendar value={b} onChange={setB} locale={TH} className="well" months={1}
          highlightDates={booked} highlightLabel="มีนัดหมาย" />
      </Demo>

      <Demo title="highlightIcon — your own node instead of the dot">
        <DateRangeCalendar value={b} onChange={setB} locale={TH} className="well" months={1}
          highlightDates={booked} highlightIcon={<span>●</span>} highlightLabel="มีนัดหมาย"
          style={{ "--drp-highlight": "#fd6203" } as CSSProperties} />
      </Demo>

      <Demo title="highlightDates as a test — every Sunday">
        <DateRangeCalendar value={b} onChange={setB} locale={TH} className="well" months={1}
          highlightDates={(d) => d.getDay() === 0} highlightLabel="วันหยุด"
          style={{ "--drp-highlight": "#d2371d" } as CSSProperties} />
      </Demo>

      <Demo title="icon — a node at the trailing edge of the field">
        <DateRangePicker value={b} onChange={setB} locale={TH} className="well"
          placeholder="ระบุวันที่" format={pattern("DD/MM/BBBB")} icon={<CalendarIcon />} />
      </Demo>

      <Demo title=".well — inline calendar">
        <DateRangeCalendar value={b} onChange={setB} locale={TH} className="well" />
      </Demo>

      <Demo title=".well-dark — the same tokens, dark">
        <DateRangeCalendar value={b} onChange={setB} locale={TH} className="well-dark" months={1} />
      </Demo>

      <Demo title=".theme-square">
        <DateRangeCalendar value={b} onChange={setB} className="theme-square" weekStartsOn={1} />
      </Demo>

      <Demo title=".theme-compact">
        <DateRangeCalendar value={b} onChange={setB} className="theme-compact" months={3} />
      </Demo>

      <Demo title=".theme-night — pinned dark">
        <DateRangeCalendar value={b} onChange={setB} className="theme-night" />
      </Demo>

      <Demo title=".theme-roomy — no slide, serif">
        <DateRangeCalendar value={b} onChange={setB} className="theme-roomy" months={1} />
      </Demo>

      <Demo title="One-off override with the style prop">
        <DateRangeCalendar value={b} onChange={setB} months={1}
          style={{ "--drp-accent": "#e91e63", "--drp-band": "#fde4ed",
                   "--drp-surface": "#fff", "--drp-text": "#2b1620" } as CSSProperties} />
      </Demo>

      <Demo title="Weekends disabled, next 60 days only">
        <DateRangeCalendar value={a} onChange={setA} months={1} shouldDisableDate={noWeekends}
          minDate={new Date()} maxDate={new Date(Date.now() + 60 * 864e5)} />
      </Demo>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
