import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles.css'
import { openDB } from './db/idb.js'

openDB()
  .catch((err) => {
    console.error(err)
    alert('تعذر فتح قاعدة البيانات المحلية (IndexedDB). قد لا يعمل التخزين في هذا المتصفح أو الوضع الحالي (مثل التصفح الخاص).')
  })
  .finally(() => createApp(App).use(createPinia()).mount('#app'))
