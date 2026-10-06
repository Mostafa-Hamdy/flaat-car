<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore, PAGES, DEFAULT_CAN_EDIT } from '../../stores/auth.js'
import Modal from '../../components/Modal.vue'

const auth = useAuthStore()
const canManage = computed(() => auth.canEdit('admin'))

const PAGE_LABEL = {
  ops: 'التشغيل اليومي', cars: 'بيان السيارات', maint: 'الصيانة', tasks: 'المهام',
  airport: 'مواعيد المطار', admin: 'الأدمن (ماستر داتا + إعدادات)',
}
const pagesLabel = (u) => {
  const on = PAGES.filter((k) => u.canEdit && u.canEdit[k])
  return on.length ? on.map((k) => PAGE_LABEL[k].replace(' (ماستر داتا + إعدادات)', '')).join('، ') : '— بدون تعديل —'
}
const isMe = (u) => auth.currentUser && auth.currentUser.id === u.id

const blank = () => ({ name: '', username: '', password: '', securityQ: '', securityA: '', canEdit: { ...DEFAULT_CAN_EDIT }, showAdmin: true })
const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)

function add() { editingId.value = null; Object.assign(form, blank(), { canEdit: { ...DEFAULT_CAN_EDIT } }); open.value = true }
function edit(u) {
  editingId.value = u.id
  Object.assign(form, blank(), {
    name: u.name || '', username: u.username || '', password: '',
    securityQ: u.securityQ || '', securityA: u.securityA || '',
    canEdit: Object.fromEntries(PAGES.map((k) => [k, !!(u.canEdit && u.canEdit[k])])),
    showAdmin: !!u.showAdmin,
  })
  open.value = true
}

async function save() {
  const name = form.name.trim()
  const username = form.username.trim()
  if (!name || !username) return alert('من فضلك اكتب الاسم واسم الدخول')
  if (auth.users.some((u) => u.username === username && u.id !== editingId.value)) return alert('اسم الدخول ده مستخدم بالفعل، اختار اسم تاني')
  if (!editingId.value && !form.password) return alert('من فضلك اكتب كلمة مرور للمستخدم الجديد')
  // Removing admin edit rights from your own account would lock you out of this page.
  if (editingId.value && auth.currentUser.id === editingId.value && !form.canEdit.admin) {
    return alert('مينفعش تشيل صلاحية تعديل الأدمن من حسابك وانت مسجل دخول بيه')
  }
  await auth.upsertUser({
    name, username,
    securityQ: form.securityQ.trim(), securityA: form.securityA.trim(),
    canEdit: { ...form.canEdit }, showAdmin: form.showAdmin,
  }, form.password, editingId.value)
  open.value = false
}

async function del(u) {
  if (isMe(u)) return alert('مينفعش تحذف حسابك وانت مسجل دخول بيه')
  if (auth.users.length <= 1) return alert('لازم يفضل مستخدم واحد على الأقل في البرنامج')
  if (!confirm('هل تريد حذف هذا المستخدم؟')) return
  try { await auth.removeUser(u.id) } catch (e) { alert(e.message) }
}
</script>

<template>
  <section class="panel">
    <div class="panel-head">
      <h2 style="margin:0">👥 المستخدمين والصلاحيات</h2>
      <button v-if="canManage" class="btn primary" @click="add">+ إضافة مستخدم</button>
    </div>
    <div class="panel-body">
    <p style="color:var(--ink-soft); margin-top:0;">
      كل شخص بيفتح البرنامج بيسجّل دخول باسمه وكلمة المرور بتاعته. من هنا تتحكم في مين يقدر يعدّل في كل صفحة، ومين تظهر له صفحة الأدمن دي أصلًا.
      ⚠️ البيانات محفوظة على هذا الجهاز بس، وكلمات المرور بتتخزن مشفّرة (hash)، لكن ده يفضل تنظيم للاستخدام المشترك مش حماية أمنية قوية.
    </p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>الاسم</th><th>اسم الدخول</th><th>صفحات التعديل المسموحة</th><th>تظهر له صفحة الأدمن</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in auth.users" :key="u.id">
            <td>{{ u.name }} <span v-if="isMe(u)" class="badge ok">أنت</span></td>
            <td class="num">{{ u.username }}</td>
            <td style="font-size:12.5px;white-space:normal">{{ pagesLabel(u) }}</td>
            <td><span class="badge" :class="u.showAdmin ? 'ok' : 'bad'">{{ u.showAdmin ? 'نعم' : 'لا' }}</span></td>
            <td>
              <template v-if="canManage">
                <button class="btn secondary small" @click="edit(u)">تعديل</button>
                <button class="btn danger small" :disabled="isMe(u)" :title="isMe(u) ? 'محتاج تسجل دخول بحساب تاني عشان تحذف حسابك الحالي' : ''" @click="del(u)">حذف</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!auth.users.length" class="empty"><div class="big">👥</div>لا يوجد مستخدمين بعد</div>
    </div>

    <Modal v-if="open" :title="editingId ? 'تعديل مستخدم' : 'إضافة مستخدم'" @close="open = false">
      <div class="form-grid">
        <div class="field"><label>الاسم</label><input v-model="form.name"></div>
        <div class="field"><label>اسم الدخول</label><input v-model="form.username" autocomplete="off"></div>
        <div class="field"><label>كلمة المرور</label><input v-model="form.password" type="password" autocomplete="new-password"></div>
        <div class="field"><label>&nbsp;</label><div class="hint">سيب الخانة فاضية عند التعديل عشان تسيب كلمة المرور القديمة زي ما هي</div></div>
        <div class="field full"><label>سؤال أمان (لاسترجاع كلمة المرور بنفسه لو نسيها)</label><input v-model="form.securityQ" placeholder="مثال: اسم أول عربية دخلت الأسطول؟"></div>
        <div class="field full"><label>إجابة سؤال الأمان</label><input v-model="form.securityA"></div>
        <div class="field full">
          <label>الصفحات المسموح له يعدّل فيها</label>
          <div class="checks">
            <label v-for="k in PAGES" :key="k" class="check"><input v-model="form.canEdit[k]" type="checkbox"> {{ PAGE_LABEL[k] }}</label>
          </div>
        </div>
        <div class="field full">
          <label class="check"><input v-model="form.showAdmin" type="checkbox"> تظهر له صفحة "الأدمن" في القائمة أصلًا</label>
        </div>
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
.hint{font-size:11.5px;color:var(--ink-soft);padding-top:8px}
.checks{display:flex;flex-wrap:wrap;gap:14px;padding-top:6px}
.check{display:flex;align-items:center;gap:6px;font-weight:600;font-size:13px;color:var(--ink);cursor:pointer}
.check input{width:auto}
.btn:disabled{opacity:.4;cursor:not-allowed}
</style>
