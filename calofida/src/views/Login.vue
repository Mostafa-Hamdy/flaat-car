<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

// Layout and wording follow the legacy login / first-run / password-recovery overlay.
const auth = useAuthStore()
const mode = ref('login') // 'login' | 'recover'

const setup = reactive({ name: '', username: '', password: '', securityQ: '', securityA: '' })
const login = reactive({ username: '', password: '' })
const loginFailed = ref(false)

const rec = reactive({ userId: '', answer: '', next: '', next2: '' })
const recMsg = ref('')
const recUser = computed(() => auth.users.find((u) => u.id === rec.userId))
const canRecover = computed(() => !!(recUser.value && recUser.value.securityQ && recUser.value.securityA))

async function createFirst() {
  const name = setup.name.trim(), username = setup.username.trim()
  const securityQ = setup.securityQ.trim(), securityA = setup.securityA.trim()
  if (!name || !username || !setup.password) return alert('من فضلك املأ كل الخانات')
  if (!securityQ || !securityA) {
    return alert('من فضلك سجّل سؤال أمان وإجابته — ده الطريقة الوحيدة لاسترجاع كلمة المرور لو نسيتها، خصوصًا وده أول حساب في البرنامج')
  }
  await auth.createFirstUser({ name, username, password: setup.password, securityQ, securityA })
}

async function doLogin() {
  loginFailed.value = !(await auth.login(login.username.trim(), login.password))
}

function pickAccount() {
  recMsg.value = ''
  rec.answer = ''
  if (recUser.value && !canRecover.value) {
    recMsg.value = 'مفيش سؤال أمان محفوظ للحساب ده — لازم مستخدم تاني معاه صلاحية "الأدمن" يغيّرلك كلمة المرور من صفحة الإعدادات.'
  }
}

async function doRecover() {
  const u = recUser.value
  if (!u) { recMsg.value = 'اختر الحساب الأول'; return }
  const answer = rec.answer.trim().toLowerCase()
  if (!answer || answer !== (u.securityA || '').trim().toLowerCase()) { recMsg.value = 'الإجابة مش مطابقة، حاول تاني'; return }
  if (!rec.next) { recMsg.value = 'من فضلك اكتب كلمة مرور جديدة'; return }
  if (rec.next !== rec.next2) { recMsg.value = 'كلمة المرور الجديدة وتأكيدها مش متطابقين'; return }
  await auth.recoverPassword(u.id, rec.answer, rec.next)
  recMsg.value = ''
  alert('تم تغيير كلمة المرور بنجاح، سجّل دخولك بيها دلوقتي')
  Object.assign(rec, { userId: '', answer: '', next: '', next2: '' })
  mode.value = 'login'
}
</script>

<template>
  <div class="auth-overlay">
    <div class="auth-card">
      <div class="auth-brand">
        <div class="brand-badge" style="width:40px; height:40px; font-size:20px;">🚘</div>
        <div>
          <div style="font-weight:800; font-size:17px; color:var(--ink);">ليموزين كالوفيدا</div>
          <div style="font-size:12px; color:var(--ink-soft);">تسجيل الدخول</div>
        </div>
      </div>

      <!-- first run: no users yet -->
      <form v-if="auth.isFirstRun" @submit.prevent="createFirst">
        <p style="color:var(--ink-soft); margin-top:0;">مفيش مستخدمين متسجلين لسه. أنشئ أول حساب (هيكون بصلاحيات كاملة) عشان تقدر تضيف باقي المستخدمين بعدين من صفحة الأدمن.</p>
        <div class="form-grid">
          <div class="field full"><label>الاسم</label><input v-model="setup.name" type="text"></div>
          <div class="field"><label>اسم الدخول</label><input v-model="setup.username" type="text" autocomplete="off"></div>
          <div class="field"><label>كلمة المرور</label><input v-model="setup.password" type="password" autocomplete="new-password"></div>
          <div class="field full"><label>سؤال أمان (لاسترجاع كلمة المرور لو نسيتها)</label><input v-model="setup.securityQ" type="text" placeholder="مثال: اسم أول عربية دخلت الأسطول؟"></div>
          <div class="field full"><label>إجابة سؤال الأمان</label><input v-model="setup.securityA" type="text"></div>
        </div>
        <div style="margin-top:14px;"><button type="submit" class="btn" style="width:100%;">إنشاء الحساب والدخول</button></div>
      </form>

      <!-- password recovery -->
      <form v-else-if="mode === 'recover'" @submit.prevent="doRecover">
        <p style="color:var(--ink-soft); margin-top:0;">اختر حسابك وجاوب على سؤال الأمان عشان تقدر تحط كلمة مرور جديدة.</p>
        <div class="form-grid">
          <div class="field full">
            <label>الحساب</label>
            <select v-model="rec.userId" @change="pickAccount">
              <option value="">اختر الحساب</option>
              <option v-for="u in auth.users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.username }})</option>
            </select>
          </div>
          <template v-if="canRecover">
            <div class="field full"><label>{{ recUser.securityQ }}</label><input v-model="rec.answer" type="text"></div>
            <div class="field full"><label>كلمة المرور الجديدة</label><input v-model="rec.next" type="password" autocomplete="new-password"></div>
            <div class="field full"><label>تأكيد كلمة المرور الجديدة</label><input v-model="rec.next2" type="password" autocomplete="new-password"></div>
          </template>
        </div>
        <div v-if="recMsg" class="auth-msg">{{ recMsg }}</div>
        <div style="margin-top:14px; display:flex; gap:8px;">
          <button v-if="canRecover" type="submit" class="btn" style="flex:1;">تغيير كلمة المرور</button>
        </div>
        <div style="text-align:center; margin-top:12px;">
          <a href="#" class="auth-link" @click.prevent="mode = 'login'">رجوع لتسجيل الدخول</a>
        </div>
      </form>

      <!-- login -->
      <form v-else @submit.prevent="doLogin">
        <p style="color:var(--ink-soft); margin-top:0;">سجّل دخولك عشان تكمل.</p>
        <div class="form-grid">
          <div class="field full"><label>اسم الدخول</label><input v-model="login.username" type="text" autocomplete="username"></div>
          <div class="field full"><label>كلمة المرور</label><input v-model="login.password" type="password" autocomplete="current-password"></div>
        </div>
        <div v-if="loginFailed" class="auth-msg">اسم الدخول أو كلمة المرور غير صحيحة</div>
        <div style="margin-top:14px;"><button type="submit" class="btn" style="width:100%;">دخول</button></div>
        <div style="text-align:center; margin-top:12px;">
          <a href="#" class="auth-link" @click.prevent="mode = 'recover'">نسيت اسم الدخول أو كلمة المرور؟</a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay{ position:fixed; inset:0; z-index:9998; background:var(--paper); display:flex; align-items:center; justify-content:center; padding:16px; }
.auth-card{
  width:100%; max-width:400px; background:var(--surface); border:1px solid var(--line);
  border-radius:var(--radius); box-shadow:var(--shadow); padding:26px 24px;
}
.auth-brand{ display:flex; align-items:center; gap:10px; margin-bottom:18px; }
.auth-msg{ color:var(--brick); font-size:12.5px; margin-top:8px; }
.auth-link{ font-size:12.5px; color:var(--teal); text-decoration:underline; }
</style>
