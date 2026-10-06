<script setup>
import { ref, reactive, computed } from 'vue'
import { useMaintItemsStore } from '../../stores/collections.js'
import { useAuthStore } from '../../stores/auth.js'
import { fmtMoney, toNum } from '../../utils/helpers.js'
import { printTable } from '../../utils/print.js'
import Modal from '../../components/Modal.vue'
import FilterClear from '../../components/FilterClear.vue'

const store = useMaintItemsStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('admin'))

const q = ref('')
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return store.items
    .filter((it) => !s || (it.name || '').toLowerCase().includes(s))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
})

const editingId = ref(null)
const form = reactive({ name: '', price: '' })
const open = ref(false)
const table = ref(null)

function add() { editingId.value = null; Object.assign(form, { name: '', price: '' }); open.value = true }
function edit(it) { editingId.value = it.id; Object.assign(form, { name: it.name || '', price: it.price || '' }); open.value = true }

async function save() {
  const name = form.name.trim()
  if (!name) return alert('من فضلك اكتب اسم البند')
  await store.upsert({ name, price: toNum(form.price) }, editingId.value)
  open.value = false
}

async function del(it) {
  if (confirm('هل تريد حذف هذا البند من الدليل؟')) await store.remove(it.id)
}
</script>

<template>
  <div>
    <div class="panel-head" style="padding:0 0 14px">
      <h3>دليل بنود الصيانة الشائعة</h3>
      <div style="display:flex;gap:8px">
        <button class="btn secondary" @click="printTable(table, 'دليل بنود الصيانة')">🖨️ طباعة</button>
        <button v-if="canEdit" class="btn primary" @click="add">+ إضافة بند</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (اسم البند)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <FilterClear :active="!!q.trim()" @clear="q = ''" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead><tr><th>اسم البند</th><th>السعر الافتراضي</th><th></th></tr></thead>
        <tbody>
          <tr v-for="it in rows" :key="it.id">
            <td>{{ it.name }}</td>
            <td class="num">{{ fmtMoney(it.price || 0) }}</td>
            <td>
              <template v-if="canEdit">
                <button class="btn secondary small" @click="edit(it)">تعديل</button>
                <button class="btn danger small" @click="del(it)">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!store.items.length" class="empty">
        <div class="big">🧰</div>
        لا توجد بنود صيانة مسجلة بعد — اضغط "إضافة بند" لبدء التسجيل
      </div>
      <div v-else-if="!rows.length" class="empty">لا توجد نتائج مطابقة للفلاتر</div>
    </div>
    <div class="note" style="margin-top:10px">هذه البنود بتظهر كاقتراحات تلقائية عند إضافة بنود صيانة جديدة في صفحة الصيانة.</div>

    <Modal v-if="open" :title="editingId ? 'تعديل بند صيانة' : 'إضافة بند صيانة'" @close="open = false">
      <div class="form-grid">
        <div class="field"><label>اسم البند</label><input v-model="form.name" placeholder="مثال: زيت، فلتر زيت، مصنعية..."></div>
        <div class="field"><label>السعر الافتراضي</label><input v-model="form.price" type="number" step="0.01"></div>
      </div>
      <template #footer>
        <button class="btn secondary" @click="open = false">إلغاء</button>
        <button class="btn primary" @click="save">حفظ</button>
      </template>
    </Modal>
  </div>
</template>
