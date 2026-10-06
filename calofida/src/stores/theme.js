import { defineStore } from 'pinia'

const KEY = 'limo_theme_v1'
export const THEMES = [
  { id: 'classic', label: 'كلاسيكي (تيل)', swatch: 'linear-gradient(135deg,#0A423E,#0E5C56)' },
  { id: 'night', label: 'داكن تيل', swatch: 'linear-gradient(135deg,#12161C,#1FA595)' },
  { id: 'gold', label: 'ذهبي فاخر', swatch: 'linear-gradient(135deg,#6B5219,#9C7A2E)' },
  { id: 'navy', label: 'كحلي احترافي', swatch: 'linear-gradient(135deg,#15355F,#1E4E8C)' },
  { id: 'light', label: 'فاتح', swatch: 'linear-gradient(135deg,#ffffff,#e3e3e3)' },
  { id: 'apple', label: 'آبل', swatch: 'linear-gradient(135deg,#f5f5f7,#0071e3)' },
  { id: 'dark', label: 'غامق', swatch: 'linear-gradient(135deg,#181818,#3b82f6)' },
]

// Unknown/missing stored id follows the OS preference.
function stored() {
  try {
    const t = localStorage.getItem(KEY)
    if (THEMES.some((x) => x.id === t)) return t
  } catch (e) { /* ignore */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(theme) { document.documentElement.setAttribute('data-theme', theme) }

export const useThemeStore = defineStore('theme', {
  state: () => { const current = stored(); apply(current); return { current } },
  actions: {
    set(theme) {
      this.current = theme
      apply(theme)
      try { localStorage.setItem(KEY, theme) } catch (e) { /* ignore */ }
    },
  },
})
