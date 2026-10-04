<script setup>
import { computed } from 'vue'
import { MONTH_NAMES, fmtMoney } from '../utils/helpers.js'

// Monthly revenue / expenses bars + profit line for whichever ops rows it is given.
const props = defineProps({ rows: { type: Array, default: () => [] } })

// Group by real calendar year-month; keep the most recent 12.
const months = computed(() => {
  const map = new Map()
  for (const o of props.rows) {
    if (!o.date) continue
    const key = o.date.slice(0, 7)
    if (!map.has(key)) map.set(key, { key, rev: 0, exp: 0, profit: 0 })
    const m = map.get(key)
    m.rev += (o.revlimo || 0) + (o.revtrip || 0)
    m.exp += o.exp || 0
    m.profit += o.profit || 0
  }
  return [...map.values()]
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .slice(-12)
    .map((m) => {
      const [y, mo] = m.key.split('-')
      return { ...m, label: MONTH_NAMES[parseInt(mo, 10) - 1] + ' ' + y.slice(2) }
    })
})

const title = computed(() => 'الأداء الشهري' + (months.value.length
  ? ` — حسب الفلتر الحالي (${months.value.length} ${months.value.length === 1 ? 'شهر' : 'شهور'})` : ''))
const range = computed(() => {
  const m = months.value
  if (!m.length) return ''
  return m.length === 1 ? `الفترة المعروضة: ${m[0].label}` : `الفترة المعروضة: من ${m[0].label} إلى ${m[m.length - 1].label}`
})

const W = 760, H = 290, padL = 44, padR = 26, topY = 26, baseY = 214, plotBottom = 246
const barArea = baseY - topY

