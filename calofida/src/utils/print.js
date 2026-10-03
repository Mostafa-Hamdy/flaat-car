// Prints a copy of a table element (buttons/inputs stripped) in a new window.
export function printTable(tableEl, title) {
  if (!tableEl) return alert('لا يوجد جدول لطباعته')
  const clone = tableEl.cloneNode(true)
  clone.querySelectorAll('button').forEach((b) => b.remove())
  clone.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    const s = document.createElement('span'); s.textContent = cb.checked ? '✔' : '—'; cb.replaceWith(s)
  })
  clone.querySelectorAll('input,select,textarea').forEach((el) => {
    const s = document.createElement('span'); s.textContent = el.value || ''; el.replaceWith(s)
  })
  const w = window.open('', '_blank')
  if (!w) return alert('من فضلك اسمح بفتح النوافذ المنبثقة لتفعيل الطباعة')
  const date = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  w.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
<style>
body{font-family:'Tajawal','IBM Plex Sans Arabic',Tahoma,Arial,sans-serif;padding:24px;color:#1F2430}
h2{margin:0 0 16px;font-size:18px}.meta{color:#5B6270;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border:1px solid #ccc;padding:6px 8px;text-align:start}th{background:#E6EFEE;color:#0A423E}
.badge{padding:2px 7px;border-radius:99px;font-size:10.5px;border:1px solid #999;display:inline-block}
@media print{body{padding:0}}
</style></head><body><h2>${title} — ليموزين كالوفيدا</h2><div class="meta">تاريخ الطباعة: ${date}</div>${clone.outerHTML}</body></html>`)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
}
