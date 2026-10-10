import { defineStore } from 'pinia'
import { loadAll, putItem, deleteItem } from '../db/idb.js'
import { uid } from '../utils/helpers.js'
import { hashPassword, newSalt } from '../utils/crypto.js'

const SESSION_KEY = 'limo_current_user_id_v1'
// Per-page permissions: view (ظهور) / add (إضافة) / edit (تعديل — includes delete).
export const PERM_ACTIONS = [
  { key: 'view', label: 'ظهور' },
  { key: 'add', label: 'إضافة' },
  { key: 'edit', label: 'تعديل' },
]
export const PERM_PAGES = [
  { key: 'dashboard', label: 'لوحة التحكم', actions: ['view'] },
  { key: 'ops', label: 'التشغيل اليومي' },
  { key: 'cars', label: 'بيان السيارات' },
  { key: 'maint', label: 'الصيانة' },
  { key: 'tasks', label: 'المهام القادمة' },
  { key: 'airport', label: 'مواعيد المطار' },
  { key: 'drivers', label: 'السائقين' },
  { key: 'maintitems', label: 'الأدمن › بنود الصيانة' },
  { key: 'users', label: 'الأدمن › المستخدمين والصلاحيات' },
  { key: 'backup', label: 'الأدمن › النسخ الاحتياطي (التعديل = استيراد)', actions: ['view', 'edit'] },
  { key: 'settings', label: 'الأدمن › المظهر وكلمة المرور', actions: ['view'] },
]
export const pageActions = (p) => p.actions || ['view', 'add', 'edit']
const ADMIN_KEYS = ['maintitems', 'users', 'backup', 'settings']

export const allPerms = (on = true) => Object.fromEntries(PERM_PAGES.map((p) => [p.key,
  Object.fromEntries(PERM_ACTIONS.map((a) => [a.key, on && pageActions(p).includes(a.key)]))]))

// Accounts created before per-action permissions only have `canEdit` (per page) and `showAdmin`; derive from those.
export function permsOf(user) {
  const out = allPerms(false)
  if (!user) return out
  if (user.perms) {
    for (const p of PERM_PAGES) for (const a of pageActions(p)) out[p.key][a] = !!(user.perms[p.key] && user.perms[p.key][a])
    return out
  }
  const ce = user.canEdit || {}
  for (const p of PERM_PAGES) {
    const adminPage = ADMIN_KEYS.includes(p.key)
    const legacyKey = adminPage || p.key === 'drivers' ? 'admin' : p.key
    const editOn = p.key !== 'dashboard' && p.key !== 'settings' && !!ce[legacyKey]
    out[p.key].view = adminPage ? !!user.showAdmin : true
    if (pageActions(p).includes('add')) out[p.key].add = editOn && out[p.key].view
    if (pageActions(p).includes('edit')) out[p.key].edit = editOn && out[p.key].view
  }
  return out
}

// Legacy accounts store `password` in plain text; new/upgraded ones store salt + passwordHash.
async function matches(user, password) {
  if (user.passwordHash) return (await hashPassword(password, user.salt)) === user.passwordHash
  return user.password === password
}

async function withHash(rec, password) {
  const salt = newSalt()
  const { password: _old, ...rest } = rec
  return { ...rest, salt, passwordHash: await hashPassword(password, salt) }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ users: [], currentUser: null, ready: false }),
  getters: {
    isFirstRun: (s) => s.users.length === 0,
    can: (s) => (page, action = 'view') => !!(s.currentUser && permsOf(s.currentUser)[page]?.[action]),
  },
  actions: {
    async init() {
      this.users = await loadAll('users')
      try {
        const id = sessionStorage.getItem(SESSION_KEY)
        if (id) this.currentUser = this.users.find((u) => u.id === id) || null
      } catch (e) { /* sessionStorage unavailable */ }
      this.ready = true
    },
    // After a backup restore replaced the users store: refresh the list and re-bind (or drop) the session.
    async reloadUsers() {
      this.users = await loadAll('users')
      if (!this.currentUser) return
      const me = this.users.find((u) => u.id === this.currentUser.id)
      if (me) this.currentUser = me
      else this.logout()
    },
    async createFirstUser({ name, username, password, securityQ, securityA }) {
      const rec = await withHash(
        { id: uid(), name, username, securityQ, securityA, perms: allPerms() },
        password,
      )
      await this.saveUser(rec)
      this.setCurrent(rec)
    },
    async login(username, password) {
      const u = this.users.find((x) => x.username === username)
      if (!u || !(await matches(u, password))) return false
      let user = u
      if (!u.passwordHash) { // auto-upgrade legacy plain-text password
        user = await withHash(u, password)
        await this.saveUser(user)
      }
      this.setCurrent(user)
      return true
    },
    setCurrent(user) {
      this.currentUser = user
      try { sessionStorage.setItem(SESSION_KEY, user.id) } catch (e) { /* ignore */ }
    },
    logout() {
      this.currentUser = null
      try { sessionStorage.removeItem(SESSION_KEY) } catch (e) { /* ignore */ }
    },
    async saveUser(rec) {
      await putItem('users', rec)
      const i = this.users.findIndex((u) => u.id === rec.id)
      if (i > -1) this.users[i] = rec; else this.users.push(rec)
      if (this.currentUser && this.currentUser.id === rec.id) this.currentUser = rec
    },
    // password === '' keeps the existing one when editing.
    async upsertUser(fields, password, id) {
      const existing = id ? this.users.find((u) => u.id === id) : null
      let rec = { ...(existing || { id: uid() }), ...fields }
      if (password) rec = await withHash(rec, password)
      await this.saveUser(rec)
    },
    async removeUser(id) {
      if (this.users.length <= 1) throw new Error('لا يمكن حذف آخر مستخدم')
      if (this.currentUser && this.currentUser.id === id) throw new Error('لا يمكن حذف حسابك الحالي')
      await deleteItem('users', id)
      this.users = this.users.filter((u) => u.id !== id)
    },
    async changeOwnPassword(current, next) {
      if (!(await matches(this.currentUser, current))) throw new Error('كلمة المرور الحالية غير صحيحة')
      await this.saveUser(await withHash(this.currentUser, next))
    },
    async recoverPassword(userId, answer, next) {
      const u = this.users.find((x) => x.id === userId)
      if (!u || !u.securityQ) throw new Error('لا يوجد سؤال أمني، اطلب من الأدمن')
      if ((u.securityA || '').trim().toLowerCase() !== answer.trim().toLowerCase()) throw new Error('الإجابة غير صحيحة')
      await this.saveUser(await withHash(u, next))
    },
  },
})
