<script setup>
import { ref, reactive, computed } from 'vue'
import { useCarsStore } from '../stores/collections.js'
import { useAuthStore } from '../stores/auth.js'
import { printTable } from '../utils/print.js'
import Modal from '../components/Modal.vue'
import FilterClear from '../components/FilterClear.vue'
import ExpiryBadge from '../components/ExpiryBadge.vue'

const store = useCarsStore()
const auth = useAuthStore()
const canEdit = computed(() => auth.canEdit('cars'))

const q = ref('')

// Cars marked inactive (Admin > Master data > Car status) are hidden from this page.
const activeCars = computed(() => store.items.filter((c) => (c.status || 'active') !== 'inactive'))
const rows = computed(() => {
  const s = q.value.trim().toLowerCase()
  return activeCars.value.filter((c) => !s || [c.plate, c.brand, c.model, c.ins_name].join(' ').toLowerCase().includes(s))
})

const TEXT_FIELDS = ['plate', 'brand', 'model', 'category', 'color', 'chassis', 'engine', 'owner', 'location', 'ins_name', 'ins_no']
const DATE_FIELDS = ['lic_start', 'lic_end', 'org_start', 'org_end']
const blank = () => Object.fromEntries([...TEXT_FIELDS, ...DATE_FIELDS].map((k) => [k, k === 'owner' ? 'الشركة' : '']))

const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)
const table = ref(null)

function add() { editingId.value = null; Object.assign(form, blank()); open.value = true }
function edit(c) { editingId.value = c.id; Object.assign(form, blank(), pick(c)); open.value = true }
const pick = (c) => Object.fromEntries([...TEXT_FIELDS, ...DATE_FIELDS].map((k) => [k, c[k] || '']))

async function save() {
  const plate = form.plate.trim()
  if (!plate) return alert('من فضلك أدخل لوحة السيارة')
  if (store.items.some((c) => c.plate === plate && c.id !== editingId.value)) return alert('اللوحة دي مسجلة بالفعل لسيارة تانية')
  const rec = {}
  TEXT_FIELDS.forEach((k) => { rec[k] = form[k].trim() })
  DATE_FIELDS.forEach((k) => { rec[k] = form[k] })
  // upsert merges into the stored car, so status/joinDate (managed in the Admin page) are kept.
  await store.upsert(rec, editingId.value)
  open.value = false
}

async function del(c) {
  if (confirm('هل تريد حذف هذه السيارة؟')) await store.remove(c.id)
}
</script>

<template>
  <section class="card">
    <div class="panel-head">
      <h2 style="margin:0">بيان السيارات</h2>
      <div style="display:flex;gap:8px">
        <button class="btn secondary" @click="printTable(table, 'بيان السيارات')">🖨️ طباعة</button>
        <button v-if="canEdit" class="btn primary" @click="add">+ إضافة سيارة</button>
      </div>
    </div>

    <div class="toolbar">
      <div class="field" :class="{ 'filter-active': q.trim() }">
        <label>بحث (لوحة / ماركة / سائق)</label>
        <input v-model="q" placeholder="اكتب للبحث...">
      </div>
      <FilterClear :active="!!q.trim()" @clear="q = ''" />
    </div>

    <div class="table-wrap">
      <table ref="table">
        <thead>
          <tr>
            <th>لوحة رقم</th><th>الماركة</th><th>الموديل</th><th>الفئة</th><th>اللون</th>
            <th>شاسية</th><th>ماتور</th><th>الجهة المالكة</th><th>التواجد</th>
            <th>انتهاء الرخصة</th><th>حالة الرخصة</th>
            <th>السائق (تأمينات)</th><th>رقم تأمين</th>
            <th>انتهاء المؤسسة</th><th>حالة المؤسسة</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in rows" :key="c.id">
            <td>{{ c.plate }}</td><td>{{ c.brand }}</td><td>{{ c.model }}</td><td>{{ c.category }}</td><td>{{ c.color }}</td>
            <td>{{ c.chassis }}</td><td>{{ c.engine }}</td><td>{{ c.owner }}</td><td>{{ c.location }}</td>
            <td class="num">{{ c.lic_end || '—' }}</td><td><ExpiryBadge :date="c.lic_end" /></td>
            <td>{{ c.ins_name }}</td><td class="num">{{ c.ins_no }}</td>
            <td class="num">{{ c.org_end || '—' }}</td><td><ExpiryBadge :date="c.org_end" /></td>
            <td>
              <template v-if="canEdit">
                <button class="btn secondary small" @click="edit(c)">تعديل</button>
                <button class="btn danger small" @click="del(c)">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!activeCars.length" class="empty">
        <div class="big">🚗</div>
        لا توجد سيارات مسجلة بعد — اضغط "إضافة سيارة" لبدء التسجيل
      </div>
      <div v-else-if="!rows.length" class="empty">لا توجد نتائج مطابقة للبحث</div>
    </div>

    <Modal v-if="open" :title="editingId ? 'تعديل سيارة' : 'إضافة سيارة'" width="760px" @close="open = false">
      <div class="form-grid">
        <div class="field"><label>لوحة رقم</label><input v-model="form.plate"></div>
        <div class="field"><label>ماركة السيارة</label><input v-model="form.brand"></div>
        <div class="field"><label>الموديل</label><input v-model="form.model"></div>
        <div class="field"><label>الفئة</label><input v-model="form.category"></div>
        <div class="field"><label>اللون</label><input v-model="form.color"></div>
        <div class="field"><label>شاسية رقم</label><input v-model="form.chassis"></div>
        <div class="field"><label>ماتور رقم</label><input v-model="form.engine"></div>
        <div class="field"><label>الجهة المالكة</label><input v-model="form.owner"></div>
        <div class="field"><label>التواجد</label><input v-model="form.location"></div>
        <div class="field"><label>تاريخ إصدار رخصة</label><input v-model="form.lic_start" type="date"></div>
        <div class="field"><label>تاريخ إنتهاء رخصة</label><input v-model="form.lic_end" type="date"></div>
        <div class="field"><label>اسم السائق بالتأمينات</label><input v-model="form.ins_name"></div>
        <div class="field"><label>رقم تأمين السائق</label><input v-model="form.ins_no"></div>
        <div class="field"><label>تاريخ بداية مؤسسة</label><input v-model="form.org_start" type="date"></div>
        <div class="field"><label>تاريخ إنتهاء مؤسسة</label><input v-model="form.org_end" type="date"></div>
      </div>
      <template #footer>
        <button class="btn" @click="open = false">إلغاء</button>
        <button class="btn primary" @click="save">حفظ</button>
      </template>
    </Modal>
  </section>
</template>
