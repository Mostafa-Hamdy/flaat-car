<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useThemeStore } from './stores/theme.js'
import { useCarsStore, useDriversStore, useMaintItemsStore, useMaintStore, useTasksStore } from './stores/collections.js'
import AppHeader from './components/AppHeader.vue'
import ComingSoon from './components/ComingSoon.vue'
import Login from './views/Login.vue'
import Admin from './views/Admin.vue'
import Fleet from './views/Fleet.vue'
import DailyOps from './views/DailyOps.vue'
import Dashboard from './views/Dashboard.vue'
import Maintenance from './views/Maintenance.vue'
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
const titleOf = (id) => TABS.find((t) => t.id === id)?.label

const active = ref('dashboard')

// Every login (and logout) lands on the dashboard, which everyone can see.
watch(() => auth.currentUser?.id, () => { active.value = 'dashboard' })

onMounted(async () => {
  await Promise.all([auth.init(), useCarsStore().load(), useDriversStore().load(), useMaintItemsStore().load(), useOpsStore().load(),
    useMaintStore().load(), useTasksStore().load()])
})
</script>

<template>
  <template v-if="auth.ready">
    <Login v-if="!auth.currentUser" />
    <template v-else>
      <AppHeader v-model="active" :tabs="TABS" />
      <main class="content">
        <Admin v-if="active === 'settings' && auth.currentUser.showAdmin" />
        <Dashboard v-else-if="active === 'dashboard'" />
        <DailyOps v-else-if="active === 'ops'" />
        <Fleet v-else-if="active === 'cars'" />
        <Maintenance v-else-if="active === 'maint'" />
        <ComingSoon v-else :title="titleOf(active)" />
      </main>
    </template>
  </template>
</template>

<style>
.content{padding:24px 28px}
@media (max-width:700px){.content{padding:16px}}
</style>
