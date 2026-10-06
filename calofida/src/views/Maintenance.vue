<script setup>
import { ref, reactive, computed } from 'vue'
import { useMaintStore, useCarsStore, useMaintItemsStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { daysUntil, expiryStatus, fmtMoney, toNum } from '../utils/helpers.js'
import { printTable } from '../utils/print.js'
import Modal from '../components/Modal.vue'
import FilterClear from '../components/FilterClear.vue'

const store = useMaintStore()
const carsStore = useCarsStore()
const catalog = useMaintItemsStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('maint'))

const q = ref('')
const carF = ref('')
const statusF = ref('')
const anyFilter = computed(() => !!(q.value.trim() || carF.value || statusF.value))
function clearFilters() { q.value = ''; carF.value = ''; statusF.value = '' }

const stOf = (m) => expiryStatus(daysUntil(m.nextdue))
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return store.items
    .filter((m) => {
      const names = (m.items || []).map((it) => it.name).join(' ')
      if (s && ![m.car, m.type, m.workshop, names].join(' ').toLowerCase().includes(s)) return false
      if (carF.value && m.car !== carF.value) return false
      if (statusF.value && stOf(m).cls !== statusF.value) return false
      return true
    })
    .sort((a, b) => ((a.date || '') < (b.date || '') ? 1 : -1))
})

const expanded = ref(new Set())
function toggleExpand(id) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id); else next.add(id)
  expanded.value = next
}

// ---- form ----
const TYPE_SUGGESTIONS = ['تغيير زيت', 'إطارات', 'فرامل', 'بطارية', 'صيانة عامة', 'كهرباء', 'سمكرة ودهان', 'تكييف']
let rowKey = 0
const newItem = (name = '', price = '') => ({ k: ++rowKey, name, price })
const blank = () => ({ car: '', date: new Date().toISOString().slice(0, 10), type: '', workshop: '', odometer: '', nextdue: '', notes: '' })

const editingId = ref(null)
const open = ref(false)
const form = reactive(blank())
const items = ref([newItem()])
const table = ref(null)

const total = computed(() => items.value.reduce((s, it) => s + toNum(it.price), 0))
const nextStatus = computed(() => expiryStatus(daysUntil(form.nextdue)).label)

// Active cars only; a record's own car is kept as an extra option even if it has gone inactive.
const carChoices = computed(() => {
  const list = carsStore.items.filter((c) => (c.status || 'active') !== 'inactive')
    .map((c) => ({ plate: c.plate, label: `${c.plate} — ${c.brand || ''} ${c.model || ''}` }))
  if (form.car && !list.some((c) => c.plate === form.car)) {
    const c = carsStore.items.find((x) => x.plate === form.car)
    list.push({ plate: form.car, label: `${form.car} — ${c ? c.brand || '' : ''} ${c ? c.model || '' : ''} (غير نشطة)` })
  }
  return list
})

function add() {
  editingId.value = null
  Object.assign(form, blank())
  items.value = [newItem()]
  open.value = true
}
function edit(m) {
  editingId.value = m.id
  Object.assign(form, blank(), {
    car: m.car || '', date: m.date || '', type: m.type || '', workshop: m.workshop || '',
    odometer: m.odometer || '', nextdue: m.nextdue || '', notes: m.notes || '',
  })
  items.value = (m.items && m.items.length ? m.items : [{ name: '', price: '' }]).map((it) => newItem(it.name, it.price))
  open.value = true
}

// Fill the price from the catalog when the name matches exactly and no price was typed yet.
function onItemName(it) {
  if (it.price === '' || it.price === null) {
    const hit = catalog.items.find((c) => c.name === it.name.trim())
    if (hit) it.price = hit.price
  }
}

async function save() {
  if (!form.car) return alert('من فضلك اختر السيارة')
  if (!form.date) return alert('من فضلك اختر تاريخ الصيانة')
  const list = items.value
    .map((it) => ({ name: it.name.trim(), price: toNum(it.price) }))
    .filter((it) => it.name || it.price)
  await store.upsert({
    car: form.car, date: form.date,
    type: form.type.trim(), workshop: form.workshop.trim(),
    odometer: toNum(form.odometer),
    items: list, total: list.reduce((s, it) => s + it.price, 0),
    nextdue: form.nextdue, notes: form.notes.trim(),
  }, editingId.value)
  open.value = false
}

