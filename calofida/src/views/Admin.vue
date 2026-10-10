<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import MasterData from './admin/MasterData.vue'
import Settings from './admin/Settings.vue'

const auth = useAuthStore()
const subs = computed(() => [
  { id: 'master', label: '📋 الماستر داتا', show: auth.can('maintitems') },
  { id: 'settings', label: '⚙️ الإعدادات', show: ['users', 'backup', 'settings'].some((k) => auth.can(k)) },
].filter((s) => s.show))
const picked = ref('')
const sub = computed(() => (subs.value.some((s) => s.id === picked.value) ? picked.value : subs.value[0]?.id))
</script>

<template>
  <div>
    <div class="admintabs">
      <button v-for="s in subs" :key="s.id" class="admintab" :class="{ active: sub === s.id }" @click="picked = s.id">{{ s.label }}</button>
    </div>
    <MasterData v-if="sub === 'master'" />
    <Settings v-else />
  </div>
</template>

<style scoped>
.admintabs{ display:flex; gap:10px; margin-bottom:18px; }
.admintab{
  padding:11px 22px; font-size:14px; font-weight:800; color:var(--ink-soft);
  background:var(--surface); border:1px solid var(--line); cursor:pointer; border-radius:10px;
  font-family:inherit;
}
.admintab:hover{ border-color:var(--teal); }
.admintab.active{ color:#fff; background:var(--teal); border-color:var(--teal); }
</style>
