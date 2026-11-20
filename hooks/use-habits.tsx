"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, setDoc } from "firebase/firestore"
import type { Habit } from "@/lib/types"
import { applyReading, autoPerCheck, pagesInName, withPages, type Project } from "@/lib/projects"
import { firebaseDb } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"

const STORAGE_KEY = "minimo-ridiculo-habits"
const NOTES_KEY = "mrd-notes"
const SLEEP_KEY = "mrd-sleep"
const PROFILE_KEY = "mrd-profile"
const PROJECTS_KEY = "mrd-projects"

export interface Profile {
  /** apelido exibido no app */
  name?: string
  /** foto em data URL JPEG pequena (até ~256px) */
  photo?: string
  /** já viu (ou pulou) a introdução */
  onboarded?: boolean
  /** meta de sono por noite, em horas (padrão 7) */
  sleepGoal?: number
  /** chave da caixa de entrada do sono (app Atalhos -> /api/sono) */
  sleepKey?: string
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
  /** horas dormidas na noite que termina no dia (chave YYYY-MM-DD) */
  sleep: Record<string, number>
  setSleep: (key: string, hours: number | null) => void
  /** cria (uma vez) e devolve a chave pessoal para o atalho do app Saúde */
  ensureSleepKey: () => Promise<string | null>
  setNote: (key: string, text: string) => void
  /** move o hábito para a posição do outro (arrastar e soltar) */
  moveHabit: (fromId: string, toId: string) => void
  profile: Profile
  setProfile: (profile: Profile) => void
  /** projetos com prazo, alimentados por um hábito */
  projects: Project[]
  /** aviso do ritmo automático da leitura (páginas por check ajustadas ao prazo) */
  paceNotice: PaceNotice | null
  dismissPace: () => void
  undoPace: () => void
  saveProject: (project: Project) => void
  deleteProject: (id: string) => void
}

export interface PaceNotice {
  projectId: string
  name: string
  from: number
  to: number
  stamp: number
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

function readProjects(): Project[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeProjects(projects: Project[]) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  } catch {}
}

