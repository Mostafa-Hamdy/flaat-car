<script setup>
import SelectBox from '../components/SelectBox.vue'
import { ref, reactive, computed } from 'vue'
import { useAirportStore, useCarsStore, useDriversStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { printTable } from '../utils/print.js'
import Modal from '../components/Modal.vue'
import FilterClear from '../components/FilterClear.vue'

const store = useAirportStore()
const carsStore = useCarsStore()
const drivers = useDriversStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('airport'))

const STATUS_LABEL = { upcoming: 'قادم', done: 'تم', cancelled: 'ملغي' }
const STATUS_CLS = { upcoming: 'warn', done: 'ok', cancelled: 'bad' }
const TYPE_LABEL = { 'استلام': 'استلام من المطار', 'توصيل': 'توصيل إلى المطار' }

const q = ref('')
const typeF = ref('')
const statusF = ref('')
const anyFilter = computed(() => !!(q.value.trim() || typeF.value || statusF.value))
function clearFilters() { q.value = ''; typeF.value = ''; statusF.value = '' }

const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return store.items
    .filter((a) => {
      if (s && ![a.client, a.phone, a.car, a.driver, a.flight].join(' ').toLowerCase().includes(s)) return false
      if (typeF.value && a.type !== typeF.value) return false
      if (statusF.value && (a.status || 'upcoming') !== statusF.value) return false
      return true
    })
    .sort((a, b) => (((a.date || '') + ' ' + (a.time || '')) < ((b.date || '') + ' ' + (b.time || '')) ? -1 : 1))
})

const blank = () => ({ client: '', phone: '', type: 'استلام', date: '', time: '', flight: '', car: '', driver: '', location: '', status: 'upcoming', notes: '' })
const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)
const table = ref(null)

// Only active drivers are offered; a driver already on the appointment stays selectable.
const driverChoices = computed(() => {
  const names = drivers.items.filter((d) => (d.status || 'active') !== 'inactive').map((d) => ({ name: d.name, label: d.name }))
  if (form.driver && !names.some((d) => d.name === form.driver)) names.push({ name: form.driver, label: form.driver + ' (غير نشط)' })
  return names
})

