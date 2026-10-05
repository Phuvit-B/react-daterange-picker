# react-daterange

A date range picker for React that looks like the MUI one, without the licence.
No runtime dependencies, about 10 KB, and there is no CSS file to import — the styles
come along with the component.

```bash
npm i @phuvit-b/daterange
```

```tsx
import { useState } from "react";
import { DateRangePicker, type DateRange } from "@phuvit-b/daterange";

function Booking() {
  const [range, setRange] = useState<DateRange>([null, null]);
  return <DateRangePicker value={range} onChange={setRange} />;
}
```

`DateRangePicker` is the text field that opens a calendar in a popover.
`DateRangeCalendar` is the same calendar on its own, always visible — use that one when
the calendar *is* the page, like a booking screen.

`value` is just `[Date | null, Date | null]`. Nothing is wrapped, nothing is cloned, so
you can hand those dates straight to your API. The component is controlled: whatever you
pass in is what gets drawn.

Click a day to set the start, click another to set the end. If the second click lands
*before* the first, the range flips instead of doing nothing. Clicking again once a range
is complete starts over.

---

## Thai Buddhist years (พ.ศ.)

There is no prop for this, and for Thai there is nothing to configure either:

```tsx
<DateRangePicker value={range} onChange={setRange} locale="th" />
```

```
ตุลาคม 2569          6 ต.ค. 2569 – 14 ต.ค. 2569
```

Buddhist *is* the default calendar for the Thai locale, so `"th"` already gives you
พ.ศ. — in the header, in the field, and in the screen-reader labels. Don't be tempted to
do `year + 543` yourself; you'd fix the header and quietly break the other two.

### The long version, and when you actually need it

