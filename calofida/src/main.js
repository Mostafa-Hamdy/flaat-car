import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './fonts.css' // self-hosted fonts
import './styles.css'
import { openDB } from './db/idb.js'

openDB()
  .catch((err) => console.error(err)) // App.vue shows the database error screen
  .finally(() => createApp(App).use(createPinia()).mount('#app'))
