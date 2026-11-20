import { describe, expect, it } from "vitest"
import { bestStreak, currentStreak, cycleStatus, toggleDay, weekdayRates } from "./stats"
import type { Habit } from "./types"

const h = (keys: string[], extra: Record<string, boolean> = {}): Habit => ({
  id: "1",
  name: "x",
  completions: { ...Object.fromEntries(keys.map((k) => [k, true])), ...extra },
})

describe("toggle", () => {
  it("cicla vazio -> feito -> não feito -> vazio", () => {
    expect(cycleStatus(undefined)).toBe(true)
    expect(cycleStatus(true)).toBe(false)
    expect(cycleStatus(false)).toBe(undefined)
  })
  it("remove a chave ao voltar para vazio", () => {
    const habit = h([], { "2026-11-09": false })
    expect(toggleDay(habit, "2026-11-09").completions).toEqual({})
  })
})

describe("streaks", () => {
  const today = new Date(2026, 10, 9)
  it("não zera a sequência se hoje ainda não foi marcado", () => {
    expect(currentStreak(h(["2026-11-07", "2026-11-08"]), today)).toBe(2)
  })
  it("conta hoje quando feito", () => {
    expect(currentStreak(h(["2026-11-08", "2026-11-09"]), today)).toBe(2)
  })
  it("recorde atravessa virada de mês", () => {
    expect(bestStreak(h(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-05"]))).toBe(3)
  })
})

describe("weekdayRates", () => {
  it("sem hábitos retorna 0 em todos os dias", () => {
    expect(weekdayRates([]).every((d) => d.rate === 0)).toBe(true)
  })
})

import { offKind } from "./stats"

describe("folga e coringa", () => {
  // 2026-11-15 é domingo
  const base = { id: "h", name: "Treino", completions: { "2026-11-16": true, "2026-11-17": true, "2026-11-19": true } as Record<string, boolean> }
  it("folga semanal não quebra a sequência", () => {
    const h = { ...base, restDays: [3] } // quarta (18) de folga
    expect(currentStreak(h, new Date(2026, 10, 19))).toBe(3)
    expect(currentStreak(base, new Date(2026, 10, 19))).toBe(1)
  })
  it("coringa: feito -> não feito -> coringa -> vazio, 1 por semana", () => {
    let h = toggleDay({ ...base, completions: { ...base.completions, "2026-11-18": false } }, "2026-11-18")
    expect(offKind(h, "2026-11-18")).toBe("coringa")
    expect(currentStreak(h, new Date(2026, 10, 19))).toBe(3)
    // segundo coringa na mesma semana não é oferecido
    h = toggleDay({ ...h, completions: { ...h.completions, "2026-11-20": false } }, "2026-11-20")
    expect(offKind(h, "2026-11-20")).toBeNull()
    expect(h.completions["2026-11-20"]).toBeUndefined()
  })
})
