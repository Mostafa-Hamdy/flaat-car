import { defineStore } from 'pinia'
import { loadAll, putItem, deleteItem } from '../db/idb.js'
import { uid } from '../utils/helpers.js'

// One Pinia store per IndexedDB object store, persisting item-by-item.
export function defineCollection(id, storeName, migrate = (x) => x) {
  return defineStore(id, {
    state: () => ({ items: [], loaded: false }),
    actions: {
      async load() {
        this.items = migrate(await loadAll(storeName))
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