Locales here are plain [BCP-47 tags](https://www.rfc-editor.org/info/bcp47), the same ones
`Intl` takes. They look busy because anything past the language is optional extra:

```
th  -  TH  -  u  -  ca  -  buddhist
│      │      │      │      └─ the value
│      │      │      └──────── the setting: ca = calendar
│      │      └─────────────── "extras start here"
│      └────────────────────── region
└───────────────────────────── language
```

You only reach for the extras when the default isn't what you want:

| | |
|---|---|
| `th` | พ.ศ., Thai month names — what you want 95% of the time |
| `en-TH-u-ca-buddhist` | พ.ศ. with English months: `Oct 8, 2569 BE` |
| `th-u-ca-gregory` | Thai months but ค.ศ.: `8 ต.ค. 2026` |
| `th-u-nu-thai` | Thai digits: `๘ ต.ค. ๒๕๖๙` |

Stack them with more dashes (`th-u-ca-gregory-nu-thai`) and leave the region out unless it
changes something — `th` and `th-TH` behave identically here.

Same idea for everyone else: `ja-JP-u-ca-japanese` gives Reiwa years, `ar-SA` defaults to
the Islamic calendar on its own.

If you want a Thai *font* as well, that's a normal CSS variable, not a locale:

```css
.thai { --drp-font: "Noto Sans Thai", system-ui, sans-serif; }
```

```tsx
<DateRangePicker value={range} onChange={setRange} locale="th" className="thai" />
```

---

## Making it look like yours

Every colour, size, radius and timing is a CSS variable named `--drp-*`. The defaults sit
on `:root`, which matters more than it sounds: any declaration closer to the component wins
automatically, so you never fight specificity and you never need `!important`.

Three ways to set them, all equivalent — pick whichever fits where you work:

```tsx
// 1. a class, for a theme you'll reuse
<DateRangeCalendar className="brand" ... />

// 2. the style prop, for a one-off
<DateRangeCalendar style={{ "--drp-accent": "#e91e63" } as CSSProperties} ... />

// 3. any wrapper above it, to theme a whole section at once
<div style={{ "--drp-accent": "#e91e63" } as CSSProperties}><DateRangePicker ... /></div>
```

**One thing to watch.** Dark mode works by redefining these same variables from
`prefers-color-scheme`. So if you override a background — `--drp-surface` or `--drp-band` —
set `--drp-text` and `--drp-muted` too. Otherwise your light pink range band keeps the dark
theme's white digits and nobody can read the dates. Set the whole group and you've pinned
your theme to one appearance in both modes, which is usually what a branded picker wants.

### Themes you can paste

All four are in [`demo/themes.css`](demo/themes.css), and the demo renders them so you can
see them before you commit.

**Square and flat.** Corners off, brand green.

```css
.theme-square {
  --drp-accent: #0f9d58;
  --drp-accent-contrast: #fff;
  --drp-band: #e2f3ea;
  --drp-surface: #fff;
  --drp-text: #14341f;
  --drp-muted: #8aa394;
  --drp-day-radius: 2px;
  --drp-radius: 2px;
  --drp-panel-radius: 2px;
}
```

**Compact.** For a sidebar or a toolbar, where three months have to fit. Smaller cells, and
a quicker animation to match — a slow slide feels sluggish once things are small.

```css
.theme-compact {
  --drp-cell: 28px;
  --drp-day: 24px;
  --drp-gap: 14px;
  --drp-radius: 5px;
  --drp-duration: .14s;
  --drp-slide: 14px;
}
```

**Always dark.** Ignores the OS setting, because it names every colour.

```css
.theme-night {
  --drp-accent: #c084fc;
  --drp-accent-contrast: #1a1125;
  --drp-band: #32204a;
  --drp-surface: #171022;
  --drp-text: #ede6f7;
  --drp-muted: #8b7da3;
  --drp-border: #3b2d4f;
  --drp-hover: rgba(255, 255, 255, .09);
  --drp-shadow: 0 10px 34px rgba(0, 0, 0, .6);
}
```

**Roomy.** Big tap targets, serif, and `--drp-slide: 0` to keep the cross-fade but drop the
sideways movement.

```css
.theme-roomy {
  --drp-accent: #b45309;
  --drp-band: #fdf0dd;
  --drp-surface: #fffdf9;
  --drp-text: #3a2a15;
  --drp-muted: #b09877;
  --drp-cell: 52px;
  --drp-day: 46px;
  --drp-gap: 40px;
  --drp-panel-radius: 20px;
  --drp-slide: 0;
  --drp-duration: .35s;
  --drp-font: Georgia, "Times New Roman", serif;
}
```

### Porting a theme you already have

If your app keeps its colours in one place, the theme is mostly a copy job. Here is one
built from a real project's `theme.json`, token names kept in the comments so the next
person can trace each value back:

```css
.well {
  --drp-accent: #5c26ce;            /* COLORS.BLUE_1  — the brand purple */
  --drp-accent-contrast: #ffffff;   /* COLORS.WHITE_1 */
  --drp-band: #e3edff;              /* COLORS.BLUE_3 */
  --drp-band-text: #1751ae;         /* COLORS.BLUE_4 */
  --drp-surface: #ffffff;           /* COLORS.WHITE_1 */
  --drp-text: #000000;              /* COLORS.BLACK_1 */
  --drp-muted: #b3b3b3;             /* COLORS.GRAY_4 */
  --drp-border: #f2f2f2;            /* COLORS.GRAY_1 */
  --drp-shadow: 1px 1px 6px 0 #e7e7e7;   /* COLORS.GRAY_3 */
  --drp-font: "Noto Sans Thai", "Poppins", sans-serif;
  --drp-panel-radius: 20px;
  --drp-day-radius: 10px;
  --drp-radius: 10px;
  --drp-field-radius: 20px;              /* .control is 40px tall — a capsule */
  --drp-field-padding: 9px 30px 9px 20px;
  --drp-field-text: #5c26ce;             /* COLORS.BLUE_1 — a filled field is coloured */
}
```

```tsx
<DateRangePicker ... className="well" locale="th" format={pattern("DD/MM/BBBB")} />
```

The full version, plus a dark variant built from the same tokens, is in
[`demo/theme-well.css`](demo/theme-well.css).

### The full list

| Variable | Default (light) | What it paints |
|---|---|---|
| `--drp-accent` | `#1976d2` | the selected day, and the focus ring |
| `--drp-accent-contrast` | `#fff` | the number on top of the selected day |
| `--drp-band` | `#e3f0fb` | the stripe behind the days in between |
| `--drp-band-text` | inherits `--drp-text` | day numbers sitting on that stripe |
| `--drp-highlight` | `#1976d2` | the mark on a highlighted day |
| `--drp-surface` | `#fff` | the panel and the text field |
| `--drp-text` | `#1c1b1f` | day numbers, month name |
| `--drp-muted` | `#9aa0a6` | weekday letters, disabled days, arrows at rest |
| `--drp-border` | `#c4c4c4` | the field's outline |
| `--drp-field-width` | `230px` | `100%` to fill its column, whether or not a date is picked |
| `--drp-field-radius` | `6px` | the field's corners — raise it to half the height for a capsule |
| `--drp-field-padding` | `10px 12px` | the field's padding, and so its height |
| `--drp-field-text` | inherits `--drp-text` | the chosen dates in the field; the placeholder is always `--drp-muted` |
| `--drp-hover` | `rgba(0,0,0,.06)` | arrow hover |
| `--drp-shadow` | `0 8px 28px rgba(0,0,0,.18)` | the popover |
| `--drp-font` | `system-ui, …` | everything |
| `--drp-cell` | `38px` | one grid square |
| `--drp-day` | `32px` | the circle inside that square |
| `--drp-day-radius` | `50%` | `4px` or so gives you squares |
| `--drp-nav-size` | `32px` | the ‹ › buttons; the glyph scales with it |
| `--drp-radius` | `8px` | the rounded ends of the range stripe |
| `--drp-panel-radius` | `12px` | the panel's own corners |
| `--drp-gap` | `28px` | space between two months |
| `--drp-slide` | `26px` | how far a new month slides in; `0` to just fade |
| `--drp-duration` | `.22s` | how long that takes |

---

## Marking days

Days worth pointing out — appointments, holidays, the ones that are already booked — take a
small dot under the number:

```tsx
<DateRangeCalendar
  value={range}
  onChange={setRange}
  highlightDates={appointments}        // Date[], or (day) => boolean
  highlightLabel="has an appointment"  // read out after the date
/>
```

The dot follows `--drp-highlight`, and turns the contrast colour when it lands on a selected
day so it doesn't vanish into the accent fill. Pass `highlightIcon` to draw your own node
there instead.

A mark that only exists visually is invisible to a screen reader, which is why
`highlightLabel` is there: give it and the day announces "Friday 9 October 2026, has an
appointment". Leave it out and the mark stays decorative, which is the right call only when
the same information is somewhere else on the page.

Highlighting says "look at this"; it doesn't stop anyone picking the day. To do that, use
`shouldDisableDate` — the two are separate on purpose, since a day with an appointment is
often still selectable.

## An icon in the field

```tsx
<DateRangePicker value={range} onChange={setRange} icon={<CalendarIcon />} />
```

Anything React can render. The field is a flex row, so the icon sits at the trailing edge
and the text ellipsises before it rather than pushing it out — your theme's padding doesn't
have to leave a hole for it.

---

## The text in the field

By default the field uses `Intl.DateTimeFormat.formatRange`, which quietly drops whatever
the two dates have in common:

```
6–14 ต.ค. 2569                 not   6 ต.ค. 2569 – 14 ต.ค. 2569
28 ต.ค. – 3 พ.ย. 2569          when they straddle a month
28 ธ.ค. 2569 – 3 ม.ค. 2570     when they straddle a year
```

To change the style, hand `format` the same options `Intl` takes. You keep the collapsing:

```tsx
<DateRangePicker ... format={{ dateStyle: "full" }} />
// Tuesday, October 6 – Wednesday, October 14, 2026

<DateRangePicker ... locale="th" format={{ day: "2-digit", month: "2-digit", year: "numeric" }} />
// 6–14/10/2569
```

Note these *replace* the default rather than merging with it — `Intl` throws if `dateStyle`
turns up next to `day`/`month`/`year`, so pick one approach per call.

Or pass a function and write the endpoint yourself. You lose the collapsing, since at that
point only you know what the string means:

```tsx
<DateRangePicker ... format={(d) => `${d.getDate()}/${d.getMonth() + 1}`} />
// 6/10 – 14/10
```

### MM/DD/YYYY, DD/MM/BBBB, and friends

Intl decides the order and the separators from the locale, which is usually right and
occasionally not what the form next to it is doing. When you need the exact layout, build
the function from a pattern:

```tsx
import { pattern } from "@phuvit-b/daterange";

<DateRangePicker ... format={pattern("DD/MM/BBBB")} />            // 06/10/2569 – 14/10/2569
<DateRangePicker ... format={pattern("MM/DD/YYYY")} />            // 10/06/2026 – 10/14/2026
<DateRangePicker ... format={pattern("D MMMM BBBB", "th")} />     // 6 ตุลาคม 2569 – 14 ตุลาคม 2569
<DateRangePicker ... format={pattern("DDD, D MMM YYYY", "en-GB")} />  // Tue, 6 Oct 2026 – ...
```

| | |
|---|---|
| `YYYY` `YY` | 2026, 26 |
| `BBBB` `BB` | 2569, 69 — Buddhist, the one place `+543` is the right answer |
| `MMMM` `MMM` | ตุลาคม, ต.ค. — from the locale you pass as the second argument |
| `MM` `M` | 10, 10 |
| `DDDD` `DDD` | วันอังคาร, อ. |
| `DD` `D` | 06, 6 |

Anything that isn't a token is copied through, so slashes, dots and Thai words all survive.
The catch is the reverse: a literal English letter that happens to be a token gets eaten —
`pattern("D of MMMM")` would mangle the "o"-less bits of "of". Reach for a plain function
if you need literal text that collides.

`pattern` is a separate import, not a prop, so it disappears from your bundle if you
don't use it.

### Sending the dates somewhere

`value` holds plain `Date` objects, so they're ready for your API as-is — but if you need
`YYYY-MM-DD`, use the helper rather than `toISOString()`:

```tsx
import { toISODate } from "@phuvit-b/daterange";

fetch(`/bookings?from=${toISODate(start)}&to=${toISODate(end)}`);
```

`toISOString().slice(0, 10)` *looks* like it does the same thing, and it's wrong for half
the planet. The dates here are local midnight; `toISOString` converts to UTC first, so
anyone east of Greenwich gets yesterday. Someone in Bangkok picks 6 October and books the
5th. The helper reads the year, month and day the visitor actually sees.

---

## Props

Both components take these:

| Prop | Default | |
|---|---|---|
| `value` | — | `[Date \| null, Date \| null]` |
| `onChange` | — | called with the next pair on every click |
| `months` | `2` | how many months side by side |
| `locale` | the browser's | a BCP-47 tag, e.g. `"th"` or `"en-GB"` |
| `weekStartsOn` | `0` | `0` is Sunday, `1` is Monday |
| `minDate` / `maxDate` | — | days outside are struck through and unclickable |
| `shouldDisableDate` | — | `(day) => boolean`, for blocking weekends or booked dates |
| `highlightDates` | — | `Date[]`, or `(day) => boolean`, for days worth marking |
| `highlightIcon` | a dot | any node to draw on a marked day instead |
| `highlightLabel` | — | what the mark means, for screen readers |
| `defaultMonth` | `value[0]`, else today | which month opens first |
| `className` / `style` | — | land on the root element |

And `DateRangePicker` adds:

| Prop | Default | |
|---|---|---|
| `placeholder` | `"Select date range"` | shown before anything is picked |
| `format` | `{ dateStyle: "medium" }` | Intl options, or `(date) => string` — see above |
| `closeOnComplete` | `true` | shut the popover once both ends are set |
| `icon` | — | a node at the trailing edge of the field |

```tsx
// no weekends, and only within the next two months
<DateRangeCalendar
  value={range}
  onChange={setRange}
  shouldDisableDate={(d) => d.getDay() === 0 || d.getDay() === 6}
  minDate={new Date()}
  maxDate={new Date(Date.now() + 60 * 864e5)}
/>
```

---

## Moving between months

The arrows do the obvious thing, and the new month slides in from whichever side you came
from, over 220ms. If the visitor has asked their system to reduce motion, nothing moves.

On a phone or tablet you can also swipe the calendar sideways — left for the next month,
right for the previous. Three things it deliberately doesn't do: it ignores a mouse drag
(on a desktop that's a text selection, not a gesture), it ignores a swipe that's more
vertical than horizontal so the page can still scroll, and it swallows the click that
lands at the end of a swipe, so your finger coming to rest on the 14th doesn't book it.

## On a small screen

Below 560px the calendar drops to a single month whatever you passed to `months`, because
two months side by side don't fit and stacking them turns the picker into a page you have
to scroll. Swiping makes the second month a flick away, so nothing is lost. Widen the
window and the extra months come straight back.

Day sizes are capped against the viewport at the same time, so a generous theme can't push
the calendar off the edge of a phone — `min()` leaves a theme alone until it stops fitting,
rather than overriding its variables, which would lose the fight with your own stylesheet
anyway.

On touch screens each day's tap area quietly grows to 44px even when the circle you see is
32px, or 24px in a compact theme. Nothing moves; the target is just bigger than the paint.

Tab moves through the days and the arrows, Escape closes the popover, clicking outside does
too. Every day carries a full spoken date as its label, so a screen reader reads
"Thursday 8 October 2026", not "8".

## Running it locally

```bash
npm run dev      # the demo, with every theme and format above, at :5173
npm test         # the date arithmetic, including the DST and timezone edge cases
npm run build
```

## What it doesn't do

Times, presets like "last 7 days", multiple separate ranges, or arrow-key navigation inside
the grid. Some of those are a few lines on top of what's here; none of them were needed yet.

MIT
