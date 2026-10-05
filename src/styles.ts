// ponytail: one injected <style> instead of a .css file, so consumers need no bundler config.
// Defaults live on :root so ANY closer declaration wins by inheritance — set --drp-* on the
// component (style prop), on a wrapper, or in your own stylesheet. No specificity fights.
const css = `
:root{
  --drp-font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --drp-accent:#1976d2;--drp-accent-contrast:#fff;--drp-band:#e3f0fb;
  --drp-surface:#fff;--drp-text:#1c1b1f;--drp-muted:#9aa0a6;--drp-border:#c4c4c4;
  --drp-hover:rgba(0,0,0,.06);--drp-shadow:0 8px 28px rgba(0,0,0,.18);
  --drp-slide:26px;--drp-duration:.22s;--drp-nav-size:32px;
  --drp-field-radius:6px;--drp-field-padding:10px 12px;--drp-field-width:230px;
  --drp-highlight:#1976d2;
  --drp-cell:38px;--drp-day:32px;--drp-day-radius:50%;--drp-radius:8px;--drp-panel-radius:12px;--drp-gap:28px;
}
@media (prefers-color-scheme:dark){:root{
  --drp-band:#1b3550;--drp-surface:#1f1f1f;--drp-text:#e8e8e8;--drp-muted:#8a8f94;
  --drp-border:#4a4a4a;--drp-hover:rgba(255,255,255,.08);--drp-highlight:#64b5f6;--drp-shadow:0 8px 28px rgba(0,0,0,.5);
}}
.drp{display:inline-flex;gap:var(--drp-gap);padding:12px;background:var(--drp-surface);color:var(--drp-text);
  border-radius:var(--drp-panel-radius);font:14px/1.4 var(--drp-font);-webkit-user-select:none;user-select:none;touch-action:pan-y}
.drp-month{display:flex;flex-direction:column;gap:6px;overflow:hidden}
/* Slide-in only: the outgoing month would need a second copy in the DOM to animate out. */
@keyframes drp-slide{from{opacity:0;transform:translateX(var(--drp-from,0))}}
.drp-anim{animation:drp-slide var(--drp-duration) cubic-bezier(.2,.6,.3,1)}
.drp[data-dir="1"]{--drp-from:var(--drp-slide)}
.drp[data-dir="-1"]{--drp-from:calc(-1 * var(--drp-slide))}
@media (prefers-reduced-motion:reduce){.drp-anim{animation:none}}
.drp-head{display:flex;align-items:center;justify-content:space-between;min-height:var(--drp-nav-size);font-weight:600}
.drp-nav{all:unset;cursor:pointer;width:var(--drp-nav-size);height:var(--drp-nav-size);border-radius:50%;
  display:grid;place-items:center;color:var(--drp-muted);font-size:calc(var(--drp-nav-size) * .72);line-height:1}
.drp-nav:hover{background:var(--drp-hover);color:var(--drp-text)}
.drp-nav:disabled{opacity:.3;cursor:default;background:none}
.drp-nav:focus-visible,.drp-day:focus-visible{outline:2px solid var(--drp-accent);outline-offset:-2px}
.drp-grid{display:grid;grid-template-columns:repeat(7,var(--drp-cell))}
.drp-dow{height:28px;display:grid;place-items:center;color:var(--drp-muted);font-size:12px}
.drp-cell{position:relative;height:var(--drp-cell);display:grid;place-items:center}
.drp-cell.in::before{content:"";position:absolute;inset:3px 0;background:var(--drp-band)}
.drp-cell.in.s::before{border-radius:var(--drp-radius) 0 0 var(--drp-radius);left:3px}
.drp-cell.in.e::before{border-radius:0 var(--drp-radius) var(--drp-radius) 0;right:3px}
.drp-day{all:unset;position:relative;cursor:pointer;width:var(--drp-day);height:var(--drp-day);
  border-radius:var(--drp-day-radius);display:grid;place-items:center;font-variant-numeric:tabular-nums}
.drp-day:hover:not(:disabled){box-shadow:inset 0 0 0 1px var(--drp-accent)}
.drp-day[aria-selected="true"]{background:var(--drp-accent);color:var(--drp-accent-contrast);font-weight:600}
.drp-cell.in .drp-day:not([aria-selected="true"]){color:var(--drp-band-text,inherit)}
.drp-day:disabled{color:var(--drp-muted);cursor:default;text-decoration:line-through}
.drp-day.out{visibility:hidden}
/* A 32px circle is a small target for a thumb. Grow the hit area to 44px without moving
   anything: min(0px,...) means a theme with big days is left alone. */
@media (pointer:coarse){.drp-day::after{content:"";position:absolute;inset:min(0px,calc((var(--drp-day) - 44px) / 2))}}
.drp-day.today:not([aria-selected="true"]){box-shadow:inset 0 0 0 1px var(--drp-muted)}
/* A marked day: a dot by default, or whatever node was handed in, tucked under the number. */
.drp-day.hl::before{content:"";position:absolute;bottom:2px;left:50%;translate:-50% 0;
  width:4px;height:4px;border-radius:50%;background:var(--drp-highlight)}
.drp-day .drp-mark{position:absolute;bottom:0;left:50%;translate:-50% 0;display:flex;
  line-height:1;font-size:9px;color:var(--drp-highlight);pointer-events:none}
.drp-day .drp-mark svg{width:9px;height:9px;display:block}
.drp-day[aria-selected="true"].hl::before,.drp-day[aria-selected="true"] .drp-mark{color:var(--drp-accent-contrast);background:var(--drp-accent-contrast)}
/* The width lives on the wrapper: an inline-block with no width shrinks to whatever
   text is inside, so an empty field would be narrower than a filled one. */
.drp-field{position:relative;display:inline-block;width:var(--drp-field-width);font:14px/1.4 var(--drp-font)}
/* Flex rather than an absolutely placed icon: the gap does the spacing, so a theme's
   padding never has to leave room for it. */
.drp-input{width:100%;box-sizing:border-box;padding:var(--drp-field-padding);border:1px solid var(--drp-border);
  border-radius:var(--drp-field-radius);background:var(--drp-surface);cursor:pointer;font:inherit;
  color:var(--drp-field-text,var(--drp-text));display:flex;align-items:center;gap:8px}
.drp-value{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.drp-field-icon{flex:none;display:flex;color:var(--drp-muted)}
.drp-field-icon svg{display:block;width:1em;height:1em}
/* A placeholder that looks exactly like a value is a small lie; mute it until there is one. */
.drp-input[data-empty]{color:var(--drp-muted)}
.drp-input:hover{border-color:var(--drp-text)}
.drp-input:focus-visible{outline:2px solid var(--drp-accent);outline-offset:1px}
.drp-pop{position:absolute;z-index:10;top:calc(100% + 6px);left:0;border-radius:var(--drp-panel-radius);
  background:var(--drp-surface);box-shadow:var(--drp-shadow)}
/* Cap at the point of use, not on --drp-cell: a theme's own value would win over ours
   and overflow the screen. min() leaves generous themes alone until they don't fit. */
@media (max-width:560px){
  .drp{--drp-gap:16px;padding:8px}
  .drp-grid{grid-template-columns:repeat(7,min(var(--drp-cell),12vw))}
  .drp-day{width:min(var(--drp-day),11vw);height:min(var(--drp-day),11vw)}
  .drp-field{width:100%}
}
`;
let done = false;
export function injectStyles() {
  if (done || typeof document === "undefined") return;
  done = true;
  // Prepended so the defaults lose to any stylesheet the app already loaded.
  document.head.prepend(Object.assign(document.createElement("style"), { textContent: css }));
}
