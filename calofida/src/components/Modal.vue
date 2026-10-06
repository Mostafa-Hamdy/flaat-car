<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

// Same layout as the legacy modals (760px). Like the legacy ones it does not close on a backdrop click,
// so a stray click never throws away a half-filled form; Escape and the ✕ button close it.
defineProps({ title: String, width: { type: String, default: '760px' } })
const emit = defineEmits(['close'])

const onKey = (e) => { if (e.key === 'Escape') emit('close') }
onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay">
      <div class="modal" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
        <div class="modal-head">
          <h3 style="margin:0">{{ title }}</h3>
          <button type="button" class="close-x" aria-label="إغلاق" @click="emit('close')">✕</button>
        </div>
        <div class="modal-body"><slot /></div>
        <div class="modal-foot"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay{
  position:fixed; inset:0; background:rgba(20,26,26,.45); display:flex;
  align-items:flex-start; justify-content:center; padding:40px 16px; z-index:50; overflow-y:auto;
}
.modal{
  background:var(--surface); color:var(--ink); border:1px solid var(--line); border-radius:var(--radius-xl); max-width:760px; width:100%;
  box-shadow:var(--shadow-pop);
}
.modal-head{ display:flex; justify-content:space-between; align-items:center; padding:16px 20px; border-bottom:1px solid var(--line); }
.modal-body{ padding:18px 20px; max-height:70vh; overflow-y:auto; }
.modal-foot{ padding:14px 20px; border-top:1px solid var(--line); display:flex; justify-content:flex-end; gap:8px; }
.close-x{ background:none; border:none; font-size:20px; cursor:pointer; color:var(--ink-soft); }
</style>
