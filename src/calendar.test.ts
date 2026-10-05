import { test } from "node:test";
import assert from "node:assert/strict";
import { monthGrid, nextRange, inRange, compareDay, toISODate, pattern } from "./calendar.ts";

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