function add() { editingId.value = null; Object.assign(form, blank()); open.value = true }
function edit(a) {
  editingId.value = a.id
  Object.assign(form, blank(), {
    client: a.client || '', phone: a.phone || '', type: a.type || 'استلام', date: a.date || '', time: a.time || '',
    flight: a.flight || '', car: a.car || '', driver: a.driver || '', location: a.location || '',
    status: a.status || 'upcoming', notes: a.notes || '',
  })
  open.value = true
}
async function save() {
  const client = form.client.trim()
  if (!client) return alert('من فضلك أدخل اسم العميل')
  if (!form.date) return alert('من فضلك أدخل تاريخ الموعد')
  await store.upsert({
    client, phone: form.phone.trim(), type: form.type, date: form.date, time: form.time,
    flight: form.flight.trim(), car: form.car, driver: form.driver, location: form.location.trim(),
    status: form.status, notes: form.notes.trim(),
  }, editingId.value)
  open.value = false
}
async function del(a) {
  if (confirm('هل تريد حذف هذا الموعد؟')) await store.remove(a.id)
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 style="margin:0">مواعيد المطار</h2>
      <div style="display:flex;gap:8px">
        <button class="btn secondary" @click="printTable(table, 'مواعيد المطار')">🖨️ طباعة</button>
        <button v-if="canEdit" class="btn primary" @click="add">+ إضافة موعد</button>
      </div>
    </div>
    <div class="panel-body">

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (العميل / السيارة / السائق / الرحلة)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <div class="field" :class="{ 'filter-active': typeF }">
        <label>النوع</label>
        <SelectBox v-model="typeF">
          <option value="">كل الأنواع</option>
          <option value="استلام">استلام من المطار</option>
          <option value="توصيل">توصيل إلى المطار</option>
        </SelectBox>
      </div>
      <div class="field" :class="{ 'filter-active': statusF }">
        <label>الحالة</label>
        <SelectBox v-model="statusF">
          <option value="">كل الحالات</option>
          <option value="upcoming">قادم</option>
          <option value="done">تم</option>
          <option value="cancelled">ملغي</option>
        </SelectBox>
      </div>
      <FilterClear :active="anyFilter" @clear="clearFilters" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead>
          <tr>
            <th>التاريخ والوقت</th><th>النوع</th><th>العميل</th><th>الهاتف</th>
            <th>رقم الرحلة</th><th>السيارة</th><th>السائق</th><th>مكان الاستلام/التسليم</th>
            <th>الحالة</th><th>ملاحظات</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in rows" :key="a.id">
            <td class="num">{{ a.date }} {{ a.time }}</td>
            <td>{{ TYPE_LABEL[a.type] || a.type }}</td>
            <td>{{ a.client }}</td>
            <td class="num">{{ a.phone }}</td>
            <td class="num">{{ a.flight || '—' }}</td>
            <td>{{ a.car || '—' }}</td>
            <td>{{ a.driver || '—' }}</td>
            <td class="wrap">{{ a.location }}</td>
            <td><span class="badge" :class="STATUS_CLS[a.status || 'upcoming']">{{ STATUS_LABEL[a.status || 'upcoming'] || a.status }}</span></td>
            <td class="wrap">{{ a.notes }}</td>
            <td>
              <template v-if="canEdit">
                <button class="btn secondary small" @click="edit(a)">تعديل</button>
                <button class="btn danger small" @click="del(a)">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="empty">
        <div class="big">✈️</div>
        <template v-if="!store.items.length">لا توجد مواعيد مطار مسجلة بعد — اضغط "إضافة موعد" لبدء التسجيل</template>
        <template v-else>لا توجد نتائج مطابقة للفلاتر</template>
      </div>
    </div>

    <Modal v-if="open" :title="editingId ? 'تعديل موعد مطار' : 'إضافة موعد مطار'" @close="open = false">
      <div class="form-grid">
        <div class="field"><label>اسم العميل</label><input v-model="form.client"></div>
        <div class="field"><label>رقم هاتف العميل</label><input v-model="form.phone"></div>
        <div class="field">
          <label>النوع</label>
          <SelectBox v-model="form.type"><option value="استلام">استلام من المطار</option><option value="توصيل">توصيل إلى المطار</option></SelectBox>
        </div>
        <div class="field"><label>التاريخ</label><input v-model="form.date" type="date"></div>
        <div class="field"><label>الوقت</label><input v-model="form.time" type="time"></div>
        <div class="field"><label>رقم الرحلة</label><input v-model="form.flight" placeholder="مثال: MS 785"></div>
        <div class="field">
          <label>السيارة المخصصة (اختياري)</label>
          <SelectBox v-model="form.car">
            <option value="">— بدون —</option>
            <option v-for="c in carsStore.items" :key="c.id" :value="c.plate">{{ c.plate }} — {{ c.brand }} {{ c.model }}</option>
          </SelectBox>
        </div>
        <div class="field">
          <label>السائق المخصص (اختياري)</label>
          <SelectBox v-model="form.driver">
            <option value="">— بدون —</option>
            <option v-for="d in driverChoices" :key="d.name" :value="d.name">{{ d.label }}</option>
          </SelectBox>
        </div>
        <div class="field full"><label>مكان الاستلام / التسليم</label><input v-model="form.location" placeholder="مثال: صالة الوصول 3 — أو — عنوان الفندق"></div>
        <div class="field">
          <label>الحالة</label>
          <SelectBox v-model="form.status"><option value="upcoming">قادم</option><option value="done">تم</option><option value="cancelled">ملغي</option></SelectBox>
        </div>
        <div class="field full"><label>ملاحظات</label><textarea v-model="form.notes" rows="2"></textarea></div>
      </div>
      <template #footer>
        <button class="btn secondary" @click="open = false">إلغاء</button>
        <button class="btn primary" @click="save">حفظ</button>
      </template>
    </Modal>
    </div>
  </section>
</template>

<style scoped>
.wrap{white-space:normal}
</style>
