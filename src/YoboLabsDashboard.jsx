import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

/* ============================================================================
 * YoboLabs Mission KPIs
 * Single-page executive dashboard. Spec at SPEC.md.
 * Voice: operator. No em dashes, no exclamation, no marketing copy.
 * Color is semantic only: green = positive, red = negative, amber = watch.
 * ========================================================================== */

const C = {
  bg: '#0a0a0a',
  panel: '#131313',
  panel2: '#1a1a1a',
  line: '#222222',
  line2: '#2e2e2e',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  faint: '#555555',
  green: '#6FED45',
  red: '#ff4d4d',
  amber: '#ffb547',
};

const REGIONS = [
  { id: 'combined', label: 'Combined' },
  { id: 'id', label: 'ID' },
  { id: 'us', label: 'US' },
];

const PERIODS = [
  { id: 'mtd', label: 'MTD' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'qtd', label: 'QTD' },
];

const THRESHOLD = { good: 50, bad: 20 };

/* -------------------------------------------------------------------------- */
/* Format + parse                                                             */
/* -------------------------------------------------------------------------- */

function fmt(n, format) {
  if (n === null || n === undefined || Number.isNaN(n)) return '-';
  switch (format) {
    case 'money-arr':
      if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
      return '$' + Math.round(n / 1_000) + 'K';
    case 'money':
      if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
      if (n >= 10_000) return '$' + Math.round(n / 1_000) + 'K';
      if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
      return '$' + Math.round(n).toLocaleString();
    case 'kilo':
      if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
      if (n >= 10_000) return Math.round(n / 1_000) + 'K';
      if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
      return n.toLocaleString();
    case 'int':
      return Math.round(n).toLocaleString();
    case 'pct':
      return Math.round(n) + '%';
    default:
      return String(n);
  }
}

function parseValue(text, format) {
  let s = String(text).trim().replace(/[$,\s]/g, '');
  if (s === '') return null;
  const isPct = s.endsWith('%');
  if (isPct) s = s.slice(0, -1);
  const last = s.slice(-1).toLowerCase();
  let mult = 1;
  if (last === 'k') { mult = 1_000; s = s.slice(0, -1); }
  else if (last === 'm') { mult = 1_000_000; s = s.slice(0, -1); }
  const n = parseFloat(s);
  if (Number.isNaN(n)) return null;
  const v = n * mult;
  if (format === 'pct') return v;
  return Math.round(v);
}

/* -------------------------------------------------------------------------- */
/* Region resolution                                                          */
/* -------------------------------------------------------------------------- */

function metricVal(m, region) {
  if (m.kind === 'ratio') return m[region];
  if (region === 'combined') return m.id + m.us;
  return m[region];
}

function metricTrend(m, region) {
  if (m.kind === 'ratio') return m.trend[region];
  if (region === 'combined') {
    return m.trend.id.map((v, i) => v + m.trend.us[i]);
  }
  return m.trend[region];
}

function splitToRegions(m, newCombined) {
  const total = m.id + m.us;
  if (total === 0) {
    const half = Math.round(newCombined / 2);
    return { id: half, us: newCombined - half };
  }
  const ratio = m.id / total;
  const newId = Math.round(newCombined * ratio);
  return { id: newId, us: newCombined - newId };
}

/* -------------------------------------------------------------------------- */
/* Delta + conv                                                               */
/* -------------------------------------------------------------------------- */

function trendDelta(trend) {
  if (!trend || trend.length < 2) return { dir: 'flat', pct: 0 };
  const prev = trend[trend.length - 2];
  const curr = trend[trend.length - 1];
  if (prev === 0 && curr === 0) return { dir: 'flat', pct: 0 };
  if (prev === 0 && curr > 0) return { dir: 'up', pct: null };
  const pct = ((curr - prev) / prev) * 100;
  const dir = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
  return { dir, pct };
}

function deltaColor(dir) {
  return dir === 'up' ? C.green : dir === 'down' ? C.red : C.dim;
}

function deltaText(d) {
  if (d.dir === 'flat') return 'flat';
  if (d.pct === null) return 'new';
  const sign = d.pct > 0 ? '+' : '';
  return `${sign}${d.pct.toFixed(1)}%`;
}

function convColor(pct) {
  if (pct === null || pct === undefined) return C.dim;
  if (pct >= THRESHOLD.good) return C.green;
  if (pct < THRESHOLD.bad) return C.red;
  return C.dim;
}

