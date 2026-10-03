import { defineStore } from 'pinia'
import { loadAll, putItem, deleteItem } from '../db/idb.js'
import { uid, maintMigrate } from '../utils/helpers.js'

// One Pinia store per IndexedDB object store, persisting item-by-item.
// `migrate` upgrades old records in memory; changed records are written back so it runs once.
export function defineCollection(id, storeName, migrate = (x) => x) {
  return defineStore(id, {
    state: () => ({ items: [], loaded: false }),
    actions: {
      async load() {
        const raw = await loadAll(storeName)
        const migrated = migrate(raw)
        await Promise.all(migrated.filter((m, i) => JSON.stringify(m) !== JSON.stringify(raw[i])).map((m) => putItem(storeName, m)))
        this.items = migrated
        this.loaded = true
      },
      async upsert(fields, existingId) {
        const old = existingId ? this.items.find((i) => i.id === existingId) : null
        const rec = { ...(old || {}), ...fields, id: existingId || uid() }
        await putItem(storeName, rec)
        const i = this.items.findIndex((x) => x.id === rec.id)
        if (i > -1) this.items[i] = rec; else this.items.push(rec)
        return rec
      },
      async remove(itemId) {
        await deleteItem(storeName, itemId)
        this.items = this.items.filter((x) => x.id !== itemId)
      },
    },
  })
}

export const useCarsStore = defineCollection('cars', 'cars')
export const useDriversStore = defineCollection('drivers', 'drivers')
export const useMaintItemsStore = defineCollection('maintitems', 'maintitems')
export const useMaintStore = defineCollection('maints', 'maints', maintMigrate)
export const useTasksStore = defineCollection('tasks', 'tasks')
