"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore"
import type { Habit } from "@/lib/types"
import { firebaseDb } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

const STORAGE_KEY = "minimo-ridiculo-habits"
const NOTES_KEY = "mrd-notes"
const PROFILE_KEY = "mrd-profile"

export interface Profile {
  /** apelido exibido no app */
  name?: string
  /** foto em data URL JPEG pequena (até ~256px) */
  photo?: string
}
const LEGACY_AUTH_KEYS = ["mrd-users", "mrd-current-user"]

interface HabitsContextValue {
  habits: Habit[]
  ready: boolean
  addHabit: (name: string) => Habit
  updateHabit: (habit: Habit) => void
  deleteHabit: (id: string) => void
  /** nota livre por dia (chave YYYY-MM-DD) */
  notes: Record<string, string>
  setNote: (key: string, text: string) => void
  /** move o hábito para a posição do outro (arrastar e soltar) */
  moveHabit: (fromId: string, toId: string) => void
  profile: Profile
  setProfile: (profile: Profile) => void
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

function readNotes(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeNotes(notes: Record<string, string>) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
  } catch {}
}

function readProfile(): Profile {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function writeProfile(profile: Profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch {}
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
  const [notes, setNotes] = useState<Record<string, string>>({})
  const notesRef = useRef<Record<string, string>>({})
  const [profile, setProfileState] = useState<Profile>({})
  const uid = user?.uid

  useEffect(() => {
    LEGACY_AUTH_KEYS.forEach((key) => localStorage.removeItem(key))
  }, [])

  useEffect(() => {
    if (!authReady) return

    const applyProfile = (next: Profile) => {
      setProfileState(next)
      writeProfile(next)
    }

    const applyNotes = (next: Record<string, string>) => {
      notesRef.current = next
      setNotes(next)
      writeNotes(next)
    }

    const apply = (next: Habit[]) => {
      habitsRef.current = next
      setHabits(next)
      writeLocal(next)
      setReady(true)
    }

    if (!enabled || !uid) {
      apply(enabled ? [] : readLocal())
      applyNotes(enabled ? {} : readNotes())
      applyProfile(enabled ? {} : readProfile())
      if (enabled) setReady(true)
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) apply(readLocal())
        if (e.key === NOTES_KEY) applyNotes(readNotes())
        if (e.key === PROFILE_KEY) applyProfile(readProfile())
      }
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
        const localNotes = readNotes()
        if (local.length || Object.keys(localNotes).length)
          await setDoc(ref, { habits: local, notes: localNotes, profile: readProfile() }, { merge: true })
      }
      unsub = onSnapshot(ref, (s) => {
        apply((s.data()?.habits as Habit[]) ?? [])
        applyNotes((s.data()?.notes as Record<string, string>) ?? {})
        applyProfile((s.data()?.profile as Profile) ?? {})
      })
    })()

    // abre instantâneo com o cache enquanto a nuvem responde
    setHabits(readLocal())
    setNotes(readNotes())
    setProfileState(readProfile())
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

  const setNote = useCallback(
    (key: string, text: string) => {
      const next = { ...notesRef.current }
      const trimmed = text.trim().slice(0, 500)
      if (trimmed) next[key] = trimmed
      else delete next[key]
      notesRef.current = next
      setNotes(next)
      writeNotes(next)
      if (enabled && uid) {
        // sem merge no mapa de notas para que uma nota apagada suma da nuvem também
        setDoc(doc(firebaseDb(), "users", uid), { notes: next }, { mergeFields: ["notes"] }).catch(console.error)
      }
    },
    [enabled, uid],
  )

  const moveHabit = useCallback(
    (fromId: string, toId: string) =>
      persist((prev) => {
        const from = prev.findIndex((h) => h.id === fromId)
        const to = prev.findIndex((h) => h.id === toId)
        if (from < 0 || to < 0 || from === to) return prev
        const next = [...prev]
        const [item] = next.splice(from, 1)
        next.splice(to, 0, item)
        return next
      }),
    [persist],
  )

  const setProfile = useCallback(
    (next: Profile) => {
      const clean: Profile = {}
      if (next.name?.trim()) clean.name = next.name.trim().slice(0, 30)
      if (next.photo) clean.photo = next.photo
      setProfileState(clean)
      writeProfile(clean)
      if (enabled && uid) {
        // escreve o perfil inteiro (sem merge interno) para que remover a foto apague na nuvem
        setDoc(doc(firebaseDb(), "users", uid), { profile: clean }, { mergeFields: ["profile"] }).catch(console.error)
      }
    },
    [enabled, uid],
  )

  const value = useMemo(
    () => ({ habits, ready, addHabit, updateHabit, deleteHabit, notes, setNote, moveHabit, profile, setProfile }),
    [habits, ready, addHabit, updateHabit, deleteHabit, notes, setNote, moveHabit, profile, setProfile],
  )

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error("useHabits precisa estar dentro de <HabitsProvider>")
  return ctx
}