function stageWasDeclining(trend) {
  if (!trend || trend.length < 2) return false;
  const prev = trend[trend.length - 2];
  const curr = trend[trend.length - 1];
  if (prev === 0) return false;
  return curr < prev * 0.995;
}

/* -------------------------------------------------------------------------- */
/* Auto-suggestion                                                            */
/* -------------------------------------------------------------------------- */

function autoSuggest(funnel, region) {
  const stages = funnel.stages.map((s) => ({
    label: s.label,
    val: metricVal(s, region),
    trend: metricTrend(s, region),
  }));
  const start = funnel.milestoneStage === 0 ? 2 : 1;
  const convs = [];
  for (let i = start; i < stages.length; i++) {
    const prev = stages[i - 1].val;
    const curr = stages[i].val;
    convs.push({
      from: stages[i - 1].label,
      to: stages[i].label,
      conv: prev > 0 ? (curr / prev) * 100 : 0,
      prevVal: prev,
      val: curr,
    });
  }
  let weakest = null;
  for (const c of convs) {
    if (weakest === null || c.conv < weakest.conv) weakest = c;
  }
  const declining = stages
    .map((s, i) => ({ ...s, i }))
    .filter((s) => stageWasDeclining(s.trend));
  const stalled = convs.filter((c) => c.val === 0 && c.prevVal > 0);

  if (stalled.length > 0) {
    return { status: 'red', text: `${stalled[0].to} stalled at zero. Investigate handoff.` };
  }
  if (weakest && weakest.conv < THRESHOLD.bad) {
    const stuck = Math.max(0, weakest.prevVal - weakest.val);
    return {
      status: 'red',
      text: `${weakest.from} to ${weakest.to} only ${Math.round(weakest.conv)}%. ${stuck} stuck.`,
    };
  }
  if (declining.length >= 2) {
    return {
      status: 'amber',
      text: `${declining.length} stages declining. Review ${declining[0].label}, ${declining[1].label}.`,
    };
  }
  if (weakest && weakest.conv < 40) {
    return {
      status: 'amber',
      text: `${weakest.from} to ${weakest.to} at ${Math.round(weakest.conv)}%. Worth a look.`,
    };
  }
  if (declining.length === 1) {
    return { status: 'amber', text: `${declining[0].label} trending down. Worth checking.` };
  }
  return { status: 'green', text: `${funnel.title} healthy. Nothing to do.` };
}

const STATUS_COLOR = { green: C.green, amber: C.amber, red: C.red };

/* -------------------------------------------------------------------------- */
/* Mock data                                                                  */
/* -------------------------------------------------------------------------- */