async function del(m) {
  if (!confirm('هل تريد حذف سجل الصيانة هذا وكل بنوده؟')) return
  await store.remove(m.id)
  expanded.value.delete(m.id)
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 style="margin:0">سجل الصيانة</h2>
      <div style="display:flex;gap:8px">
        <button class="btn secondary" @click="printTable(table, 'سجل الصيانة')">🖨️ طباعة</button>
        <button v-if="canEdit" class="btn primary" @click="add">+ إضافة صيانة</button>
      </div>
    </div>
    <div class="panel-body">

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (سيارة / نوع / ورشة)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <div class="field" :class="{ 'filter-active': carF }">
        <label>السيارة</label>
        <select v-model="carF">
          <option value="">كل السيارات</option>
          <option v-for="c in carsStore.items" :key="c.id" :value="c.plate">{{ c.plate }} — {{ c.brand }}</option>
        </select>
      </div>
      <div class="field" :class="{ 'filter-active': statusF }">
        <label>حالة الصيانة القادمة</label>
        <select v-model="statusF">
          <option value="">كل الحالات</option>
          <option value="ok">سارية</option>
          <option value="warn">قريبة</option>
          <option value="bad">متأخرة</option>
        </select>
      </div>
      <FilterClear :active="anyFilter" @clear="clearFilters" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead>
          <tr>
            <th class="chevron-col"></th>
            <th>تاريخ الصيانة</th><th>السيارة</th><th>نوع الصيانة</th><th>الورشة</th>
            <th>العداد</th><th>الإجمالي</th><th>الصيانة القادمة</th><th>الحالة</th><th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="m in rows" :key="m.id">
            <tr class="maint-parent-row" :class="{ expanded: expanded.has(m.id) }" @click="toggleExpand(m.id)">
              <td class="chevron-col">
                <button type="button" class="chevron-btn" :title="expanded.has(m.id) ? 'إخفاء البنود' : 'عرض البنود'" @click.stop="toggleExpand(m.id)">
                  <svg class="chevron-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </td>
              <td class="num">{{ m.date }}</td><td>{{ m.car }}</td><td>{{ m.type || '—' }}</td><td>{{ m.workshop || '—' }}</td>
              <td class="num">{{ m.odometer || 0 }}</td><td class="num">{{ fmtMoney(m.total || 0) }}</td>
              <td class="num">{{ m.nextdue || '—' }}</td>
              <td><span class="badge" :class="stOf(m).cls">{{ stOf(m).label }}</span></td>
              <td @click.stop>
                <template v-if="canEdit">
                  <button class="btn secondary small" @click="edit(m)">تعديل</button>
                  <button class="btn danger small" @click="del(m)">حذف</button>
                </template>
              </td>
            </tr>
            <tr v-show="expanded.has(m.id)" class="maint-detail-row">
              <td class="chevron-col"></td>
              <td colspan="9">
                <div class="maint-detail-box">
                  <div class="detail-title">{{ m.type || 'بنود الصيانة' }}</div>
                  <template v-if="m.items && m.items.length">
                    <div v-for="(it, i) in m.items" :key="i" class="maint-item-row">
                      <span class="maint-item-bullet">•</span>
                      <span>{{ it.name || 'بند بدون اسم' }}</span>
                      <span class="maint-item-dots"></span>
                      <span class="maint-item-price">{{ fmtMoney(it.price || 0) }} جنيه</span>
                    </div>
                  </template>
                  <div v-else class="maint-empty-items">لا توجد بنود مسجلة لهذه الصيانة</div>
                  <div class="maint-detail-total"><span>الإجمالي</span><span>{{ fmtMoney(m.total || 0) }} جنيه</span></div>
                  <div v-if="m.notes" class="maint-detail-notes">ملاحظات: {{ m.notes }}</div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
      <div v-if="!store.items.length" class="empty">
        <div class="big">🔧</div>
        لا توجد صيانات مسجلة بعد — اضغط "إضافة صيانة" لبدء التسجيل
      </div>
      <div v-else-if="!rows.length" class="empty">لا توجد نتائج مطابقة للفلاتر</div>
    </div>

    <Modal v-if="open" :title="editingId ? 'تعديل صيانة' : 'إضافة صيانة'" @close="open = false">
      <div class="form-grid">
        <div class="field">
          <label>السيارة</label>
          <select v-model="form.car">
            <option value="">اختر السيارة</option>
            <option v-for="c in carChoices" :key="c.plate" :value="c.plate">{{ c.label }}</option>
          </select>
        </div>
        <div class="field"><label>تاريخ الصيانة</label><input v-model="form.date" type="date"></div>
        <div class="field">
          <label>نوع الصيانة</label>
          <input v-model="form.type" list="maintTypesList" placeholder="تغيير زيت، إطارات، فرامل...">
          <datalist id="maintTypesList"><option v-for="t in TYPE_SUGGESTIONS" :key="t" :value="t" /></datalist>
        </div>
        <div class="field"><label>الورشة</label><input v-model="form.workshop"></div>
        <div class="field"><label>عداد الكيلومترات</label><input v-model="form.odometer" type="number" step="1"></div>
        <div class="field"><label>موعد الصيانة القادمة</label><input v-model="form.nextdue" type="date"></div>
        <div class="field"><label>حالة الصيانة القادمة (تلقائي)</label><input :value="nextStatus" disabled></div>

        <div class="field full">
          <label>بنود الصيانة</label>
          <div class="items-form">
            <div v-for="(it, i) in items" :key="it.k" class="item-row">
              <input v-model="it.name" class="mi-name" list="maintItemNamesList" placeholder="اسم البند (مثال: زيت)" @input="onItemName(it)">
              <input v-model="it.price" class="mi-price" type="number" step="0.01" placeholder="السعر">
              <button type="button" class="btn danger small" @click="items.splice(i, 1)">✕</button>
            </div>
          </div>
          <button type="button" class="btn secondary small" style="margin-top:8px;align-self:flex-start" @click="items.push(newItem())">+ إضافة بند</button>
          <datalist id="maintItemNamesList"><option v-for="c in catalog.items" :key="c.id" :value="c.name" /></datalist>
        </div>
        <div class="field"><label>الإجمالي (تلقائي)</label><input :value="fmtMoney(total) + ' جنيه'" disabled></div>
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
.chevron-col{width:34px}
.chevron-btn{width:26px;height:26px;border:1px solid var(--line);background:var(--surface);border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--teal-dark)}
.chevron-btn:hover{background:var(--teal-soft)}
.chevron-icon{transition:transform .18s}
.expanded .chevron-icon{transform:rotate(180deg)}
.maint-parent-row{cursor:pointer}
.maint-detail-row td{background:var(--paper);border-top:none;padding:0}
.maint-detail-box{margin:2px 14px 12px;padding:12px 16px;background:var(--surface);border:1px dashed var(--line);border-radius:10px;white-space:normal}
.detail-title{font-weight:700;margin-bottom:6px;color:var(--ink-soft);font-size:12.5px}
.maint-item-row{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:13px;border-bottom:1px dotted var(--line)}
.maint-item-row:last-of-type{border-bottom:none}
.maint-item-bullet{color:var(--teal);font-weight:700}
.maint-item-dots{flex:1;border-bottom:1px dotted var(--line);margin:0 4px;height:1px}
.maint-item-price{font-family:'JetBrains Mono',monospace;font-weight:700;white-space:nowrap}
.maint-detail-total{display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:2px solid var(--line);font-weight:800;color:var(--teal-dark);font-size:14px}
.maint-detail-notes{margin-top:8px;font-size:12.5px;color:var(--ink-soft)}
.maint-empty-items{font-size:12.5px;color:var(--ink-soft)}
.items-form{display:flex;flex-direction:column;gap:8px}
.item-row{display:flex;gap:8px;align-items:center}
.mi-name{flex:2}
.mi-price{flex:1}
</style>
