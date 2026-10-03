<script setup>
import { ref, reactive, computed } from 'vue'
import { useCarsStore } from '../../stores/collections.js'
import { useAuthStore } from '../../stores/auth.js'
import { printTable } from '../../utils/print.js'
import Modal from '../../components/Modal.vue'
import FilterClear from '../../components/FilterClear.vue'

// Edits only `status` and `joinDate` on a car; the rest of the car lives on the Fleet page.
const store = useCarsStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('admin'))

const q = ref('')
const statusF = ref('')
const anyFilter = computed(() => !!(q.value.trim() || statusF.value))
const clear = () => { q.value = ''; statusF.value = '' }

const isActive = (c) => (c.status || 'active') !== 'inactive'
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return store.items
    .filter((c) => (!s || [c.plate, c.brand].join(' ').toLowerCase().includes(s)) && (!statusF.value || (c.status || 'active') === statusF.value))
    .sort((a, b) => (a.plate || '').localeCompare(b.plate || '', 'ar'))
})

const editing = ref(null)
const form = reactive({ joinDate: '', status: 'active' })
const table = ref(null)

function edit(c) {
  editing.value = c
  Object.assign(form, { joinDate: c.joinDate || '', status: c.status || 'active' })
}

async function save() {
  await store.upsert({ joinDate: form.joinDate, status: form.status || 'active' }, editing.value.id)
  editing.value = null
}
</script>

<template>
  <div>
    <div class="panel-head">
      <h3>حالة السيارات (نشطة / غير نشطة) وتاريخ الانضمام</h3>
      <button class="btn secondary" @click="printTable(table, 'حالة السيارات')">🖨️ طباعة</button>
    </div>
    <p class="note">
      السيارة اللي حالتها "غير نشطة" بتتشال تلقائيًا من صفحة "بيان السيارات" ومن قائمة اختيار السيارة في التشغيل اليومي.
      باقي بيانات السيارة (اللوحة، الرخصة، التأمين...) لسه بتتعدل من صفحة "بيان السيارات" زي ما هي.
    </p>

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (لوحة / ماركة)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <div class="field" :class="{ 'filter-active': statusF }">
        <label>الحالة</label>
        <select v-model="statusF">
          <option value="">الكل</option>
          <option value="active">نشطة</option>
          <option value="inactive">غير نشطة</option>
        </select>
      </div>
      <FilterClear :active="anyFilter" @clear="clear" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead><tr><th>لوحة رقم</th><th>الماركة / الموديل</th><th>تاريخ الانضمام</th><th>الحالة</th><th></th></tr></thead>
        <tbody>
          <tr v-for="c in rows" :key="c.id">
            <td>{{ c.plate }}</td>
            <td>{{ c.brand }} {{ c.model }}</td>
            <td class="num">{{ c.joinDate || '—' }}</td>
            <td><span class="badge" :class="isActive(c) ? 'ok' : 'bad'">{{ isActive(c) ? 'نشطة' : 'غير نشطة' }}</span></td>
            <td><button v-if="canEdit" class="btn secondary small" @click="edit(c)">تعديل الحالة</button></td>
          </tr>
        </tbody>
      </table>
      <div v-if="!store.items.length" class="empty">
        <div class="big">🚗</div>
        لا توجد سيارات مسجلة بعد — أضف سيارة من صفحة "بيان السيارات" أولًا
      </div>
      <div v-else-if="!rows.length" class="empty">لا توجد نتائج مطابقة للفلاتر</div>
    </div>

    <Modal v-if="editing" :title="'تعديل حالة سيارة: ' + (editing.plate || '')" width="440px" @close="editing = null">
      <div class="field"><label>السيارة</label><input :value="`${editing.plate || ''} — ${editing.brand || ''} ${editing.model || ''}`" disabled></div>
      <div class="field"><label>تاريخ الانضمام للأسطول</label><input v-model="form.joinDate" type="date"></div>
      <div class="field">
        <label>الحالة</label>
        <select v-model="form.status"><option value="active">نشطة</option><option value="inactive">غير نشطة</option></select>
      </div>
      <template #footer>
        <button class="btn" @click="editing = null">إلغاء</button>
        <button class="btn primary" @click="save">حفظ</button>
      </template>
    </Modal>
  </div>
</template>
