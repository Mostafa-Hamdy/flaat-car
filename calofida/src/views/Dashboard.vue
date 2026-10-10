<script setup>
import SelectBox from '../components/SelectBox.vue'
import { ref, computed } from 'vue'
import { useOpsStore } from '../stores/ops.js'
import { useCarsStore, useMaintStore, useTasksStore } from '../stores/collections.js'
import { MONTH_NAMES, dateInfo, daysUntil, expiryStatus, fmtMoney } from '../utils/helpers.js'
import { printTable } from '../utils/print.js'
import MultiSelect from '../components/MultiSelect.vue'
import FilterClear from '../components/FilterClear.vue'
import PerfChart from '../components/PerfChart.vue'

const ops = useOpsStore()
const carsStore = useCarsStore()
const maints = useMaintStore()
const tasks = useTasksStore()

const monthSel = ref([])
const half = ref('')
const carSel = ref([])
const anyFilter = computed(() => !!(monthSel.value.length || half.value || carSel.value.length))
function clearFilters() { monthSel.value = []; half.value = ''; carSel.value = [] }

const monthOptions = MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }))
const carOptions = computed(() => carsStore.items.map((c) => ({ value: c.plate, label: c.plate + ' — ' + (c.brand || '') })))

const rows = computed(() => {
  const months = new Set(monthSel.value)
  const cars = new Set(carSel.value)
  return ops.items.filter((o) => {
    const info = dateInfo(o.date)
    if (months.size && !months.has(String(info.monthIdx))) return false
    if (half.value && !info.half.startsWith(half.value)) return false
    if (cars.size && !cars.has(o.car)) return false
    return true
  })
})

const sum = (f) => rows.value.reduce((s, o) => s + (f(o) || 0), 0)
const stats = computed(() => {
  const limo = sum((o) => o.revlimo)
  const trip = sum((o) => o.revtrip)
  const exp = sum((o) => o.exp)
  return {
    // The bank balance ignores every filter: all revenue minus all expenses.
    bank: ops.items.reduce((s, o) => s + (o.revlimo || 0) + (o.revtrip || 0) - (o.exp || 0), 0),
    totalRev: limo + trip,
    exp,
    profit: limo + trip - exp,
    cars: new Set(rows.value.map((o) => o.car)).size,
    trips: rows.value.length,
    km: sum((o) => o.kmnet),
    limo,
    trip,
    openTasks: tasks.items.filter((t) => t.status !== 'done').length,
    maints: maints.items.length,
  }
})

// Cards: the SPEC order for the core five, then the extra counters the legacy app also showed.
const cards = computed(() => {
  const s = stats.value
  return [
    { label: 'الحساب البنكي', value: s.bank },
    { label: 'إجمالي الإيرادات', value: s.totalRev, cls: 'accent' },
    { label: 'إجمالي المصاريف', value: s.exp, cls: 'warn' },
    { label: 'صافي الربح', value: s.profit },
    { label: 'عدد السيارات', value: s.cars, plain: true },
    { label: 'عدد الرحلات المسجلة', value: s.trips, plain: true },
    { label: 'إجمالي ك/م صافي', value: s.km },
    { label: 'إيراد ليموزين', value: s.limo, cls: 'accent' },
    { label: 'إيراد رحلات', value: s.trip, cls: 'accent' },
    { label: 'مهام مفتوحة', value: s.openTasks, cls: 'warn', plain: true },
    { label: 'سجلات الصيانة', value: s.maints, plain: true },
  ]
})
const show = (c) => (c.plain ? Number(c.value).toLocaleString('en-US') : fmtMoney(c.value))

// Licences/organisation (<=30 days or expired), maintenance due (<=30), open tasks due (<=7).
const alerts = computed(() => {
  const items = []
  for (const c of carsStore.items) {
    const lic = daysUntil(c.lic_end)
    if (lic !== null && lic <= 30) items.push({ plate: c.plate, type: 'رخصة السيارة', days: lic })
    const org = daysUntil(c.org_end)
    if (org !== null && org <= 30) items.push({ plate: c.plate, type: 'مؤسسة/تأمين', days: org })
  }
  for (const m of maints.items) {
    const d = daysUntil(m.nextdue)
    if (d !== null && d <= 30) items.push({ plate: m.car || '—', type: 'صيانة' + (m.type ? ` (${m.type})` : ''), days: d })
  }
  for (const t of tasks.items) {
    if (t.status === 'done') continue
    const d = daysUntil(t.duedate)
    if (d !== null && d <= 7) items.push({ plate: t.car || '—', type: 'مهمة: ' + t.title, days: d })
  }
  return items.sort((a, b) => a.days - b.days).map((it) => ({ ...it, st: expiryStatus(it.days) }))
})
const alertsTable = ref(null)
</script>

<template>
  <div>
    <section class="panel">
      <div class="panel-head">
        <h2 style="margin:0">ملخص عام</h2>
        <div class="toolbar" style="margin:0">
          <div class="field" :class="{ 'filter-active': monthSel.length }" style="min-width:150px">
            <label>الشهر (اختيار متعدد)</label>
            <MultiSelect v-model="monthSel" :options="monthOptions" placeholder="كل الشهور" />
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
      </div>
    <div class="panel-body">
      <div class="stat-grid">
        <div v-for="c in cards" :key="c.label" class="stat-card" :class="c.cls">
          <div class="label">{{ c.label }}</div>
          <div class="value">{{ show(c) }}</div>
        </div>
      </div>
    </div>
  </section>

    <PerfChart :rows="rows" />

    <section class="panel">
      <div class="panel-head">
        <h2 style="margin:0">تنبيهات التراخيص والتأمينات</h2>
        <button class="btn secondary small" @click="printTable(alertsTable, 'تنبيهات التراخيص والتأمينات')">🖨️ طباعة</button>
      </div>
    <div class="panel-body">
      <div v-if="!alerts.length" class="empty">
        <div class="big">✅</div>لا توجد تراخيص أو تأمينات أو صيانات أو مهام قريبة من الاستحقاق
      </div>
      <div v-else class="table-wrap">
        <table ref="alertsTable">
          <thead><tr><th>السيارة</th><th>النوع</th><th>الحالة</th></tr></thead>
          <tbody>
            <tr v-for="(a, i) in alerts" :key="i">
              <td>{{ a.plate }}</td><td>{{ a.type }}</td><td><span class="badge" :class="a.st.cls">{{ a.st.label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
  </div>
</template>

