import { defineStore } from 'pinia'

const KEY = 'limo_theme_v1'
export const THEMES = [
  { id: 'classic', label: 'كلاسيكي (تيل)', swatch: 'linear-gradient(135deg,#0A423E,#0E5C56)' },
  { id: 'dark', label: 'داكن', swatch: 'linear-gradient(135deg,#12161C,#1FA595)' },
  { id: 'gold', label: 'ذهبي فاخر', swatch: 'linear-gradient(135deg,#6B5219,#9C7A2E)' },
  { id: 'navy', label: 'كحلي احترافي', swatch: 'linear-gradient(135deg,#15355F,#1E4E8C)' },
]

function stored() {
  try { return localStorage.getItem(KEY) || 'classic' } catch (e) { return 'classic' }
}

export const useThemeStore = defineStore('theme', {
  state: () => ({ current: stored() }),
  actions: {
    set(theme) {
      this.current = theme
      const root = document.documentElement
      if (theme && theme !== 'classic') root.setAttribute('data-theme', theme)
      else root.removeAttribute('data-theme')
      try { localStorage.setItem(KEY, theme) } catch (e) { /* ignore */ }
    },
  },
})
