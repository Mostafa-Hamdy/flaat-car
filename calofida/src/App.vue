<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAuthStore } from './stores/auth.js'
import { useThemeStore } from './stores/theme.js'
import { useCarsStore, useDriversStore, useMaintItemsStore } from './stores/collections.js'
import AppHeader from './components/AppHeader.vue'
import ComingSoon from './components/ComingSoon.vue'
import Login from './views/Login.vue'
import Admin from './views/Admin.vue'

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
  await Promise.all([auth.init(), useCarsStore().load(), useDriversStore().load(), useMaintItemsStore().load()])
})
</script>

<template>
  <template v-if="auth.ready">
    <Login v-if="!auth.currentUser" />
    <template v-else>
      <AppHeader v-model="active" :tabs="TABS" />
      <main class="content">
        <Admin v-if="active === 'settings' && auth.currentUser.showAdmin" />
        <ComingSoon v-else :title="titleOf(active)" />
      </main>
    </template>
  </template>
</template>

<style>
.content{padding:24px 28px}
@media (max-width:700px){.content{padding:16px}}
</style>
