import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  ChevronDown,
  Database,
  Globe2,
  Image as ImageIcon,
  Megaphone,
  MessageCircle,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';

/* ============================================================================
 * YoboLabs — Mission Control
 * Single-page React cockpit. Brand palette: #6FED45 (live) + #000000 (ink)
 * + #FFFFFF (canvas) + #FF3B30 reserved for the "broken" semantic state only.
 * ========================================================================== */

const COLOR = { live: '#6FED45', bad: '#FF3B30', ink: '#000000', mid: '#686868', faint: '#C9C9C9' };

/* -------------------------------------------------------------------------- */
/* Mock data — calibrated to ~$1.3M ARR, ~40 brands, ~800 outlets, multi-region */
/* -------------------------------------------------------------------------- */

const spark = (n, base, swing, trend = 0) =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    y: Math.max(0, Math.round(base + Math.sin(i / 1.7) * swing + (i * trend) + (Math.random() - 0.5) * swing * 0.7)),
  }));

const kpis = [
  {
    id: 'mrr',
    label: 'MRR',
    value: '$108.5K',
    raw: 108500,
    delta: +8.2,
    deltaSuffix: '%',
    deltaLabel: 'vs. last month',
    target: { current: 108.5, goal: 115, unit: 'K' },
    healthy: true,
    sparkline: spark(30, 92, 4, 0.5),
    breakdown: [
      { k: 'Subscription', v: '$32.1K', pct: 30 },
      { k: 'Transaction · new', v: '$27.4K', pct: 25 },
      { k: 'Transaction · repeat', v: '$37.9K', pct: 35 },
      { k: 'Messaging passthrough', v: '$11.1K', pct: 10 },
    ],
  },
  {
    id: 'gp',
    label: 'Gross profit',
    value: '$76.1K',
    sub: '70.1% margin',
    delta: +2.0,
    deltaSuffix: 'pp',
    deltaLabel: 'vs. last month',
    target: { current: 70.1, goal: 72, unit: '%' },
    healthy: true,
    sparkline: spark(30, 64, 3, 0.4),
    breakdown: [
      { k: 'Subscription GP', v: '$28.5K', pct: 89 },
      { k: 'Transaction GP', v: '$42.6K', pct: 65 },
      { k: 'Messaging passthrough GP', v: '$5.0K', pct: 45 },
    ],
  },
  {
    id: 'outlets',
    label: 'Live outlets',
    value: '812',
    delta: +47,
    deltaSuffix: '',
    deltaLabel: 'net new this month',
    target: { current: 812, goal: 850, unit: '' },
    healthy: true,
    sparkline: spark(30, 750, 12, 2),
    breakdown: [
      { k: 'Indonesia', v: '612', pct: 75 },
      { k: 'Singapore', v: '94', pct: 12 },
      { k: 'Malaysia', v: '78', pct: 10 },
      { k: 'United States', v: '28', pct: 3 },
    ],
  },
  {
    id: 'brands',
    label: 'Live brands',
    value: '41',
    delta: +2,
    deltaSuffix: '',
    deltaLabel: 'net (+3 added, −1 churned)',
    target: { current: 41, goal: 45, unit: '' },
    healthy: true,
    sparkline: spark(30, 36, 1.2, 0.18),
    breakdown: [
      { k: 'New this month', v: '+3', pct: 0 },
      { k: 'Churned this month', v: '−1', pct: 0 },
      { k: 'In pilot', v: '6', pct: 0 },
      { k: 'Paid', v: '35', pct: 0 },
    ],
  },
  {
    id: 'eu',
    label: 'Active end-users · 30d',
    value: '1.24M',
    delta: +11.4,
    deltaSuffix: '%',
    deltaLabel: 'vs. last 30d',
    target: { current: 1.24, goal: 1.3, unit: 'M' },
    healthy: true,
    sparkline: spark(30, 1.05, 0.06, 0.008),
    breakdown: [
      { k: 'WhatsApp', v: '742K', pct: 60 },
      { k: 'Instagram', v: '348K', pct: 28 },
      { k: 'SMS', v: '149K', pct: 12 },
    ],
  },
  {
    id: 'db',
    label: 'Customer DB size',
    value: '8.74M',
    delta: +3.6,
    deltaSuffix: '%',
    deltaLabel: '+312K added in 30d',
    target: { current: 8.74, goal: 9.0, unit: 'M' },
    healthy: true,
    sparkline: spark(30, 8.1, 0.05, 0.022),
    breakdown: [
      { k: 'Indonesia', v: '6.42M', pct: 73 },
      { k: 'Malaysia', v: '1.18M', pct: 14 },
      { k: 'Singapore', v: '0.91M', pct: 10 },
      { k: 'United States', v: '0.23M', pct: 3 },
    ],
  },
];

