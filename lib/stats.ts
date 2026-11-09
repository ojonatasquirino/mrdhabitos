import type { Habit } from "@/lib/types"
import { addDays, toDateKey } from "@/lib/dates"

export type DayStatus = true | false | undefined

/** vazio -> feito -> não feito -> vazio */
export function cycleStatus(current: DayStatus): DayStatus {
  if (current === undefined) return true
  if (current === true) return false
  return undefined
}

export function toggleDay(habit: Habit, key: string): Habit {
  const next = cycleStatus(habit.completions[key])
  const completions = { ...habit.completions }
  if (next === undefined) delete completions[key]
  else completions[key] = next
  return { ...habit, completions }
}

/** Sequência atual: hoje conta se feito; se hoje ainda está vazio, conta a partir de ontem. */
export function currentStreak(habit: Habit, today = new Date()): number {
  let streak = 0
  let day = today
  if (habit.completions[toDateKey(day)] !== true) day = addDays(day, -1)
  while (habit.completions[toDateKey(day)] === true) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}

export function bestStreak(habit: Habit): number {
  const keys = Object.keys(habit.completions).filter((k) => habit.completions[k]).sort()
  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const key of keys) {
    const [y, m, d] = key.split("-").map(Number)
    const date = new Date(y, m - 1, d)
    run = prev && toDateKey(addDays(prev, 1)) === key ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return best
}

/** % de hábitos feitos em um dia (0-100), ou null se não há hábitos. */
export function dayRate(habits: Habit[], key: string): number | null {
  if (!habits.length) return null
  const done = habits.filter((h) => h.completions[key] === true).length
  return Math.round((done / habits.length) * 100)
}

export function lastDays(n: number, today = new Date()): Date[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

export function rateOverDays(habits: Habit[], days: Date[]): number {
  if (!habits.length || !days.length) return 0
  let done = 0
  for (const d of days) {
    const key = toDateKey(d)
    done += habits.filter((h) => h.completions[key] === true).length
  }
  return Math.round((done / (habits.length * days.length)) * 100)
}

export function habitRate(habit: Habit, days: Date[]): number {
  if (!days.length) return 0
  const done = days.filter((d) => habit.completions[toDateKey(d)] === true).length
  return Math.round((done / days.length) * 100)
}

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const WEEKDAY_LONG = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

/** Taxa média por dia da semana nos últimos `n` dias. */
export function weekdayRates(habits: Habit[], n = 56, today = new Date()) {
  const acc = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }))
  for (const d of lastDays(n, today)) {
    const key = toDateKey(d)
    acc[d.getDay()].total += habits.length
    acc[d.getDay()].done += habits.filter((h) => h.completions[key] === true).length
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
  let day = doneOn(today) ? today : addDays(today, -1)
  let streak = 0
  while (doneOn(day)) {
    streak++
    day = addDays(day, -1)
  }
  return streak
}
