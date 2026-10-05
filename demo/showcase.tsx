import { createRoot } from "react-dom/client";
import { useState, type CSSProperties } from "react";
import { DateRangeCalendar, DateRangePicker, pattern, type DateRange } from "../src";
import "./themes.css";
import "./theme-well.css";

// One framed screenshot per ?shot= value, so each README image crops itself.
const shot = new URLSearchParams(location.search).get("shot") ?? "hero";

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <rect x="3" y="5" width="18" height="16" rx="4" /><path d="M8 3v4M16 3v4M3 10h18" />
  </svg>
);

const RANGE: DateRange = [new Date(2026, 9, 6), new Date(2026, 9, 20)];
const BOOKED = [9, 13, 22, 23].map((n) => new Date(2026, 9, n));

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card"><h3>{title}</h3>{children}</div>;
}

function App() {
  const [a, setA] = useState<DateRange>(RANGE);
  const [b, setB] = useState<DateRange>(RANGE);
  const [c, setC] = useState<DateRange>([new Date(2026, 9, 6), null]);

  if (shot === "themes")
    return (
      <div className="shot"><div className="row">
        <Card title="default"><DateRangeCalendar value={a} onChange={setA} months={1} /></Card>
        <Card title=".theme-square"><DateRangeCalendar value={b} onChange={setB} months={1} className="theme-square" /></Card>
        <Card title=".theme-night"><DateRangeCalendar value={c} onChange={setC} months={1} className="theme-night" /></Card>
      </div></div>
    );

  if (shot === "thai")
    return (
      <div className="shot">
        <div className="row">
          <Card title='locale="th" — พ.ศ.'>
            <DateRangeCalendar value={a} onChange={setA} months={1} locale="th"
              style={{ "--drp-font": '"Noto Sans Thai", sans-serif' } as CSSProperties}
              highlightDates={BOOKED} highlightLabel="มีนัดหมาย" />
          </Card>
          <Card title="field + icon + pattern()">
            <div style={{ display: "grid", gap: 14, paddingTop: 4 }}>
              <DateRangePicker value={a} onChange={setA} locale="th" icon={<CalendarIcon />}
                format={pattern("DD/MM/BBBB")} style={{ "--drp-font": '"Noto Sans Thai", sans-serif' } as CSSProperties} />
              <DateRangePicker value={[null, null]} onChange={() => {}} locale="th"
                placeholder="เลือกช่วงวันที่" icon={<CalendarIcon />}
                style={{ "--drp-font": '"Noto Sans Thai", sans-serif' } as CSSProperties} />
            </div>
          </Card>
        </div>
      </div>
    );

  return (
    <div className="shot">
      <DateRangeCalendar value={a} onChange={setA} weekStartsOn={1} />
      <DateRangePicker value={a} onChange={setA} icon={<CalendarIcon />}
        style={{ "--drp-field-width": "360px" } as CSSProperties} />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
