<script setup>
import { ref, onMounted } from 'vue'
import { loadAll, IDB_STORES } from './db/idb.js'
import { useAuthStore } from './stores/auth.js'
import Login from './views/Login.vue'

const auth = useAuthStore()
const counts = ref({})
onMounted(async () => {
  await auth.init()
  for (const s of IDB_STORES) counts.value[s] = (await loadAll(s)).length
})
</script>

<template>
  <template v-if="auth.ready">
    <Login v-if="!auth.currentUser" />
    <main v-else style="padding: 24px">
      <h1>أهلاً {{ auth.currentUser.name || auth.currentUser.username }}</h1>
      <button class="btn" @click="auth.logout()">خروج</button>
      <ul>
        <li v-for="(n, s) in counts" :key="s">{{ s }}: {{ n }}</li>
      </ul>
    </main>
  </template>
</template>
