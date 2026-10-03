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
.app-header{background:linear-gradient(135deg,var(--teal-dark),var(--teal));color:#fff;padding:22px 28px 0;position:relative;overflow:hidden}
.app-header::after{content:"";position:absolute;inset-inline-start:0;bottom:0;width:100%;height:10px;pointer-events:none;
  background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 26px,transparent 26px 46px);opacity:.35}
.header-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:12px}
.brand-badge{width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid rgba(255,255,255,.25)}
.brand-title{font-size:20px;font-weight:800;font-family:'Tajawal',inherit}
.brand-sub{font-size:12.5px;opacity:.82;margin-top:2px}
.user-badge{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700}
.ghost-btn{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.35);padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit}
.ghost-btn:hover{background:rgba(255,255,255,.22)}
.tabs{display:flex;gap:2px;margin-top:18px;position:relative;z-index:1;overflow-x:auto}
.tab{padding:11px 20px;font-size:14px;font-weight:700;color:rgba(255,255,255,.72);background:transparent;border:none;cursor:pointer;border-radius:10px 10px 0 0;font-family:'Tajawal',inherit;white-space:nowrap}
.tab.active{background:var(--paper);color:var(--teal-dark)}
@media (max-width:700px){.app-header{padding:16px 16px 0}}
</style>
