import { addDays, toDateKey } from "@/lib/dates"
import { dayRate, currentStreak } from "@/lib/stats"
import type { Habit } from "@/lib/types"
import { projectProgress, type Project } from "@/lib/projects"

/** Domingo (início) da semana de uma data. */
export function weekStart(d = new Date()): Date {
  return addDays(d, -d.getDay())
}

/** Revisão disponível: sábado a partir das 18h e domingo, se a semana ainda não foi revisada. */
export function reviewDue(lastReview: string | undefined, now = new Date()): string | null {
  const day = now.getDay()
  const ws = day === 0 ? weekStart(addDays(now, -1)) : weekStart(now)
  const key = toDateKey(ws)
  if (lastReview === key) return null
  if ((day === 6 && now.getHours() >= 18) || day === 0) return key
  return null
}

export interface WeekReview {
  weekKey: string
  days: { key: string; label: string; rate: number | null; future: boolean }[]
  pct: number
  prevPct: number | null
  habits: { habit: Habit; done: number; total: number }[]
  best?: { habit: Habit; done: number; total: number }
  worst?: { habit: Habit; done: number; total: number }
  streak: { habit: Habit; days: number } | null
  sleep: { avg: number; nights: number; onGoal: number; perfOn: number | null; perfOff: number | null } | null
  projects: { project: Project; pages: number; pct: number }[]
}

export function buildReview(
  weekKey: string,
  habits: Habit[],
  sleep: Record<string, number>,
  goal: number,
  projects: Project[],
  today = toDateKey(new Date()),
): WeekReview {
  const start = new Date(weekKey + "T12:00")
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"]
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = toDateKey(addDays(start, i))
    return { key, label: labels[i], rate: key > today ? null : dayRate(habits, key), future: key > today }
  })
  const past = days.filter((d) => !d.future)
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0)
  const pct = avg(past.map((d) => d.rate ?? 0))
  const prevDays = Array.from({ length: 7 }, (_, i) => toDateKey(addDays(start, i - 7)))
  const prevRates = prevDays.map((k) => dayRate(habits, k) ?? 0)
  const prevPct = habits.some((h) => prevDays.some((k) => h.completions[k] !== undefined)) ? avg(prevRates) : null

  const per = habits.map((habit) => ({
    habit,
    done: past.filter((d) => habit.completions[d.key] === true).length,
    total: past.length,
  }))
  const sorted = [...per].sort((a, b) => b.done - a.done)
  const best = sorted[0]
  const worst = sorted.length > 1 && sorted[sorted.length - 1].done < sorted[0].done ? sorted[sorted.length - 1] : undefined
  const streaks = habits.map((h) => ({ habit: h, days: currentStreak(h) })).sort((a, b) => b.days - a.days)

  const nights = past.map((d) => ({ key: d.key, h: sleep[d.key] })).filter((n): n is { key: string; h: number } => n.h != null)
  let sleepBlock: WeekReview["sleep"] = null
  if (nights.length) {
    const on = nights.filter((n) => n.h >= goal).map((n) => dayRate(habits, n.key) ?? 0)
    const off = nights.filter((n) => n.h < goal).map((n) => dayRate(habits, n.key) ?? 0)
    sleepBlock = {
      avg: nights.reduce((a, n) => a + n.h, 0) / nights.length,
      nights: nights.length,
      onGoal: on.length,
      perfOn: on.length ? avg(on) : null,
      perfOff: off.length ? avg(off) : null,
    }
  }

  const keys = new Set(past.map((d) => d.key))
  const proj = projects
    .filter((p) => p.status === "ativo")
    .map((p) => ({
      project: p,
      pages: Object.entries(p.log ?? {}).reduce((a, [k, v]) => a + (keys.has(k) ? v : 0), 0),
      pct: Math.round(projectProgress(p) * 100),
    }))

  return {
    weekKey,
    days,
    pct,
    prevPct,
    habits: per,
    best,
    worst,
    streak: streaks[0]?.days ? streaks[0] : null,
    sleep: sleepBlock,
    projects: proj,
  }
}
