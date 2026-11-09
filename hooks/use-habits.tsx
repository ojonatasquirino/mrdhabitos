"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Habit } from "@/lib/types"

const STORAGE_KEY = "minimo-ridiculo-habits"
const LEGACY_AUTH_KEYS = ["mrd-users", "mrd-current-user"]

interface HabitsContextValue {
  habits: Habit[]
  ready: boolean
  addHabit: (name: string) => Habit
  updateHabit: (habit: Habit) => void
  deleteHabit: (id: string) => void
}

const HabitsContext = createContext<HabitsContextValue | null>(null)

function readHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setHabits(readHabits())
    // remove o antigo login falso (senhas em texto puro)
    LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key))
    setReady(true)

    // mantém abas sincronizadas
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHabits(readHabits())
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const persist = useCallback((updater: (prev: Habit[]) => Habit[]) => {
    setHabits((prev) => {
      const next = updater(prev)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // armazenamento indisponível (modo privado / cota cheia)
      }
      return next
    })
  }, [])

  const addHabit = useCallback(
    (name: string) => {
      const habit: Habit = { id: crypto.randomUUID(), name, completions: {} }
      persist((prev) => [...prev, habit])
      return habit
    },
    [persist],
  )

  const updateHabit = useCallback(
    (habit: Habit) => persist((prev) => prev.map((h) => (h.id === habit.id ? habit : h))),
    [persist],
  )

  const deleteHabit = useCallback(
    (id: string) => persist((prev) => prev.filter((h) => h.id !== id)),
    [persist],
  )

  const value = useMemo(
    () => ({ habits, ready, addHabit, updateHabit, deleteHabit }),
    [habits, ready, addHabit, updateHabit, deleteHabit],
  )

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error("useHabits precisa estar dentro de <HabitsProvider>")
  return ctx
}