function readNotes(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function readSleep(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(SLEEP_KEY) ?? "{}")
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function writeSleep(sleep: Record<string, number>) {
  try {
    localStorage.setItem(SLEEP_KEY, JSON.stringify(sleep))
  } catch {}
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
  const [sleep, setSleepState] = useState<Record<string, number>>({})
  const sleepRef = useRef<Record<string, number>>({})
  const [profile, setProfileState] = useState<Profile>({})
  const [projects, setProjectsState] = useState<Project[]>([])
  const projectsRef = useRef<Project[]>([])
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

    const applyProjects = (next: Project[]) => {
      projectsRef.current = next
      setProjectsState(next)
      writeProjects(next)
    }

    const applySleep = (next: Record<string, number>) => {
      sleepRef.current = next
      setSleepState(next)
      writeSleep(next)
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
      applySleep(enabled ? {} : readSleep())
      applyProfile(enabled ? {} : readProfile())
      applyProjects(enabled ? [] : readProjects())
      if (enabled) setReady(true)
      const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) apply(readLocal())
        if (e.key === NOTES_KEY) applyNotes(readNotes())
        if (e.key === SLEEP_KEY) applySleep(readSleep())
        if (e.key === PROFILE_KEY) applyProfile(readProfile())
        if (e.key === PROJECTS_KEY) applyProjects(readProjects())
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
          await setDoc(
            ref,
            { habits: local, notes: localNotes, profile: readProfile(), projects: JSON.parse(JSON.stringify(readProjects())) },
            { merge: true },
          )
      }
      unsub = onSnapshot(ref, (s) => {
        apply((s.data()?.habits as Habit[]) ?? [])
        applyNotes((s.data()?.notes as Record<string, string>) ?? {})
        applySleep((s.data()?.sleep as Record<string, number>) ?? {})
        applyProfile((s.data()?.profile as Profile) ?? {})
        applyProjects((s.data()?.projects as Project[]) ?? [])
      })
    })()

    // abre instantâneo com o cache enquanto a nuvem responde
    setHabits(readLocal())
    setNotes(readNotes())
    setSleepState(readSleep())
    setProfileState(readProfile())
    setProjectsState(readProjects())
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
      if (next.onboarded) clean.onboarded = true
      if (next.sleepKey) clean.sleepKey = next.sleepKey
      if (next.sleepGoal && next.sleepGoal >= 4 && next.sleepGoal <= 12)
        clean.sleepGoal = Math.round(next.sleepGoal * 4) / 4
      setProfileState(clean)
      writeProfile(clean)
      if (enabled && uid) {
        // escreve o perfil inteiro (sem merge interno) para que remover a foto apague na nuvem
        setDoc(doc(firebaseDb(), "users", uid), { profile: clean }, { mergeFields: ["profile"] }).catch(console.error)
      }
    },
    [enabled, uid],
  )

  const setSleep = useCallback(
    (key: string, hours: number | null) => {
      const next = { ...sleepRef.current }
      if (hours == null || !Number.isFinite(hours) || hours <= 0) delete next[key]
      else next[key] = Math.round(Math.min(hours, 16) * 4) / 4 // passos de 15 min
      sleepRef.current = next
      setSleepState(next)
      writeSleep(next)
      if (enabled && uid) {
        setDoc(doc(firebaseDb(), "users", uid), { sleep: next }, { mergeFields: ["sleep"] }).catch(console.error)
      }
    },
    [enabled, uid],
  )

  const writeAllProjects = useCallback(
    (raw: Project[]) => {
      // remove campos vazios: o Firestore recusa undefined
      const next = JSON.parse(JSON.stringify(raw)) as Project[]
      projectsRef.current = next
      setProjectsState(next)
      writeProjects(next)
      if (enabled && uid) {
        try {
          setDoc(doc(firebaseDb(), "users", uid), { projects: next }, { mergeFields: ["projects"] }).catch(console.error)
        } catch (e) {
          console.error(e)
        }
      }
    },
    [enabled, uid],
  )

  const saveProject = useCallback(
    (project: Project) => {
      const prev = projectsRef.current
      const exists = prev.some((p) => p.id === project.id)
      writeAllProjects(exists ? prev.map((p) => (p.id === project.id ? project : p)) : [...prev, project])
    },
    [writeAllProjects],
  )

  /**
   * Salva o hábito e, se ele alimenta um projeto de leitura ativo, soma (ou desfaz) as páginas
   * de cada dia marcado/desmarcado. Vale para qualquer tela: Hoje, calendário do hábito etc.
   */
  const updateHabit = useCallback(
    (habit: Habit) => {
      const prev = habitsRef.current.find((h) => h.id === habit.id)
      persist((list) => list.map((h) => (h.id === habit.id ? habit : h)))
      if (!prev) return
      // renomeou "Ler 5 páginas" para "Ler 8 páginas": o projeto passa a somar 8 (e 8 vira o mínimo)
      const named = prev.name !== habit.name ? pagesInName(habit.name) : null
      if (named) {
        const linked = projectsRef.current.some((p) => p.kind === "leitura" && p.habitId === habit.id)
        if (linked)
          writeAllProjects(
            projectsRef.current.map((p) =>
              p.kind === "leitura" && p.habitId === habit.id ? { ...p, perCheck: named, basePerCheck: named } : p,
            ),
          )
      }
      const keys = new Set([...Object.keys(prev.completions), ...Object.keys(habit.completions)])
      const changed = [...keys].filter((k) => (prev.completions[k] === true) !== (habit.completions[k] === true))
      if (!changed.length) return
      let touched = false
      const next = projectsRef.current.map((p) => {
        if (p.status !== "ativo" || p.kind !== "leitura" || p.habitId !== habit.id) return p
        let q = p
        for (const k of changed) q = applyReading(q, k, habit.completions[k] === true ? (q.perCheck ?? 1) : 0)
        if (q !== p) touched = true
        return q
      })
      if (touched) writeAllProjects(next)
    },
    [persist, writeAllProjects],
  )

  const deleteProject = useCallback(
    (id: string) => writeAllProjects(projectsRef.current.filter((p) => p.id !== id)),
    [writeAllProjects],
  )

  // ritmo automático: ajusta páginas por check (e o nome do hábito) para cumprir o prazo
  const [paceNotice, setPaceNotice] = useState<PaceNotice | null>(null)
  useEffect(() => {
    if (!ready) return
    let changedProjects = false
    let notice: PaceNotice | null = null
    const renames = new Map<string, string>()
    const next = projectsRef.current.map((p) => {
      const habit = habitsRef.current.find((h) => h.id === p.habitId)
      const target = autoPerCheck(p, habit)
      if (target == null || target === p.perCheck) return p
      changedProjects = true
      notice = { projectId: p.id, name: p.name, from: p.perCheck ?? target, to: target, stamp: Date.now() }
      if (habit) {
        const renamed = withPages(habit.name, target)
        if (renamed !== habit.name) renames.set(habit.id, renamed)
      }
      return { ...p, perCheck: target, basePerCheck: p.basePerCheck ?? p.perCheck }
    })
    if (!changedProjects) return
    writeAllProjects(next)
    if (renames.size) persist((list) => list.map((h) => (renames.has(h.id) ? { ...h, name: renames.get(h.id)! } : h)))
    if (notice) setPaceNotice(notice)
  }, [ready, projects, habits, writeAllProjects, persist])

  const dismissPace = useCallback(() => setPaceNotice(null), [])

  /** Desfazer: volta ao número anterior e desliga o ajuste automático daquele projeto. */
  const undoPace = useCallback(() => {
    const n = paceNotice
    if (!n) return
    const p = projectsRef.current.find((x) => x.id === n.projectId)
    setPaceNotice(null)
    if (!p) return
    writeAllProjects(
      projectsRef.current.map((x) => (x.id === p.id ? { ...x, perCheck: n.from, basePerCheck: n.from, autoPace: false } : x)),
    )
    if (p.habitId)
      persist((list) => list.map((h) => (h.id === p.habitId ? { ...h, name: withPages(h.name, n.from) } : h)))
  }, [paceNotice, writeAllProjects, persist])

  const profileRef = useRef<Profile>({})
  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  const ensureSleepKey = useCallback(async () => {
    if (!enabled || !uid) return null
    const existing = profileRef.current.sleepKey
    if (existing) return existing
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
    const bytes = crypto.getRandomValues(new Uint8Array(20))
    const key = "mrd_" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
    await setDoc(doc(firebaseDb(), "sleepInbox", key), { uid })
    setProfile({ ...profileRef.current, sleepKey: key })
    return key
  }, [enabled, uid, setProfile])

  // traz o sono enviado pelo app Atalhos: preenche só noites sem registro manual
  const sleepKey = profile.sleepKey
  useEffect(() => {
    if (!ready || !enabled || !uid || !sleepKey) return
    let cancelled = false
    ;(async () => {
      try {
        const snap = await getDocs(collection(firebaseDb(), "sleepInbox", sleepKey, "dias"))
        if (cancelled || snap.empty) return
        const next = { ...sleepRef.current }
        let changed = false
        snap.forEach((d) => {
          const h = Number(d.data().horas)
          if (Number.isFinite(h) && h > 0 && next[d.id] == null) {
            next[d.id] = Math.round(Math.min(h, 16) * 4) / 4
            changed = true
          }
        })
        if (changed) {
          sleepRef.current = next
          setSleepState(next)
          writeSleep(next)
          await setDoc(doc(firebaseDb(), "users", uid), { sleep: next }, { mergeFields: ["sleep"] })
        }
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, enabled, uid, sleepKey])

  const value = useMemo(
    () => ({
      habits,
      ready,
      addHabit,
      updateHabit,
      deleteHabit,
      notes,
      setNote,
      sleep,
      setSleep,
      ensureSleepKey,
      moveHabit,
      profile,
      setProfile,
      projects,
      paceNotice,
      dismissPace,
      undoPace,
      saveProject,
      deleteProject,
    }),
    [
      habits,
      ready,
      addHabit,
      updateHabit,
      deleteHabit,
      notes,
      setNote,
      sleep,
      setSleep,
      ensureSleepKey,
      moveHabit,
      profile,
      setProfile,
      projects,
      paceNotice,
      dismissPace,
      undoPace,
      saveProject,
      deleteProject,
    ],
  )

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>
}

export function useHabits() {
  const ctx = useContext(HabitsContext)
  if (!ctx) throw new Error("useHabits precisa estar dentro de <HabitsProvider>")
  return ctx
}
