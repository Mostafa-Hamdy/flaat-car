<script setup>
import SelectBox from '../components/SelectBox.vue'
import { ref, reactive, computed } from 'vue'
import { useDriversStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { printTable } from '../utils/print.js'
import Modal from '../components/Modal.vue'
import FilterClear from '../components/FilterClear.vue'
import ExpiryBadge from '../components/ExpiryBadge.vue'

const store = useDriversStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('admin'))

const q = ref('')
const statusF = ref('')
const anyFilter = computed(() => !!(q.value.trim() || statusF.value))
const clear = () => { q.value = ''; statusF.value = '' }

const isActive = (d) => (d.status || 'active') !== 'inactive'
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return store.items
    .filter((d) => (!s || [d.name, d.phone].join(' ').toLowerCase().includes(s)) && (!statusF.value || (d.status || 'active') === statusF.value))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
})

const blank = () => ({ name: '', phone: '', license_no: '', license_end: '', ins_no: '', ins_name: '', status: 'active', notes: '' })
const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)
const table = ref(null)

function add() { editingId.value = null; Object.assign(form, blank()); open.value = true }
function edit(d) { editingId.value = d.id; Object.assign(form, blank(), d); open.value = true }

async function save() {
  const name = form.name.trim()
  if (!name) return alert('من فضلك اكتب اسم السائق')
  await store.upsert({
    name,
    phone: form.phone.trim(),
    license_no: form.license_no.trim(),
    license_end: form.license_end,
    ins_no: form.ins_no.trim(),
    ins_name: form.ins_name.trim(),
    status: form.status || 'active',
    notes: form.notes.trim(),
  }, editingId.value)
  open.value = false
}

async function del(d) {
  if (confirm('هل تريد حذف هذا السائق؟')) await store.remove(d.id)
}
</script>

<template>
  <div>
    <div class="panel-head" style="padding:0 0 14px">
      <h3>قائمة السائقين المسجلين</h3>
      <div style="display:flex;gap:8px">
        <button class="btn secondary" @click="printTable(table, 'قائمة السائقين')">🖨️ طباعة</button>
        <button v-if="canEdit" class="btn primary" @click="add">+ إضافة سائق</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (اسم / موبايل)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <div class="field" :class="{ 'filter-active': statusF }">
        <label>الحالة</label>
        <SelectBox v-model="statusF">
          <option value="">الكل</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </SelectBox>
      </div>
      <FilterClear :active="anyFilter" @clear="clear" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead>
          <tr>
            <th>الاسم</th><th>الموبايل</th><th>رقم الرخصة</th><th>انتهاء الرخصة</th>
            <th>رقم التأمين</th><th>الاسم بالتأمينات</th><th>الحالة</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in rows" :key="d.id">
            <td>{{ d.name }}</td>
            <td class="num">{{ d.phone }}</td>
            <td class="num">{{ d.license_no }}</td>
            <td class="num">{{ d.license_end || '—' }} <ExpiryBadge :date="d.license_end" /></td>
            <td class="num">{{ d.ins_no }}</td>
            <td>{{ d.ins_name }}</td>
            <td><span class="badge" :class="isActive(d) ? 'ok' : 'bad'">{{ isActive(d) ? 'نشط' : 'غير نشط' }}</span></td>
            <td>
              <template v-if="canEdit">
                <button class="btn secondary small" @click="edit(d)">تعديل</button>
                <button class="btn danger small" @click="del(d)">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!store.items.length" class="empty">
        <div class="big">👤</div>
        لا يوجد سائقين مسجلين بعد — اضغط "إضافة سائق" لبدء التسجيل
      </div>
      <div v-else-if="!rows.length" class="empty">لا توجد نتائج مطابقة للفلاتر</div>
    </div>

    <Modal v-if="open" :title="editingId ? 'تعديل سائق' : 'إضافة سائق'" @close="open = false">
      <div class="form-grid">
        <div class="field"><label>الاسم</label><input v-model="form.name"></div>
        <div class="field"><label>رقم الموبايل</label><input v-model="form.phone"></div>
        <div class="field"><label>رقم الرخصة</label><input v-model="form.license_no"></div>
        <div class="field"><label>تاريخ انتهاء الرخصة</label><input v-model="form.license_end" type="date"></div>
        <div class="field"><label>رقم التأمين</label><input v-model="form.ins_no"></div>
        <div class="field"><label>الاسم على التأمين</label><input v-model="form.ins_name"></div>
        <div class="field">
          <label>الحالة</label>
          <SelectBox v-model="form.status"><option value="active">نشط</option><option value="inactive">غير نشط</option></SelectBox>
        </div>
        <div class="field full"><label>ملاحظات</label><textarea v-model="form.notes" rows="2"></textarea></div>
      </div>
      <template #footer>
        <button class="btn secondary" @click="open = false">إلغاء</button>
        <button class="btn primary" @click="save">حفظ</button>
      </template>
    </Modal>
  </div>
</template>
