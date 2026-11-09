import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { monthGrid, nextRange, inRange, compareDay, toISODate, pattern, yearSpan, monthBlocked, lastDays, lastMonths } from "./calendar.ts";

const d = (s: string) => new Date(s + "T00:00:00");

test("grid is 6 weeks and starts on the chosen weekday", () => {
  const g = monthGrid(d("2026-02-01"), 1); // Feb 2026 starts Sunday
  assert.equal(g.length, 42);
  assert.equal(g[0].getDay(), 1);
  assert.ok(g.some((x) => x.getDate() === 1 && x.getMonth() === 1));
  assert.ok(g.some((x) => x.getDate() === 28 && x.getMonth() === 1));
});

test("second click before the first flips the range", () => {
  const r = nextRange(nextRange([null, null], d("2026-03-10")), d("2026-03-04"));
  assert.deepEqual(r.map(String), [d("2026-03-04"), d("2026-03-10")].map(String));
});

test("a complete range restarts on the next click", () => {
  assert.deepEqual(nextRange([d("2026-03-01"), d("2026-03-05")], d("2026-03-09")), [d("2026-03-09"), null]);
});

test("range includes both endpoints, excludes outside", () => {
  const r: [Date, Date] = [d("2026-03-04"), d("2026-03-10")];
  assert.ok(inRange(d("2026-03-04"), r) && inRange(d("2026-03-10"), r) && inRange(d("2026-03-07"), r));
  assert.ok(!inRange(d("2026-03-03"), r) && !inRange(d("2026-03-11"), r));
});

test("DST day boundaries compare as whole days", () => {
  // 2026-03-08 is the US DST jump; a naive ms-diff /86400000 would round wrong here.
  assert.equal(compareDay(new Date(2026, 2, 8, 23), new Date(2026, 2, 8, 1)), 0);
  assert.ok(compareDay(new Date(2026, 2, 9, 0), new Date(2026, 2, 8, 23)) > 0);
});

test("toISODate keeps the day the user clicked, whatever the timezone", () => {
  const midnight = new Date(2026, 9, 6);             // local midnight, 6 October
  assert.equal(toISODate(midnight), "2026-10-06");
  assert.equal(toISODate(new Date(2026, 9, 6, 23, 59)), "2026-10-06");
  assert.equal(toISODate(new Date(2026, 0, 1)), "2026-01-01");
});

test("pattern fills the tokens and leaves the rest alone", () => {
  const d = new Date(2026, 9, 6); // 6 October 2026 = 6 ตุลาคม 2569
  assert.equal(pattern("DD/MM/YYYY")(d), "06/10/2026");
  assert.equal(pattern("MM/DD/YYYY")(d), "10/06/2026");
  assert.equal(pattern("D/M/BB")(d), "6/10/69");
  assert.equal(pattern("DD/MM/BBBB")(d), "06/10/2569");
  assert.equal(pattern("D MMMM BBBB", "th")(d), "6 ตุลาคม 2569");
  assert.equal(pattern("DDD, D MMM YYYY", "en-GB")(d), "Tue, 6 Oct 2026");
});

test("a month name never gets re-scanned for tokens", () => {
  // "December" and "March" both contain letters that are tokens on their own.
  assert.equal(pattern("MMMM YYYY", "en-GB")(new Date(2026, 11, 1)), "December 2026");
  assert.equal(pattern("MMMM", "en-GB")(new Date(2026, 2, 1)), "March");
});

test("every component that can render on its own injects the stylesheet", () => {
  // DateRangePicker only mounts the calendar once its popover opens, so relying on
  // the calendar to inject left a closed field completely unstyled.
  for (const file of ["DateRangeCalendar.tsx", "DateRangePicker.tsx"]) {
    const src = readFileSync(new URL(file, import.meta.url), "utf8");
    assert.match(src, /injectStyles\(\)/, `${file} never calls injectStyles()`);
  }
});

test("year grid spans min..max, defaults to 1900-2099, always holds the cursor", () => {
  const ys = yearSpan(d("2026-03-01"), d("2024-05-01"), d("2027-01-01"));
  assert.deepEqual(ys, [2024, 2025, 2026, 2027]);
  const all = yearSpan(d("2026-03-01"));
  assert.equal(all[0], 1900);
  assert.equal(all.at(-1), 2099);
  assert.deepEqual(yearSpan(d("2030-01-01"), undefined, d("2026-01-01")).slice(-1), [2030]);
});

test("a month is blocked only when every day of it is out of bounds", () => {
  const min = d("2026-03-15"), max = d("2026-10-05");
  assert.ok(monthBlocked(2026, 1, min, max));    // Feb: all before min
  assert.ok(!monthBlocked(2026, 2, min, max));   // Mar: 15-31 pickable
  assert.ok(!monthBlocked(2026, 9, min, max));   // Oct: 1-5 pickable
  assert.ok(monthBlocked(2026, 10, min, max));   // Nov: all after max
  assert.ok(!monthBlocked(1999, 0));             // no bounds
});

test("presets end today and count it", () => {
  const iso = (r: [Date | null, Date | null]) => r.map((x) => toISODate(x!));
  assert.deepEqual(iso(lastDays(7, d("2026-11-09"))), ["2026-11-03", "2026-11-09"]);
  assert.deepEqual(iso(lastMonths(1, d("2026-11-09"))), ["2026-10-10", "2026-11-09"]);
  assert.deepEqual(iso(lastMonths(6, d("2026-11-09"))), ["2026-05-10", "2026-11-09"]);
  assert.deepEqual(iso(lastMonths(1, d("2026-03-31"))), ["2026-03-01", "2026-03-31"]);
  assert.deepEqual(iso(lastMonths(2, d("2026-01-15"))), ["2025-11-16", "2026-01-15"]);
});
