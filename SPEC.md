# YoboLabs Mission KPIs — Spec (as built)

Version 2, 2026-07-03. This replaces the original prototype handoff spec and describes the dashboard as it exists in this repo. The original spec lives in git history at commit `b58be0c`.

Live build: https://stevenshkim.github.io/YOBO-Mission-Control/
Repo: `stevenshkim/YOBO-Mission-Control`, branch `claude/build-executive-dashboard-1t0AT`

---

## 1. Purpose

A single-page executive dashboard showing whether YoboLabs is winning across acquisition, activation, revenue, and customer outcome. For the founder, leadership, and investors. Not a customer-facing surface.

Optimized for:
- One mobile screen for the high-level monitor (north star + 3 funnels)
- Scroll-down for diagnostic detail (Customer Success + Campaign Performance)
- Click-to-edit every number for what-if and manual overrides
- Region and period toggles on every section
- Installable on a phone home screen (PWA)

## 2. Current status

| Layer | Status |
|---|---|
| UI, all sections and interactions | Built |
| Period model (MTD, 30D, 90D, QTD) | Built, real per-period data slices |
| Persistence (edits, notes, config) | Built, localStorage |
| Config knobs (ROI multiple, conv thresholds, targets) | Built, editable in place |
| Pace vs target | Built, north star tiles |
| PWA install | Built |
| Live data from source systems | Not built. All numbers are seeded mock data. See section 10. |

## 3. Stack and file map

Vite + React 18 + Tailwind (utility classes only, design is inline styles + CSS vars). No state library, no router. Deploys to GitHub Pages via Actions on push to `main` or the branch above.

```
index.html                     entry, Inter font, manifest + icon links
src/main.jsx                   mount + service worker registration
src/YoboLabsDashboard.jsx      the entire UI, one file on purpose
src/data.js                    seed generation, period model, localStorage
public/manifest.webmanifest    PWA manifest
public/sw.js                   no-cache service worker (install eligibility only)
public/icons/                  192 + 512 icons
.github/workflows/deploy.yml   Pages deploy, BASE_PATH /YOBO-Mission-Control/
```

Gotcha: the Pages URL is case-sensitive. Capital letters as in the repo name.

## 4. Page structure (top to bottom)

```
HEADER      brand, live timestamp, Region toggle (Combined | ID | US),
            Period toggle (MTD | 30D | 90D | QTD)
SECTION 1   North star: ARR, New MRR, Active customers, NRR.
            Each tile: label, big editable number, delta vs prior bucket,
            sparkline, pace line (editable target, pace %, status word)
SECTION 2   Funnels: Acquisition, Activation, Revenue side by side.
            Each card: status dot, stage rows (number, label, editable value,
            44x16 sparkline, conv %), action banner
SECTION 3   Customer Success detail funnel, 6 stages, full rows with source
            caption, stage bar, delta, 60x20 sparkline, end-to-end conv
SECTION 4   Campaign Performance detail funnel, 5 stages, same layout,
            end-user counts formatted in K/M
CONFIG ROW  ROI multiple, Conv good %, Conv bad %, all editable
FOOTER      edit hint, Export JSON, Reset
```

## 5. Funnel definitions

### Acquisition. Are we filling the top?
| # | Stage | Source of truth (when wired) |
|---|---|---|
| 01 | Leads | CRM, top-of-funnel inquiries |
| 02 | MQL | CRM, marketing-qualified, fits ICP |
| 03 | Signups | Product DB, created account |

### Activation. Are new customers reaching first value?
| # | Stage | Source |
|---|---|---|
| 01 | Signups | Product DB |
| 02 | Connected | Shopify + Klaviyo + POS data flowing |
| 03 | First launch | YoboLabs pushed first flow to Klaviyo |
| 04 | First sent | Klaviyo sent at least one message |

First launch means we did our job. First sent means the system works end to end. If launch is high but sent lags, there is an integration or scheduling issue.

### Revenue. Are we paid and proving ROI?
| # | Stage | Source |
|---|---|---|
| 01 | Card on file | Stripe |
| 02 | First payment | Stripe |
| 03 | Nx ROI | Stripe + Shopify attribution. N is the ROI multiple knob, default 3. The stage label updates when the knob changes. |
| 04 | Upgrades | Stripe tier expansion |

### Customer Success. Are paying customers active and getting results?
Scope: paying customers, last 4 weeks, distinct customer-weeks. Stage 01 is a milestone entry so no conv % is shown between 01 and 02.
| # | Stage |
|---|---|
| 01 | First sent (milestone) |
| 02 | Viewed performance |
| 03 | Reviewed or edited |
| 04 | Launched to Klaviyo |
| 05 | Messages sent |
| 06 | Orders generated |

### Campaign Performance. How are end-user funnels performing?
Scope: this month, all campaigns. "Customers" here are end consumers of YoboLabs clients, so counts run 10K to 1M+ and format as K/M.
Targeted, Sent, Opened, Clicked, Ordered.

## 6. Computations

All in `src/YoboLabsDashboard.jsx`.

**Conversion per stage** `conv_i = value_i / value_(i-1) * 100`. Color: green at or above the Conv good knob (default 50), red below the Conv bad knob (default 20), dim otherwise.

**Delta** compares the last two trend buckets. `pct = (curr - prev) / prev * 100`, direction up above +0.5, down below -0.5, else flat. Zero to zero is flat, zero to positive shows "new".

**Pace vs target** (north star tiles). Two metric kinds:
- Flow metrics (New MRR): accrue over the window. `expected = target * elapsed_fraction`, `pace = actual / expected * 100`. Elapsed fraction is day-of-month over days-in-month for MTD, day-of-quarter for QTD, and 1 for rolling 30D/90D windows.
- Stock and ratio metrics (ARR, Active customers, NRR): level vs target directly, `pace = actual / target * 100`.

