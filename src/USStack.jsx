import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  Bot,
  Calendar,
  ChevronDown,
  Copy,
  GitBranch,
  Linkedin,
  Mail,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  Users,
  Workflow,
  X,
} from 'lucide-react';

/* ============================================================================
 * YOBO Labs — US Launch Stack
 * The full Claude-powered marketing & lead-gen stack YOBO uses to land
 * US F&B brands. Monochrome + #00E07A (live) + #FF3B30 (broken).
 * Same visual language as Mission Control.
 * ========================================================================== */

const COLOR = { live: '#00E07A', bad: '#FF3B30', ink: '#0A0A0A', mid: '#686868', faint: '#C9C9C9' };

const spark = (n, base, swing, trend = 0) =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    y: Math.max(0, Math.round(base + Math.sin(i / 1.7) * swing + i * trend + (Math.random() - 0.5) * swing * 0.7)),
  }));

/* -------------------------------------------------------------------------- */
/* US pipeline header KPIs                                                    */
/* -------------------------------------------------------------------------- */

const headerKpis = [
  { label: 'US pipeline', value: '$1.84M', sub: '34 open opps', delta: '+22%', healthy: true, spark: spark(28, 1.2, 0.08, 0.022) },
  { label: 'US ARR · booked', value: '$312K', sub: '11 paid · 4 pilot', delta: '+18%', healthy: true, spark: spark(28, 240, 8, 2.4) },
  { label: 'Meetings · 30d', value: '47', sub: 'target 60', delta: '+9', healthy: false, spark: spark(28, 38, 4, 0.4) },
  { label: 'Reply rate · cold', value: '6.8%', sub: 'benchmark 3%', delta: '+1.4pp', healthy: true, spark: spark(28, 6, 0.4, 0.04) },
];

/* -------------------------------------------------------------------------- */
/* Top-row: capability cards (agents/skills/team/cowork/workflows)            */
/* Bottom-row: asset cards (email/qualify/objection/followup/linkedin)        */
/* -------------------------------------------------------------------------- */

