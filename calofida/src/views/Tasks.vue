<script setup>
import { ref, reactive, computed } from 'vue'
import { useTasksStore, useCarsStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { daysUntil } from '../utils/helpers.js'
import { printTable } from '../utils/print.js'
import Modal from '../components/Modal.vue'
import FilterClear from '../components/FilterClear.vue'

const store = useTasksStore()
const carsStore = useCarsStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('tasks'))

const q = ref('')
const prioF = ref('')
const anyFilter = computed(() => !!(q.value.trim() || prioF.value))
function clearFilters() { q.value = ''; prioF.value = '' }

const PRIO_CLS = { 'عاجل': 'bad', 'مهم': 'warn', 'عادي': 'ok' }
const isDone = (t) => t.status === 'done'

// The same search/priority filters apply to both the pending and the completed list.
const matches = (t) => {
  const s = q.value.trim().toLowerCase()
  if (s && ![t.title, t.car, t.notes].join(' ').toLowerCase().includes(s)) return false
  if (prioF.value && t.priority !== prioF.value) return false
  return true
}
const pending = computed(() => store.items.filter((t) => !isDone(t) && matches(t))
  .sort((a, b) => ((a.duedate || '9999') < (b.duedate || '9999') ? -1 : 1)))
const done = computed(() => store.items.filter((t) => isDone(t) && matches(t))
  .sort((a, b) => ((a.duedate || '') < (b.duedate || '') ? 1 : -1)))
const overdue = (t) => { const d = daysUntil(t.duedate); return !isDone(t) && d !== null && d < 0 }

const blank = () => ({ title: '', duedate: '', car: '', priority: 'عادي', status: 'open', notes: '' })
const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)
const pendingTable = ref(null)
const doneTable = ref(null)

function add() { editingId.value = null; Object.assign(form, blank()); open.value = true }
function edit(t) {
  editingId.value = t.id
  Object.assign(form, blank(), { title: t.title || '', duedate: t.duedate || '', car: t.car || '', priority: t.priority || 'عادي', status: t.status || 'open', notes: t.notes || '' })
  open.value = true
}
async function save() {
  const title = form.title.trim()
  if (!title) return alert('من فضلك أدخل وصف المهمة')
  await store.upsert({ title, car: form.car, duedate: form.duedate, priority: form.priority, status: form.status, notes: form.notes.trim() }, editingId.value)
  open.value = false
}
const toggle = (t) => store.upsert({ status: isDone(t) ? 'open' : 'done' }, t.id)
async function del(t) {
  if (confirm('هل تريد حذف هذه المهمة؟')) await store.remove(t.id)
}
</script>

