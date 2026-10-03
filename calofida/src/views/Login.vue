<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const mode = ref('login') // 'login' | 'recover'
const f = reactive({ name: '', username: '', password: '', securityQ: '', securityA: '' })
const error = ref('')

const rec = reactive({ userId: '', answer: '', next: '', next2: '' })
const recUser = computed(() => auth.users.find((u) => u.id === rec.userId))

async function submit() {
  error.value = ''
  if (auth.isFirstRun) {
    if (!f.name || !f.username || !f.password) return (error.value = 'من فضلك املأ كل الخانات')
    if (!f.securityQ.trim() || !f.securityA.trim()) return (error.value = 'السؤال الأمني وإجابته إجباريان')
    await auth.createFirstUser({ ...f })
  } else if (!(await auth.login(f.username.trim(), f.password))) {
    error.value = 'اسم الدخول أو كلمة المرور غير صحيحة'
  }
}

async function recover() {
  error.value = ''
  if (!rec.next || rec.next !== rec.next2) return (error.value = 'كلمتا المرور غير متطابقتين')
  try {
    await auth.recoverPassword(rec.userId, rec.answer, rec.next)
    mode.value = 'login'
    f.username = recUser.value.username
  } catch (e) { error.value = e.message }
}
</script>

<template>
  <div class="overlay">
    <form class="card box" @submit.prevent="mode === 'login' ? submit() : recover()">
      <h2>ليموزين كالوفيدا</h2>

      <template v-if="mode === 'login'">
        <p v-if="auth.isFirstRun">أول تشغيل: أنشئ أول حساب (بكل الصلاحيات)</p>
        <div v-if="auth.isFirstRun" class="field"><label>الاسم</label><input v-model="f.name"></div>
        <div class="field"><label>اسم الدخول</label><input v-model="f.username" autocomplete="username"></div>
        <div class="field"><label>كلمة المرور</label><input v-model="f.password" type="password" autocomplete="current-password"></div>
        <template v-if="auth.isFirstRun">
          <div class="field"><label>السؤال الأمني</label><input v-model="f.securityQ"></div>
          <div class="field"><label>الإجابة</label><input v-model="f.securityA"></div>
        </template>
        <button class="btn primary" type="submit">{{ auth.isFirstRun ? 'إنشاء الحساب' : 'دخول' }}</button>
        <a v-if="!auth.isFirstRun" href="#" class="link" @click.prevent="mode = 'recover'; error = ''">نسيت اسم الدخول أو كلمة المرور؟</a>
      </template>

      <template v-else>
        <div class="field">
          <label>الحساب</label>
          <select v-model="rec.userId">
            <option value="" disabled>اختر الحساب</option>
            <option v-for="u in auth.users" :key="u.id" :value="u.id">{{ u.name || u.username }}</option>
          </select>
        </div>
        <template v-if="recUser">
          <p v-if="!recUser.securityQ">لا يوجد سؤال أمني لهذا الحساب — اطلب من الأدمن.</p>
          <template v-else>
            <div class="field"><label>{{ recUser.securityQ }}</label><input v-model="rec.answer"></div>
            <div class="field"><label>كلمة المرور الجديدة</label><input v-model="rec.next" type="password" autocomplete="new-password"></div>
            <div class="field"><label>تأكيد كلمة المرور</label><input v-model="rec.next2" type="password" autocomplete="new-password"></div>
            <button class="btn primary" type="submit">تغيير كلمة المرور</button>
          </template>
        </template>
        <a href="#" class="link" @click.prevent="mode = 'login'; error = ''">رجوع</a>
      </template>

      <p v-if="error" class="err">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.overlay{position:fixed;inset:0;background:var(--paper);display:grid;place-items:center;z-index:100}
.box{width:min(380px,92vw);display:flex;flex-direction:column}
.link{margin-top:12px;color:var(--teal);font-size:13px}
.err{color:var(--brick);margin:10px 0 0}
</style>
