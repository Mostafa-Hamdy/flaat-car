<script setup>
import { ref, useSlots, Fragment, Comment, onMounted, onBeforeUnmount, nextTick } from 'vue'

// Drop-in replacement for a native select: same v-model and <option> children, but opens a
// chip-style list (each option a bordered rounded box, selected one tinted). An <option value="">
// is shown first as the "clear" row. The list is teleported to <body> so tables/modals never clip it.
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue', 'change'])
const slots = useSlots()

const root = ref(null)
const panel = ref(null)
const open = ref(false)
const pos = ref({})

const textOf = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map(textOf).join('') : c && typeof c.children !== 'undefined' ? textOf(c.children) : '')

function flatten(nodes, out) {
  for (const n of nodes || []) {
    if (Array.isArray(n)) flatten(n, out)
    else if (!n || n.type === Comment) continue
    else if (n.type === Fragment) flatten(n.children, out)
    else if (n.type === 'option') {
      const label = textOf(n.children).trim()
      const p = n.props || {}
      out.push({ value: p.value !== undefined ? p.value : label, label, disabled: p.disabled !== undefined && p.disabled !== false })
    }
  }
  return out
}
const opts = () => flatten(slots.default?.(), [])
const current = () => opts().find((o) => o.value === props.modelValue)

function pick(o) {
  if (o.disabled) return
  if (o.value !== props.modelValue) {
    emit('update:modelValue', o.value)
    emit('change', o.value)
  }
  open.value = false
}

function place() {
  const r = root.value.getBoundingClientRect()
  const width = Math.max(r.width, 220)
  const rtl = getComputedStyle(root.value).direction === 'rtl'
  let left = rtl ? r.right - width : r.left
  left = Math.min(Math.max(8, left), window.innerWidth - width - 8)
  const below = window.innerHeight - r.bottom
  const flip = below < 240 && r.top > below
  pos.value = {
    left: left + 'px', width: width + 'px',
    maxHeight: Math.max(160, Math.min(320, (flip ? r.top : below) - 16)) + 'px',
    ...(flip ? { bottom: window.innerHeight - r.top + 6 + 'px' } : { top: r.bottom + 6 + 'px' }),
  }
}

async function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    place()
    await nextTick()
    panel.value?.querySelector('.sb-opt.on')?.scrollIntoView({ block: 'nearest' })
  }
}

const onDocDown = (e) => {
  if (!open.value) return
  if (root.value?.contains(e.target) || panel.value?.contains(e.target)) return
  open.value = false
}
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
const onScroll = (e) => { if (open.value && !panel.value?.contains(e.target)) open.value = false }
onMounted(() => {
  document.addEventListener('mousedown', onDocDown)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <div ref="root" class="sb" :class="{ open, disabled }">
    <button type="button" class="sb-btn" :disabled="disabled" :class="{ muted: !current()?.label || current()?.value === '' }" @click="toggle">
      <span class="sb-label">{{ current()?.label || '' }}</span><span class="sb-caret">▾</span>
    </button>
    <Teleport to="body">
      <div v-if="open" ref="panel" class="sb-panel" :style="pos">
        <button
          v-for="(o, i) in opts()" :key="i" type="button" class="sb-opt"
          :class="{ on: o.value === modelValue, clear: o.value === '', off: o.disabled }"
          @click="pick(o)"
        >{{ o.label || (o.value === '' ? 'مسح' : '') }}</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.sb{position:relative;min-width:0}
.sb-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 10px;border:1px solid var(--line);border-radius:7px;font-family:inherit;font-size:13.5px;color:var(--ink);background:var(--bg);cursor:pointer;text-align:start;min-height:38px}
.sb-btn:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.sb-btn.muted .sb-label{color:var(--ink-soft)}
.sb-btn:disabled{cursor:not-allowed;opacity:.6}
.sb-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sb-caret{color:var(--ink-soft);font-size:11px;flex:none;transition:transform .12s ease}
.open .sb-caret{transform:rotate(180deg)}
/* ops-cell inputs in the daily table are borderless; keep the select visually in line with them */
.sb.ops-cell{padding:0;border:none;background:transparent;width:100%}
.sb.ops-cell .sb-btn{padding:6px 8px;min-height:0}
:global(.field.filter-active) .sb-btn{border-color:var(--teal);background:var(--teal-soft);color:var(--teal-dark);font-weight:700;box-shadow:0 0 0 1px var(--teal)}
</style>

<style>
.sb-panel{position:fixed;z-index:100;display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:10px;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:var(--shadow-pop,0 8px 24px rgba(0,0,0,.18))}
.sb-opt{flex:none;width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);font-family:inherit;font-size:14px;text-align:start;cursor:pointer}
.sb-opt:hover{background:var(--surface-2)}
.sb-opt.on{background:color-mix(in srgb,var(--accent) 16%,var(--surface));border-color:var(--accent);font-weight:700}
.sb-opt.clear{color:var(--ink-soft);font-style:italic}
.sb-opt.clear.on{font-weight:400}
.sb-opt.off{opacity:.5;cursor:not-allowed}
</style>
