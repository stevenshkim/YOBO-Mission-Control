/* ============================================================================
 * YoboLabs Mission KPIs data layer
 * Seed generation (per period), localStorage persistence, period model.
 * Data shape: { v, periods: { mtd, '30d', '90d', qtd }, overrides, config }
 * Each period slice: { northStar, acquisition, activation, revenue, cs, campaign }
 * ========================================================================== */

export const PERIOD_BUCKETS = { mtd: 8, '30d': 8, '90d': 12, qtd: 3 };

/* Window length in months. Flow metrics scale with it; stock metrics (ARR,
 * active customers, NRR) hold their level across periods. */
const WINDOW_MONTHS = { mtd: 1, '30d': 1, '90d': 3, qtd: 3 };

/* Fraction of the period window already elapsed. MTD and QTD accrue with the
 * calendar; rolling windows are always complete. Used both for seeding
 * realistic partial-window flow values and for pace vs target. */
export function timeFraction(period) {
  const now = new Date();
  if (period === 'mtd') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return now.getDate() / daysInMonth;
  }
  if (period === 'qtd') {
    const q = Math.floor(now.getMonth() / 3);
    const qStart = new Date(now.getFullYear(), q * 3, 1);
    const qEnd = new Date(now.getFullYear(), q * 3 + 3, 0);
    const total = Math.round((qEnd - qStart) / 86400000) + 1;
    const elapsed = Math.floor((now - qStart) / 86400000) + 1;
    return Math.min(1, elapsed / total);
  }
  return 1;
}

const STORAGE_KEY = 'yobolabs-kpis-v1';
const STATE_VERSION = 1;

/* -------------------------------------------------------------------------- */
/* Deterministic trend generator                                              */
/* -------------------------------------------------------------------------- */

function mkTrend(target, growth, n, seed) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const start = target / Math.pow(1 + growth, n - 1);
  const out = [];
  for (let i = 0; i < n; i++) {
    const base = start * Math.pow(1 + growth, i);
    const wiggle = base * 0.07 * (rand() * 2 - 1);
    out.push(Math.max(0, Math.round(base + wiggle)));
  }
  out[n - 1] = target;
  return out;
}

/* -------------------------------------------------------------------------- */
/* Metric templates. base values are the MTD numbers; stock metrics ignore    */
/* PERIOD_SCALE. Seeds are offset per period so sparklines differ.            */
/* -------------------------------------------------------------------------- */

const NORTH_STAR = [
  { key: 'arr', label: 'ARR', format: 'money-arr', kind: 'sum', stock: true,
    id: 336000, us: 144000, growth: 0.035, seed: 11 },
  { key: 'newMrr', label: 'New MRR', format: 'money', kind: 'sum',
    id: 7200, us: 4800, growth: 0.06, seed: 21 },
  { key: 'activeCustomers', label: 'Active customers', format: 'int', kind: 'sum', stock: true,
    id: 26, us: 12, growth: 0.05, seed: 31 },
  { key: 'nrr', label: 'NRR', format: 'pct', kind: 'ratio', stock: true,
    id: 114, us: 108, combined: 112, growth: 0.008, seed: 41 },
];