Status: 110+ ahead, 95+ on track, 80+ watch, below 80 behind. Color only on watch (amber) and behind (red). Green never highlights, calm by default.

**Auto-suggestion** per funnel, in priority order:
1. Any stage at zero while the prior stage is positive: red, "X stalled at zero. Investigate handoff."
2. Weakest conv below Conv bad: red, "A to B only N%. M stuck."
3. Two or more stages declining week over week: amber, "N stages declining. Review A, B."
4. Weakest conv below 40: amber, "A to B at N%. Worth a look."
5. One declining stage: amber, "X trending down. Worth checking."
6. Otherwise green, "Funnel healthy. Nothing to do."

## 7. Region and period model

**Region.** Every sum metric stores `id` and `us`; Combined is always computed as the sum, never stored. Ratio metrics (NRR) store all three explicitly. Editing a number while on Combined splits the new value between ID and US proportionally to the existing ratio (50/50 if both are zero).

**Period.** State holds four full data slices, one per period (`src/data.js`). Switching period switches the slice, so values and sparklines both change. Sparkline buckets: MTD 8, 30D 8, 90D 12, QTD 3. Edits apply to the currently selected period slice only.

## 8. Editing and persistence

- Every number is contenteditable. Enter or blur commits, Escape reverts.
- Parser accepts `1.6M`, `18K`, `$500`, `112%`, raw numbers, commas.
- Action banners: italic auto-suggestion plus an editable override note per funnel. Notes are shared across periods (a note is about the funnel, not the window).
- Persistence: the full state object is written to localStorage key `yobolabs-kpis-v1` after the first edit. Until then the seed stays live so fresh devices always get current seed data. Reset clears storage and restores the seed. Export JSON downloads the full state.
- The `v` field in stored state guards migrations. Bump it when the shape changes and stale stored state will be discarded.

## 9. Config knobs

Editable in the config row above the footer, persisted with everything else:
- ROI multiple (default 3). Drives the Revenue funnel stage label and source caption.
- Conv good % (default 50) and Conv bad % (default 20). Drive all conversion colors and the suggestion thresholds.
- Per-metric targets are edited inline in each north star tile (the Target number in the pace line). Targets split by region the same way values do.

## 10. Mock data, until the data layer lands

`buildSeed()` in `src/data.js` generates everything deterministically (seeded PRNG, no random flicker between reloads).
- Flow metrics accrue with the real calendar: on day 3 of a month, MTD numbers are about 10% of the monthly base. This keeps pace math honest.
- Stock metrics hold their level across periods.
- Base calibration: about $480K ARR, 38 active customers, ID roughly 2x US.

To change seed numbers, edit the templates at the top of `src/data.js` (`NORTH_STAR`, `FUNNELS`) and bump `STATE_VERSION` if the shape changed.

## 11. Visual and voice rules

- Single font: Inter 400/500/600/700. Tabular numerals everywhere.
- Dark palette via CSS vars in `src/index.css`: bg #0a0a0a, panels #131313/#1a1a1a, text #f5f5f5, green #6FED45 (brand, positive), red #ff4d4d, amber #ffb547.
- Color is semantic only. No decorative color.
- Copy: no em dashes, no exclamation marks, no emojis, numbers over adjectives, operator voice. "Acquisition healthy. Nothing to do."
- Brand is always YoboLabs, one word.
- Region and period toggles are segmented controls, never dropdowns.
- Mobile: single column under 720px, north star 2x2, 36px touch targets, toggles scroll horizontally.

## 12. Deploy

Push to `main` or `claude/build-executive-dashboard-1t0AT` triggers `.github/workflows/deploy.yml`: npm ci, vite build with `BASE_PATH=/YOBO-Mission-Control/`, deploy to Pages. Takes about a minute. The service worker does not cache, so a hard refresh always gets the newest deploy.

Local: `npm ci`, `npm run dev` for dev server, `npm run build && npm run preview` for a production check.

## 13. Roadmap

**Phase 1, data layer (next).** Google Sheet holding the raw data model (Acquisition_Daily, Activation_Cohorts, Revenue_Customers, CS_Weekly, Campaign_Performance, Config, Dashboard_Summary). An Apps Script web app returns Dashboard_Summary as JSON matching the state shape in section 7. The dashboard fetches on load with the seed as fallback, and manual edits become patches layered over fetched data instead of whole-state persistence.

**Phase 2, source syncs.** Acquisition_Daily from the CRM, Activation_Cohorts nightly from product DB, Revenue_Customers from Stripe webhooks plus Shopify attribution, CS_Weekly from product analytics, Campaign_Performance nightly from Klaviyo.

**Phase 3, hosting.** `kpis.yobolabs.ai` behind SSO. Needs a DNS and hosting decision.

**Phase 4, action layer.** Every amber or red suggestion feeds a task queue, override notes sync to Notion or Linear, weekly digest email generated from dashboard state.

## 14. QC checklist

After any change, verify on the live URL:
1. Period toggle changes both values and sparkline bucket counts (8/8/12/3).
2. Edit a number on Combined, switch to ID, confirm the proportional share. Reload, confirm it stuck.
3. Write an action note, reload, confirm it stuck. Reset restores seed.
4. Change ROI multiple, confirm the Revenue stage label follows.
5. North star tiles show pace with status coloring only on watch or behind.
6. Phone width: no wrapped numbers, north star 2x2, toggles scroll.
7. No em dashes, exclamation marks, or emojis anywhere in copy.
