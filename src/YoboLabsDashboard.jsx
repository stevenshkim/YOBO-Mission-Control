import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildSeed, loadState, saveState, clearState, timeFraction } from './data.js';

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
/* Stage label resolution (ROI stage derives from config)                     */
/* -------------------------------------------------------------------------- */

function stageLabel(stage, config) {
  if (stage.roiStage) return `${config.roiMultiple}x ROI`;
  return stage.label;
}

function stageSource(stage, config) {
  if (stage.roiStage) return `Driving ${config.roiMultiple}x monthly cost in sales`;
  return stage.source;
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

function convColor(pct, config) {
  if (pct === null || pct === undefined) return C.dim;
  if (pct >= config.convGood) return C.green;
  if (pct < config.convBad) return C.red;
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
/* Pace vs target (SPEC 7.3)                                                  */
/* -------------------------------------------------------------------------- */

/* Stock and ratio metrics compare level to target directly. Flow metrics
 * compare accrual to the elapsed share of the target. */
function paceInfo(metric, target, region, period) {
  if (!target) return null;
  const targetVal = metricVal(target, region);
  if (!targetVal) return null;
  const actual = metricVal(metric, region);
  const frac = metric.kind === 'ratio' || metric.stock ? 1 : timeFraction(period);
  const expected = targetVal * frac;
  if (expected <= 0) return null;
  const pace = Math.round((actual / expected) * 100);
  const status = pace >= 110 ? 'ahead' : pace >= 95 ? 'on track' : pace >= 80 ? 'watch' : 'behind';
  return { targetVal, pace, status };
}

const PACE_COLOR = { ahead: null, 'on track': null, watch: C.amber, behind: C.red };

/* -------------------------------------------------------------------------- */
/* Auto-suggestion                                                            */
/* -------------------------------------------------------------------------- */

function autoSuggest(funnel, region, config) {
  const stages = funnel.stages.map((s) => ({
    label: stageLabel(s, config),
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
  if (weakest && weakest.conv < config.convBad) {
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
        whiteSpace: 'nowrap',
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

function NorthStarTile({ metric, target, region, period, onCommit, onCommitTarget }) {
  const val = metricVal(metric, region);
  const trend = metricTrend(metric, region);
  const delta = trendDelta(trend);
  const sparkColor = deltaColor(delta.dir);
  const pace = paceInfo(metric, target, region, period);

  return (
    <div className="yl-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, color: C.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
        {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <EditableNumber
          value={val}
          format={metric.format}
          onChange={(v) => onCommit(metric.key, region, v)}
          align="left"
          size="clamp(20px, 6.5vw, 28px)"
          weight={600}
        />
        <span className="yl-num" style={{ fontSize: 12, color: sparkColor, fontWeight: 500 }}>
          {deltaText(delta)}
        </span>
      </div>
      <Sparkline points={trend} w={120} h={26} color={sparkColor} area />
      {pace && (
        <div className="yl-num" style={{
          display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap',
          fontSize: 11, color: C.faint,
        }}>
          <span>Target</span>
          <EditableNumber
            value={pace.targetVal}
            format={metric.format}
            onChange={(v) => onCommitTarget(metric.key, region, v)}
            align="left"
            size={11}
            weight={500}
            color={C.dim}
          />
          <span>· pace {pace.pace}%</span>
          <span style={{ color: PACE_COLOR[pace.status] || C.faint, fontWeight: 500 }}>
            {pace.status}
          </span>
        </div>
      )}
    </div>
  );
}

function NorthStarSection({ slice, targets, region, period, onCommit, onCommitTarget }) {
  const tiles = [slice.northStar.arr, slice.northStar.newMrr, slice.northStar.activeCustomers, slice.northStar.nrr];
  return (
    <section style={{ marginBottom: 32 }}>
      <SectionLabel label="North Star" region={region} />
      <div className="yl-northstar-grid">
        {tiles.map((m) => (
          <NorthStarTile
            key={m.key}
            metric={m}
            target={targets[m.key]}
            region={region}
            period={period}
            onCommit={onCommit}
            onCommitTarget={onCommitTarget}
          />
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Top funnel card                                                            */
/* -------------------------------------------------------------------------- */

function FunnelCard({ funnel, override, config, region, onCommitStage, onCommitOverride }) {
  const suggestion = useMemo(() => autoSuggest(funnel, region, config), [funnel, region, config]);
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
              {stageLabel(s, config)}
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
              fontSize: 12, textAlign: 'right', color: convColor(s.conv, config), fontWeight: 500,
            }}>
              {s.conv === null ? '' : Math.round(s.conv) + '%'}
            </span>
          </div>
        ))}
      </div>
      <ActionBanner funnelKey={funnel.key} override={override} suggestion={suggestion} onCommitOverride={onCommitOverride} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Action banner                                                              */
/* -------------------------------------------------------------------------- */

function ActionBanner({ funnelKey, override, suggestion, onCommitOverride }) {
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
          value={override}
          onChange={(t) => onCommitOverride(funnelKey, t)}
          placeholder="Add your note"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail funnel (CS + Campaign)                                              */
/* -------------------------------------------------------------------------- */

function DetailFunnel({ funnel, override, config, region, onCommitStage, onCommitOverride }) {
  const suggestion = useMemo(() => autoSuggest(funnel, region, config), [funnel, region, config]);
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
          End to end: <span className="yl-num" style={{ color: convColor(e2e, config), fontWeight: 600 }}>{Math.round(e2e)}%</span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginBottom: 14 }}>{funnel.scope}</div>
      <div>
        {stages.map((s) => (
          <DetailStageRow
            key={s.key}
            stage={s}
            funnelKey={funnel.key}
            config={config}
            region={region}
            maxVal={maxVal}
            onCommitStage={onCommitStage}
          />
        ))}
      </div>
      <div style={{ marginTop: 14 }}>
        <ActionBanner funnelKey={funnel.key} override={override} suggestion={suggestion} onCommitOverride={onCommitOverride} />
      </div>
    </section>
  );
}

function DetailStageRow({ stage, funnelKey, config, region, maxVal, onCommitStage }) {
  const barPct = Math.max(2, (stage.val / maxVal) * 100);
  return (
    <div className="yl-detail-row">
      <span className="yl-detail-num">{String(stage.i + 1).padStart(2, '0')}</span>
      <div className="yl-detail-text">
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{stageLabel(stage, config)}</div>
        <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{stageSource(stage, config)}</div>
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
        <span className="yl-detail-conv yl-num" style={{ color: convColor(stage.conv, config) }}>
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
/* Config row + footer                                                        */
/* -------------------------------------------------------------------------- */

function ConfigRow({ config, onCommitConfig }) {
  const item = { display: 'flex', gap: 6, alignItems: 'baseline' };
  return (
    <div style={{
      marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.line}`,
      display: 'flex', gap: 24, alignItems: 'baseline', flexWrap: 'wrap',
    }}>
      <span className="yl-section-label">Config</span>
      <span style={{ ...item, fontSize: 12, color: C.dim }}>
        ROI multiple
        <EditableNumber value={config.roiMultiple} format="int" onChange={(v) => onCommitConfig('roiMultiple', v)} size={12} weight={600} color={C.text} align="left" />
      </span>
      <span style={{ ...item, fontSize: 12, color: C.dim }}>
        Conv good
        <EditableNumber value={config.convGood} format="pct" onChange={(v) => onCommitConfig('convGood', v)} size={12} weight={600} color={C.text} align="left" />
      </span>
      <span style={{ ...item, fontSize: 12, color: C.dim }}>
        Conv bad
        <EditableNumber value={config.convBad} format="pct" onChange={(v) => onCommitConfig('convBad', v)} size={12} weight={600} color={C.text} align="left" />
      </span>
    </div>
  );
}

function Footer({ onExport, onReset }) {
  return (
    <footer style={{
      marginTop: 16, paddingTop: 20, borderTop: `1px solid ${C.line}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 12, paddingBottom: 32,
    }}>
      <div style={{ fontSize: 12, color: C.faint }}>Tap any number or note to edit. Edits save on this device.</div>
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
  const [state, setState] = useState(() => loadState() ?? buildSeed());
  const dirty = useRef(false);

  /* Persist after the first real edit; a fresh seed stays unsaved so future
   * seed updates reach devices that never edited anything. */
  useEffect(() => {
    if (dirty.current) saveState(state);
  }, [state]);

  const mutate = (fn) => {
    setState((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    dirty.current = true;
  };

  const commitNorthStar = (key, region, newVal) =>
    mutate((n) => applyEdit(n.periods[period].northStar[key], region, newVal));

  const commitStage = (funnelKey, stageKey, region, newVal) =>
    mutate((n) => {
      const stage = n.periods[period][funnelKey].stages.find((s) => s.key === stageKey);
      if (stage) applyEdit(stage, region, newVal);
    });

  const commitOverride = (funnelKey, text) =>
    mutate((n) => { n.overrides[funnelKey] = text; });

  const commitTarget = (metricKey, region, newVal) =>
    mutate((n) => applyEdit(n.config.targets[metricKey], region, newVal));

  const commitConfig = (field, newVal) =>
    mutate((n) => {
      if (newVal > 0) n.config[field] = newVal;
    });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yobolabs-kpis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (window.confirm('Reset all values and notes to the seed data?')) {
      clearState();
      dirty.current = false;
      setState(buildSeed());
    }
  };

  const slice = state.periods[period];
  const config = state.config;

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      padding: '0 max(20px, env(safe-area-inset-left, 20px))',
    }}>
      <style>{detailFunnelCss}</style>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Header region={region} setRegion={setRegion} period={period} setPeriod={setPeriod} />

        <NorthStarSection
          slice={slice}
          targets={config.targets}
          region={region}
          period={period}
          onCommit={commitNorthStar}
          onCommitTarget={commitTarget}
        />

        <section style={{ marginBottom: 32 }}>
          <SectionLabel label="Funnels" region={region} />
          <div className="yl-funnel-grid">
            {['acquisition', 'activation', 'revenue'].map((fk) => (
              <FunnelCard
                key={fk}
                funnel={slice[fk]}
                override={state.overrides[fk]}
                config={config}
                region={region}
                onCommitStage={commitStage}
                onCommitOverride={commitOverride}
              />
            ))}
          </div>
        </section>

        <SectionLabel label="Customer Success" region={region} />
        <DetailFunnel
          funnel={slice.cs}
          override={state.overrides.cs}
          config={config}
          region={region}
          onCommitStage={commitStage}
          onCommitOverride={commitOverride}
        />

        <SectionLabel label="Campaign Performance" region={region} />
        <DetailFunnel
          funnel={slice.campaign}
          override={state.overrides.campaign}
          config={config}
          region={region}
          onCommitStage={commitStage}
          onCommitOverride={commitOverride}
        />

        <ConfigRow config={config} onCommitConfig={commitConfig} />
        <Footer onExport={handleExport} onReset={handleReset} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout CSS (injected once)                                                 */
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