<template>
  <div>
    <section class="panel">
      <div class="panel-head">
        <h2 style="margin:0">المهام القادمة</h2>
        <div style="display:flex;gap:8px">
          <button class="btn secondary" @click="printTable(pendingTable, 'المهام القادمة')">🖨️ طباعة</button>
          <button v-if="canEdit" class="btn primary" @click="add">+ إضافة مهمة</button>
        </div>
      </div>
    <div class="panel-body">

      <div class="toolbar">
        <div class="field" :class="{ 'filter-active': q.trim() }">
          <label>بحث (المهمة / السيارة)</label>
          <input v-model="q" placeholder="اكتب للبحث...">
        </div>
        <div class="field" :class="{ 'filter-active': prioF }">
          <label>الأولوية</label>
          <select v-model="prioF">
            <option value="">كل الأولويات</option>
            <option value="عاجل">عاجل</option>
            <option value="مهم">مهم</option>
            <option value="عادي">عادي</option>
          </select>
        </div>
        <FilterClear :active="anyFilter" @clear="clearFilters" />
      </div>

      <div class="table-wrap">
        <table ref="pendingTable">
          <thead><tr><th></th><th>المهمة</th><th>السيارة المرتبطة</th><th>تاريخ الاستحقاق</th><th>الأولوية</th><th>ملاحظات</th><th></th></tr></thead>
          <tbody>
            <tr v-for="t in pending" :key="t.id">
              <td><input type="checkbox" :disabled="!canEdit" title="تم الإنجاز" @change="toggle(t)"></td>
              <td class="wrap">{{ t.title }}</td>
              <td>{{ t.car || '—' }}</td>
              <td class="num">{{ t.duedate || '—' }} <span v-if="overdue(t)" class="badge bad">متأخرة</span></td>
              <td><span class="badge" :class="PRIO_CLS[t.priority]">{{ t.priority || 'عادي' }}</span></td>
              <td class="wrap">{{ t.notes }}</td>
              <td>
                <template v-if="canEdit">
                  <button class="btn secondary small" @click="edit(t)">تعديل</button>
                  <button class="btn danger small" @click="del(t)">حذف</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!pending.length" class="empty">
          <div class="big">📋</div>
          لا توجد مهام قادمة حاليًا — أضف أول حاجة مطلوب تنفيذها الفترة القادمة
        </div>
      </div>
    </div>
  </section>

    <section class="panel">
      <div class="panel-head">
        <h2 style="margin:0">المهام التي تم تنفيذها</h2>
        <button class="btn secondary" @click="printTable(doneTable, 'المهام التي تم تنفيذها')">🖨️ طباعة</button>
      </div>
    <div class="panel-body">
      <div class="table-wrap">
        <table ref="doneTable">
          <thead><tr><th></th><th>المهمة</th><th>السيارة المرتبطة</th><th>تاريخ الاستحقاق</th><th>الأولوية</th><th>ملاحظات</th><th></th></tr></thead>
          <tbody>
            <tr v-for="t in done" :key="t.id" class="done-row">
              <td><input type="checkbox" checked :disabled="!canEdit" title="تم الإنجاز" @change="toggle(t)"></td>
              <td class="wrap title">{{ t.title }}</td>
              <td>{{ t.car || '—' }}</td>
              <td class="num">{{ t.duedate || '—' }}</td>
              <td><span class="badge" :class="PRIO_CLS[t.priority]">{{ t.priority || 'عادي' }}</span></td>
              <td class="wrap">{{ t.notes }}</td>
              <td>
                <template v-if="canEdit">
                  <button class="btn secondary small" @click="edit(t)">تعديل</button>
                  <button class="btn danger small" @click="del(t)">حذف</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!done.length" class="empty"><div class="big">✅</div>لا توجد مهام منجزة بعد</div>
      </div>
    </div>
  </section>

    <Modal v-if="open" :title="editingId ? 'تعديل مهمة' : 'إضافة مهمة'" @close="open = false">
      <div class="form-grid">
        <div class="field full"><label>المهمة / الوصف</label><input v-model="form.title" placeholder="مثال: تجديد رخصة السيارة أ ب ج 1234"></div>
        <div class="field"><label>تاريخ الاستحقاق</label><input v-model="form.duedate" type="date"></div>
        <div class="field">
          <label>السيارة المرتبطة (اختياري)</label>
          <select v-model="form.car">
            <option value="">— بدون —</option>
            <option v-for="c in carsStore.items" :key="c.id" :value="c.plate">{{ c.plate }} — {{ c.brand }} {{ c.model }}</option>
          </select>
        </div>
        <div class="field">
          <label>الأولوية</label>
          <select v-model="form.priority"><option value="عادي">عادي</option><option value="مهم">مهم</option><option value="عاجل">عاجل</option></select>
        </div>
        <div class="field">
          <label>الحالة</label>
          <select v-model="form.status"><option value="open">قيد الانتظار</option><option value="done">تم الإنجاز</option></select>
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

<style scoped>
.block{margin-bottom:20px}
.wrap{white-space:normal}
.done-row{opacity:.6}
.done-row .title{text-decoration:line-through}
</style>
