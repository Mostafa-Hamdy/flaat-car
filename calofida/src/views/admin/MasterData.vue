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
  <section class="panel">
    <div class="panel-head"><h2>📋 الماستر داتا</h2></div>
    <div class="panel-body">
      <div class="subtabs">
        <button v-for="s in subs" :key="s.id" class="subtab" :class="{ active: sub === s.id }" @click="sub = s.id">{{ s.label }}</button>
      </div>
      <component :is="subs.find((s) => s.id === sub).comp" />
    </div>
  </section>
</template>

<style scoped>
.subtabs{ display:flex; gap:8px; margin-bottom:18px; border-bottom:2px solid var(--line); flex-wrap:wrap; }
.subtab{
  padding:9px 16px; font-size:13.5px; font-weight:700; color:var(--ink-soft);
  background:transparent; border:none; cursor:pointer; border-radius:8px 8px 0 0;
  font-family:inherit; border-bottom:2px solid transparent; margin-bottom:-2px;
}
.subtab:hover{ color:var(--teal-dark); }
.subtab.active{ color:var(--teal-dark); border-bottom-color:var(--teal); background:var(--teal-soft); }
</style>
