import * as XLSX from 'xlsx'
import { daysUntil, dateInfo } from './helpers.js'

// Headers are copied verbatim from the legacy export so the file keeps the original sheet's format.
const CARS_HEADER = ['لوحة رقم', 'ماركة السيارة', 'موديل', 'الفئة', 'شاسية رقم', 'ماتور رقم', 'الجهه المالكة', 'تواجدها', 'اللون',
  'تاريخ إصدار رخصة', 'تاريخ إنتهاء رخصة', 'المدة المتبقية باليوم للرخصة', 'رقم تأمين السائق', 'اسم السائق بالتامينات',
  'تاريخ بداية مؤسسه', 'تاريخ إنتهاء مؤسسة', 'المدة المتبقية باليوم للمؤسسة']

const OPS_HEADER = ['التاريخ', 'اليوم', 'الشهر', 'الشهر بالرقم', 'نصف الشهر', 'سنة', 'السيارات', 'السائقين',
  'بند الإيجار', 'بند العقد', 'رقم العقد', 'ك/م ذهاب', 'ك/م إياب', 'ك/م صافى', 'موقع ذهاب', 'موقع إياب',
  'إيراد ليموزين', 'إيراد رحلات', 'مصاريف يومية', 'صافى الربح', 'بنك الإيداع', 'رقم إيداع الشيك',
  'الضريبة', 'اجمالى بعد الضريبة', 'رقم الفاتورة', 'ملاحظات']

function carsSheet(cars) {
  const rows = cars.map((c) => [
    c.plate || '', c.brand || '', c.model || '', c.category || '', c.chassis || '', c.engine || '', c.owner || '', c.location || '', c.color || '',
    c.lic_start || '', c.lic_end || '', daysUntil(c.lic_end), c.ins_no || '', c.ins_name || '',
    c.org_start || '', c.org_end || '', daysUntil(c.org_end),
  ])
  const ws = XLSX.utils.aoa_to_sheet([CARS_HEADER, ...rows])
  ws['!cols'] = CARS_HEADER.map(() => ({ wch: 16 }))
  return ws
}

function opsSheet(ops) {
  const rows = ops.slice().sort((a, b) => ((a.date || '') < (b.date || '') ? -1 : 1)).map((o) => {
    const info = dateInfo(o.date)
    return [
      o.date || '', info.day || '', info.month || '', info.monthIdx >= 0 ? info.monthIdx + 1 : '', info.half || '', info.year || '',
      o.car || '', o.driver || '', o.kind || '', '', o.contract || '',
      o.km1 || 0, o.km2 || 0, o.kmnet || 0, o.from || '', o.to || '',
      o.revlimo || 0, o.revtrip || 0, o.exp || 0, o.profit || 0,
      o.bank || '', o.depno || '', o.tax || 0, o.afterTax || 0, o.invoice || '', o.notes || '',
    ]
  })
  const ws = XLSX.utils.aoa_to_sheet([OPS_HEADER, ...rows])
  ws['!cols'] = OPS_HEADER.map(() => ({ wch: 14 }))
  return ws
}

export function buildWorkbook({ cars, ops }) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, carsSheet(cars), 'بيان بالسيارات')
  XLSX.utils.book_append_sheet(wb, opsSheet(ops), 'التشغلات اليومية')
  return wb
}

export function exportExcel(data) {
  XLSX.writeFile(buildWorkbook(data), 'ليموزين-كالوفيدا-' + new Date().toISOString().slice(0, 10) + '.xlsx')
}
