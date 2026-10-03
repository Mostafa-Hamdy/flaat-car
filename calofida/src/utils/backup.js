import { loadAll, replaceMany } from '../db/idb.js'
import { maintMigrate } from './helpers.js'

// JSON key in the backup file -> IndexedDB store. Same keys as the legacy backup, plus users/airport.
export const BACKUP_KEYS = {
  cars: 'cars', ops: 'ops', maints: 'maints', tasks: 'tasks', drivers: 'drivers',
  maintItemsCatalog: 'maintitems', users: 'users', airport: 'airport',
}

export async function buildBackup() {
  const data = {}
  for (const [key, store] of Object.entries(BACKUP_KEYS)) data[key] = await loadAll(store)
  data.exportedAt = new Date().toISOString()
  return data
}

// Returns the sections present in the file; throws a user-facing Error when the file is not a backup.
export function validateBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('ملف غير صالح')
  const present = Object.keys(BACKUP_KEYS).filter((k) => k in data)
  if (!present.length) throw new Error('ملف غير صالح: مفيش بيانات نسخة احتياطية جواه')
  for (const k of present) {
    const list = data[k]
    const validId = (id) => typeof id === 'string' ? id !== '' : typeof id === 'number' && Number.isFinite(id)
    if (!Array.isArray(list) || list.some((it) => !it || typeof it !== 'object' || Array.isArray(it) || !validId(it.id))) {
      throw new Error(`ملف غير صالح: القسم "${k}" تالف أو ناقص`)
    }
  }
  return present
}

// Replaces the sections found in the file; sections missing from the file are left untouched
// (older backups have no users/airport, and must not wipe them).
export async function restoreBackup(data) {
  const present = validateBackup(data)
  const map = {}
  for (const k of present) map[BACKUP_KEYS[k]] = k === 'maints' ? maintMigrate(data[k]) : data[k]
  await replaceMany(map)
  return present
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
