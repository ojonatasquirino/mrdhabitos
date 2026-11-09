"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore"
import type { Habit } from "@/lib/types"
import { firebaseDb } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

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

function readLocal(): Habit[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLocal(habits: Habit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  } catch {
    // modo privado / cota cheia
  }
}

/**
 * Sem Firebase configurado: localStorage.
 * Com usuário logado: Firestore em users/{uid}, com cache local para abrir offline.
 * No primeiro login, hábitos locais existentes sobem para a conta.
 */
export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { user, ready: authReady, enabled } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [ready, setReady] = useState(false)
  const habitsRef = useRef<Habit[]>([])
  const uid = user?.uid

  useEffect(() => {
    LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key))
  }, [])

  useEffect(() => {
    if (!authReady) return

    const apply = (next: Habit[]) => {
      habitsRef.current = next
      setHabits(next)
      writeLocal(next)
      setReady(true)
    }

    if (!enabled || !uid) {
      apply(enabled ? [] : readLocal())
      if (enabled) setReady(true)
      const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && apply(readLocal())
      window.addEventListener("storage", onStorage)
      return () => window.removeEventListener("storage", onStorage)
    }

    const ref = doc(firebaseDb(), "users", uid)
    let unsub = () => {}
    let cancelled = false

    ;(async () => {
      const snap = await getDoc(ref).catch(() => null)
      if (cancelled) return
      if (!snap?.exists()) {
        const local = readLocal()
        if (local.length) await setDoc(ref, { habits: local }, { merge: true })
      }
      unsub = onSnapshot(ref, (s) => apply((s.data()?.habits as Habit[]) ?? []))
    })()

    // abre instantâneo com o cache enquanto a nuvem responde
    setHabits(readLocal())
    return () => {
      cancelled = true
      unsub()
    }
  }, [authReady, enabled, uid])

  const persist = useCallback(
    (updater: (prev: Habit[]) => Habit[]) => {
      const next = updater(habitsRef.current)
      habitsRef.current = next
      setHabits(next)
      writeLocal(next)
      if (enabled && uid) {
        setDoc(doc(firebaseDb(), "users", uid), { habits: next }, { merge: true }).catch(console.error)
      }
    },
    [enabled, uid],
  )

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