function mkTrend(target, growth = 0.04, n = 8, seed = 1) {
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

const T = (target, growth, seed) => mkTrend(target, growth, 8, seed);

function buildSeed() {
  return {
    northStar: {
      arr: {
        key: 'arr', label: 'ARR', format: 'money-arr', kind: 'sum',
        id: 336000, us: 144000,
        trend: { id: T(336000, 0.035, 11), us: T(144000, 0.045, 12) },
      },
      newMrr: {
        key: 'newMrr', label: 'New MRR', format: 'money', kind: 'sum',
        id: 7200, us: 4800,
        trend: { id: T(7200, 0.06, 21), us: T(4800, 0.08, 22) },
      },
      activeCustomers: {
        key: 'activeCustomers', label: 'Active customers', format: 'int', kind: 'sum',
        id: 26, us: 12,
        trend: { id: T(26, 0.05, 31), us: T(12, 0.07, 32) },
      },
      nrr: {
        key: 'nrr', label: 'NRR', format: 'pct', kind: 'ratio',
        id: 114, us: 108, combined: 112,
        trend: {
          id: T(114, 0.01, 41),
          us: T(108, 0.005, 42),
          combined: T(112, 0.008, 43),
        },
      },
    },
    acquisition: {
      key: 'acquisition',
      title: 'Acquisition',
      question: 'Are we filling the top?',
      override: '',
      stages: [
        { key: 'leads', label: 'Leads', source: 'CRM, top-of-funnel inquiries', format: 'int', kind: 'sum',
          id: 196, us: 88, trend: { id: T(196, 0.03, 101), us: T(88, 0.04, 102) } },
        { key: 'mql', label: 'MQL', source: 'Marketing-qualified, fits ICP', format: 'int', kind: 'sum',
          id: 64, us: 31, trend: { id: T(64, 0.025, 103), us: T(31, 0.03, 104) } },
        { key: 'signups', label: 'Signups', source: 'Product DB, created account', format: 'int', kind: 'sum',
          id: 18, us: 6, trend: { id: T(18, 0.04, 105), us: T(6, 0.05, 106) } },
      ],
    },
    activation: {
      key: 'activation',
      title: 'Activation',
      question: 'Are new customers reaching first value?',
      override: '',
      stages: [
        { key: 'signups', label: 'Signups', source: 'Product DB', format: 'int', kind: 'sum',
          id: 18, us: 6, trend: { id: T(18, 0.04, 201), us: T(6, 0.05, 202) } },
        { key: 'connected', label: 'Connected', source: 'Shopify + Klaviyo + POS flowing', format: 'int', kind: 'sum',
          id: 14, us: 5, trend: { id: T(14, 0.04, 203), us: T(5, 0.04, 204) } },
        { key: 'launched', label: 'First launch', source: 'YoboLabs pushed first flow', format: 'int', kind: 'sum',
          id: 12, us: 4, trend: { id: T(12, 0.05, 205), us: T(4, 0.04, 206) } },
        { key: 'sent', label: 'First sent', source: 'Klaviyo sent first message', format: 'int', kind: 'sum',
          id: 10, us: 4, trend: { id: T(10, 0.04, 207), us: T(4, 0.04, 208) } },
      ],
    },
    revenue: {
      key: 'revenue',
      title: 'Revenue',
      question: 'Are we paid and proving ROI?',
      roiLabel: '3x ROI',
      override: '',
      stages: [
        { key: 'card', label: 'Card on file', source: 'Stripe, payment method added', format: 'int', kind: 'sum',
          id: 16, us: 6, trend: { id: T(16, 0.05, 301), us: T(6, 0.04, 302) } },
        { key: 'firstPay', label: 'First payment', source: 'Stripe, first charge succeeded', format: 'int', kind: 'sum',
          id: 14, us: 5, trend: { id: T(14, 0.045, 303), us: T(5, 0.04, 304) } },
        { key: 'roi', label: '3x ROI', source: 'Driving 3x monthly cost in sales', format: 'int', kind: 'sum',
          id: 7, us: 2, trend: { id: T(7, 0.05, 305), us: T(2, 0.04, 306) } },
        { key: 'upgrade', label: 'Upgrades', source: 'Stripe, tier expansion', format: 'int', kind: 'sum',
          id: 3, us: 1, trend: { id: T(3, 0.06, 307), us: T(1, 0.05, 308) } },
      ],
    },
    cs: {
      key: 'cs',
      title: 'Customer Success',
      subtitle: 'Are paying customers active and getting results?',
      scope: 'Last 4 weeks, distinct customer-weeks',
      override: '',
      milestoneStage: 0,
      stages: [
        { key: 'firstSent', label: 'First sent', source: 'Klaviyo delivered first message (milestone)', format: 'int', kind: 'sum',
          id: 10, us: 4, trend: { id: T(10, 0.04, 401), us: T(4, 0.04, 402) } },
        { key: 'viewed', label: 'Viewed performance', source: 'Opened dashboard to check results', format: 'int', kind: 'sum',
          id: 68, us: 28, trend: { id: T(68, 0.03, 403), us: T(28, 0.035, 404) } },
        { key: 'reviewed', label: 'Reviewed or edited', source: 'Touched a campaign draft', format: 'int', kind: 'sum',
          id: 54, us: 22, trend: { id: T(54, 0.025, 405), us: T(22, 0.03, 406) } },
        { key: 'launched', label: 'Launched to Klaviyo', source: 'Approved and pushed live', format: 'int', kind: 'sum',
          id: 46, us: 18, trend: { id: T(46, 0.03, 407), us: T(18, 0.025, 408) } },
        { key: 'sent', label: 'Messages sent', source: 'Klaviyo continues delivering', format: 'int', kind: 'sum',
          id: 41, us: 17, trend: { id: T(41, 0.03, 409), us: T(17, 0.03, 410) } },
        { key: 'orders', label: 'Orders generated', source: 'Campaigns drove sales', format: 'int', kind: 'sum',
          id: 30, us: 12, trend: { id: T(30, 0.04, 411), us: T(12, 0.04, 412) } },
      ],
    },
    campaign: {
      key: 'campaign',
      title: 'Campaign Performance',
      subtitle: 'How are end-user funnels performing?',
      scope: 'This month, all campaigns, end-user counts',
      override: '',
      stages: [
        { key: 'targeted', label: 'Customers targeted', source: 'Segment size across all sends', format: 'kilo', kind: 'sum',
          id: 1_120_000, us: 480_000, trend: { id: T(1_120_000, 0.03, 501), us: T(480_000, 0.04, 502) } },
        { key: 'sent', label: 'Customers sent', source: 'Klaviyo delivered to inbox', format: 'kilo', kind: 'sum',
          id: 1_000_000, us: 420_000, trend: { id: T(1_000_000, 0.03, 503), us: T(420_000, 0.035, 504) } },
        { key: 'opened', label: 'Customers opened', source: 'Opened the email', format: 'kilo', kind: 'sum',
          id: 270_000, us: 110_000, trend: { id: T(270_000, 0.025, 505), us: T(110_000, 0.03, 506) } },
        { key: 'clicked', label: 'Customers clicked', source: 'Clicked through', format: 'kilo', kind: 'sum',
          id: 31_000, us: 11_000, trend: { id: T(31_000, 0.03, 507), us: T(11_000, 0.035, 508) } },
        { key: 'ordered', label: 'Customers ordered', source: 'Placed an order', format: 'kilo', kind: 'sum',
          id: 3_400, us: 1_400, trend: { id: T(3_400, 0.04, 509), us: T(1_400, 0.04, 510) } },
      ],
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Editable primitives                                                        */
/* -------------------------------------------------------------------------- */

function EditableNumber({ value, format, onChange, align = 'right', size = 14, weight = 500, color = C.text }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el) {
      el.textContent = fmt(value, format);
    }
  }, [value, format]);

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const parsed = parseValue(el.textContent || '', format);
    if (parsed === null || parsed === value) {
      el.textContent = fmt(value, format);
    } else {
      onChange(parsed);
    }
  };

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="yl-editable"
      style={{
        textAlign: align,
        fontSize: size,
        fontWeight: weight,
        color,
        minWidth: 32,
        display: 'inline-block',
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (ref.current) ref.current.textContent = fmt(value, format);
          e.currentTarget.blur();
        }
      }}
      onFocus={(e) => {
        const range = document.createRange();
        range.selectNodeContents(e.currentTarget);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }}
    />
  );
}

