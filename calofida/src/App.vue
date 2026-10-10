<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useThemeStore } from './stores/theme.js'
import {
  useCarsStore, useDriversStore, useMaintItemsStore, useMaintStore, useTasksStore, useAirportStore,
} from './stores/collections.js'
import AppHeader from './components/AppHeader.vue'
import Login from './views/Login.vue'
import Admin from './views/Admin.vue'
import Fleet from './views/Fleet.vue'
import DailyOps from './views/DailyOps.vue'
import Dashboard from './views/Dashboard.vue'
import Maintenance from './views/Maintenance.vue'
import Tasks from './views/Tasks.vue'
import Airport from './views/Airport.vue'
import Drivers from './views/Drivers.vue'
import { useOpsStore } from './stores/ops.js'

const auth = useAuthStore()
useThemeStore()

// A tab shows only when the user has "view" on one of its permission pages (see PERM_PAGES in the auth store).
const TABS = [
  { id: 'dashboard', label: 'لوحة التحكم', perms: ['dashboard'] },
  { id: 'ops', label: 'التشغيل اليومي', perms: ['ops'] },
  { id: 'cars', label: 'بيان السيارات', perms: ['cars'] },
  { id: 'maint', label: 'الصيانة', perms: ['maint'] },
  { id: 'tasks', label: 'المهام القادمة', perms: ['tasks'] },
  { id: 'airport', label: 'مواعيد المطار', perms: ['airport'] },
  { id: 'drivers', label: 'السائقين', perms: ['drivers'] },
  { id: 'settings', label: '⚙️ الأدمن', perms: ['maintitems', 'users', 'backup', 'settings'] },
]
const visibleTabs = computed(() => TABS.filter((t) => t.perms.some((k) => auth.can(k, 'view'))))

const active = ref('dashboard')

// Every login (and logout) lands on the first tab the user may see; a tab that loses access falls back too.
const firstTab = () => visibleTabs.value[0]?.id || ''
watch(() => auth.currentUser?.id, () => { active.value = firstTab() })
watch(visibleTabs, (tabs) => { if (!tabs.some((t) => t.id === active.value)) active.value = firstTab() })

const dbError = ref('')

onMounted(async () => {
  try {
    await Promise.all([
      auth.init(), useCarsStore().load(), useDriversStore().load(), useMaintItemsStore().load(), useOpsStore().load(),
      useMaintStore().load(), useTasksStore().load(), useAirportStore().load(),
    ])
  } catch (e) {
    console.error(e)
    dbError.value = 'تعذر قراءة البيانات من قاعدة البيانات المحلية (IndexedDB). قد لا يعمل التخزين في هذا المتصفح أو الوضع الحالي (مثل التصفح الخاص).'
  }
})
</script>

<template>
  <div v-if="dbError" class="card db-error">{{ dbError }}</div>
  <template v-else-if="auth.ready">
    <Login v-if="!auth.currentUser" />
    <template v-else>
      <AppHeader v-model="active" :tabs="visibleTabs" />
      <main>
        <div :key="active" class="view">
          <div v-if="!visibleTabs.length" class="card db-error">ما عندكش صلاحية لعرض أي صفحة — اطلب من الأدمن يفعّل صلاحيات حسابك.</div>
          <Admin v-else-if="active === 'settings'" />
          <Dashboard v-else-if="active === 'dashboard'" />
          <DailyOps v-else-if="active === 'ops'" />
          <Fleet v-else-if="active === 'cars'" />
          <Maintenance v-else-if="active === 'maint'" />
          <Tasks v-else-if="active === 'tasks'" />
          <Airport v-else-if="active === 'airport'" />
          <Drivers v-else-if="active === 'drivers'" />
        </div>
      </main>
      <footer>ليموزين كالوفيدا · البيانات محفوظة محليًا على هذا الجهاز فقط</footer>
    </template>
  </template>
  <div v-else class="app-loading">
    <div style="font-size:34px;">🚘</div>
    <div style="font-weight:700; color:var(--ink);">جاري تحميل البيانات...</div>
    <div class="spinner"></div>
  </div>
</template>

<style>
.db-error{max-width:520px;margin:15vh auto;text-align:center;color:var(--brick);background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:20px}
.app-loading{position:fixed;inset:0;z-index:9999;background:var(--paper);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px}
.app-loading .spinner{width:34px;height:34px;border:3px solid var(--line);border-top-color:var(--teal);border-radius:50%;animation:appLoadSpin .8s linear infinite}
@keyframes appLoadSpin{to{transform:rotate(360deg)}}
</style>
