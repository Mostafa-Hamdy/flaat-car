<script setup>
import { ref, watch, onMounted } from 'vue'
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
import { useOpsStore } from './stores/ops.js'

const auth = useAuthStore()
useThemeStore()

// Page ids match the legacy `data-view` values and the permission keys in auth.canEdit.
const TABS = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'ops', label: 'التشغيل اليومي' },
  { id: 'cars', label: 'بيان السيارات' },
  { id: 'maint', label: 'الصيانة' },
  { id: 'tasks', label: 'المهام القادمة' },
  { id: 'airport', label: 'مواعيد المطار' },
  { id: 'settings', label: '⚙️ الأدمن', adminOnly: true },
]

const active = ref('dashboard')

// Every login (and logout) lands on the dashboard, which everyone can see.
watch(() => auth.currentUser?.id, () => { active.value = 'dashboard' })

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
      <AppHeader v-model="active" :tabs="TABS" />
      <main class="content">
        <Admin v-if="active === 'settings' && auth.currentUser.showAdmin" />
        <Dashboard v-else-if="active === 'dashboard'" />
        <DailyOps v-else-if="active === 'ops'" />
        <Fleet v-else-if="active === 'cars'" />
        <Maintenance v-else-if="active === 'maint'" />
        <Tasks v-else-if="active === 'tasks'" />
        <Airport v-else-if="active === 'airport'" />
        <Dashboard v-else />
      </main>
    </template>
  </template>
</template>

<style>
.content{padding:24px 28px}
.db-error{max-width:520px;margin:15vh auto;text-align:center;color:var(--brick)}
@media (max-width:700px){.content{padding:16px}}
</style>