function EditableText({ value, onChange, placeholder = '' }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el) {
      el.textContent = value || '';
    }
  }, [value]);

  const commit = () => {
    const el = ref.current;
    if (!el) return;
    const txt = (el.textContent || '').trim();
    if (txt !== value) onChange(txt);
  };

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="yl-text-edit"
      data-placeholder={placeholder}
      style={{ color: C.text, fontSize: 13, fontWeight: 500 }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          if (ref.current) ref.current.textContent = value || '';
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Sparkline                                                                  */
/* -------------------------------------------------------------------------- */

function Sparkline({ points, w, h, color, area = false }) {
  if (!points || points.length < 2) {
    return <svg width={w} height={h} />;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 1.4;
  const xStep = (w - pad * 2) / (points.length - 1);
  const ys = points.map((v) => pad + (h - pad * 2) * (1 - (v - min) / range));
  const xs = points.map((_, i) => pad + i * xStep);
  const d = ys.map((y, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(2)},${y.toFixed(2)}`).join(' ');
  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      {area && (
        <path
          d={`${d} L${lastX},${h} L${xs[0]},${h} Z`}
          fill={color}
          opacity="0.08"
        />
      )}
      <path d={d} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="1.8" fill={color} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Toggles                                                                    */
/* -------------------------------------------------------------------------- */

function Seg({ items, value, onChange }) {
  return (
    <div className="yl-seg">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={value === it.id}
          onClick={() => onChange(it.id)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Status dot                                                                 */
/* -------------------------------------------------------------------------- */

function Dot({ status }) {
  return <span className="yl-dot" style={{ background: STATUS_COLOR[status] || C.dim }} />;
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ region, setRegion, period, setPeriod }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  const ts = now.toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: false,
  });
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap', padding: '20px 0 24px',
      borderBottom: `1px solid ${C.line}`, marginBottom: 28,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>YoboLabs</div>
        <div style={{ fontSize: 12, color: C.dim }}>Mission KPIs · {ts}</div>
      </div>
      <div className="yl-scroll-x" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Seg items={REGIONS} value={region} onChange={setRegion} />
        <Seg items={PERIODS} value={period} onChange={setPeriod} />
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

function SectionLabel({ label, region, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 14, gap: 12,
    }}>
      <div className="yl-section-label">{label}</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
        {right}
        <span style={{ fontSize: 11, color: C.faint, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {REGIONS.find((r) => r.id === region)?.label}
        </span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* North Star                                                                 */
/* -------------------------------------------------------------------------- */

function NorthStarTile({ metric, region, onCommit }) {
  const val = metricVal(metric, region);
  const trend = metricTrend(metric, region);
  const delta = trendDelta(trend);
  const sparkColor = deltaColor(delta.dir);

  const handle = (newVal) => onCommit(metric.key, region, newVal);

  return (
    <div className="yl-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
        {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <EditableNumber
          value={val}
          format={metric.format}
          onChange={handle}
          align="left"
          size={28}
          weight={600}
        />
        <span className="yl-num" style={{ fontSize: 12, color: sparkColor, fontWeight: 500 }}>
          {deltaText(delta)}
        </span>
      </div>
      <Sparkline points={trend} w={120} h={26} color={sparkColor} area />
    </div>
  );
}

function NorthStarSection({ data, region, onCommit }) {
  const tiles = [data.northStar.arr, data.northStar.newMrr, data.northStar.activeCustomers, data.northStar.nrr];
  return (
    <section style={{ marginBottom: 32 }}>
      <SectionLabel label="North Star" region={region} />
      <div className="yl-northstar-grid">
        {tiles.map((m) => (
          <NorthStarTile key={m.key} metric={m} region={region} onCommit={onCommit} />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Top funnel card                                                            */
/* -------------------------------------------------------------------------- */

function FunnelCard({ funnel, region, onCommitStage, onCommitOverride }) {
  const suggestion = useMemo(() => autoSuggest(funnel, region), [funnel, region]);
  const stages = funnel.stages.map((s, i) => {
    const val = metricVal(s, region);
    const trend = metricTrend(s, region);
    const delta = trendDelta(trend);
    let conv = null;
    if (i > 0) {
      const prev = metricVal(funnel.stages[i - 1], region);
      conv = prev > 0 ? (val / prev) * 100 : 0;
    }
    if (funnel.milestoneStage === 0 && i === 1) conv = null;
    return { ...s, i, val, trend, delta, conv };
  });

  return (
    <div className="yl-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Dot status={suggestion.status} />
        <div style={{ fontSize: 15, fontWeight: 600 }}>{funnel.title}</div>
        <div style={{ fontSize: 11, color: C.faint, marginLeft: 'auto' }}>{funnel.question}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {stages.map((s) => (
          <div key={s.key} style={{
            display: 'grid',
            gridTemplateColumns: '20px minmax(0, 1fr) auto 44px 44px',
            gap: 10, alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: C.faint, fontFamily: 'inherit' }}>
              {String(s.i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 13, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
            <EditableNumber
              value={s.val}
              format={s.format}
              onChange={(v) => onCommitStage(funnel.key, s.key, region, v)}
              align="right"
              size={13}
              weight={600}
            />
            <Sparkline points={s.trend} w={44} h={16} color={deltaColor(s.delta.dir)} />
            <span className="yl-num" style={{
              fontSize: 12, textAlign: 'right', color: convColor(s.conv), fontWeight: 500,
            }}>
              {s.conv === null ? '' : Math.round(s.conv) + '%'}
            </span>
          </div>
        ))}
      </div>
      <ActionBanner funnel={funnel} suggestion={suggestion} onCommitOverride={onCommitOverride} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action banner                                                              */
/* -------------------------------------------------------------------------- */

function ActionBanner({ funnel, suggestion, onCommitOverride }) {
  const color = STATUS_COLOR[suggestion.status];
  return (
    <div style={{
      borderTop: `1px solid ${C.line}`,
      paddingTop: 12,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 7, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: C.dim, fontStyle: 'italic', lineHeight: 1.5 }}>
          {suggestion.text}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 11, color: C.faint, marginTop: 4, flexShrink: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Action
        </span>
        <EditableText
          value={funnel.override}
          onChange={(t) => onCommitOverride(funnel.key, t)}
          placeholder="Add your note"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail funnel (CS + Campaign)                                              */
/* -------------------------------------------------------------------------- */

function DetailFunnel({ funnel, region, onCommitStage, onCommitOverride }) {
  const suggestion = useMemo(() => autoSuggest(funnel, region), [funnel, region]);
  const stages = funnel.stages.map((s, i) => {
    const val = metricVal(s, region);
    const trend = metricTrend(s, region);
    const delta = trendDelta(trend);
    let conv = null;
    if (i > 0) {
      const prev = metricVal(funnel.stages[i - 1], region);
      conv = prev > 0 ? (val / prev) * 100 : 0;
    }
    if (funnel.milestoneStage === 0 && i === 1) conv = null;
    return { ...s, i, val, trend, delta, conv };
  });
  const maxVal = Math.max(...stages.map((s) => s.val), 1);

  const e2e = (() => {
    const last = stages[stages.length - 1].val;
    const start = funnel.milestoneStage === 0 ? stages[1].val : stages[0].val;
    return start > 0 ? (last / start) * 100 : 0;
  })();

  return (
    <section className="yl-panel" style={{ padding: 22, marginBottom: 28 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <Dot status={suggestion.status} />
        <div style={{ fontSize: 16, fontWeight: 600 }}>{funnel.title}</div>
        <div style={{ fontSize: 11, color: C.faint }}>{funnel.subtitle}</div>
        <div style={{ marginLeft: 'auto', fontSize: 12, color: C.dim }}>
          End to end: <span className="yl-num" style={{ color: convColor(e2e), fontWeight: 600 }}>{Math.round(e2e)}%</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 14 }}>{funnel.scope}</div>
      <div>
        {stages.map((s) => (
          <DetailStageRow
            key={s.key}
            stage={s}
            funnelKey={funnel.key}
            region={region}
            maxVal={maxVal}
            onCommitStage={onCommitStage}
          />
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <ActionBanner funnel={funnel} suggestion={suggestion} onCommitOverride={onCommitOverride} />
      </div>
    </section>
  );
}

function DetailStageRow({ stage, funnelKey, region, maxVal, onCommitStage }) {
  const barPct = Math.max(2, (stage.val / maxVal) * 100);
  return (
    <div className="yl-detail-row">
      <span className="yl-detail-num">{String(stage.i + 1).padStart(2, '0')}</span>
      <div className="yl-detail-text">
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{stage.label}</div>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{stage.source}</div>
      </div>
      <div className="yl-detail-value">
        <EditableNumber
          value={stage.val}
          format={stage.format}
          onChange={(v) => onCommitStage(funnelKey, stage.key, region, v)}
          align="right"
          size={14}
          weight={600}
        />
      </div>
      <div className="yl-detail-meta">
        <span className="yl-detail-conv yl-num" style={{ color: convColor(stage.conv) }}>
          {stage.conv === null ? '' : Math.round(stage.conv) + '%'}
        </span>
        <div className="yl-detail-bar">
          <div className="yl-detail-bar-fill" style={{ width: barPct + '%' }} />
        </div>
        <span className="yl-detail-delta yl-num" style={{ color: deltaColor(stage.delta.dir) }}>
          {deltaText(stage.delta)}
        </span>
        <div className="yl-detail-spark">
          <Sparkline points={stage.trend} w={60} h={20} color={deltaColor(stage.delta.dir)} />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function Footer({ onExport, onReset }) {
  return (
    <footer style={{
      marginTop: 28, paddingTop: 20, borderTop: `1px solid ${C.line}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 12, paddingBottom: 32,
    }}>
      <div style={{ fontSize: 12, color: C.faint }}>Tap any number or note to edit.</div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" className="yl-btn-link" onClick={onExport}>Export JSON</button>
        <button type="button" className="yl-btn-link" onClick={onReset}>Reset</button>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function YoboLabsDashboard() {
  const [region, setRegion] = useState('combined');
  const [period, setPeriod] = useState('mtd');
  const [data, setData] = useState(() => buildSeed());

  /* Edit handlers ----------------------------------------------------------- */
  const commitMetric = (sectionKey, key, region, newVal) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const m = next[sectionKey][key];
      applyEdit(m, region, newVal);
      return next;
    });
  };

  const commitNorthStar = (key, region, newVal) => commitMetric('northStar', key, region, newVal);

  const commitStage = (funnelKey, stageKey, region, newVal) => {
    setData((prev) => {
      const next = structuredClone(prev);
      const funnel = next[funnelKey];
      const stage = funnel.stages.find((s) => s.key === stageKey);
      if (!stage) return prev;
      applyEdit(stage, region, newVal);
      return next;
    });
  };

  const commitOverride = (funnelKey, text) => {
    setData((prev) => {
      const next = structuredClone(prev);
      next[funnelKey].override = text;
      return next;
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yobolabs-kpis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('Reset all values and notes to the seed data?')) {
      setData(buildSeed());
    }
  };

  /* Layout ------------------------------------------------------------------ */
  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      padding: '0 max(20px, env(safe-area-inset-left, 20px))',
    }}>
      <style>{detailFunnelCss}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Header region={region} setRegion={setRegion} period={period} setPeriod={setPeriod} />

        <NorthStarSection data={data} region={region} onCommit={commitNorthStar} />

        <section style={{ marginBottom: 32 }}>
          <SectionLabel label="Funnels" region={region} />
          <div className="yl-funnel-grid">
            <FunnelCard funnel={data.acquisition} region={region} onCommitStage={commitStage} onCommitOverride={commitOverride} />
            <FunnelCard funnel={data.activation} region={region} onCommitStage={commitStage} onCommitOverride={commitOverride} />
            <FunnelCard funnel={data.revenue} region={region} onCommitStage={commitStage} onCommitOverride={commitOverride} />
          </div>
        </section>

        <SectionLabel label="Customer Success" region={region} />
        <DetailFunnel funnel={data.cs} region={region} onCommitStage={commitStage} onCommitOverride={commitOverride} />

        <SectionLabel label="Campaign Performance" region={region} />
        <DetailFunnel funnel={data.campaign} region={region} onCommitStage={commitStage} onCommitOverride={commitOverride} />

        <Footer onExport={handleExport} onReset={handleReset} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Edit application (shared)                                                  */
