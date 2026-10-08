<script setup>
import SelectBox from '../components/SelectBox.vue'
import { ref, computed, watch } from 'vue'
import { useOpsStore } from '../stores/ops.js'
import { useCarsStore, useDriversStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { MONTH_NAMES, dateInfo, fmtLocalDate } from '../utils/helpers.js'
import { printTable } from '../utils/print.js'
import OpsRow from '../components/OpsRow.vue'
import MultiSelect from '../components/MultiSelect.vue'
import FilterClear from '../components/FilterClear.vue'

const ops = useOpsStore()
const carsStore = useCarsStore()
const drivers = useDriversStore()
const auth = useAuthStore()
const canAdd = computed(() => auth.can('ops', 'add'))
const canEdit = computed(() => auth.can('ops', 'edit'))

// One calendar month is rendered at a time (keeps the DOM small and typing fast).
const now = new Date()
const page = ref({ year: now.getFullYear(), month: now.getMonth() })
const goDate = ref(fmtLocalDate(new Date(page.value.year, page.value.month, 1)))

const q = ref('')
const half = ref('')
const carSel = ref([])
const anyFilter = computed(() => !!(q.value.trim() || half.value || carSel.value.length))
function clearFilters() { q.value = ''; half.value = ''; carSel.value = [] }

// Earliest selectable date: oldest car join date, else the earliest ops record.
const minDate = computed(() => {
  const joins = carsStore.items.map((c) => c.joinDate).filter(Boolean)
  return joins.length ? joins.reduce((a, b) => (a < b ? a : b)) : ops.earliestDate
})
function clamp(year, month) {
  if (!minDate.value) return { year, month }
  const m = new Date(minDate.value + 'T00:00:00')
  if (year < m.getFullYear() || (year === m.getFullYear() && month < m.getMonth())) {
    return { year: m.getFullYear(), month: m.getMonth() }
  }
  return { year, month }
}
function setPage(year, month) {
  page.value = clamp(year, month)
  goDate.value = fmtLocalDate(new Date(page.value.year, page.value.month, 1))
}
function shiftMonth(delta) {
  let { year, month } = page.value
  month += delta
  if (month < 0) { month = 11; year-- } else if (month > 11) { month = 0; year++ }
  setPage(year, month)
}
function jump() {
  const d = new Date(goDate.value + 'T00:00:00')
  if (!isNaN(d)) setPage(d.getFullYear(), d.getMonth())
}
const atMin = computed(() => {
  if (!minDate.value) return false
  const m = new Date(minDate.value + 'T00:00:00')
  return page.value.year < m.getFullYear() || (page.value.year === m.getFullYear() && page.value.month <= m.getMonth())
})
watch(minDate, () => setPage(page.value.year, page.value.month))

const monthLabel = computed(() => MONTH_NAMES[page.value.month] + ' ' + page.value.year)
const monthDays = computed(() => {
  const out = []
  const d = new Date(page.value.year, page.value.month, 1)
  while (d.getMonth() === page.value.month) { out.push(fmtLocalDate(d)); d.setDate(d.getDate() + 1) }
  return out
})

const carOptions = computed(() => carsStore.items.map((c) => ({ value: c.plate, label: c.plate + ' — ' + (c.brand || '') })))
const driverNames = computed(() => drivers.items.filter((d) => d.status !== 'inactive').map((d) => d.name))

// Per day: active cars that had joined by then (no join date = always eligible), plus any car
// that already has data that day, so existing entries are never hidden by a later status change.
const groups = computed(() => {
  const cars = carsStore.items
  const active = cars.filter((c) => (c.status || 'active') !== 'inactive')
  const always = active.filter((c) => !c.joinDate)
  const dated = active.filter((c) => c.joinDate)
  const s = q.value.trim().toLowerCase()
  const sel = new Set(carSel.value)
  const result = []
  for (const date of monthDays.value) {
    const info = dateInfo(date)
    if (half.value && !info.half.startsWith(half.value)) continue
    let dayCars = always.concat(dated.filter((c) => c.joinDate <= date))
    for (const plate of ops.platesByDate.get(date) || []) {
      if (!dayCars.some((c) => c.plate === plate)) dayCars.push(cars.find((c) => c.plate === plate) || { plate, brand: '', model: '' })
    }
    if (sel.size) dayCars = dayCars.filter((c) => sel.has(c.plate))
    if (s) {
      dayCars = dayCars.filter((c) => {
        const o = ops.index.get(c.plate + '|' + date) || {}
        return [c.plate, o.driver, o.from, o.to].join(' ').toLowerCase().includes(s)
      })
    }
    if (!dayCars.length) continue
    dayCars.sort((a, b) => (a.plate || '').localeCompare(b.plate || '', 'ar'))
    result.push({ date, info, cars: dayCars })
  }
  return result
})

const table = ref(null)
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 style="margin:0">سجل التشغيل اليومي</h2>
      <button class="btn secondary" @click="printTable(table, 'سجل التشغيل اليومي')">🖨️ طباعة</button>
    </div>
    <div class="panel-body">
    <p class="note">
      الجدول بيعرض شهر واحد في المرة — اتنقل بين الشهور بالأسهم أو اقفز لتاريخ معين، وكل يوم بتظهر تحته السيارات اللي "نشطة" ومنضمة للأسطول لحد تاريخه.
      اكتب في أي خانة وهتتحفظ تلقائيًا.
    </p>

    <div class="toolbar">
      <div class="field">
        <label>الشهر المعروض</label>
        <div style="display:flex;align-items:center;gap:6px">
          <button type="button" class="btn secondary" style="padding:9px 12px;" title="الشهر السابق" :disabled="atMin" @click="shiftMonth(-1)">◀</button>
          <span class="month-label">{{ monthLabel }}</span>
          <button type="button" class="btn secondary" style="padding:9px 12px;" title="الشهر التالي" @click="shiftMonth(1)">▶</button>
        </div>
      </div>
      <div class="field">
        <label>الانتقال لتاريخ</label>
        <input v-model="goDate" type="date" :min="minDate || undefined" style="width:150px" @change="jump">
      </div>
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (سيارة / سائق / موقع)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <div class="field" :class="{ 'filter-active': half }">
        <label>نصف الشهر</label>
        <SelectBox v-model="half">
          <option value="">الكل</option>
          <option value="أول">أول 15 يوم</option>
          <option value="أخر">آخر 15 يوم</option>
        </SelectBox>
      </div>
      <div class="field" :class="{ 'filter-active': carSel.length }" style="min-width:170px">
        <label>السيارة (اختيار متعدد)</label>
        <MultiSelect v-model="carSel" :options="carOptions" placeholder="كل السيارات" searchable />
      </div>
      <FilterClear :active="anyFilter" @clear="clearFilters" />
    </div>

    <div class="table-wrap ops-table-wrap">
      <table ref="table" class="ops-grid">
        <thead>
          <tr>
            <th>التاريخ</th><th>السيارة</th><th>السائق</th><th>بند</th><th>رقم العقد</th>
            <th>ك/م ذهاب</th><th>ك/م إياب</th><th>ك/م صافي</th>
            <th>من</th><th>إلى</th><th>إيراد ليموزين</th><th>إيراد رحلات</th>
            <th>المصاريف</th><th>صافي الربح</th><th>البنك</th><th>رقم الإيداع</th>
            <th>الضريبة</th><th>الإجمالي بعد الضريبة</th><th>رقم الفاتورة</th><th>ملاحظات</th><th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="g in groups" :key="g.date">
            <OpsRow
              v-for="(c, i) in g.cars"
              :key="c.plate + '|' + g.date"
              :car="c"
              :date="g.date"
              :record="ops.index.get(c.plate + '|' + g.date)"
              :info="g.info"
              :is-first="i === 0"
              :group-size="g.cars.length"
              :driver-names="driverNames"
              :can-add="canAdd"
              :can-edit="canEdit"
            />
          </template>
        </tbody>
      </table>
      <div v-if="!groups.length" class="empty">
        <div class="big">🗒️</div>
        لا توجد سيارات نشطة لعرضها في الشهر ده — أضف سيارات وفعّلها من "الأدمن › الماستر داتا"
      </div>
    </div>
    </div>
  </section>
</template>

<style>
.month-label{min-width:110px;text-align:center;font-weight:800;color:var(--teal-dark)}
.ops-table-wrap{max-height:75vh;overflow:auto;position:relative}
.ops-grid{border-collapse:separate;border-spacing:0}
.ops-grid td,.ops-grid th{white-space:nowrap}
.ops-grid thead th{position:sticky;top:0;z-index:4}
.ops-date-cell{background:var(--teal-soft);color:var(--teal-dark);font-weight:800;vertical-align:top;border-inline-end:2px solid var(--teal);position:sticky;inset-inline-start:0;z-index:2;width:96px;min-width:96px;max-width:96px}
.ops-grid thead th:nth-child(1){position:sticky;inset-inline-start:0;z-index:5;width:96px;min-width:96px;max-width:96px}
.ops-car-cell{position:sticky;inset-inline-start:96px;z-index:2;background:var(--surface);border-inline-end:1px solid var(--line);width:120px;min-width:120px;max-width:120px}
.ops-grid thead th:nth-child(2){position:sticky;inset-inline-start:96px;z-index:5;width:120px;min-width:120px;max-width:120px}
tr.ops-row-filled .ops-car-cell{background:var(--paper)}
tr.ops-day-start td{border-top:2px solid var(--teal)}
.ops-date-day{font-size:12px;font-weight:700}
.ops-date-half{font-size:10.5px;font-weight:600;color:var(--ink-soft);margin-top:2px}
.ops-car-plate{font-weight:800}
.ops-car-sub{font-size:11px;color:var(--ink-soft);font-weight:500}
.ops-cell{width:100%;min-width:64px;padding:5px 6px;font-size:12px;border-radius:5px;border:1px solid var(--line);background:transparent;color:var(--ink);font-family:inherit}
.ops-cell:hover{border-color:var(--teal)}
.ops-cell:focus{border-color:var(--teal);background:var(--surface);outline:none}
.ops-cell:disabled{border-color:transparent}
select.ops-cell{min-width:90px}
.ops-computed{font-weight:700;color:var(--teal-dark)}
.ops-computed.pos{color:var(--olive)}
.ops-computed.neg{color:var(--brick)}
.ops-row-filled{background:var(--paper)}
</style>
