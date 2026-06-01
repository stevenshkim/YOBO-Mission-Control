# YoboLabs Mission KPIs — Build Spec

This document is the source of truth for the YoboLabs executive KPI dashboard. Hand it to Claude Code at the start of a build session, or commit it to the repo as `SPEC.md`.

Two prototypes exist:
1. `yobolabs-dashboard.html` — interactive HTML prototype (vanilla JS, single file, in-memory data)
2. `yobolabs-dashboard-data.xlsx` — data model and formula layer (8 sheets)

The goal is a production build that pulls live data from internal systems into the dashboard structure proven in the prototype.

---

## 1. Purpose

A single-page executive dashboard showing whether YoboLabs is winning across acquisition, activation, revenue, and customer outcome. Optimized for:

- One mobile screen for the high-level monitor (3 funnels + north star)
- Scroll-down for the diagnostic detail (CS + Campaign Performance)
- Click-to-edit every number for what-if and manual overrides
- ID / US / Combined region toggle on every section

This dashboard is for the founder, leadership, and investors. It is NOT a customer-facing surface and follows internal voice rules (no marketing copy).

---

## 2. Page structure (top to bottom)

```
HEADER
  Brand + live timestamp
  Region toggle: Combined | ID | US
  Period toggle: MTD | 30D | 90D | QTD

SECTION 1 — NORTH STAR (calm, 4 tiles)
  ARR | New MRR | Active customers | NRR
  Each tile: label, big number, WoW delta %, sparkline (last 8 buckets)

SECTION 2 — FUNNELS (3 compact cards, side-by-side on desktop)
  Acquisition  | Activation  | Revenue
  Each card:
    Status dot (green / amber / red)
    Title
    Compact stage rows: # | label | value | tiny sparkline (44x16) | conv %
    Action banner:
      Auto-suggestion (italic, generated from data)
      Editable override field (user's own note)

SECTION 3 — CUSTOMER SUCCESS DETAIL (full-detail funnel)
  Title + region label + end-to-end conversion
  6 stages, each with:
    # | label | source caption | value | conv % | stage bar | delta % | sparkline (60x20)
  Action banner (same pattern as top funnels)

SECTION 4 — CAMPAIGN PERFORMANCE (full-detail funnel)
  Same layout as CS Detail. 5 stages.

FOOTER
  "Tap any number or banner to edit"
  Export JSON / Reset buttons
```

---

## 3. Funnel definitions

### 3.1 Acquisition — "Are we filling the top?"

| # | Stage | Source |
|---|---|---|
| 01 | Leads | CRM (HubSpot) — top-of-funnel inquiries |
| 02 | MQL | CRM — marketing-qualified, fits ICP |
| 03 | Signups | Product DB — created YoboLabs account |

### 3.2 Activation — "Are new customers reaching first value?"

| # | Stage | Source |
|---|---|---|
| 01 | Signups | Product DB — same as acquisition output |
| 02 | Connected | Product DB — Shopify + Klaviyo + POS data flowing |
| 03 | First launch | Product DB — YoboLabs pushed first flow to Klaviyo |
| 04 | First sent | Klaviyo API — Klaviyo sent at least one message |

The split between First launch and First sent matters: First launch is "we did our job," First sent is "system end-to-end works." If launch is high but sent lags, there's an integration or scheduling issue.

### 3.3 Revenue — "Are we paid and proving ROI?"

| # | Stage | Source |
|---|---|---|
| 01 | Card on file | Stripe — payment method added |
| 02 | First payment | Stripe — first charge succeeded |
| 03 | 3x ROI | Stripe + Shopify — customer driving ≥ 3× their monthly cost in attributed sales |
| 04 | Upgrades | Stripe — tier expansion (subscription upgrade) |

ROI multiple is configurable (default 3, stored in `Config!C15`). The "3x" label in the funnel header reflects the current value.

### 3.4 Customer Success Detail — "Are paying customers active and getting results?"

Scope: paying customers, last 4 weeks, distinct customer-weeks counted.

| # | Stage | Source caption |
|---|---|---|
| 01 | First sent | Klaviyo delivered first message (milestone) |
| 02 | Viewed performance | opened dashboard to check results |
| 03 | Reviewed / edited | touched a campaign draft |
| 04 | Launched to Klaviyo | approved and pushed live |
| 05 | Messages sent | Klaviyo continues delivering |
| 06 | Orders generated | campaigns drove sales |

