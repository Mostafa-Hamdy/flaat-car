<script setup>
import { reactive } from 'vue'
import { useAuthStore } from '../../stores/auth.js'

const auth = useAuthStore()
const f = reactive({ current: '', next: '', confirm: '' })

async function submit() {
  if (!f.next) return alert('من فضلك أدخل كلمة مرور جديدة')
  if (f.next !== f.confirm) return alert('كلمتا المرور الجديدتان غير متطابقتين')
  try {
    await auth.changeOwnPassword(f.current, f.next)
  } catch (e) {
    return alert(e.message)
  }
  Object.assign(f, { current: '', next: '', confirm: '' })
  alert('تم تحديث كلمة المرور بنجاح')
}
</script>

<template>
  <section class="panel">
    <div class="panel-head"><h2 style="margin:0">🔑 تغيير كلمة مروري</h2></div>
    <div class="panel-body">
    <form @submit.prevent="submit">
      <div class="form-grid">
        <div class="field"><label>كلمة المرور الحالية</label><input v-model="f.current" type="password" autocomplete="current-password"></div>
        <div class="field"><label>كلمة المرور الجديدة</label><input v-model="f.next" type="password" autocomplete="new-password"></div>
        <div class="field"><label>تأكيد كلمة المرور الجديدة</label><input v-model="f.confirm" type="password" autocomplete="new-password"></div>
      </div>
      <div style="margin-top:12px;"><button class="btn" type="submit">تحديث كلمة المرور</button></div>
    </form>
    </div>
  </section>
</template>

