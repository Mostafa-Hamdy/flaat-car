import { defineStore } from 'pinia'
import { loadAll, putItem, deleteItem } from '../db/idb.js'
import { uid } from '../utils/helpers.js'

// One record per car (plate) + date, same shape as the legacy `ops` store.
export const useOpsStore = defineStore('ops', {
  state: () => ({ items: [], loaded: false }),
  getters: {
    index: (s) => new Map(s.items.map((o) => [o.car + '|' + o.date, o])),
    platesByDate: (s) => {
      const m = new Map()
      s.items.forEach((o) => { if (!m.has(o.date)) m.set(o.date, []); m.get(o.date).push(o.car) })
      return m
    },
    earliestDate: (s) => s.items.reduce((min, o) => (o.date && (!min || o.date < min) ? o.date : min), null),
  },
  actions: {
    async load() { this.items = await loadAll('ops'); this.loaded = true },
    async saveRow(car, date, fields) {
      const old = this.index.get(car + '|' + date)
      const rec = { ...(old || {}), ...fields, id: old ? old.id : uid(), car, date }
      await putItem('ops', rec)
      const i = this.items.findIndex((o) => o.id === rec.id)
      if (i > -1) this.items[i] = rec; else this.items.push(rec)
    },
    async removeRow(car, date) {
      const old = this.index.get(car + '|' + date)
      if (!old) return
      await deleteItem('ops', old.id)
      this.items = this.items.filter((o) => o.id !== old.id)
    },
  },
})