const stackCards = [
  {
    id: 'agents',
    icon: Bot,
    title: 'Claude Agents',
    caption: 'AI agents that work for you and drive results.',
    metric: '9',
    metricLabel: 'live · 24/7',
    spark: spark(14, 22, 4, 0.6),
    healthy: true,
  },
  {
    id: 'skills',
    icon: Sparkles,
    title: 'Claude Skills',
    caption: 'Specialized skills to automate and elevate your marketing.',
    metric: '38',
    metricLabel: 'composable',
    spark: spark(14, 26, 6, 0.4),
    healthy: true,
  },
  {
    id: 'linkedin-team',
    icon: Linkedin,
    title: 'Claude LinkedIn Growth Team',
    caption: 'AI-powered team to grow your LinkedIn presence.',
    metric: '4',
    metricLabel: 'roles · 1 founder',
    spark: spark(14, 18, 4, 0.8),
    healthy: true,
  },
  {
    id: 'cowork',
    icon: Users,
    title: 'Claude CoWork Agents',
    caption: 'Collaborative AI agents that work together seamlessly.',
    metric: '6',
    metricLabel: 'agent pairs',
    spark: spark(14, 14, 3, 0.5),
    healthy: true,
  },
  {
    id: 'workflows',
    icon: Workflow,
    title: 'Claude Workflows',
    caption: 'Ready-to-use workflows to save time and maximize impact.',
    metric: '12',
    metricLabel: 'playbooks',
    spark: spark(14, 30, 5, 0.3),
    healthy: true,
  },
  {
    id: 'cold-email',
    icon: Mail,
    title: 'Cold Email Frameworks',
    caption: 'Proven email templates that get replies and start conversations.',
    metric: '8',
    metricLabel: 'frameworks',
    spark: spark(14, 12, 3, 0.4),
    healthy: true,
  },
  {
    id: 'pipeline',
    icon: Search,
    title: 'Pipeline & Qualification Prompts',
    caption: 'Qualify leads, uncover needs, and move deals forward.',
    metric: '14',
    metricLabel: 'prompts · MEDDIC',
    spark: spark(14, 16, 4, 0.3),
    healthy: true,
  },
  {
    id: 'objections',
    icon: Shield,
    title: 'Objection Handling Scripts',
    caption: 'Confidently handle objections and turn them into opportunities.',
    metric: '11',
    metricLabel: 'scripts',
    spark: spark(14, 10, 3, 0.2),
    healthy: true,
  },
  {
    id: 'followups',
    icon: Calendar,
    title: 'Follow-Up Cadences',
    caption: 'Structured follow-ups that keep you top-of-mind and close more deals.',
    metric: '6',
    metricLabel: 'cadences',
    spark: spark(14, 14, 4, 0.4),
    healthy: true,
  },
  {
    id: 'linkedin-sequences',
    icon: Send,
    title: 'LinkedIn Outreach Sequences',
    caption: 'Multi-touch sequences that build relationships and drive replies.',
    metric: '7',
    metricLabel: 'sequences',
    spark: spark(14, 18, 4, 0.5),
    healthy: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Section content — concrete, US F&B GTM                                     */
/* -------------------------------------------------------------------------- */

const agents = [
  {
    name: 'US Outbound Agent',
    role: 'BDR · cold email + LinkedIn at scale',
    metric: '1,420 touches · 24h',
    quality: '6.8% reply rate',
    last: 'Booked discovery with Sweetfin Group · 38m ago',
    healthy: true,
  },
  {
    name: 'US ICP Researcher',
    role: 'Account enrichment · POS / store count / funding',
    metric: '184 accounts enriched',
    quality: '94% match accuracy',
    last: 'Mapped 47 Cava-adjacent fast-casual chains · 2h ago',
    healthy: true,
  },
  {
    name: 'US Demo Scheduler',
    role: 'Calendar negotiation · time-zone aware',
    metric: '47 demos booked · 30d',
    quality: '11% reply→demo',
    last: 'Booked CRO of Honeygrow for Thursday 2pm ET',
    healthy: true,
  },
  {
    name: 'US Account Researcher',
    role: '30-min brief before every call',
    metric: '64 briefs generated',
    quality: '4.6/5 AE rating',
    last: 'Brief for Dig Inn call · sources: 8-K, IG, Toast SDK',
    healthy: true,
  },
  {
    name: 'US Pipeline Hygiene Agent',
    role: 'HubSpot CRM cleaning + stage moves',
    metric: '218 contacts deduped',
    quality: '0 stale deals >30d',
    last: 'Moved 6 SQLs to demo stage, flagged 2 stalled',
    healthy: true,
  },
  {
    name: 'US Renewal Agent',
    role: 'Usage signals → expansion plays',
    metric: '11 accounts monitored',
    quality: '$84K expansion sourced',
    last: 'Flagged Honeygrow for 2-region expansion offer',
    healthy: true,
  },
  {
    name: 'US Content Agent',
    role: 'Case studies · landing pages · ads',
    metric: '28 assets shipped · 30d',
    quality: '3.2× CTR vs. baseline',
    last: 'Published "Cava-tier loyalty in 14 days" page',
    healthy: true,
  },
  {
    name: 'US Event Agent',
    role: 'Conference targeting · RNDC / NRA / FSTEC',
    metric: '4 events worked',
    quality: '38 booked meetings',
    last: 'Pre-FSTEC: booked 12 meetings with target ICPs',
    healthy: true,
  },
  {
    name: 'US Reporting Agent',
    role: 'Weekly board update · auto-drafted',
    metric: '4 reports · 30d',
    quality: '92% accepted as-drafted',
    last: 'Drafted W21 update · sent to Steven Sat 6am ET',
    healthy: true,
  },
];

const skills = [
  { name: 'detect-pos-stack', desc: 'Detect Toast, Square, Clover, Olo, Bikky, Punchh from a website + Wappalyzer trace.', use: 'enrichment' },
  { name: 'score-icp-us-fnb', desc: 'Score account against ICP: 50-500 outlets, $20M-$500M revenue, multi-region.', use: 'qualification' },
  { name: 'build-opener', desc: 'Generate 1-line personal opener from LinkedIn + website + recent news.', use: 'outbound' },
  { name: 'pull-funding-news', desc: 'Crunchbase + PitchBook + 8-K parse for funding / expansion / leadership.', use: 'research' },
  { name: 'draft-cold-email', desc: 'Apply chosen framework (AIDA / BAB / PAS / peer-proof) to an enriched account.', use: 'outbound' },
  { name: 'analyze-call-transcript', desc: 'Pull MEDDIC fields, objections, and next steps from a Gong transcript.', use: 'qualification' },
  { name: 'build-mutual-action-plan', desc: 'Generate a co-signed MAP from a discovery transcript.', use: 'sales' },
  { name: 'draft-followup', desc: 'Context-aware follow-up draft pulling from last 3 touches + brand POV.', use: 'sales' },
  { name: 'reply-objection', desc: 'Match objection to the closest of 11 handled scripts + brand voice.', use: 'sales' },
  { name: 'generate-case-study', desc: 'Pull metrics + quotes from an existing customer, draft a 1-page case study.', use: 'content' },
  { name: 'rewrite-li-post', desc: 'Rewrite a draft post in founder voice with hook + payoff structure.', use: 'content' },
  { name: 'find-warm-intro', desc: 'Find shortest 2nd-degree LinkedIn path to a target persona.', use: 'outbound' },
  { name: 'score-meeting-fit', desc: 'Score post-discovery: BANT + fit + signal strength → go/no-go.', use: 'qualification' },
  { name: 'draft-proposal', desc: 'Generate pilot proposal from MAP, pricing config, and customer profile.', use: 'sales' },
  { name: 'detect-buyer-intent', desc: 'Watch Common Room / RB2B / Clearbit reveal for ICP visitors.', use: 'enrichment' },
];

const linkedinTeam = [
  {
    role: 'Content Engine',
    desc: 'Ships 3 posts/week from Steven\'s POV. Pulls from F&B operator interviews, US data, and the agent ops.',
    output: '12 posts/mo · avg 18.4K impressions · 142 profile visits',
    healthy: true,
  },
  {
    role: 'Comment Engine',
    desc: 'Engages on posts from ICPs (VP Marketing / CRO / Director CX of US F&B chains 50-500 outlets).',
    output: '84 thoughtful comments/wk · 6.2% comment→connect',
    healthy: true,
  },
  {
    role: 'Connection Engine',
    desc: 'Sends 12-15 personalized connection invites/day. Watches for accept → triggers DM Engine.',
    output: '312 invites/mo · 38% accept · 119 new ICP connections',
    healthy: true,
  },
  {
    role: 'DM Engine',
    desc: '6-touch sequence post-accept. Soft hook → resource → ask. Never pitches before touch 4.',
    output: '74 conversations/mo · 11.4% conv→meeting',
    healthy: true,
  },
];

const coworkPairs = [
  {
    name: 'Brief → Deck',
    pair: 'Researcher + Designer',
    desc: 'Researcher pulls account brief, Designer auto-builds a 6-slide tailored deck before discovery.',
    cycle: '~9 min',
    output: '142 decks · 30d',
  },
  {
    name: 'Lead → Demo',
    pair: 'Scorer + Booker',
    desc: 'Scorer qualifies inbound, Booker negotiates time-zone-aware calendar slot.',
    cycle: '~3 min',
    output: '47 demos · 30d',
  },
  {
    name: 'Reply → Resolution',
    pair: 'Triager + Drafter',
    desc: 'Triager classifies an email reply (objection / question / yes / unsubscribe), Drafter writes the response.',
    cycle: '~40 sec',
    output: '618 replies handled',
  },
  {
    name: 'Call → MAP',
    pair: 'Transcriber + Planner',
    desc: 'Transcriber parses Gong call, Planner drafts mutual action plan + sends within 1h.',
    cycle: '~12 min',
    output: '38 MAPs auto-drafted',
  },
  {
    name: 'Demo → Proposal',
    pair: 'Notes-taker + Proposer',
    desc: 'Pulls demo notes + pricing config → generates 2-page pilot proposal for AE review.',
    cycle: '~8 min',
    output: '24 proposals',
  },
  {
    name: 'Signal → Play',
    pair: 'Watcher + Triggerer',
    desc: 'Watcher monitors intent signals (web visits, funding, hires) → Triggerer kicks the right playbook.',
    cycle: '~real-time',
    output: '186 plays triggered',
  },
];

const workflows = [
  { name: 'US F&B chain → Demo', steps: 10, desc: 'ICP map → enrich → opener → 6-touch sequence → demo book.', runs: 184, conv: '6.8%' },
  { name: 'Inbound MQL → SQL', steps: 6, desc: 'Form fill → enrich → score → SDR alert → discovery booked.', runs: 62, conv: '34%' },
  { name: 'Closed-Lost → Re-engage', steps: 4, desc: '90-day quiet → trigger event → 3-touch warm sequence.', runs: 18, conv: '11%' },
  { name: 'Demo → Pilot Proposal', steps: 8, desc: 'Demo notes → MAP → pricing → 2-pager → e-sign nudge.', runs: 24, conv: '58%' },
  { name: 'Pilot → Annual Contract', steps: 12, desc: 'Pilot kickoff → weekly QBR → success metric proof → upsell.', runs: 7, conv: '71%' },
  { name: 'Conference → Booked Meetings', steps: 7, desc: 'Attendee list → ICP filter → 3-touch pre-event → onsite slot.', runs: 4, conv: '38 meetings' },
  { name: 'Renewal · 90-day window', steps: 5, desc: 'Usage health → expansion fit → renewal proposal → e-sign.', runs: 11, conv: '$84K expansion' },
  { name: 'Champion → Multi-thread', steps: 6, desc: 'Identify champion → map buying committee → multi-touch.', runs: 14, conv: '64%' },
  { name: 'Lost → Win-back', steps: 5, desc: 'Quarterly trigger + new feature → re-open conversation.', runs: 9, conv: '22%' },
  { name: 'Outbound → Referral', steps: 4, desc: 'Closed deal → champion ask → 2 named intros.', runs: 6, conv: '67%' },
  { name: 'New Hire → Outreach', steps: 5, desc: 'Watch hires at ICPs → 30-day welcome touch.', runs: 28, conv: '14% reply' },
  { name: 'Press → Hot Inbound', steps: 4, desc: 'TechCrunch / Restaurant Dive mention → fast-lane SDR alert.', runs: 5, conv: '3 demos' },
];

const coldEmails = [
  {
    framework: 'Peer-proof · 4-line',
    subjectLine: 'Cava → +38% repeat in 60 days',
    body: `Hey {firstName} — saw {brand} just opened 4 stores in Austin. Congrats.

Reason I'm reaching out: we run loyalty + SMS for Sweetfin and a few Cava-tier chains. Repeat-rate up 38% in 60 days, $0 ad spend.

Worth a 15-min look at what's working for them?

— Steven, YOBO Labs`,
    works: 'opens 64% · reply 8.2%',
  },
  {
    framework: 'BAB · Before–After–Bridge',
    subjectLine: '{brand}\'s Toast loyalty leaves money on the table',
    body: `{firstName} — most Toast-stack F&B chains we talk to are sitting on 200K+ guest profiles they can't segment, can't reach via SMS, and can't measure repeat lift on.

After dropping YOBO in, the avg picture is: 38% repeat rate (up from 22%), 6.4× ROAS on owned channels, no extra headcount.

Open to a 15-min walkthrough next week?`,
    works: 'opens 58% · reply 6.4%',
  },
  {
    framework: 'AIDA · short',
    subjectLine: '38% repeat, no ad spend — playbook?',
    body: `{firstName} — Sweetfin grew repeat 38% in 60 days using YOBO, $0 paid.

Same playbook works for any chain on Toast / Square / Olo. We saw {brand} is at 47 outlets and growing in {region} — feels like a fit.

Worth a 15-min look?`,
    works: 'opens 61% · reply 7.1%',
  },
  {
    framework: 'PAS · Problem–Agitate–Solve',
    subjectLine: 'Why your loyalty app is plateauing',
    body: `{firstName} — most US F&B loyalty programs we audit have the same problem: 14% of guests sign up, 3% redeem, and nobody can tell you who actually came back.

That gap is widening as POS-native loyalty becomes a check-box product instead of a growth lever.

YOBO replaces the check-box with an agent layer: segmentation, SMS, IG DMs, attribution — built for chains 50-500 outlets. Worth a look?`,
    works: 'opens 52% · reply 5.8%',
  },
  {
    framework: 'Founder-to-founder',
    subjectLine: 'one F&B founder to another',
    body: `{firstName} — Steven, founder of YOBO. Quick one.

We just hit 800 outlets across SEA and we're opening US ops. {brand} is exactly the kind of chain we're built for — 50+ outlets, multi-region, Toast/Square stack.

Not a pitch — would love your read on whether US F&B operators care about the same loyalty + repeat problems our SEA customers do. 15 min?`,
    works: 'opens 71% · reply 12.4%',
  },
  {
    framework: 'Question-first',
    subjectLine: 'who owns repeat-rate at {brand}?',
    body: `{firstName} — quick question: who at {brand} owns the repeat-rate number?

Reason I ask: we just got Honeygrow from 22% to 38% repeat in 60 days, all on owned channels. Want to share the playbook with whoever cares most about that number.

Mind pointing me in the right direction?`,
    works: 'opens 67% · reply 9.8%',
  },
  {
    framework: 'Trigger-event',
    subjectLine: 'congrats on the Series C — one thought',
    body: `{firstName} — saw the {amount} Series C. Congrats.

When chains hit your stage, the repeat-rate-per-store number becomes the make-or-break unit econ. We've moved that needle 1.7× for chains like Sweetfin and Dig.

15 min worth it before you scale the next 50 stores?`,
    works: 'opens 74% · reply 11.2%',
  },
  {
    framework: 'Breakup',
    subjectLine: 'closing the loop',
    body: `{firstName} — going to stop reaching out after this one.

If repeat-rate isn't on your radar right now, no worries. If it is and now's not the time, just reply "later" and I'll circle back in Q3.

— Steven`,
    works: 'opens 58% · reply 14.6%',
  },
];

const qualifyPrompts = [
  { framework: 'MEDDIC', field: 'Metrics', prompt: 'What\'s {brand}\'s current repeat-rate and what would a 10pp lift be worth annually?' },
  { framework: 'MEDDIC', field: 'Economic Buyer', prompt: 'Who owns the marketing P&L? Is that the same person who owns the loyalty stack decision?' },
  { framework: 'MEDDIC', field: 'Decision Criteria', prompt: 'What three things must this solve before you\'d sign? What\'s the dealbreaker?' },
  { framework: 'MEDDIC', field: 'Decision Process', prompt: 'Walk me through the last vendor decision of this size — who, when, how long?' },
  { framework: 'MEDDIC', field: 'Identify Pain', prompt: 'What\'s the cost of doing nothing for 6 months? Tell me a specific number.' },
  { framework: 'MEDDIC', field: 'Champion', prompt: 'Who else needs to win if this gets greenlit? How does this make them look good internally?' },
  { framework: 'BANT', field: 'Budget', prompt: 'Is there an allocated line for guest-retention / loyalty tech this fiscal year?' },
  { framework: 'BANT', field: 'Authority', prompt: 'Who signs above ${amount}? Are they aligned on solving this now vs. next year?' },
  { framework: 'BANT', field: 'Need', prompt: 'What happens if repeat-rate doesn\'t improve in the next 12 months?' },
  { framework: 'BANT', field: 'Timeline', prompt: 'When does this need to be live to hit your fiscal-year goals?' },
  { framework: 'GPCT', field: 'Goals', prompt: 'If repeat-rate hit your target, what would that unlock — store openings, hiring, valuation?' },
  { framework: 'GPCT', field: 'Plans', prompt: 'What\'s the current plan to hit that? What have you tried that didn\'t work?' },
  { framework: 'GPCT', field: 'Challenges', prompt: 'What\'s blocking the plan — data, vendor lock-in, headcount, exec alignment?' },
  { framework: 'GPCT', field: 'Timeline', prompt: 'If we started in 30 days, what would we need to prove by day 90 for you to renew?' },
];

const objections = [
  {
    objection: '"We already use Toast loyalty."',
    response: 'Totally — and Toast loyalty is great for points-at-checkout. The reason brands like Sweetfin run YOBO on top: segmented SMS, IG DMs, real attribution. Toast does 1 thing, YOBO does the other 4. Want to see the side-by-side?',
  },
  {
    objection: '"We don\'t have budget this quarter."',
    response: 'Got it. Most of our pilots are budgeted out of the marketing efficiency line, not new tools — because they pay for themselves in 60 days via incremental repeat. Worth scoping a 90-day pilot inside that envelope?',
  },
  {
    objection: '"Send me a deck and I\'ll get back to you."',
    response: 'Happy to. The deck is fine but it\'s generic — the 15-min call is where I\'d show you what Cava-tier chains are doing with their guest data right now. I\'ll send the deck either way — does Thursday 2pm work for the call?',
  },
  {
    objection: '"We\'re focused on H2."',
    response: 'Makes sense. If we kicked off in H2, the prep work — connecting POS, importing guests, training the agent on your brand voice — takes ~3 weeks. Worth a 15-min scoping call now so H2 starts day one?',
  },
  {
    objection: '"We\'re a small chain, doesn\'t apply."',
    response: 'Actually built for 50-500 outlets — most of our wins are right in that band. Bigger chains have in-house teams; smaller ones don\'t have the guest volume yet. You\'re the sweet spot.',
  },
  {
    objection: '"How are you different from Punchh / Paytronix / Thanx?"',
    response: 'Honest answer: they\'re great loyalty programs, we\'re a growth agent layer. They issue points; we run the marketing team. Brands run us next to one of them about 30% of the time. Want the 3-row comparison?',
  },
  {
    objection: '"We just signed with [competitor]."',
    response: 'Congrats. Genuine question: what made them the pick? If it\'s loyalty issuance, makes sense. If you also need a marketing-execution layer, that\'s a different category — happy to share the pattern from brands who ended up running both.',
  },
  {
    objection: '"We don\'t do SMS, customers hate it."',
    response: 'Same instinct everyone has — then we test it. Across 800 outlets, SMS open-rates are 94%, opt-outs sit at 0.3%, and incremental revenue is the highest of any channel. Worth a 15-min look at the actual numbers?',
  },
  {
    objection: '"Can you white-label it?"',
    response: 'Yes — brand-skinning, custom domain, your team logs into your URL. Enterprise tier. What\'s driving the ask — guest experience or internal positioning?',
  },
  {
    objection: '"Send pricing first."',
    response: 'Pricing is outlet-based, starts at ${anchor} for a chain your size, scales with volume. The 15-min call is where I\'d size it to your actual store count + guest base — otherwise the number\'s wrong by 30%. Thursday 2pm?',
  },
  {
    objection: '"We need to see US references."',
    response: 'Fair. We\'re early in US — 11 paid, 4 pilot, names I can share under NDA. SEA reference base is 800+ outlets across Indonesia, Singapore, Malaysia. Want the SEA case studies first, then a call with a US pilot customer?',
  },
];

const followUps = [
  {
    name: '14-day · cold no-reply',
    touches: 5,
    cadence: 'D0 cold · D2 bump · D5 case study · D9 angle change · D14 breakup',
    used: '1,124 sequences · 30d',
  },
  {
    name: '7-day · post-demo',
    touches: 4,
    cadence: 'D0 recap + MAP · D2 deck · D4 reference call offer · D7 decision nudge',
    used: '47 sequences · 30d',
  },
  {
    name: '30-day · quote sent',
    touches: 5,
    cadence: 'D1 confirm received · D7 unblock · D14 stakeholder add · D21 deadline · D30 last-call',
    used: '24 sequences · 30d',
  },
  {
    name: '90-day · closed-lost',
    touches: 3,
    cadence: 'D30 product change · D60 case study · D90 calendar invite',
    used: '38 sequences',
  },
  {
    name: '30-day · post-conference',
    touches: 4,
    cadence: 'D0 nice-to-meet · D3 promised resource · D10 angle-specific · D30 followup',
    used: '38 sequences',
  },
  {
    name: '60-day · champion-gone-quiet',
    touches: 3,
    cadence: 'D7 friendly check · D21 new artifact · D60 second-stakeholder reach',
    used: '14 sequences',
  },
];

const linkedinSequences = [
  {
    persona: 'VP Marketing · F&B chain 100-500 outlets',
    touches: 6,
    sequence: [
      'T1 · Engage on 2 recent posts (substantive comments, not "great post")',
      'T2 · Connection invite — 1-liner referencing one of their posts',
      'T3 · Day-3 post-accept: 2-line thank-you + a useful F&B retention stat',
      'T4 · Day-7: share a tailored 1-pager (no ask)',
      'T5 · Day-14: ask for 15 min — frame as F&B operator research, not pitch',
      'T6 · Day-21: graceful close — "circling back in Q3, mind if I follow you here?"',
    ],
    metric: '11.4% conv→meeting',
  },
  {
    persona: 'CRO / Head of Growth · public F&B',
    touches: 5,
    sequence: [
      'T1 · Like 1 post, comment on 1 post (2 days apart)',
      'T2 · Invite with founder-to-founder framing',
      'T3 · Day-2: 1 sentence + 1 line of data ("Sweetfin: +38% repeat in 60 days")',
      'T4 · Day-7: send the 90-second Loom of the agent in action',
      'T5 · Day-14: direct ask for 15 min',
    ],
    metric: '14.2% conv→meeting',
  },
  {
    persona: 'Director of CX · restaurant tech buyer',
    touches: 6,
    sequence: [
      'T1 · Engage on a CX-flavored post',
      'T2 · Invite — frame around peer benchmark study',
      'T3 · Day-3: drop the benchmark teaser (1 chart)',
      'T4 · Day-7: ask for 10 min for the full benchmark',
      'T5 · Day-14: switch persona — alert that {peer} just signed',
      'T6 · Day-21: breakup',
    ],
    metric: '9.4% conv→meeting',
  },
  {
    persona: 'Founder / CEO · sub-100-outlet chain',
    touches: 4,
    sequence: [
      'T1 · Voice-note connection invite (yes, audio invites)',
      'T2 · Day-2 voice DM — 30 seconds, one specific compliment, no ask',
      'T3 · Day-7: send a peer chain\'s case study',
      'T4 · Day-14: ask — "15 min, founder-to-founder, no slides"',
    ],
    metric: '18.6% conv→meeting',
  },
  {
    persona: 'Marketing Director · multi-brand F&B group',
    touches: 5,
    sequence: [
      'T1 · Comment with a counter-take on a recent industry post',
      'T2 · Day-3 invite referencing the exchange',
      'T3 · Day-5: send a multi-brand-group case study (relevant fit)',
      'T4 · Day-12: ask for 20 min — frame around portfolio-level insights',
      'T5 · Day-21: breakup with door open',
    ],
    metric: '8.8% conv→meeting',
  },
  {
    persona: 'Operations · multi-unit franchisee',
    touches: 5,
    sequence: [
      'T1 · Engage on an operations/labor post',
      'T2 · Invite framed around store-level repeat',
      'T3 · Day-4: send 1 chart — repeat-rate-per-store impact on AUV',
      'T4 · Day-10: peer franchisee reference offer',
      'T5 · Day-18: ask for 15 min',
    ],
    metric: '7.2% conv→meeting',
  },
  {
    persona: 'Investor / Board member · F&B portfolio',
    touches: 4,
    sequence: [
      'T1 · Comment on portfolio post',
      'T2 · Invite — frame as "useful intro across your portfolio"',
      'T3 · Day-5: portfolio-fit 1-pager (3 chains in their portfolio that fit YOBO)',
      'T4 · Day-12: ask for 20 min — outcome: 1-2 warm intros',
    ],
    metric: '24.6% conv→meeting',
  },
];

/* -------------------------------------------------------------------------- */
/* Atoms (reused / parallel to MissionControl)                                */
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

function Sparkline({ data, healthy = true, height = 28 }) {
  const stroke = healthy ? COLOR.ink : COLOR.bad;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line type="monotone" dataKey="y" stroke={stroke} strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniArea({ data, healthy = true, height = 36 }) {
  const stroke = healthy ? COLOR.ink : COLOR.bad;
  const fillId = `usfill-${Math.random().toString(36).slice(2, 8)}`;
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

/* -------------------------------------------------------------------------- */
/* Top KPI strip                                                              */
/* -------------------------------------------------------------------------- */

function USHeaderKpis() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        {headerKpis.map((k) => (
          <div
            key={k.label}
            className="flex w-[260px] flex-col gap-3 border border-ink-100 bg-ink-0 p-4 sm:w-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusDot healthy={k.healthy} live />
                <Label>{k.label}</Label>
              </div>
              <div className="h-7 w-16 opacity-90">
                <Sparkline data={k.spark} healthy={k.healthy} height={28} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-[36px] font-bold leading-none tracking-tight tnum">{k.value}</div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-[12px] text-ink-400">{k.sub}</span>
              <span
                className="text-[12px] font-medium tabular-nums"
                style={{ color: k.healthy ? COLOR.live : COLOR.bad }}
              >
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* The 10-card stack grid (matches the image layout)                          */
/* -------------------------------------------------------------------------- */

function StackGrid({ onOpen }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stackCards.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.id}
            onClick={() => onOpen(c.id)}
            className="group flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4 text-left transition hover:border-ink-900"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center border border-ink-900 bg-ink-900 text-ink-0">
                <Icon size={16} strokeWidth={2} />
              </div>
              <div className="ml-auto inline-flex items-center gap-1.5">
                <StatusDot healthy={c.healthy} live />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLOR.live }}>
                  Live
                </span>
              </div>
            </div>

            <div className="text-[15px] font-bold leading-tight tracking-tight">{c.title}</div>
            <p className="text-[12px] leading-snug text-ink-400">{c.caption}</p>

            <div className="dotted-rule" />

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[28px] font-bold leading-none tabular-nums">{c.metric}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{c.metricLabel}</div>
              </div>
              <div className="h-9 w-20">
                <MiniArea data={c.spark} healthy={c.healthy} height={36} />
              </div>
            </div>

            <div className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-900">
              Open
              <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Agents (detailed)                                                 */
/* -------------------------------------------------------------------------- */

function AgentsDetail() {
  return (
    <div id="sec-agents" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((a) => (
        <div key={a.name} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-ink-900 bg-ink-900 text-ink-0">
              <Bot size={14} strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-bold tracking-tight">{a.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">{a.role}</div>
            </div>
            <div className="ml-auto inline-flex items-center gap-1.5">
              <StatusDot healthy={a.healthy} live />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLOR.live }}>
                Running
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[20px] font-bold leading-none tabular-nums">{a.metric.split(' · ')[0]}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">
                {a.metric.split(' · ').slice(1).join(' · ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-bold tabular-nums">{a.quality}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">quality</div>
            </div>
          </div>
          <div className="dotted-rule" />
          <div className="text-[11px] text-ink-400">
            <span className="uppercase tracking-wider">Last</span> · {a.last}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Skills                                                            */
/* -------------------------------------------------------------------------- */

function SkillsDetail() {
  const groups = useMemo(() => {
    const map = {};
    for (const s of skills) {
      if (!map[s.use]) map[s.use] = [];
      map[s.use].push(s);
    }
    return map;
  }, []);
  return (
    <div id="sec-skills" className="space-y-3">
      {Object.entries(groups).map(([use, items]) => (
        <div key={use} className="border border-ink-100 bg-ink-0 p-4">
          <Label>{use}</Label>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <div key={s.name} className="flex flex-col gap-1 border border-ink-100 bg-ink-50 p-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={12} />
                  <span className="font-mono text-[12px] font-medium">{s.name}</span>
                </div>
                <div className="text-[11px] leading-snug text-ink-400">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: LinkedIn Growth Team                                              */
/* -------------------------------------------------------------------------- */

function LinkedInTeamDetail() {
  return (
    <div id="sec-linkedin-team" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {linkedinTeam.map((m) => (
        <div key={m.role} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center border border-ink-900 bg-ink-900 text-ink-0">
              <Linkedin size={14} strokeWidth={2} />
            </div>
            <div className="text-[14px] font-bold tracking-tight">{m.role}</div>
            <div className="ml-auto inline-flex items-center gap-1.5">
              <StatusDot healthy={m.healthy} live />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLOR.live }}>
                Running
              </span>
            </div>
          </div>
          <p className="text-[13px] leading-snug text-ink-900">{m.desc}</p>
          <div className="dotted-rule" />
          <div className="text-[11px] text-ink-400">{m.output}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: CoWork                                                            */
/* -------------------------------------------------------------------------- */

function CoworkDetail() {
  return (
    <div id="sec-cowork" className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {coworkPairs.map((p) => (
        <div key={p.name} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2">
            <Users size={14} />
            <div className="text-[14px] font-bold tracking-tight">{p.name}</div>
          </div>
          <div className="text-[11px] uppercase tracking-wider text-ink-400">{p.pair}</div>
          <p className="text-[12px] leading-snug text-ink-900">{p.desc}</p>
          <div className="dotted-rule" />
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[18px] font-bold tabular-nums">{p.cycle}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">avg cycle</div>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-bold tabular-nums">{p.output}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">throughput</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Workflows                                                         */
/* -------------------------------------------------------------------------- */

function WorkflowsDetail() {
  return (
    <div id="sec-workflows" className="overflow-x-auto border border-ink-100">
      <table className="w-full min-w-[760px] text-left text-[13px] tnum">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50 text-[10px] uppercase tracking-wider text-ink-400">
            <th className="px-4 py-2.5 font-medium">Workflow</th>
            <th className="px-4 py-2.5 text-right font-medium">Steps</th>
            <th className="px-4 py-2.5 font-medium">Description</th>
            <th className="px-4 py-2.5 text-right font-medium">Runs · 30d</th>
            <th className="px-4 py-2.5 text-right font-medium">Conversion</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((w) => (
            <tr key={w.name} className="border-b border-ink-100 hover:bg-ink-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <GitBranch size={12} />
                  <span className="font-medium">{w.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{w.steps}</td>
              <td className="px-4 py-3 text-ink-400">{w.desc}</td>
              <td className="px-4 py-3 text-right tabular-nums">{w.runs}</td>
              <td className="px-4 py-3 text-right" style={{ color: COLOR.live }}>
                {w.conv}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Cold email frameworks                                             */
/* -------------------------------------------------------------------------- */

function ColdEmailDetail() {
  const [open, setOpen] = useState(0);
  const [copied, setCopied] = useState(null);

  const copy = async (i) => {
    try {
      await navigator.clipboard.writeText(coldEmails[i].body);
      setCopied(i);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* ignore */
    }
  };

  return (
    <div id="sec-cold-email" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {coldEmails.map((e, i) => (
        <div key={i} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2">
            <Mail size={14} />
            <Label>{e.framework}</Label>
            <span className="ml-auto text-[11px] tabular-nums text-ink-400">{e.works}</span>
          </div>
          <div className="border-l-2 border-ink-900 pl-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-400">Subject</div>
            <div className="text-[14px] font-medium leading-snug">{e.subjectLine}</div>
          </div>
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-ink-400 hover:text-ink-900"
          >
            <span>{open === i ? 'Hide body' : 'Show body'}</span>
            <ChevronDown size={14} className={open === i ? 'rotate-180 transition' : 'transition'} />
          </button>
          {open === i && (
            <>
              <pre className="whitespace-pre-wrap border border-ink-100 bg-ink-50 p-3 font-mono text-[12px] leading-relaxed text-ink-900">
                {e.body}
              </pre>
              <button
                onClick={() => copy(i)}
                className="inline-flex items-center gap-1.5 self-start border border-ink-900 bg-ink-0 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider hover:bg-ink-900 hover:text-ink-0"
              >
                <Copy size={11} />
                {copied === i ? 'Copied' : 'Copy template'}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Pipeline & Qualification                                          */
/* -------------------------------------------------------------------------- */

function QualifyDetail() {
  const groups = useMemo(() => {
    const map = {};
    for (const q of qualifyPrompts) {
      if (!map[q.framework]) map[q.framework] = [];
      map[q.framework].push(q);
    }
    return map;
  }, []);
  return (
    <div id="sec-pipeline" className="space-y-3">
      {Object.entries(groups).map(([framework, items]) => (
        <div key={framework} className="border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2">
            <Search size={14} />
            <Label>{framework}</Label>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {items.map((q, i) => (
              <div key={i} className="flex gap-3 border border-ink-100 bg-ink-50 p-3">
                <div className="min-w-[88px] text-[10px] font-bold uppercase tracking-wider text-ink-900">
                  {q.field}
                </div>
                <div className="text-[12px] leading-snug">{q.prompt}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Objection handling                                                */
/* -------------------------------------------------------------------------- */

function ObjectionsDetail() {
  return (
    <div id="sec-objections" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {objections.map((o, i) => (
        <div key={i} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <Label>Objection · {String(i + 1).padStart(2, '0')}</Label>
          </div>
          <div className="border-l-2 border-ink-400 pl-3 text-[14px] italic text-ink-900">
            {o.objection}
          </div>
          <div className="dotted-rule" />
          <div className="border-l-2 pl-3 text-[13px] leading-snug text-ink-900" style={{ borderColor: COLOR.live }}>
            {o.response}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: Follow-up cadences                                                */
/* -------------------------------------------------------------------------- */

function FollowupsDetail() {
  return (
    <div id="sec-followups" className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {followUps.map((f) => (
        <div key={f.name} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-center gap-2">
            <Calendar size={14} />
            <div className="text-[14px] font-bold tracking-tight">{f.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[24px] font-bold leading-none tabular-nums">{f.touches}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">touches</div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium tabular-nums">{f.used}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">usage</div>
            </div>
          </div>
          <div className="dotted-rule" />
          <div className="font-mono text-[11px] leading-relaxed text-ink-900">{f.cadence}</div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section: LinkedIn sequences                                                */
/* -------------------------------------------------------------------------- */

function LinkedInSequencesDetail() {
  return (
    <div id="sec-linkedin-sequences" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {linkedinSequences.map((s, i) => (
        <div key={i} className="flex flex-col gap-3 border border-ink-100 bg-ink-0 p-4">
          <div className="flex items-start gap-2">
            <Send size={14} className="mt-0.5" />
            <div className="flex-1">
              <div className="text-[14px] font-bold tracking-tight">{s.persona}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">
                {s.touches} touches
              </div>
            </div>
            <span className="text-[11px] font-medium tabular-nums" style={{ color: COLOR.live }}>
              {s.metric}
            </span>
          </div>
          <div className="dotted-rule" />
          <ol className="space-y-1.5">
            {s.sequence.map((step, j) => (
              <li key={j} className="font-mono text-[11px] leading-relaxed text-ink-900">
                {step}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Section wrapper                                                            */
/* -------------------------------------------------------------------------- */

function Section({ id, eyebrow, title, caption, children }) {
  return (
    <section id={id} className="space-y-4 scroll-mt-24">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Label>{eyebrow}</Label>
          <h2 className="mt-1 text-[20px] font-bold tracking-tight sm:text-[24px]">{title}</h2>
          {caption && <p className="mt-0.5 text-[12px] text-ink-400">{caption}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Header (page-local)                                                        */
/* -------------------------------------------------------------------------- */

function PageHeader({ route, setRoute }) {
  const now = new Date();
  const stamp = now.toLocaleString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-ink-0/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <a href="#/" className="flex items-center gap-2.5" onClick={() => setRoute('/')}>
          <svg width={22} height={22} viewBox="0 0 64 64" fill="none" aria-hidden>
            <circle cx="20" cy="32" r="6" stroke={COLOR.ink} strokeWidth="2.4" />
            <line x1="32" y1="14" x2="22" y2="50" stroke={COLOR.ink} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M44 38 L52 26 L36 26 Z" stroke={COLOR.live} strokeWidth="2.4" strokeLinejoin="round" />
          </svg>
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-tight">YOBO Labs</div>
            <div className="text-[10px] uppercase tracking-wider text-ink-400">US Launch Stack</div>
          </div>
        </a>

        <div className="hidden md:ml-6 md:flex md:items-center md:gap-3">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-400">
            <span className="dot-live inline-block h-1.5 w-1.5 rounded-full" style={{ background: COLOR.live }} />
            Live · {stamp} ET
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 p-0.5">
          <button
            onClick={() => setRoute('/')}
            className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition ${
              route === '/' ? 'bg-ink-900 text-ink-0' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Mission Control
          </button>
          <button
            onClick={() => setRoute('/us')}
            className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition ${
              route === '/us' ? 'bg-ink-900 text-ink-0' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            US Stack
          </button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Top-level page                                                             */
/* -------------------------------------------------------------------------- */

const SECTION_MAP = {
  agents: 'sec-agents',
  skills: 'sec-skills',
  'linkedin-team': 'sec-linkedin-team',
  cowork: 'sec-cowork',
  workflows: 'sec-workflows',
  'cold-email': 'sec-cold-email',
  pipeline: 'sec-pipeline',
  objections: 'sec-objections',
  followups: 'sec-followups',
  'linkedin-sequences': 'sec-linkedin-sequences',
};

export default function USStack({ route, setRoute }) {
  const onOpen = (id) => {
    const target = document.getElementById(SECTION_MAP[id]);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-ink-0 text-ink-900 font-sans">
      <PageHeader route={route} setRoute={setRoute} />

      <main className="mx-auto max-w-[1440px] space-y-12 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Hero */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <Label>The stack</Label>
            <h1 className="text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[48px]">
              YOBO For <span style={{ color: COLOR.live }}>Marketing &amp; Lead Gen</span>
            </h1>
            <p className="max-w-2xl text-[14px] leading-relaxed text-ink-400 sm:text-[15px]">
              The full Claude-powered stack YOBO Labs runs to land US F&amp;B chains —
              50–500 outlets, multi-region, Toast / Square / Olo stack. Agents do the work,
              skills compose, workflows orchestrate, assets convert.
            </p>
          </div>
          <USHeaderKpis />
        </section>

        {/* The 10-card grid */}
        <Section
          eyebrow="Layer 01"
          title="The stack"
          caption="10 components · agents · skills · workflows · assets · click any card to jump"
        >
          <StackGrid onOpen={onOpen} />
        </Section>

        {/* Detailed sections — exactly mirror the card order */}
        <Section
          eyebrow="01 · Claude Agents"
          title="Agents working US right now"
          caption="Always-on autonomous BDRs, researchers, schedulers and ops"
        >
          <AgentsDetail />
        </Section>

        <Section
          eyebrow="02 · Claude Skills"
          title="Composable skills"
          caption="The verbs agents use · grouped by where they fire in the funnel"
        >
          <SkillsDetail />
        </Section>

        <Section
          eyebrow="03 · LinkedIn Growth Team"
          title="The 4-role LinkedIn team"
          caption="Founder-led presence · run as a team of agents · zero Steven hours/wk"
        >
          <LinkedInTeamDetail />
        </Section>

        <Section
          eyebrow="04 · CoWork Agents"
          title="Agents that pair up"
          caption="6 collaboration pairs that ship higher-quality output than any agent alone"
        >
          <CoworkDetail />
        </Section>

        <Section
          eyebrow="05 · Workflows"
          title="End-to-end playbooks"
          caption="12 workflows that run unattended · trigger → outcome"
        >
          <WorkflowsDetail />
        </Section>

        <Section
          eyebrow="06 · Cold Email Frameworks"
          title="Cold email that gets replies"
          caption="8 frameworks · proven on US F&B chains · click to expand body + copy"
        >
          <ColdEmailDetail />
        </Section>

        <Section
          eyebrow="07 · Pipeline & Qualification"
          title="Discovery prompts that move deals"
          caption="MEDDIC · BANT · GPCT — actually answerable in 30 minutes"
        >
          <QualifyDetail />
        </Section>

        <Section
          eyebrow="08 · Objection Handling"
          title="11 scripts for the objections we hear weekly"
          caption="Calibrated to US F&B operator language · not generic SaaS"
        >
          <ObjectionsDetail />
        </Section>

        <Section
          eyebrow="09 · Follow-Up Cadences"
          title="Structured follow-ups · 6 cadences"
          caption="Trigger-based · stops on reply · always closes the loop"
        >
          <FollowupsDetail />
        </Section>

        <Section
          eyebrow="10 · LinkedIn Sequences"
          title="7 multi-touch LinkedIn sequences"
          caption="Persona-specific · never opens with a pitch · soft → ask"
        >
          <LinkedInSequencesDetail />
        </Section>

        <footer className="border-t border-ink-100 pt-6 text-[11px] uppercase tracking-wider text-ink-400">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <svg width={14} height={14} viewBox="0 0 64 64" fill="none" aria-hidden>
                <circle cx="20" cy="32" r="6" stroke={COLOR.ink} strokeWidth="2.4" />
                <line x1="32" y1="14" x2="22" y2="50" stroke={COLOR.ink} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M44 38 L52 26 L36 26 Z" stroke={COLOR.live} strokeWidth="2.4" strokeLinejoin="round" />
              </svg>
              <span>YOBO Labs · US Launch Stack</span>
            </div>
            <div>
              Find <span className="text-ink-900">●</span> · Land{' '}
              <span style={{ color: COLOR.live }}>▲</span> · Expand{' '}
              <span className="text-ink-900">/</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
