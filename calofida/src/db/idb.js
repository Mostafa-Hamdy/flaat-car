// Same database name/version/stores as the legacy limousine-app.html so data stays compatible.
export const IDB_NAME = 'limoCalofidaDB'
export const IDB_VERSION = 4
export const IDB_STORES = ['cars', 'ops', 'maints', 'tasks', 'drivers', 'maintitems', 'users', 'airport']

let db = null

export function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB غير مدعوم في هذا المتصفح'))
    const req = indexedDB.open(IDB_NAME, IDB_VERSION)
    req.onupgradeneeded = (e) => {
      const d = e.target.result
      IDB_STORES.forEach((name) => {
        if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, { keyPath: 'id' })
      })
    }
    req.onsuccess = () => { db = req.result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve()
  tx.onerror = () => reject(tx.error)
  tx.onabort = () => reject(tx.error)
})

export function loadAll(store) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

export function putItem(store, item) {
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(JSON.parse(JSON.stringify(item)))
  return done(tx)
}

export function deleteItem(store, id) {
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).delete(id)
  return done(tx)
}

// Replace the whole store (used by backup import).
export function replaceAll(store, items) {
  const tx = db.transaction(store, 'readwrite')
  const s = tx.objectStore(store)
  s.clear()
  ;(items || []).forEach((it) => s.put(JSON.parse(JSON.stringify(it))))
  return done(tx)
}