const anomalies = [
  {
    severity: 'HIGH',
    area: 'Brand · Sambal House',
    headline: 'Repeat rate dropped 18% WoW',
    metric: '24.3% → 19.9%',
    benchmark: 'target 28%',
    action: 'Trigger win-back via Marketing Agent',
  },
  {
    severity: 'HIGH',
    area: 'Agent · Creative',
    headline: 'Image generation failure rate above threshold',
    metric: '6.8% errors / 24h',
    benchmark: 'threshold 5%',
    action: 'Inspect failed jobs',
  },
  {
    severity: 'MED',
    area: 'GTM · Paid Social',
    headline: 'Cost per MQL spiked 2.1× baseline',
    metric: '$184 → $387',
    benchmark: 'baseline $185',
    action: 'Pause underperforming creatives',
  },
  {
    severity: 'MED',
    area: 'Brand · Boba Lab',
    headline: 'No campaign sent in 14 days',
    metric: '0 sends / 14d',
    benchmark: 'cadence 7d',
    action: 'Schedule re-engagement run',
  },
  {
    severity: 'LOW',
    area: 'Pipeline · SQL stage',
    headline: 'Deal stuck >30 days',
    metric: 'Acme F&B · 34d',
    benchmark: 'avg 12d',
    action: 'Reach out today',
  },
];

const brands = [
  { name: 'Kopi Nusantara', country: 'ID', mrr: 7200, gmv: 412000, sales: 24800, repeat: 38.4, outlets: 84, tier: 'Paid', healthy: true },
  { name: 'Sambal House', country: 'ID', mrr: 5800, gmv: 286000, sales: 14200, repeat: 19.9, outlets: 62, tier: 'Paid', healthy: false },
  { name: 'Sushi Sora', country: 'SG', mrr: 5400, gmv: 318000, sales: 9800, repeat: 41.2, outlets: 47, tier: 'Paid', healthy: true },
  { name: 'Boba Lab', country: 'ID', mrr: 4900, gmv: 244000, sales: 28100, repeat: 33.1, outlets: 71, tier: 'Paid', healthy: false },
  { name: 'Mie Goreng Khas', country: 'ID', mrr: 4200, gmv: 198000, sales: 16400, repeat: 29.7, outlets: 53, tier: 'Paid', healthy: true },
  { name: 'Roti Bakar Bandung', country: 'ID', mrr: 3800, gmv: 167000, sales: 11900, repeat: 31.5, outlets: 38, tier: 'Paid', healthy: true },
  { name: 'Teh Botol Co.', country: 'MY', mrr: 3400, gmv: 142000, sales: 13700, repeat: 36.2, outlets: 44, tier: 'Paid', healthy: true },
  { name: 'Ayam Kremes', country: 'ID', mrr: 3100, gmv: 121000, sales: 8400, repeat: 26.8, outlets: 29, tier: 'Paid', healthy: true },
  { name: 'Dim Sum Wok', country: 'SG', mrr: 2700, gmv: 109000, sales: 5200, repeat: 39.4, outlets: 31, tier: 'Paid', healthy: true },
  { name: 'Nasi Padang Express', country: 'ID', mrr: 2400, gmv: 88000, sales: 7100, repeat: 28.4, outlets: 24, tier: 'Paid', healthy: true },
  { name: 'Hawker Heritage', country: 'SG', mrr: 1900, gmv: 71000, sales: 3200, repeat: 34.0, outlets: 16, tier: 'Pilot', healthy: true },
  { name: 'Pasar Pagi', country: 'ID', mrr: 1400, gmv: 42000, sales: 2900, repeat: 22.1, outlets: 12, tier: 'Pilot', healthy: false },
];

const funnel = [
  { stage: 'Leads', count: 2840, target: 3000, conv: null },
  { stage: 'MQLs', count: 612, target: 600, conv: 21.5 },
  { stage: 'SQLs', count: 184, target: 200, conv: 30.1 },
  { stage: 'Active accounts', count: 64, target: 70, conv: 34.8 },
  { stage: 'Paid accounts', count: 41, target: 45, conv: 64.1 },
  { stage: 'Upsell accounts', count: 14, target: 12, conv: 34.1 },
];