const FUNNELS = {
  acquisition: {
    key: 'acquisition',
    title: 'Acquisition',
    question: 'Are we filling the top?',
    stages: [
      { key: 'leads', label: 'Leads', source: 'CRM, top-of-funnel inquiries', format: 'int',
        id: 196, us: 88, growth: 0.03, seed: 101 },
      { key: 'mql', label: 'MQL', source: 'Marketing-qualified, fits ICP', format: 'int',
        id: 64, us: 31, growth: 0.025, seed: 103 },
      { key: 'signups', label: 'Signups', source: 'Product DB, created account', format: 'int',
        id: 18, us: 6, growth: 0.04, seed: 105 },
    ],
  },
  activation: {
    key: 'activation',
    title: 'Activation',
    question: 'Are new customers reaching first value?',
    stages: [
      { key: 'signups', label: 'Signups', source: 'Product DB', format: 'int',
        id: 18, us: 6, growth: 0.04, seed: 201 },
      { key: 'connected', label: 'Connected', source: 'Shopify + Klaviyo + POS flowing', format: 'int',
        id: 14, us: 5, growth: 0.04, seed: 203 },
      { key: 'launched', label: 'First launch', source: 'YoboLabs pushed first flow', format: 'int',
        id: 12, us: 4, growth: 0.05, seed: 205 },
      { key: 'sent', label: 'First sent', source: 'Klaviyo sent first message', format: 'int',
        id: 10, us: 4, growth: 0.04, seed: 207 },
    ],
  },
  revenue: {
    key: 'revenue',
    title: 'Revenue',
    question: 'Are we paid and proving ROI?',
    stages: [
      { key: 'card', label: 'Card on file', source: 'Stripe, payment method added', format: 'int',
        id: 16, us: 6, growth: 0.05, seed: 301 },
      { key: 'firstPay', label: 'First payment', source: 'Stripe, first charge succeeded', format: 'int',
        id: 14, us: 5, growth: 0.045, seed: 303 },
      { key: 'roi', label: 'ROI', source: 'Driving a multiple of monthly cost in sales', format: 'int', roiStage: true,
        id: 7, us: 2, growth: 0.05, seed: 305 },
      { key: 'upgrade', label: 'Upgrades', source: 'Stripe, tier expansion', format: 'int',
        id: 3, us: 1, growth: 0.06, seed: 307 },
    ],
  },
  cs: {
    key: 'cs',
    title: 'Customer Success',
    subtitle: 'Are paying customers active and getting results?',
    scope: 'Last 4 weeks, distinct customer-weeks',
    milestoneStage: 0,
    stages: [
      { key: 'firstSent', label: 'First sent', source: 'Klaviyo delivered first message (milestone)', format: 'int',
        id: 10, us: 4, growth: 0.04, seed: 401 },
      { key: 'viewed', label: 'Viewed performance', source: 'Opened dashboard to check results', format: 'int',
        id: 68, us: 28, growth: 0.03, seed: 403 },
      { key: 'reviewed', label: 'Reviewed or edited', source: 'Touched a campaign draft', format: 'int',
        id: 54, us: 22, growth: 0.025, seed: 405 },
      { key: 'launched', label: 'Launched to Klaviyo', source: 'Approved and pushed live', format: 'int',
        id: 46, us: 18, growth: 0.03, seed: 407 },
      { key: 'sent', label: 'Messages sent', source: 'Klaviyo continues delivering', format: 'int',
        id: 41, us: 17, growth: 0.03, seed: 409 },
      { key: 'orders', label: 'Orders generated', source: 'Campaigns drove sales', format: 'int',
        id: 30, us: 12, growth: 0.04, seed: 411 },
    ],
  },
  campaign: {
    key: 'campaign',
    title: 'Campaign Performance',
    subtitle: 'How are end-user funnels performing?',
    scope: 'This month, all campaigns, end-user counts',
    stages: [
      { key: 'targeted', label: 'Customers targeted', source: 'Segment size across all sends', format: 'kilo',
        id: 1120000, us: 480000, growth: 0.03, seed: 501 },
      { key: 'sent', label: 'Customers sent', source: 'Klaviyo delivered to inbox', format: 'kilo',
        id: 1000000, us: 420000, growth: 0.03, seed: 503 },
      { key: 'opened', label: 'Customers opened', source: 'Opened the email', format: 'kilo',
        id: 270000, us: 110000, growth: 0.025, seed: 505 },
      { key: 'clicked', label: 'Customers clicked', source: 'Clicked through', format: 'kilo',
        id: 31000, us: 11000, growth: 0.03, seed: 507 },
      { key: 'ordered', label: 'Customers ordered', source: 'Placed an order', format: 'kilo',
        id: 3400, us: 1400, growth: 0.04, seed: 509 },
    ],
  },
};

/* Period offset keeps trend seeds distinct so each period draws its own line */
const PERIOD_SEED_OFFSET = { mtd: 0, '30d': 1000, '90d': 2000, qtd: 3000 };

function buildMetric(tpl, period) {
  const n = PERIOD_BUCKETS[period];
  /* Flow values accrue: window months times elapsed fraction. Ceil keeps
   * small funnel stages from seeding at zero early in a window. */
  const scale = tpl.stock ? 1 : WINDOW_MONTHS[period] * timeFraction(period);
  const seedBase = tpl.seed + PERIOD_SEED_OFFSET[period];
  const id = tpl.stock ? tpl.id : Math.ceil(tpl.id * scale);
  const us = tpl.stock ? tpl.us : Math.ceil(tpl.us * scale);
  const m = {
    key: tpl.key,
    label: tpl.label,
    format: tpl.format,
    kind: tpl.kind || 'sum',
    stock: !!tpl.stock,
    id,
    us,
    trend: {
      id: mkTrend(id, tpl.growth, n, seedBase),
      us: mkTrend(us, tpl.growth, n, seedBase + 1),
    },
  };
  if (tpl.roiStage) m.roiStage = true;
  if (tpl.source) m.source = tpl.source;
  if (tpl.kind === 'ratio') {
    m.combined = tpl.combined;
    m.trend.combined = mkTrend(tpl.combined, tpl.growth, n, seedBase + 2);
  }
  return m;
}

function buildPeriodSlice(period) {
  const slice = { northStar: {} };
  for (const tpl of NORTH_STAR) {
    slice.northStar[tpl.key] = buildMetric(tpl, period);
  }
  for (const [fk, f] of Object.entries(FUNNELS)) {
    slice[fk] = {
      key: f.key,
      title: f.title,
      question: f.question,
      subtitle: f.subtitle,
      scope: f.scope,
      milestoneStage: f.milestoneStage,
      stages: f.stages.map((s) => buildMetric(s, period)),
    };
  }
  return slice;
}

export function buildSeed() {
  const periods = {};
  for (const p of Object.keys(PERIOD_BUCKETS)) {
    periods[p] = buildPeriodSlice(p);
  }
  return {
    v: STATE_VERSION,
    periods,
    overrides: { acquisition: '', activation: '', revenue: '', cs: '', campaign: '' },
    config: {
      roiMultiple: 3,
      convGood: 50,
      convBad: 20,
      /* Monthly targets per region, seeded a touch above current run rate */
      targets: {
        arr: { kind: 'sum', id: 350000, us: 150000 },
        newMrr: { kind: 'sum', id: 7500, us: 5000 },
        activeCustomers: { kind: 'sum', id: 30, us: 14 },
        nrr: { kind: 'ratio', id: 116, us: 110, combined: 114 },
      },
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Storage full or unavailable. Edits stay in memory for the session. */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to clear */
  }
}
