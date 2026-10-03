import { toNum } from './helpers.js'

// Same formulas as the legacy grid: net km, profit, and total after tax.
export function computeRow(v) {
  const kmnet = toNum(v.km2) - toNum(v.km1)
  const profit = toNum(v.revlimo) + toNum(v.revtrip) - toNum(v.exp)
  return { kmnet, profit, afterTax: profit - toNum(v.tax) }
}

const TEXT = ['driver', 'contract', 'from', 'to', 'bank', 'depno', 'invoice', 'notes']
const NUM = ['km1', 'km2', 'revlimo', 'revtrip', 'exp', 'tax']

// A row with nothing entered is not stored (and deletes an existing record when cleared).
export function isBlankRow(v) {
  return !TEXT.some((f) => String(v[f] ?? '').trim()) && !NUM.some((f) => toNum(v[f]) !== 0)
}

export function draftFrom(o = {}) {
  return {
    driver: o.driver || '', kind: o.kind || 'تشغيلة', contract: o.contract || '',
    km1: o.km1 || '', km2: o.km2 || '', from: o.from || '', to: o.to || '',
    revlimo: o.revlimo || '', revtrip: o.revtrip || '', exp: o.exp || '',
    bank: o.bank || '', depno: o.depno || '', tax: o.tax || 0,
    invoice: o.invoice || '', notes: o.notes || '',
  }
}

// Fields stored on the record (same names as the legacy `ops` store).
export function recordFields(v) {
  const c = computeRow(v)
  const t = (f) => String(v[f] ?? '').trim()
  return {
    driver: t('driver'), kind: v.kind || 'تشغيلة', contract: t('contract'),
    km1: toNum(v.km1), km2: toNum(v.km2), kmnet: c.kmnet,
    from: t('from'), to: t('to'),
    revlimo: toNum(v.revlimo), revtrip: toNum(v.revtrip), exp: toNum(v.exp), profit: c.profit,
    bank: t('bank'), depno: t('depno'),
    tax: toNum(v.tax), afterTax: c.afterTax,
    invoice: t('invoice'), notes: t('notes'),
  }
}
