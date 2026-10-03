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

// Replace several stores in ONE transaction: either every store is replaced or none is.
export function replaceMany(map) {
  const names = Object.keys(map)
  const tx = db.transaction(names, 'readwrite')
  const finished = done(tx)
  try {
    for (const name of names) {
      const s = tx.objectStore(name)
      s.clear()
      ;(map[name] || []).forEach((it) => s.put(JSON.parse(JSON.stringify(it))))
    }
  } catch (e) {
    tx.abort() // a synchronous put error must not leave a half-replaced database
    finished.catch(() => {})
    throw e
  }
  return finished
}
