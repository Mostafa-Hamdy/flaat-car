<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

// Checkbox-list dropdown. v-model is an array of selected option values (empty = no filter).
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'الكل' },
  searchable: Boolean,
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const searchBox = ref(null)
const open = ref(false)
const search = ref('')

const selected = computed(() => new Set(props.modelValue))
const shown = computed(() => {
  const s = search.value.trim().toLowerCase()
  return props.options.filter((o) => !s || String(o.label).toLowerCase().includes(s))
})
const label = computed(() => {
  const n = props.modelValue.length
  if (!n) return props.placeholder
  if (props.options.length && n === props.options.length) return props.placeholder + ' (الكل)'
  const names = props.options.filter((o) => selected.value.has(o.value)).map((o) => o.label)
  return names.length <= 2 ? names.join('، ') : names.length + ' محدد'
})

// Drop selections whose option no longer exists (e.g. a car was deleted).
watch(() => props.options, (opts) => {
  const valid = new Set(opts.map((o) => o.value))
  const kept = props.modelValue.filter((v) => valid.has(v))
  if (kept.length !== props.modelValue.length) emit('update:modelValue', kept)
})

function toggle(value, on) {
  const next = new Set(props.modelValue)
  if (on) next.add(value); else next.delete(value)
  emit('update:modelValue', [...next])
}
const selectAll = () => emit('update:modelValue', props.options.map((o) => o.value))
const clear = () => emit('update:modelValue', [])

function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    search.value = ''
    if (props.searchable) setTimeout(() => searchBox.value?.focus())
  }
}

const onDocClick = (e) => { if (root.value && !root.value.contains(e.target)) open.value = false }
const onKey = (e) => { if (e.key === 'Escape') open.value = false }
onMounted(() => { document.addEventListener('click', onDocClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onDocClick); document.removeEventListener('keydown', onKey) })
</script>

<template>
  <div ref="root" class="msdd" :class="{ open }">
    <button type="button" class="msdd-btn" @click="toggleOpen">
      <span class="msdd-btn-label">{{ label }}</span><span class="msdd-caret">▾</span>
    </button>
    <div v-if="open" class="msdd-panel">
      <div v-if="searchable" class="msdd-search"><input ref="searchBox" v-model="search" placeholder="بحث..."></div>
      <div class="msdd-actions">
        <button type="button" class="msdd-link" @click="selectAll">تحديد الكل</button>
        <button type="button" class="msdd-link" @click="clear">مسح</button>
      </div>
      <div class="msdd-list">
        <label v-for="o in shown" :key="o.value" class="msdd-opt">
          <input type="checkbox" :checked="selected.has(o.value)" @change="toggle(o.value, $event.target.checked)">
          <span>{{ o.label }}</span>
        </label>
        <div v-if="!shown.length" class="msdd-empty">لا نتائج</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msdd{position:relative}
.msdd-btn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 10px;border:1px solid var(--line);border-radius:7px;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--ink);background:var(--surface);cursor:pointer;text-align:start}
.msdd-btn-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msdd-caret{color:var(--ink-soft);font-size:11px;transition:transform .12s ease;flex:none}
.open .msdd-caret{transform:rotate(180deg)}
.msdd-panel{position:absolute;top:calc(100% + 6px);inset-inline-start:0;z-index:20;min-width:100%;width:max-content;max-width:260px;background:var(--surface);border:1px solid var(--line);border-radius:10px;box-shadow:var(--shadow);padding:8px}
.msdd-search{margin-bottom:6px}
.msdd-search input{width:100%;padding:7px 9px;border:1px solid var(--line);border-radius:6px;font-family:inherit;font-size:12.5px;background:var(--paper);color:var(--ink)}
.msdd-actions{display:flex;gap:10px;margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.msdd-link{background:none;border:none;padding:0;font-family:inherit;font-size:11.5px;font-weight:700;color:var(--teal-dark);cursor:pointer;text-decoration:underline}
.msdd-list{max-height:220px;overflow:auto;display:flex;flex-direction:column;gap:1px}
.msdd-opt{display:flex;align-items:center;gap:8px;padding:6px;border-radius:6px;font-size:13px;font-weight:600;color:var(--ink);cursor:pointer}
.msdd-opt:hover{background:var(--teal-soft)}
.msdd-opt input{width:auto;margin:0;accent-color:var(--teal);cursor:pointer}
.msdd-opt span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.msdd-empty{padding:10px 6px;font-size:12.5px;color:var(--ink-soft);text-align:center}
/* active-filter highlight when placed inside a .field.filter-active */
:global(.field.filter-active) .msdd-btn{border-color:var(--teal);background:var(--teal-soft);color:var(--teal-dark);box-shadow:0 0 0 1px var(--teal)}
</style>
