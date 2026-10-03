<script setup>
import { useThemeStore, THEMES } from '../../stores/theme.js'

const theme = useThemeStore()
</script>

<template>
  <section class="card">
    <h2>🎨 مظهر البرنامج</h2>
    <p class="hint">اختر الثيم اللي يناسبك — بيتحفظ على هذا الجهاز.</p>
    <div class="grid">
      <button
        v-for="t in THEMES"
        :key="t.id"
        type="button"
        class="opt"
        :class="{ active: theme.current === t.id }"
        @click="theme.set(t.id)"
      >
        <span class="swatch" :style="{ background: t.swatch }"></span>
        {{ t.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.hint{color:var(--ink-soft);margin-top:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
.opt{display:flex;align-items:center;gap:10px;padding:12px;border:2px solid var(--line);border-radius:var(--radius);background:var(--surface);color:var(--ink);cursor:pointer;font:inherit}
.opt.active{border-color:var(--teal)}
.swatch{width:28px;height:28px;border-radius:8px;flex:none}
</style>
