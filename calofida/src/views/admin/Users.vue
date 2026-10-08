<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore, PERM_PAGES, PERM_ACTIONS, pageActions, allPerms, permsOf } from '../../stores/auth.js'
import Modal from '../../components/Modal.vue'

const auth = useAuthStore()
const canAdd = computed(() => auth.can('users', 'add'))
const canEdit = computed(() => auth.can('users', 'edit'))

// One-line summary per user: pages they can see, with what else they may do there.
const SHORT = { add: 'إضافة', edit: 'تعديل' }
const pagesLabel = (u) => {
  const perms = permsOf(u)
  const on = PERM_PAGES.filter((p) => perms[p.key].view)
  if (!on.length) return '— لا يرى أي صفحة —'
  return on.map((p) => {
    const extra = ['add', 'edit'].filter((a) => perms[p.key][a]).map((a) => SHORT[a])
    return p.label.replace('الأدمن › ', '') + (extra.length ? ` (${extra.join(' + ')})` : '')
  }).join('، ')
}
const isMe = (u) => auth.currentUser && auth.currentUser.id === u.id

const blank = () => ({ name: '', username: '', password: '', securityQ: '', securityA: '', perms: allPerms() })
const editingId = ref(null)
const form = reactive(blank())
const open = ref(false)

function add() { editingId.value = null; Object.assign(form, blank()); open.value = true }
function edit(u) {
  editingId.value = u.id
  Object.assign(form, blank(), {
    name: u.name || '', username: u.username || '', password: '',
    securityQ: u.securityQ || '', securityA: u.securityA || '',
    perms: permsOf(u),
  })
  open.value = true
}

async function save() {
  const name = form.name.trim()
  const username = form.username.trim()
  if (!name || !username) return alert('من فضلك اكتب الاسم واسم الدخول')
  if (auth.users.some((u) => u.username === username && u.id !== editingId.value)) return alert('اسم الدخول ده مستخدم بالفعل، اختار اسم تاني')
  if (!editingId.value && !form.password) return alert('من فضلك اكتب كلمة مرور للمستخدم الجديد')
  // Removing your own access to this page would lock you out of managing permissions.
  if (editingId.value && auth.currentUser.id === editingId.value && !(form.perms.users.view && form.perms.users.edit)) {
    return alert('مينفعش تشيل صلاحية الظهور والتعديل في "المستخدمين والصلاحيات" من حسابك وانت مسجل دخول بيه')
  }
  await auth.upsertUser({
    name, username,
    securityQ: form.securityQ.trim(), securityA: form.securityA.trim(),
    perms: JSON.parse(JSON.stringify(form.perms)),
  }, form.password, editingId.value)
  open.value = false
}

// Add/edit only make sense on a page the user can see; unticking "view" clears the rest, ticking another ticks "view".
function setPerm(page, action, on) {
  const p = form.perms[page.key]
  p[action] = on
  if (on && action !== 'view') p.view = true
  if (!on && action === 'view') pageActions(page).forEach((a) => { p[a] = false })
}
function preset(kind) {
  form.perms = kind === 'all' ? allPerms() : kind === 'none' ? allPerms(false) : Object.fromEntries(
    PERM_PAGES.map((p) => [p.key, Object.fromEntries(PERM_ACTIONS.map((a) => [a.key, a.key === 'view' && pageActions(p).includes('view')]))]))
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
      <button v-if="canAdd" class="btn primary" @click="add">+ إضافة مستخدم</button>
    </div>
    <div class="panel-body">
    <p style="color:var(--ink-soft); margin-top:0;">
      كل شخص بيفتح البرنامج بيسجّل دخول باسمه وكلمة المرور بتاعته. من هنا تتحكم لكل مستخدم وفي كل صفحة: يشوفها (ظهور)، يضيف فيها (إضافة)، يعدّل ويحذف فيها (تعديل).
      ⚠️ البيانات محفوظة على هذا الجهاز بس، وكلمات المرور بتتخزن مشفّرة (hash)، لكن ده يفضل تنظيم للاستخدام المشترك مش حماية أمنية قوية.
    </p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>الاسم</th><th>اسم الدخول</th><th>الصفحات والصلاحيات</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in auth.users" :key="u.id">
            <td>{{ u.name }} <span v-if="isMe(u)" class="badge ok">أنت</span></td>
            <td class="num">{{ u.username }}</td>
            <td style="font-size:12.5px;white-space:normal">{{ pagesLabel(u) }}</td>
            <td>
              <template v-if="canEdit">
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
          <label>الصلاحيات لكل صفحة</label>
          <div class="presets">
            <button type="button" class="btn secondary small" @click="preset('all')">كل الصلاحيات</button>
            <button type="button" class="btn secondary small" @click="preset('view')">ظهور فقط</button>
            <button type="button" class="btn secondary small" @click="preset('none')">بدون صلاحيات</button>
          </div>
          <div class="table-wrap">
            <table class="perm-table">
              <thead><tr><th>الصفحة</th><th v-for="a in PERM_ACTIONS" :key="a.key">{{ a.label }}</th></tr></thead>
              <tbody>
                <tr v-for="p in PERM_PAGES" :key="p.key">
                  <td>{{ p.label }}</td>
                  <td v-for="a in PERM_ACTIONS" :key="a.key" class="perm-cell">
                    <input v-if="pageActions(p).includes(a.key)" type="checkbox" :checked="form.perms[p.key][a.key]" @change="setPerm(p, a.key, $event.target.checked)">
                    <span v-else>—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="hint">"تعديل" بتشمل الحذف. الإضافة والتعديل بيشتغلوا بس لو الصفحة ظاهرة للمستخدم.</div>
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
.presets{display:flex;flex-wrap:wrap;gap:8px;margin:2px 0 8px}
.perm-table th,.perm-table td{padding:6px 10px}
.perm-table th:not(:first-child),.perm-cell{text-align:center;width:70px}
.perm-cell input{width:auto;cursor:pointer}
.btn:disabled{opacity:.4;cursor:not-allowed}
</style>
