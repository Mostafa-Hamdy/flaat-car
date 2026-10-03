export const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
export const MONTH_NAMES = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export const toNum = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n }
export const fmt = (n) => Math.round(n * 100) / 100
export const fmtMoney = (n) => fmt(n).toLocaleString('en-US')

export function fmtLocalDate(d) {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Returns {day, month, monthIdx, year, half} for a YYYY-MM-DD string.
export function dateInfo(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  if (!dateStr || isNaN(d)) return { day: '', month: '', monthIdx: -1, year: '', half: '' }
  return {
    day: DAY_NAMES[d.getDay()],
    month: MONTH_NAMES[d.getMonth()],
    monthIdx: d.getMonth(),
    year: d.getFullYear(),
    // Same wording as the legacy app: it feeds the "نصف الشهر" column of the Excel export.
    half: (d.getDate() <= 15 ? 'أول 15 ' : 'أخر 15 ') + MONTH_NAMES[d.getMonth()],
  }
}

export function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return null
  const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.round((d - t) / 86400000)
}

export function maintMigrate(list) {
  return (list || []).map((m) => {
    if (Array.isArray(m.items)) {
      const { cost, ...clean } = m
      return { ...clean, total: m.items.reduce((s, it) => s + toNum(it.price), 0) }
    }
    const price = toNum(m.cost)
    const { cost, ...clean } = m
    return { ...clean, items: price ? [{ name: m.type || 'تكلفة الصيانة', price }] : [], total: price }
  })
}

export function expiryStatus(days) {
  if (days === null) return { label: '—', cls: '' }
  if (days < 0) return { label: 'منتهي منذ ' + Math.abs(days) + ' يوم', cls: 'bad' }
  if (days <= 30) return { label: 'باقي ' + days + ' يوم', cls: 'warn' }
  return { label: 'ساري (' + days + ' يوم)', cls: 'ok' }
}
