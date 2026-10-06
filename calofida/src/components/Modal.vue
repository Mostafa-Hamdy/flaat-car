<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

defineProps({ title: String, width: { type: String, default: '560px' } })
const emit = defineEmits(['close'])

const onKey = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @mousedown.self="emit('close')">
      <div class="modal" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
        <div class="head">
          <h3>{{ title }}</h3>
          <button type="button" class="x" aria-label="إغلاق" @click="emit('close')">✕</button>
        </div>
        <div class="body"><slot /></div>
        <div class="foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay{position:fixed;inset:0;background:rgba(20,26,26,.45);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;z-index:50;overflow-y:auto}
.modal{background:var(--surface);color:var(--ink);border-radius:var(--radius-xl);border:1px solid var(--border);width:100%;box-shadow:var(--shadow-pop)}
.head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
.head h3{margin:0}
.body{padding:18px 20px;max-height:70vh;overflow-y:auto}
.foot{padding:14px 20px;border-top:1px solid var(--line);display:flex;justify-content:flex-end;gap:8px}
.x{background:none;border:none;font-size:20px;cursor:pointer;color:var(--ink-soft)}
</style>
