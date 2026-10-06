<script setup>
import { useThemeStore, THEMES } from '../../stores/theme.js'
import Users from './Users.vue'
import OwnPassword from './OwnPassword.vue'
import Backup from './Backup.vue'

const theme = useThemeStore()
</script>

<template>
  <Users />
  <OwnPassword />
  <Backup />
  <section class="panel">
    <div class="panel-head"><h2>🎨 مظهر البرنامج</h2></div>
    <div class="panel-body">
      <p style="color:var(--ink-soft); margin-top:0;">اختر الثيم اللي يناسبك — بيتحفظ على هذا الجهاز.</p>
      <div class="theme-grid">
        <button
          v-for="t in THEMES"
          :key="t.id"
          type="button"
          class="theme-option"
          :class="{ active: theme.current === t.id }"
          @click="theme.set(t.id)"
        >
          <span class="theme-swatch" :style="{ background: t.swatch }"></span>
          {{ t.label }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.theme-grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
.theme-option{
  display:flex; flex-direction:column; align-items:flex-start; gap:8px;
  background:var(--surface); border:2px solid var(--line); border-radius:var(--radius);
  padding:12px 14px; font-family:inherit; font-size:13px; font-weight:700; color:var(--ink);
  cursor:pointer; text-align:start;
}
.theme-option:hover{ border-color:var(--teal); }
.theme-option.active{ border-color:var(--teal); box-shadow:0 0 0 2px var(--teal-soft); }
.theme-swatch{ width:100%; height:34px; border-radius:7px; display:block; }
</style>
