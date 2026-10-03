import { defineStore } from 'pinia'
import { loadAll, putItem, deleteItem } from '../db/idb.js'
import { uid } from '../utils/helpers.js'
import { hashPassword, newSalt } from '../utils/crypto.js'

const SESSION_KEY = 'limo_current_user_id_v1'
export const PAGES = ['ops', 'cars', 'maint', 'tasks', 'airport', 'admin']
export const DEFAULT_CAN_EDIT = { ops: true, cars: true, maint: true, tasks: true, admin: true, airport: true }

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
    canEdit: (s) => (page) => !!(s.currentUser && s.currentUser.canEdit && s.currentUser.canEdit[page]),
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
    async createFirstUser({ name, username, password, securityQ, securityA }) {
      const rec = await withHash(
        { id: uid(), name, username, securityQ, securityA, canEdit: { ...DEFAULT_CAN_EDIT }, showAdmin: true },
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
