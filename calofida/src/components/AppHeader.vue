<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps({ tabs: Array, modelValue: String })
const emit = defineEmits(['update:modelValue'])
const auth = useAuthStore()

// The admin tab is hidden entirely unless the user has the showAdmin flag.
const visibleTabs = computed(() => props.tabs.filter((t) => !t.adminOnly || auth.currentUser?.showAdmin))
</script>

<template>
  <header class="app-header">
    <div class="header-top">
      <div class="brand">
        <div class="brand-badge">🚘</div>
        <div>
          <div class="brand-title">ليموزين كالوفيدا</div>
          <div class="brand-sub">إدارة الأسطول والتشغيل اليومي — نسخة أوفلاين</div>
        </div>
      </div>
      <div class="user-badge">
        <span>👤 {{ auth.currentUser?.name || auth.currentUser?.username }}</span>
        <button type="button" class="ghost-btn" @click="auth.logout()">🚪 تسجيل الخروج</button>
      </div>
    </div>
    <nav class="tabs">
      <button
        v-for="t in visibleTabs"
        :key="t.id"
        class="tab"
        :class="{ active: modelValue === t.id }"
        @click="emit('update:modelValue', t.id)"
      >{{ t.label }}</button>
    </nav>
  </header>
</template>

<style scoped>
.app-header{background:var(--surface);color:var(--fg);border-bottom:1px solid var(--border);padding:var(--sp-5) var(--sp-8) 0}
.header-top{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:var(--sp-3)}
.brand-badge{width:40px;height:40px;border-radius:var(--radius-lg);background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:20px;border:1px solid var(--border)}
.brand-title{font-size:var(--fs-h1);font-weight:var(--fw-semibold)}
.brand-sub{font-size:var(--fs-sm);color:var(--fg-muted);margin-top:2px}
.user-badge{display:flex;align-items:center;gap:var(--sp-3);font-size:var(--fs-sm);font-weight:var(--fw-medium)}
.ghost-btn{background:var(--surface-2);color:var(--fg);border:1px solid var(--border);height:var(--control-h);padding:0 var(--sp-3);border-radius:var(--radius-md);font-size:var(--fs-sm);cursor:pointer;font-family:inherit}
.ghost-btn:hover{background:var(--border)}
.tabs{display:flex;gap:var(--sp-1);margin-top:var(--sp-4);overflow-x:auto}
.tab{padding:var(--sp-3) var(--sp-4);font-size:var(--fs-ui);font-weight:var(--fw-medium);color:var(--fg-muted);background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;white-space:nowrap}
.tab:hover{color:var(--fg)}
.tab.active{color:var(--fg);border-bottom-color:var(--accent)}
@media (max-width:700px){.app-header{padding:var(--sp-4) var(--sp-4) 0}}
</style>
