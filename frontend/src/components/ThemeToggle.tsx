import { useEffect, useState } from 'react'
import { Icon } from './Icon'

type Theme = 'light' | 'dark'
const key = 'hq-theme'

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function initTheme() {
  const saved = localStorage.getItem(key)
  document.documentElement.dataset.theme = saved === 'dark' ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  useEffect(() => {
    const sync = () => setTheme(currentTheme())
    window.addEventListener('hq:theme', sync)
    return () => window.removeEventListener('hq:theme', sync)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    localStorage.setItem(key, next)
    window.dispatchEvent(new Event('hq:theme'))
  }

  return <button type="button" className="theme-toggle" onClick={toggle}
    aria-label={theme === 'light' ? 'Tungi rejimga o‘tish' : 'Kunduzgi rejimga o‘tish'}
    title={theme === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}>
    <Icon name={theme === 'light' ? 'moon' : 'sun'} size={18} />
    <span>{theme === 'light' ? 'Tungi' : 'Kunduzgi'}</span>
  </button>
}
