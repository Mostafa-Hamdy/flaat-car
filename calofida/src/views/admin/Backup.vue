<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth.js'
import { useOpsStore } from '../../stores/ops.js'
import {
  useCarsStore, useDriversStore, useMaintItemsStore, useMaintStore, useTasksStore, useAirportStore,
} from '../../stores/collections.js'
import { buildBackup, restoreBackup, validateBackup, downloadBlob } from '../../utils/backup.js'
import { exportExcel } from '../../utils/excel.js'

const auth = useAuthStore()
const canImport = computed(() => auth.canEdit('admin'))
const fileInput = ref(null)
const busy = ref(false)

const today = () => new Date().toISOString().slice(0, 10)

async function exportJson() {
  const data = await buildBackup()
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'limousine-backup-' + today() + '.json')
}

async function onFile(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  busy.value = true
  try {
    let data
    try { data = JSON.parse(await file.text()) } catch (err) { throw new Error('ملف غير صالح') }
    const present = validateBackup(data)
    if (!confirm(`سيتم استبدال البيانات الحالية بالنسخة المستوردة (${present.length} أقسام). الأقسام الغير موجودة في الملف هتفضل زي ما هي. هل تريد المتابعة؟`)) return
    await restoreBackup(data)
    await Promise.all([
      useCarsStore().load(), useOpsStore().load(), useMaintStore().load(), useTasksStore().load(),
      useDriversStore().load(), useMaintItemsStore().load(), useAirportStore().load(), auth.reloadUsers(),
    ])
    alert('تم استيراد البيانات بنجاح')
  } catch (err) {
    alert(err.message || 'تعذر استيراد الملف')
  } finally {
    busy.value = false
  }
}

function toExcel() {
  exportExcel({ cars: useCarsStore().items, ops: useOpsStore().items })
}
</script>

<template>
  <section class="card block">
    <div class="panel-head"><h2 style="margin:0">النسخ الاحتياطي</h2></div>
    <p class="note">
      تصدير كل بيانات النظام (السيارات، التشغيل اليومي، الصيانة، المهام، السائقين، مواعيد المطار، المستخدمين) كملف نسخة احتياطية،
      أو استيراد نسخة سابقة لاستعادة البيانات (بتقبل ملفات النسخة القديمة كمان).
    </p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" @click="exportJson">⭳ تصدير نسخة احتياطية (JSON)</button>
      <button v-if="canImport" class="btn secondary" :disabled="busy" @click="fileInput.click()">⭱ استيراد نسخة</button>
      <button class="btn secondary" @click="toExcel">📊 تصدير ملف إكسل (بنفس صيغة الشيت الأصلي)</button>
      <input ref="fileInput" type="file" accept=".json,application/json" style="display:none" @change="onFile">
    </div>
  </section>
</template>

<style scoped>
.block{margin-bottom:20px}
.btn:disabled{opacity:.5;cursor:not-allowed}
</style>