const geo = computed(() => {
  const ms = months.value
  const n = ms.length
  if (!n) return null
  const maxVal = Math.max(1, ...ms.map((m) => Math.max(m.rev, m.exp, Math.abs(m.profit))))
  const step = (W - padL - padR) / n
  const bw = Math.min(step * 0.3, 34)
  const pts = ms.map((m, i) => {
    const cx = padL + step * (i + 0.5)
    return { ...m, cx, py: Math.min(baseY - (m.profit / maxVal) * barArea, plotBottom) }
  })
  let line = `M ${pts[0].cx.toFixed(1)} ${pts[0].py.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1], dx = (p1.cx - p0.cx) / 2
    line += ` C ${(p0.cx + dx).toFixed(1)} ${p0.py.toFixed(1)}, ${(p1.cx - dx).toFixed(1)} ${p1.py.toFixed(1)}, ${p1.cx.toFixed(1)} ${p1.py.toFixed(1)}`
  }
  const last = pts[pts.length - 1]
  return {
    maxVal, bw, pts, line, last,
    area: `${line} L ${last.cx.toFixed(1)} ${baseY} L ${pts[0].cx.toFixed(1)} ${baseY} Z`,
    showLabels: n <= 6, // value labels on bars only while there is room
    grid: [0.25, 0.5, 0.75, 1].map((f) => ({ y: baseY - f * barArea, text: fmtMoney(maxVal * f) })),
    bars: pts.map((p) => ({
      ...p,
      revH: (p.rev / maxVal) * barArea,
      expH: (p.exp / maxVal) * barArea,
    })),
  }
})
const f1 = (n) => n.toFixed(1)
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2>{{ title }}</h2>
      <div class="chart-legend">
        <span><i style="background:var(--teal)"></i> الإيراد</span>
        <span><i style="background:var(--amber)"></i> المصاريف</span>
        <span><i class="line" style="background:var(--brick)"></i> صافي الربح</span>
      </div>
    </div>
    <div class="panel-body">
    <div v-if="range" class="range">{{ range }}</div>

    <div v-if="!geo" class="empty" style="padding:26px 0">
      <div class="big">📈</div>لا توجد بيانات تشغيل تطابق الفلتر الحالي لعرض الرسم البياني
    </div>
    <div v-else class="chart-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="الأداء الشهري حسب الفلتر الحالي">
        <defs>
          <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--teal)" /><stop offset="100%" stop-color="var(--teal-dark)" />
          </linearGradient>
          <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#E3A75C" /><stop offset="100%" stop-color="#C9822E" />
          </linearGradient>
          <linearGradient id="gradProfitArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--brick)" stop-opacity="0.22" /><stop offset="100%" stop-color="var(--brick)" stop-opacity="0" />
          </linearGradient>
          <filter id="barShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.15" />
          </filter>
        </defs>

        <g v-for="g in geo.grid" :key="g.y">
          <line :x1="padL" :y1="f1(g.y)" :x2="W - padR" :y2="f1(g.y)" stroke="var(--line)" stroke-width="1" stroke-dasharray="4 6" />
          <text :x="f1(padL - 8)" :y="f1(g.y + 4)" text-anchor="end" font-size="10.5" fill="var(--ink-soft)">{{ g.text }}</text>
        </g>

        <g v-for="b in geo.bars" :key="b.key">
          <rect class="bar" :x="f1(b.cx - geo.bw - 3)" :y="f1(baseY - b.revH)" :width="f1(geo.bw)" :height="f1(b.revH)" rx="4" fill="url(#gradTeal)" filter="url(#barShadow)">
            <title>{{ b.label }} — الإيراد: {{ fmtMoney(b.rev) }}</title>
          </rect>
          <rect class="bar" :x="f1(b.cx + 3)" :y="f1(baseY - b.expH)" :width="f1(geo.bw)" :height="f1(b.expH)" rx="4" fill="url(#gradAmber)" filter="url(#barShadow)">
            <title>{{ b.label }} — المصاريف: {{ fmtMoney(b.exp) }}</title>
          </rect>
          <template v-if="geo.showLabels">
            <text :x="f1(b.cx - geo.bw / 2 - 3)" :y="f1(baseY - b.revH - 6)" text-anchor="middle" font-size="10" font-weight="700" fill="var(--teal-dark)">{{ fmtMoney(b.rev) }}</text>
            <text :x="f1(b.cx + geo.bw / 2 + 3)" :y="f1(baseY - b.expH - 6)" text-anchor="middle" font-size="10" font-weight="700" fill="#9C6A22">{{ fmtMoney(b.exp) }}</text>
          </template>
          <line :x1="f1(b.cx)" :y1="baseY" :x2="f1(b.cx)" :y2="baseY + 6" stroke="var(--line)" stroke-width="2" />
          <text :x="f1(b.cx)" :y="baseY + 24" text-anchor="middle" font-size="12" fill="var(--ink-soft)">{{ b.label }}</text>
        </g>

        <path :d="geo.area" fill="url(#gradProfitArea)" stroke="none" />
        <path class="profit-path" :d="geo.line" fill="none" stroke="var(--brick)" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" />
        <circle v-for="p in geo.pts" :key="p.key" class="bar" :cx="f1(p.cx)" :cy="f1(p.py)" r="4.5" fill="#fff" stroke="var(--brick)" stroke-width="2.5">
          <title>{{ p.label }} — صافي الربح: {{ fmtMoney(p.profit) }}</title>
        </circle>
        <text class="car" :x="f1(geo.last.cx)" :y="f1(geo.last.py - 14)" text-anchor="middle" font-size="20">🚘</text>
      </svg>
    </div>
    </div>
  </section>
</template>

<style scoped>
.chart-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--ink-soft)}
.chart-legend span{display:inline-flex;align-items:center;gap:6px}
.chart-legend i{width:10px;height:10px;border-radius:3px;display:inline-block}
.chart-legend i.line{width:14px;height:2px;border-radius:2px}
.range{font-size:12px;color:var(--ink-soft);margin-bottom:10px}
.chart-wrap{width:100%;overflow-x:auto}
.chart-wrap svg{width:100%;height:auto;min-width:520px;display:block}
.bar{transition:opacity .15s}
.bar:hover{opacity:.75}
.profit-path{stroke-dasharray:1400;stroke-dashoffset:1400;animation:draw 1.1s ease-out forwards .15s}
.car{animation:carIn .9s ease-out forwards .5s;opacity:0;transform:translateY(4px)}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes carIn{to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.profit-path{animation:none;stroke-dashoffset:0}.car{animation:none;opacity:1;transform:none}}
</style>