Stage 01 is a milestone entry. Stages 02–06 are ongoing weekly behaviors counted across the last 4 weeks. The funnel orders by depth of engagement: light touch (viewing) → operating (reviewing, launching) → outcome (messages, orders).

### 3.5 Campaign Performance — "How are end-user funnels performing?"

Scope: this-month total across all campaigns sent.

| # | Stage | Source caption |
|---|---|---|
| 01 | Customers targeted | segment size across all sends |
| 02 | Customers sent | Klaviyo delivered to inbox |
| 03 | Customers opened | opened the email |
| 04 | Customers clicked | clicked through |
| 05 | Customers ordered | placed an order |

Different from CS Detail in two ways: "customers" here are end-users (consumers receiving emails from YoboLabs' clients), not YoboLabs' customers. Numbers are large (10K–100K range), so use thousands/millions formatting.

---

## 4. Action banner logic

Every funnel card has an Action banner with two parts:
- **Auto-suggestion** (italic, system-generated)
- **Override** (editable, user's own action note)

### Auto-suggestion algorithm

```
1. Compute stage-to-stage conversion % for each stage after the first
2. Find weakest conv % across the funnel
3. Identify stages with declining WoW delta (dir === 'down')
4. Identify stages stuck at zero when prior > 0 (stalled)

Status decision:
  - stalledStages > 0           → RED: "{stage} stalled at zero. Investigate handoff."
  - weakestConv < 20%           → RED: "{from} → {to} only {x}%. {N} stuck."
  - weakestConv < 40% OR        → AMBER: "{from} → {to} at {x}%. Worth a look."
    decliningStages >= 2          OR "{N} stages declining. Review {a}, {b}."
  - decliningStages === 1       → AMBER: "{stage} trending down. Worth checking."
  - else                        → GREEN: "{Funnel} healthy. Nothing to do."
```

Status dot color matches: green / amber / red.

Conversion thresholds live in Config: "good" = 50%, "bad" = 20% (defaults, editable).

---

## 5. Visual / UX rules

### Typography
- **Single font: Inter** (400, 500, 600, 700)
- No mono font, no font switching
- `font-variant-numeric: tabular-nums` on all numeric cells
- Letter-spacing tightened by `-0.01em` on numbers

### Colors (CSS variables)

```css
--bg: #0a0a0a;          /* page background */
--panel: #131313;        /* card background */
--panel-2: #1a1a1a;      /* nested card */
--line: #222222;         /* borders */
--line-2: #2e2e2e;       /* hover/focus borders */
--text: #f5f5f5;         /* primary text */
--text-dim: #8a8a8a;     /* secondary text */
--text-faint: #555555;   /* tertiary, labels */
--green: #6FED45;        /* YoboLabs brand green, positive */
--red: #ff4d4d;          /* negative */
--amber: #ffb547;        /* watch state */
```

Color is **semantic only**: green/red/amber carry status meaning. No decorative color anywhere.

### Mobile-first rules
- Single column under 720px
- All grids collapse: north star 2×2, funnels stacked, detail funnel always vertical
- Min touch target 36px on toggles/buttons
- Toggles scroll horizontally if they overflow
- Sparklines stay visible but smaller on mobile

### Spacing & sizing
- Section gap: 28px mobile / 32px desktop
- Card padding: 16px mobile / 20px desktop
- Stage gap inside funnel: 16-18px
- Sparklines in top funnels: 44×16
- Sparklines in detail funnels: 60×20
- Sparklines on north star: 60×20

### Editing UX
- Every number is `contenteditable="true"`
- Click number → background turns to `--line` shade
- Edit, Enter or Tab → parse + re-render
- Parser accepts: `1.6M`, `18K`, `$500`, `112%`, raw numbers, with or without commas
- When editing on "Combined" view, edits split proportionally between ID and US based on existing ratio

### Copy & voice rules (CRITICAL — follow these)
- Never use em dashes or en dashes
- No exclamation marks
- No emojis
- Plain words: "use" not "leverage", "run" not "operationalize"
- Numbers over adjectives
- Operator voice: "Acquisition healthy. Nothing to do." not "Great job, your acquisition is performing excellently!"
- Section subtitles are descriptive, not promotional
- Brand: always "YoboLabs" (capital Y, lowercase obo, capital L, one word)

---

## 6. Data model

The spreadsheet `yobolabs-dashboard-data.xlsx` defines the data layer. 8 sheets:

### 6.1 Config (knobs and targets)

| Cell | Field | Notes |
|---|---|---|
| C6 / D6 / E6 | ARR target ID / US / Combined | Monthly target |
| C7 / D7 / E7 | New MRR target | |
| C8 / D8 / E8 | Active customers target | |
| C9 / D9 / E9 | NRR target | |
| C10 / D10 / E10 | Signups target | |
| C11 / D11 / E11 | First payments target | |
| C15 | ROI multiple | Default 3 |
| C16 | Revenue threshold $/wk (weekly view, legacy) | |
| C17 | Min conv % good | Default 50 |
| C18 | Min conv % bad | Default 20 |
| C23 | Current month start date | |
| C24 | Days elapsed | |
| C25 | Days in month | |
| C26 | Quarter start date | |

### 6.2 Acquisition_Daily

Columns: `Date | Region | Leads | MQL | Signups | Notes`

One row per (date, region). Source: HubSpot or whatever CRM is canonical.

### 6.3 Activation_Cohorts

Columns: `Customer ID | Customer Name | Region | Signup Date | Connected Date | First Launch Date | First Sent Date | Notes`

One row per customer. Date cells blank if not yet reached. Source: product DB.

### 6.4 Revenue_Customers

Columns: `Customer ID | Region | Card on File Date | First Payment Date | Monthly Cost ($) | Attributed Sales 30d ($) | ROI Multiple | Last Upgrade Date | Active This Month?`

ROI Multiple is computed: `=F{row}/E{row}` (sales / monthly cost). Source: Stripe + product DB + Shopify attribution.

### 6.5 CS_Weekly

Columns: `Customer ID | Region | Week Ending | First Sent (milestone) | Viewed Performance | Reviewed / Edited | Launched to Klaviyo | Messages Sent | Orders Generated | Attributed Sales ($)`

One row per (customer, week). Action columns are 0/1 flags. Source: product analytics + Klaviyo + Shopify.

### 6.6 Campaign_Performance

Columns: `Campaign ID | Send Date | Region | Campaign Name | Customers Targeted | Customers Sent | Customers Opened | Customers Clicked | Customers Ordered | Sales Generated ($)`

One row per campaign send. Source: Klaviyo API.

### 6.7 Dashboard_Summary

Read-only sheet. All formulas. Sections match the dashboard structure. This is what the dashboard reads from. Three columns per metric: ID, US, Combined (= ID + US).

Sections in Dashboard_Summary:
- North Star
- Acquisition Funnel (this month)
- Activation Funnel (this month cohort)
- Revenue Funnel (this month)
- Customer Success Detail (last 4 weeks)
- Campaign Performance (this month, all campaigns)
- Targets (pass-through from Config)

Formula patterns used:
- `SUMIFS(...)` for daily sums by region and date range
- `COUNTIFS(...)` for cohort counts by region and milestone date
- `SUMPRODUCT(...)` for CS_Weekly aggregation across customer-weeks
- Cross-sheet references for targets (= Config!Cx)

107 formulas total. Zero errors on load.

---

## 7. Compute logic (for the build)

### 7.1 Conversion % per stage
```
For stage i > 0:
  conv_i = (value_i / value_{i-1}) * 100

For stage 0:
  conv = 100
```

Color thresholds:
- conv >= 50% → green
- conv < 20% → red
- else → neutral (dim)

### 7.2 Delta (WoW for weekly, MoM for monthly)
```
prev = trend[length - 2]
curr = trend[length - 1]

if prev === 0 && curr === 0:  flat
if prev === 0 && curr > 0:    up (pct null)
else:                          pct = (curr - prev) / prev * 100
                               dir = pct > 0.5 ? up : pct < -0.5 ? down : flat
```

### 7.3 Pace vs target (used in weekly view, optional in monthly)
```
expected_now = target * (days_elapsed / days_total)
pace_pct = actual / expected_now * 100

status:
  pace_pct >= 110  → AHEAD
  pace_pct >= 95   → ON TRACK
  pace_pct >= 80   → WATCH
  else             → BEHIND

daily_needed = (target - actual) / days_left  (only if days_left > 0 and gap > 0)
```

### 7.4 Sparkline construction
- SVG `<path>` with `stroke-linecap: round`, stroke-width 1.4
- End point marked with small circle (r=1.8)
- Color matches delta direction
- ViewBox sized to passed w/h, `preserveAspectRatio="none"`
- No fill area for top funnels (keep calm), small area fill OK for north star

---

## 8. Region & period toggles

### Region: Combined | ID | US

Combined always = ID + US. When user edits a number while on Combined:
```
total = entry.id + entry.us
if total === 0:
  entry.id = newVal / 2; entry.us = newVal - entry.id
else:
  id_ratio = entry.id / total
  entry.id = round(newVal * id_ratio)
  entry.us = round(newVal - entry.id)
```

### Period: MTD | 30D | 90D | QTD

In the prototype, period is a visual flag — trend buckets stay the same. In production:
- Each period maps to a different time range
- Dashboard_Summary should expose a parameter or have parallel ranges
- Sparkline buckets:
  - MTD / 30D → 8 weekly buckets
  - 90D → 12 weekly buckets or 3 monthly
  - QTD → 3 monthly buckets

---

## 9. Build path — from prototype to production

### Phase 1: Wire data
1. Build Google Apps Script web app on the `yobolabs-dashboard-data.xlsx` (after import to Google Sheets) that returns `Dashboard_Summary` as JSON
2. Dashboard fetches JSON on load, replaces in-memory `DATA` object
3. Region/period toggles call same endpoint with parameters

### Phase 2: Sync raw data
- Acquisition_Daily ← HubSpot via Zapier or direct API
- Activation_Cohorts ← product DB nightly job
- Revenue_Customers ← Stripe webhooks + nightly Shopify attribution sync
- CS_Weekly ← product analytics rollup (weekly cron)
- Campaign_Performance ← Klaviyo API nightly

### Phase 3: Frontend hardening
- Replace in-memory state with React + state management (Zustand recommended for simplicity)
- Real-time updates: WebSocket or polling on a 5-min interval
- Hosted at `kpis.yobolabs.ai` behind SSO
- Mobile-installable PWA

### Phase 4: Action layer
- Auto-suggestion becomes a queue: every amber/red feeds a task list
- Override field syncs to a Notion or Linear ticket
- Weekly digest email auto-generated from the dashboard state

---

## 10. What NOT to do

- Don't add color for decoration. Color = status only.
- Don't add more than one font.
- Don't crowd the top funnels with sparklines per conversion. That detail lives in CS Detail.
- Don't write marketing copy in section titles or suggestions.
- Don't show ARR or customer counts on any public surface. This is investor/internal only.
- Don't add a chatbot, AI assistant overlay, or "insights" box. The auto-suggestion banner is the only AI surface.
- Don't make region/period toggles dropdowns. They're segmented controls (button groups).

---

## 11. Files in this handoff

```
yobolabs-dashboard.html              prototype, vanilla JS, single file
yobolabs-dashboard-data.xlsx         data model with formulas
SPEC.md                               this file
```

## 12. Open questions / future work

- **Cohort math for activation**: currently activation counts use signup-date filter (cohort by month). Stricter "of customers who signed up week N, what % reached stage X by week N+1" requires a different query. Worth doing when data volume justifies.
- **NRR computation**: currently hardcoded in Dashboard_Summary because it needs churn + expansion + contraction tracked separately. When Revenue_Customers includes those columns, swap the hardcode for a formula.
- **Real-time vs daily refresh**: prototype assumes a snapshot. Production should decide refresh frequency per metric (Klaviyo: real-time, Stripe: hourly, product DB: nightly).
- **Action override persistence**: override notes in the prototype are session-only. Production needs them stored (Notion, DB, or local-storage minimum).
- **ID vs US side-by-side view**: currently region is a toggle. A parallel-column view (ID column | US column on the same page) is requested but deferred. Add when team is actively running both markets.