const channels = [
  { name: 'SEO', volume: '12.4K sessions', mqls: 184, cost: '$2.1K', healthy: true, sub: 'CPL $11' },
  { name: 'Organic Social', volume: '38.2K reach', mqls: 142, cost: '$0', healthy: true, sub: '+6.4K followers' },
  { name: 'Paid Social', volume: '$24.6K spend', mqls: 96, cost: '$24.6K', healthy: false, sub: 'CPL $387' },
  { name: 'Outbound', volume: '4.2K touches', mqls: 124, cost: '$3.4K', healthy: true, sub: '6.8% reply' },
  { name: 'Channel Partner', volume: '11 partners', mqls: 66, cost: '$5.2K', healthy: true, sub: '18% rev share' },
];

const agents = [
  {
    id: 'growth',
    name: 'Growth Agent',
    role: 'Orchestrator',
    icon: Bot,
    status: 'live',
    primary: { v: '184', label: 'tasks dispatched · 24h' },
    quality: { v: '12', label: 'workflows live' },
    spark: spark(7, 22, 5, 0.8),
    last: 'Dispatched win-back to 3 brands · 4m ago',
  },
  {
    id: 'data',
    name: 'Data Agent',
    role: 'Segmentation & scoring',
    icon: Database,
    status: 'live',
    primary: { v: '47', label: 'segments built · 24h' },
    quality: { v: '128K', label: 'scores generated' },
    spark: spark(7, 18, 4, 0.6),
    last: 'Refreshed propensity scores · 11m ago',
  },
  {
    id: 'marketing',
    name: 'Marketing Agent',
    role: 'Campaign shipping',
    icon: Megaphone,
    status: 'live',
    primary: { v: '38', label: 'campaigns shipped · 24h' },
    quality: { v: '94%', label: 'completeness (G·S·T·O·C·CTA)' },
    spark: spark(7, 28, 6, 0.4),
    last: 'Sent “Lebaran preview” for Kopi Nusantara · 22m ago',
  },
  {
    id: 'creative',
    name: 'Creative Agent',
    role: 'Image & video gen',
    icon: ImageIcon,
    status: 'bad',
    primary: { v: '412', label: 'assets generated · 24h' },
    quality: { v: '93.2%', label: 'approval rate' },
    spark: spark(7, 50, 12, -0.4),
    last: '6.8% job failures last 24h · review queue',
  },
  {
    id: 'cs',
    name: 'Customer Service Agent',
    role: 'IG · WA threads',
    icon: MessageCircle,
    status: 'live',
    primary: { v: '2,148', label: 'threads handled · 24h' },
    quality: { v: '4.1%', label: 'escalation rate' },
    spark: spark(7, 280, 38, 1.2),
    last: 'Resolved 312 IG DMs in last hour',
  },
  {
    id: 'sales',
    name: 'Sales Agent',
    role: 'Follow-up sequencing',
    icon: ShoppingBag,
    status: 'live',
    primary: { v: '94', label: 'sequences active' },
    quality: { v: '11.7%', label: 'sequence-to-purchase' },
    spark: spark(7, 80, 6, 0.6),
    last: 'Booked 4 demos overnight',
  },
];

/* -------------------------------------------------------------------------- */
/* Atoms                                                                      */
/* -------------------------------------------------------------------------- */

function StatusDot({ healthy = true, live = false, size = 8 }) {
  const color = healthy ? COLOR.live : COLOR.bad;
  return (
    <span
      className={live && healthy ? 'dot-live inline-block rounded-full' : 'inline-block rounded-full'}
      style={{ width: size, height: size, background: color }}
    />
  );
}

function Label({ children, className = '' }) {
  return (
    <div className={`text-[11px] font-medium uppercase tracking-wider text-ink-400 ${className}`}>
      {children}
    </div>
  );
}

function Delta({ value, suffix = '%', goodWhenPositive = true, label }) {
  const positive = value >= 0;
  const good = positive === goodWhenPositive;
  const Arrow = positive ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-baseline gap-2 tnum">
      <span
        className="inline-flex items-center gap-1 text-[13px] font-medium"
        style={{ color: good ? COLOR.live : COLOR.bad }}
      >
        <Arrow size={12} strokeWidth={2.5} />
        {positive ? '+' : ''}
        {value}
        {suffix}
      </span>
      {label && <span className="text-[12px] text-ink-400">{label}</span>}
    </div>
  );
}

