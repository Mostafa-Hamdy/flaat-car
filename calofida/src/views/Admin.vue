<script setup>
import { ref } from 'vue'
import ComingSoon from '../components/ComingSoon.vue'
import Settings from './admin/Settings.vue'

const sub = ref('master')
const subs = [
  { id: 'master', label: 'الماستر داتا' },
  { id: 'settings', label: 'الإعدادات' },
]
</script>

<template>
  <div>
    <div class="subtabs">
      <button v-for="s in subs" :key="s.id" class="subtab" :class="{ active: sub === s.id }" @click="sub = s.id">{{ s.label }}</button>
    </div>
    <ComingSoon v-if="sub === 'master'" title="الماستر داتا" />
    <Settings v-else />
  </div>
</template>

<style scoped>
.subtabs{display:flex;gap:8px;margin-bottom:18px;border-bottom:2px solid var(--line);flex-wrap:wrap}
.subtab{padding:9px 18px;background:none;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;color:var(--ink-soft);font:inherit;font-weight:700;cursor:pointer}
.subtab.active{color:var(--teal-dark);border-bottom-color:var(--teal)}
</style>
