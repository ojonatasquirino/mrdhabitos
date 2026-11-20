import type { Habit } from "@/lib/types"
import { addDays, toDateKey } from "@/lib/dates"

export type DayStatus = true | false | undefined

function weekdayOf(key: string): number {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).getDay()
}

/** Folga: dia de descanso do hábito ou coringa usado. Não conta e não quebra sequência. */
export function offKind(habit: Habit, key: string): "folga" | "coringa" | null {
  if (habit.jokers?.[key]) return "coringa"
  if (habit.restDays?.includes(weekdayOf(key)) && habit.completions[key] !== true) return "folga"
  return null
}

const isOff = (habit: Habit, key: string) => offKind(habit, key) !== null

/** Coringa disponível: 1 por hábito por semana (domingo a sábado). */
export function jokerAvailable(habit: Habit, key: string): boolean {
  const [y, m, d] = key.split("-").map(Number)
  const start = addDays(new Date(y, m - 1, d), -weekdayOf(key))
  for (let i = 0; i < 7; i++) {
    const k = toDateKey(addDays(start, i))
    if (k !== key && habit.jokers?.[k]) return false
  }
  return true
}

/** vazio -> feito -> não feito -> vazio */
export function cycleStatus(current: DayStatus): DayStatus {
  if (current === undefined) return true
  if (current === true) return false
  return undefined
}

/** vazio -> feito -> não feito -> coringa (se disponível na semana) -> vazio */
export function toggleDay(habit: Habit, key: string): Habit {
  const completions = { ...habit.completions }
  const jokers = { ...(habit.jokers ?? {}) }
  if (jokers[key]) {
    delete jokers[key]
    delete completions[key]
  } else if (habit.completions[key] === false && jokerAvailable(habit, key)) {
    delete completions[key]
    jokers[key] = true
  } else {
    const next = cycleStatus(habit.completions[key])
    if (next === undefined) delete completions[key]
    else completions[key] = next
  }
  const out: Habit = { ...habit, completions }
  if (Object.keys(jokers).length) out.jokers = jokers
  else delete out.jokers
  return out
}

/** Sequência atual: hoje conta se feito; se hoje ainda está vazio, conta a partir de ontem. */
export function currentStreak(habit: Habit, today = new Date()): number {
  let streak = 0
  let day = today
  if (habit.completions[toDateKey(day)] !== true) day = addDays(day, -1)
  // folgas e coringas não contam, mas também não quebram
  for (let guard = 0; guard < 3660; guard++) {
    const key = toDateKey(day)
    if (habit.completions[key] === true) streak++
    else if (!isOff(habit, key)) break
    day = addDays(day, -1)
  }
  return streak
}

export function bestStreak(habit: Habit): number {
  const keys = Object.keys(habit.completions).filter((k) => habit.completions[k]).sort()
  if (!keys.length) return 0
  let best = 0
  let run = 0
  const [y, m, d] = keys[0].split("-").map(Number)
  const last = keys[keys.length - 1]
  for (let day = new Date(y, m - 1, d); ; day = addDays(day, 1)) {
    const key = toDateKey(day)
    if (habit.completions[key] === true) best = Math.max(best, ++run)
    else if (!isOff(habit, key)) run = 0
    if (key >= last) break
  }
  return best
}

/** % de hábitos feitos em um dia (0-100), ou null se não há hábitos. */
export function dayRate(habits: Habit[], key: string): number | null {
  if (!habits.length) return null
  const active = habits.filter((h) => !isOff(h, key))
  if (!active.length) return null
  const done = active.filter((h) => h.completions[key] === true).length
  return Math.round((done / active.length) * 100)
}

export function lastDays(n: number, today = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

export function rateOverDays(habits: Habit[], days: Date[]): number {
  if (!habits.length || !days.length) return 0
  let done = 0
  let total = 0
  for (const d of days) {
    const key = toDateKey(d)
    for (const h of habits) {
      if (isOff(h, key)) continue
      total++
      if (h.completions[key] === true) done++
    }
  }
  return total ? Math.round((done / total) * 100) : 0
}

export function habitRate(habit: Habit, days: Date[]): number {
  const counted = days.filter((d) => !isOff(habit, toDateKey(d)))
  if (!counted.length) return 0
  const done = counted.filter((d) => habit.completions[toDateKey(d)] === true).length
  return Math.round((done / counted.length) * 100)
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const WEEKDAY_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

/** Taxa média por dia da semana nos últimos `n` dias. */
export function weekdayRates(habits: Habit[], n = 56, today = new Date()) {
  const acc = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }))
  for (const d of lastDays(n, today)) {
    const key = toDateKey(d)
    const active = habits.filter((h) => !isOff(h, key))
    acc[d.getDay()].total += active.length
    acc[d.getDay()].done += active.filter((h) => h.completions[key] === true).length
  }
  return acc.map((a, i) => ({
    day: WEEKDAY_SHORT[i],
    long: WEEKDAY_LONG[i],
    rate: a.total ? Math.round((a.done / a.total) * 100) : 0,
    done: a.done,
  }))
}

/** Sequência de dias seguidos com ao menos um hábito feito. */
export function anyHabitStreak(habits: Habit[], today = new Date()): number {
  const doneOn = (d: Date) => habits.some((h) => h.completions[toDateKey(d)] === true)
  const allOff = (d: Date) => habits.length > 0 && habits.every((h) => isOff(h, toDateKey(d)))
  let day = doneOn(today) ? today : addDays(today, -1)
  let streak = 0
  for (let guard = 0; guard < 3660; guard++) {
    if (doneOn(day)) streak++
    else if (!allOff(day)) break
    day = addDays(day, -1)
  }
  return streak
}
