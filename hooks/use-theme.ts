"use client"

import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark"
const KEY = "mrd-theme"

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((m) => m.setAttribute("content", theme === "dark" ? "#0a0a0a" : "#ffffff"))
}

/** Tema escolhido pelo usuário; sem escolha, segue o sistema. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    let saved: string | null = null
    try {
      saved = localStorage.getItem(KEY)
    } catch {}
    const initial = saved === "dark" || saved === "light" ? saved : systemTheme()
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(KEY, next)
      } catch {}
      applyTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}

/** Roda antes da pintura para não piscar o tema errado. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`