function Sparkline({ data, healthy = true, height = 28 }) {
  const stroke = healthy ? COLOR.ink : COLOR.bad;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line
            type="monotone"
            dataKey="y"
            stroke={stroke}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniArea({ data, healthy = true, height = 36 }) {
  const stroke = healthy ? COLOR.ink : COLOR.bad;
  const fillId = `fill-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="y"
            stroke={stroke}
            strokeWidth={1.6}
            fill={`url(#${fillId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Two stacked horizontal bars: current vs target. Mono only. */
function DualBar({ current, target, unit = '', healthy = true }) {
  const max = Math.max(current, target) * 1.05;
  const cw = Math.min(100, (current / max) * 100);
  const tw = Math.min(100, (target / max) * 100);
  const goodTone = healthy ? COLOR.live : COLOR.bad;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-10 text-[10px] uppercase tracking-wider text-ink-400">Now</span>
        <div className="relative h-1.5 flex-1 bg-ink-100">
          <div className="absolute inset-y-0 left-0" style={{ width: `${cw}%`, background: goodTone }} />
        </div>
        <span className="w-14 text-right text-[11px] font-medium tabular-nums">
          {current}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-10 text-[10px] uppercase tracking-wider text-ink-400">Goal</span>
        <div className="relative h-1.5 flex-1 bg-ink-100">
          <div className="absolute inset-y-0 left-0 bg-ink-900" style={{ width: `${tw}%` }} />
        </div>
        <span className="w-14 text-right text-[11px] font-medium tabular-nums">
          {target}
          {unit}
        </span>
      </div>
    </div>
  );
}

function YoboMark({ size = 28, variant = 'light' }) {
  // light-bg variant = black tile + green mark (the dashboard default).
  // dark-bg variant  = green tile + black mark (per brand guide page 4).
  const tile = variant === 'dark' ? COLOR.live : COLOR.ink;
  const mark = variant === 'dark' ? COLOR.ink : COLOR.live;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <rect width="64" height="64" rx="12" fill={tile} />
      <line x1="50" y1="13" x2="14" y2="51" stroke={mark} strokeWidth="7" strokeLinecap="round" />
      <circle cx="19" cy="20" r="5" fill={mark} />
      <path d="M45 50 L52 36 L38 50 Z" fill={mark} />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

function Header({ period, setPeriod, region, setRegion }) {
  const periods = ['Today', '7d', '30d', '90d', 'YTD'];
  const regions = ['All', 'ID', 'SG', 'MY', 'US'];
  const now = new Date();
  const stamp = now.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-ink-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <YoboMark size={32} />
          <div className="leading-none">
            <div className="text-[18px] tracking-tight text-ink-900">
              <span className="font-brandYobo">Yobo</span>
              <span className="font-brandLabs font-medium">Labs</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">Mission Control</div>
          </div>
        </div>

        <div className="hidden md:ml-6 md:flex md:items-center md:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-400">
            <span className="dot-live inline-block h-1.5 w-1.5 rounded-full" style={{ background: COLOR.live }} />
            Live · {stamp}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Segmented value={period} options={periods} onChange={setPeriod} icon="cal" />
          <Segmented value={region} options={regions} onChange={setRegion} icon="globe" />
        </div>
      </div>
    </header>
  );
}

function Segmented({ value, options, onChange, icon }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 p-0.5">
      {icon === 'globe' && <Globe2 className="ml-1.5 h-3.5 w-3.5 text-ink-400" />}
      {icon === 'cal' && (
        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-400">Period</span>
      )}
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide transition ${
            value === o ? 'bg-ink-900 text-ink-0' : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer 1 — Company Health                                                   */
/* -------------------------------------------------------------------------- */

function Layer1({ onOpenBreakdown }) {
  return (
    <Section
      eyebrow="Layer 01"
      title="Company health"
      caption="Glanceable state of the business · click any tile for breakdown"
    >
      <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 sm:gap-3 lg:grid-cols-6">
          {kpis.map((k) => (
            <KPITile key={k.id} kpi={k} onClick={() => onOpenBreakdown(k)} />
          ))}
        </div>
      </div>
    </Section>
  );
}

function KPITile({ kpi, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-[260px] flex-col items-stretch gap-3 border border-ink-100 bg-ink-0 p-4 text-left transition hover:border-ink-900 sm:w-auto"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot healthy={kpi.healthy} live />
          <Label>{kpi.label}</Label>
        </div>
        <div className="h-7 w-16 opacity-90">
          <Sparkline data={kpi.sparkline} healthy={kpi.healthy} height={28} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-[44px] font-bold leading-none tracking-tight tnum sm:text-[48px]">
          {kpi.value}
        </div>
        {kpi.sub && <div className="text-[12px] text-ink-400">{kpi.sub}</div>}
      </div>

      <Delta value={kpi.delta} suffix={kpi.deltaSuffix} label={kpi.deltaLabel} />

      <div className="dotted-rule mt-1" />

      <DualBar
        current={kpi.target.current}
        target={kpi.target.goal}
        unit={kpi.target.unit}
        healthy={kpi.healthy}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer 2 — Needs Attention                                                  */
/* -------------------------------------------------------------------------- */

function Layer2() {
  return (
    <Section
      eyebrow="Layer 02"
      title="Needs attention"
      caption={`${anomalies.length} signals off-track this week · auto-detected`}
      indicator={<StatusDot healthy={false} />}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {anomalies.map((a, i) => (
          <AnomalyCard key={i} a={a} />
        ))}
      </div>
    </Section>
  );
}

function AnomalyCard({ a }) {
  const severityTone =
    a.severity === 'HIGH' ? COLOR.bad : a.severity === 'MED' ? COLOR.ink : COLOR.mid;
  return (
    <div className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4 transition hover:border-ink-900">
      <div className="flex items-center gap-2">
        <StatusDot healthy={false} />
        <span
          className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: a.severity === 'HIGH' ? COLOR.bad : a.severity === 'LOW' ? '#E5E5E5' : COLOR.ink,
            color: a.severity === 'LOW' ? COLOR.ink : '#FFFFFF',
          }}
        >
          {a.severity}
        </span>
        <span className="ml-auto text-[11px] uppercase tracking-wider text-ink-400">{a.area}</span>
      </div>

      <div className="text-[15px] font-medium leading-snug text-ink-900">{a.headline}</div>

      <div className="flex items-baseline gap-2 tnum">
        <span className="text-[24px] font-bold leading-none" style={{ color: severityTone }}>
          {a.metric}
        </span>
        <span className="text-[11px] text-ink-400">{a.benchmark}</span>
      </div>

      <div className="dotted-rule" />

      <button className="group inline-flex items-center justify-between text-[12px] font-medium text-ink-900">
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangle size={12} strokeWidth={2.4} />
          {a.action}
        </span>
        <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer 3 — Brand Portfolio                                                  */
/* -------------------------------------------------------------------------- */

function Layer3({ onOpenBrand }) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('mrr');
  const sorted = useMemo(() => {
    const arr = [...brands];
    arr.sort((a, b) => (typeof b[sort] === 'number' ? b[sort] - a[sort] : 0));
    return arr;
  }, [sort]);

  const totalMRR = brands.reduce((s, b) => s + b.mrr, 0);
  const totalGMV = brands.reduce((s, b) => s + b.gmv, 0);
  const unhealthy = brands.filter((b) => !b.healthy).length;

  return (
    <CollapsibleSection
      eyebrow="Layer 03"
      title="Brand portfolio"
      caption={`${brands.length} brands · $${(totalMRR / 1000).toFixed(1)}K MRR · $${(totalGMV / 1e6).toFixed(2)}M GMV (30d) · ${unhealthy} flagged`}
      open={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <StatusDot healthy />
            <span className="text-[12px] tabular-nums">{brands.length - unhealthy} healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusDot healthy={false} />
            <span className="text-[12px] tabular-nums">{unhealthy} flagged</span>
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto border border-ink-100">
        <table className="w-full min-w-[820px] text-left text-[13px] tnum">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50 text-[10px] uppercase tracking-wider text-ink-400">
              <Th>Brand</Th>
              <Th sortable onClick={() => setSort('mrr')} active={sort === 'mrr'} align="right">
                MRR
              </Th>
              <Th sortable onClick={() => setSort('gmv')} active={sort === 'gmv'} align="right">
                GMV · 30d
              </Th>
              <Th sortable onClick={() => setSort('sales')} active={sort === 'sales'} align="right">
                Sales gen.
              </Th>
              <Th sortable onClick={() => setSort('repeat')} active={sort === 'repeat'} align="right">
                Repeat rate
              </Th>
              <Th sortable onClick={() => setSort('outlets')} active={sort === 'outlets'} align="right">
                Live outlets
              </Th>
              <Th align="right">Health</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr
                key={b.name}
                onClick={() => onOpenBrand(b)}
                className="cursor-pointer border-b border-ink-100 transition hover:bg-ink-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StatusDot healthy={b.healthy} />
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-400">
                        {b.country} · {b.tier}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">${(b.mrr / 1000).toFixed(1)}K</td>
                <td className="px-4 py-3 text-right">${(b.gmv / 1000).toFixed(0)}K</td>
                <td className="px-4 py-3 text-right">{b.sales.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <span style={{ color: b.repeat >= 28 ? COLOR.live : COLOR.bad }}>
                    {b.repeat.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{b.outlets}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <StatusDot healthy={b.healthy} />
                    <span className="text-[11px] uppercase tracking-wider text-ink-400">
                      {b.healthy ? 'On track' : 'Flagged'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}

function Th({ children, align = 'left', sortable, active, onClick }) {
  return (
    <th
      onClick={sortable ? onClick : undefined}
      className={`px-4 py-2.5 font-medium ${align === 'right' ? 'text-right' : 'text-left'} ${
        sortable ? 'cursor-pointer select-none hover:text-ink-900' : ''
      } ${active ? 'text-ink-900' : ''}`}
    >
      {children}
      {sortable && active && <span className="ml-1">↓</span>}
    </th>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer 4 — GTM Funnel                                                       */
/* -------------------------------------------------------------------------- */

function Layer4() {
  const [open, setOpen] = useState(false);
  const max = funnel[0].count;

  return (
    <CollapsibleSection
      eyebrow="Layer 04"
      title="YOBO GTM funnel"
      caption="Your own pipeline · leads to upsell · 30d window"
      open={open}
      onToggle={() => setOpen((v) => !v)}
      summary={
        <div className="flex items-center gap-4 text-[12px] tnum">
          <span>
            <span className="text-ink-400">Leads</span> 2,840
          </span>
          <span>
            <span className="text-ink-400">→ Paid</span> 41
          </span>
          <span style={{ color: COLOR.bad }}>CPL $387 · paid social</span>
        </div>
      }
    >
      {/* Funnel */}
      <div className="space-y-2 border border-ink-100 bg-ink-0 p-4">
        <Label>Funnel · last 30d</Label>
        <div className="space-y-1.5">
          {funnel.map((s, i) => {
            const w = (s.count / max) * 100;
            const onTarget = s.count >= s.target;
            return (
              <div key={s.stage} className="grid grid-cols-12 items-center gap-3">
                <div className="col-span-12 sm:col-span-3">
                  <div className="text-[13px] font-medium">{s.stage}</div>
                  <div className="text-[11px] uppercase tracking-wider text-ink-400">
                    target {s.target.toLocaleString()}
                  </div>
                </div>
                <div className="col-span-9 sm:col-span-7">
                  <div className="relative h-7 bg-ink-100">
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{ width: `${w}%`, background: onTarget ? COLOR.ink : COLOR.bad }}
                    />
                    <div
                      className="pointer-events-none absolute inset-y-0 border-r border-dashed border-ink-400"
                      style={{ left: `${(s.target / max) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-3 sm:col-span-2 text-right">
                  <div className="text-[15px] font-bold tabular-nums">{s.count.toLocaleString()}</div>
                  {s.conv != null && (
                    <div
                      className="text-[11px] tabular-nums"
                      style={{ color: i > 0 && s.conv < 25 ? COLOR.bad : COLOR.mid }}
                    >
                      {s.conv}% → next
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost panel */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CostStat label="Cost per MQL" value="$184" target="target $150" healthy={false} delta={+12} />
        <CostStat label="Blended CAC" value="$612" target="target $700" healthy delta={-4.1} />
        <CostStat label="LTV : CAC" value="4.8×" target="target 3.0×" healthy delta={+8.4} />
        <CostStat label="CAC payback" value="9.2 mo" target="target 12 mo" healthy delta={-3.0} />
      </div>

      {/* Channel attribution */}
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
        {channels.map((c) => (
          <div
            key={c.name}
            className="flex flex-col gap-1.5 border border-ink-100 bg-ink-0 p-3"
          >
            <div className="flex items-center gap-1.5">
              <StatusDot healthy={c.healthy} />
              <Label>{c.name}</Label>
            </div>
            <div className="text-[20px] font-bold tabular-nums">{c.mqls}</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-400">MQLs · 30d</div>
            <div className="text-[12px] tabular-nums">{c.volume}</div>
            <div className="text-[11px]" style={{ color: c.healthy ? COLOR.mid : COLOR.bad }}>
              {c.sub}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

function CostStat({ label, value, target, healthy, delta }) {
  return (
    <div className="border border-ink-100 bg-ink-0 p-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Delta value={delta} suffix="%" goodWhenPositive={false} />
      </div>
      <div className="mt-2 text-[28px] font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider" style={{ color: healthy ? COLOR.mid : COLOR.bad }}>
        {target}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layer 5 — Agent Operations                                                 */
/* -------------------------------------------------------------------------- */

function Layer5() {
  return (
    <Section
      eyebrow="Layer 05"
      title="Agent operations"
      caption="Autonomous execution layer · always visible · YOBO's product"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
      </div>
    </Section>
  );
}

function AgentCard({ a }) {
  const Icon = a.icon;
  const healthy = a.status === 'live';
  return (
    <div className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center border border-ink-900 bg-ink-900 text-ink-0">
          <Icon size={16} strokeWidth={2} />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-bold tracking-tight">{a.name}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-400">{a.role}</div>
        </div>
        <div className="ml-auto inline-flex items-center gap-1.5">
          <StatusDot healthy={healthy} live={healthy} />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: healthy ? COLOR.live : COLOR.bad }}
          >
            {healthy ? 'Running' : 'Error'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <div>
          <div className="text-[36px] font-bold leading-none tabular-nums">{a.primary.v}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{a.primary.label}</div>
        </div>
        <div className="text-right">
          <div className="text-[20px] font-bold tabular-nums">{a.quality.v}</div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{a.quality.label}</div>
        </div>
      </div>

      <div className="-mx-1">
        <MiniArea data={a.spark} healthy={healthy} height={36} />
      </div>

      <div className="dotted-rule" />

      <div className="text-[11px] text-ink-400">
        <span className="uppercase tracking-wider">Last action</span> · {a.last}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout helpers                                                             */
/* -------------------------------------------------------------------------- */

function Section({ eyebrow, title, caption, indicator, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Label>{eyebrow}</Label>
          <h2 className="mt-1 text-[20px] font-bold tracking-tight sm:text-[24px]">{title}</h2>
          {caption && <p className="mt-0.5 text-[12px] text-ink-400">{caption}</p>}
        </div>
        {indicator}
      </div>
      {children}
    </section>
  );
}

function CollapsibleSection({ eyebrow, title, caption, open, onToggle, summary, children }) {
  return (
    <section className="space-y-3">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 border border-ink-100 bg-ink-50 px-4 py-3 text-left transition hover:bg-ink-100"
      >
        <div>
          <Label>{eyebrow}</Label>
          <div className="mt-0.5 flex items-baseline gap-3">
            <h2 className="text-[18px] font-bold tracking-tight">{title}</h2>
            {caption && <span className="hidden text-[12px] text-ink-400 sm:inline">{caption}</span>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {summary}
          <ChevronDown
            size={18}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Drilldown modals                                                           */
/* -------------------------------------------------------------------------- */

function BreakdownModal({ kpi, onClose }) {
  if (!kpi) return null;
  return (
    <Modal title={kpi.label} subtitle={kpi.value} onClose={onClose}>
      <div className="grid gap-2">
        {kpi.breakdown.map((b) => (
          <div key={b.k} className="flex items-center gap-3">
            <div className="w-44 text-[13px]">{b.k}</div>
            <div className="relative h-2 flex-1 bg-ink-100">
              <div className="absolute inset-y-0 left-0 bg-ink-900" style={{ width: `${b.pct}%` }} />
            </div>
            <div className="w-20 text-right text-[13px] font-medium tabular-nums">{b.v}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function BrandDetailModal({ brand, onClose }) {
  if (!brand) return null;
  const breakMrr = [
    { k: 'Subscription', v: `$${(brand.mrr * 0.32).toFixed(0)}` },
    { k: 'Transaction', v: `$${(brand.mrr * 0.55).toFixed(0)}` },
    { k: 'Messaging passthrough', v: `$${(brand.mrr * 0.13).toFixed(0)}` },
  ];
  const wa = {
    sent: 412800,
    delivered: 408120,
    open: 0.541,
    click: 0.124,
    conversion: 0.038,
    aov: 14.2,
    roas: 6.4,
  };
  return (
    <Modal
      title={brand.name}
      subtitle={`${brand.country} · ${brand.tier} · ${brand.outlets} outlets`}
      onClose={onClose}
      wide
    >
      {/* Commercial */}
      <Strip eyebrow="Commercial">
        <KV label="MRR" value={`$${(brand.mrr / 1000).toFixed(1)}K`} big />
        <KV label="GMV · 30d" value={`$${(brand.gmv / 1000).toFixed(0)}K`} big />
        <KV label="Sales generated" value={brand.sales.toLocaleString()} big />
        <KV label="Repeat rate" value={`${brand.repeat.toFixed(1)}%`} healthy={brand.repeat >= 28} big />
      </Strip>

      <div className="dotted-rule my-4" />

      <Strip eyebrow="MRR breakdown">
        {breakMrr.map((b) => (
          <KV key={b.k} label={b.k} value={b.v} />
        ))}
      </Strip>

      <Strip eyebrow="GMV split (30d)">
        <KV label="New signup" value={`$${((brand.gmv * 0.18) / 1000).toFixed(0)}K`} />
        <KV label="New generated" value={`$${((brand.gmv * 0.27) / 1000).toFixed(0)}K`} />
        <KV label="Repeat" value={`$${((brand.gmv * 0.55) / 1000).toFixed(0)}K`} />
      </Strip>

      <div className="dotted-rule my-4" />

      <Strip eyebrow="Execution · WhatsApp">
        <KV label="Sent" value={wa.sent.toLocaleString()} />
        <KV label="Delivered" value={`${(wa.delivered / wa.sent * 100).toFixed(1)}%`} />
        <KV label="Open" value={`${(wa.open * 100).toFixed(1)}%`} />
        <KV label="Click" value={`${(wa.click * 100).toFixed(1)}%`} />
        <KV label="Conversion" value={`${(wa.conversion * 100).toFixed(2)}%`} />
        <KV label="AOV" value={`$${wa.aov.toFixed(2)}`} />
        <KV label="ROAS" value={`${wa.roas}×`} healthy={wa.roas >= 4} />
      </Strip>

      <Strip eyebrow="Loyalty">
        <KV label="Repeat rate" value={`${brand.repeat.toFixed(1)}%`} healthy={brand.repeat >= 28} />
        <KV label="Frequency · 90d" value={`${(brand.repeat / 12).toFixed(2)}× / cust`} />
        <KV label="Spend / cust · 90d" value={`$${(brand.gmv / 1000 / brand.outlets * 0.42).toFixed(2)}`} />
        <KV label="New signups · 30d" value={Math.round(brand.sales * 0.18).toLocaleString()} />
      </Strip>

      <div className="dotted-rule my-4" />

      <Strip eyebrow="Agent activity">
        <KV label="Agents running" value="Growth · Marketing · Data · Creative · CS" />
        <KV label="Last campaign" value="“Lebaran preview” · 22m ago · ROAS 6.4×" />
        <KV label="Next scheduled" value="Win-back to lapsed · in 3h" />
      </Strip>
    </Modal>
  );
}

function Strip({ eyebrow, children }) {
  return (
    <div className="space-y-2">
      <Label>{eyebrow}</Label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </div>
  );
}

function KV({ label, value, big, healthy }) {
  const tone = healthy === false ? COLOR.bad : healthy === true ? COLOR.live : COLOR.ink;
  return (
    <div className="border border-ink-100 bg-ink-0 p-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-400">{label}</div>
      <div
        className={`mt-1 font-bold tabular-nums ${big ? 'text-[26px] leading-none' : 'text-[15px]'}`}
        style={{ color: healthy != null ? tone : COLOR.ink }}
      >
        {value}
      </div>
    </div>
  );
}

function Modal({ title, subtitle, onClose, wide, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden border border-ink-100 bg-ink-0 ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-md'
        }`}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <div className="text-[18px] font-bold tracking-tight">{title}</div>
            {subtitle && <div className="mt-0.5 text-[12px] text-ink-400">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 items-center justify-center text-ink-400 hover:text-ink-900"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Top-level                                                                  */
/* -------------------------------------------------------------------------- */

export default function MissionControl() {
  const [period, setPeriod] = useState('30d');
  const [region, setRegion] = useState('All');
  const [openKpi, setOpenKpi] = useState(null);
  const [openBrand, setOpenBrand] = useState(null);

  return (
    <div className="min-h-screen bg-ink-0 text-ink-900 font-sans">
      <Header period={period} setPeriod={setPeriod} region={region} setRegion={setRegion} />

      <main className="mx-auto max-w-[1440px] space-y-12 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <Layer1 onOpenBreakdown={setOpenKpi} />
        <Layer2 />
        <Layer3 onOpenBrand={setOpenBrand} />
        <Layer4 />
        <Layer5 />

        <footer className="border-t border-ink-100 pt-6 text-[11px] uppercase tracking-wider text-ink-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <YoboMark size={16} />
              <span>YoboLabs · Mission Control</span>
            </div>
            <div>
              Set <span className="text-ink-900">●</span> · Run <span className="text-ink-900">/</span> · Win{' '}
              <span style={{ color: COLOR.live }}>▲</span>
            </div>
          </div>
        </footer>
      </main>

      <BreakdownModal kpi={openKpi} onClose={() => setOpenKpi(null)} />
      <BrandDetailModal brand={openBrand} onClose={() => setOpenBrand(null)} />
    </div>
  );
}