/* -------------------------------------------------------------------------- */

function applyEdit(m, region, newVal) {
  if (m.kind === 'ratio') {
    m[region] = newVal;
    return;
  }
  if (region === 'combined') {
    const split = splitToRegions(m, newVal);
    m.id = split.id;
    m.us = split.us;
  } else {
    m[region] = newVal;
  }
}

/* -------------------------------------------------------------------------- */
/* Detail row CSS (injected once)                                             */
/* -------------------------------------------------------------------------- */

const detailFunnelCss = `
.yl-northstar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.yl-funnel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.yl-detail-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 96px minmax(280px, 1.4fr);
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--line);
}
.yl-detail-row:last-child {
  border-bottom: 0;
}
.yl-detail-num {
  font-size: 11px;
  color: var(--text-faint);
  letter-spacing: 0.05em;
}
.yl-detail-text {
  min-width: 0;
}
.yl-detail-value {
  text-align: right;
}
.yl-detail-meta {
  display: grid;
  grid-template-columns: 52px minmax(60px, 1fr) 56px 72px;
  gap: 14px;
  align-items: center;
}
.yl-detail-conv {
  font-size: 12px;
  text-align: right;
  font-weight: 500;
}
.yl-detail-bar {
  height: 4px;
  background: var(--line);
  border-radius: 2px;
  overflow: hidden;
}
.yl-detail-bar-fill {
  height: 100%;
  background: var(--text-faint);
  transition: width 200ms ease;
}
.yl-detail-delta {
  font-size: 12px;
  text-align: right;
  font-weight: 500;
}
.yl-detail-spark {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .yl-funnel-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 720px) {
  .yl-northstar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .yl-detail-row {
    grid-template-columns: 22px minmax(0, 1fr) auto;
    grid-template-areas:
      'num text value'
      'num meta meta';
    gap: 8px 12px;
    padding: 14px 0;
  }
  .yl-detail-num { grid-area: num; align-self: start; padding-top: 4px; }
  .yl-detail-text { grid-area: text; }
  .yl-detail-value { grid-area: value; align-self: start; padding-top: 2px; }
  .yl-detail-meta {
    grid-area: meta;
    grid-template-columns: auto minmax(60px, 1fr) auto auto;
    gap: 12px;
  }
  .yl-detail-conv { text-align: left; }
  .yl-detail-delta { text-align: left; }
  .yl-detail-spark { justify-content: flex-start; }
}
`;
