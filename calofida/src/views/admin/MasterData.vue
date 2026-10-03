<script setup>
import { ref } from 'vue'
import Drivers from './Drivers.vue'
import MaintCatalog from './MaintCatalog.vue'
import CarsStatus from './CarsStatus.vue'

const sub = ref('drivers')
const subs = [
  { id: 'drivers', label: '👤 السائقين', comp: Drivers },
  { id: 'maintitems', label: '🧰 بنود الصيانة', comp: MaintCatalog },
  { id: 'carsstatus', label: '🚗 حالة السيارات', comp: CarsStatus },
]
</script>

<template>
  <section class="card">
    <div class="subtabs">
      <button v-for="s in subs" :key="s.id" class="subtab" :class="{ active: sub === s.id }" @click="sub = s.id">{{ s.label }}</button>
    </div>
    <component :is="subs.find((s) => s.id === sub).comp" />
  </section>
</template>

<style scoped>
.subtabs{display:flex;gap:8px;margin-bottom:18px;border-bottom:2px solid var(--line);flex-wrap:wrap}
.subtab{padding:9px 18px;background:none;border:none;border-bottom:3px solid transparent;margin-bottom:-2px;color:var(--ink-soft);font:inherit;font-weight:700;cursor:pointer}
.subtab.active{color:var(--teal-dark);border-bottom-color:var(--teal)}
</style>
