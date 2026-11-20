import { describe, expect, it } from "vitest"
import { applyReading, readingPlan, type Project } from "./projects"

const book = (current = 0): Project => ({
  id: "p",
  name: "Peterson",
  kind: "leitura",
  perCheck: 5,
  habitId: "h",
  steps: [{ id: "b", title: "12 Regras", total: 100, current }],
  status: "ativo",
  createdAt: "2026-11-01",
})

describe("applyReading", () => {
  it("soma as páginas do dia e desfaz ao desmarcar", () => {
    const a = applyReading(book(10), "2026-11-20", 5)
    expect(a.steps[0].current).toBe(15)
    expect(applyReading(a, "2026-11-20", 0).steps[0].current).toBe(10)
  })
  it("não soma duas vezes o mesmo dia", () => {
    const a = applyReading(applyReading(book(), "2026-11-20", 5), "2026-11-20", 5)
    expect(a.steps[0].current).toBe(5)
  })
  it("passa para o próximo livro quando o atual acaba", () => {
    const p: Project = { ...book(98), steps: [...book(98).steps, { id: "c", title: "Mapas", total: 50, current: 0 }] }
    const a = applyReading(p, "2026-11-20", 5)
    expect(a.steps.map((s) => s.current)).toEqual([100, 3])
  })
})

describe("readingPlan", () => {
  it("calcula páginas por dia até o prazo, contando hoje se ainda não leu", () => {
    const plan = readingPlan({ ...book(20), deadline: "2026-11-29" }, undefined, "2026-11-20")
    // faltam 80 páginas em 10 dias (20 a 29)
    expect(plan).toMatchObject({ left: 80, days: 10, perDay: 8, enough: false })
  })
  it("não conta hoje se já leu", () => {
    const habit = { id: "h", name: "Ler", completions: { "2026-11-20": true } }
    expect(readingPlan({ ...book(20), deadline: "2026-11-29" }, habit, "2026-11-20")?.days).toBe(9)
  })
  it("sem prazo não recomenda ritmo", () => {
    expect(readingPlan(book(20), undefined, "2026-11-20")?.perDay).toBeNull()
  })
  it("prazo vencido", () => {
    expect(readingPlan({ ...book(20), deadline: "2026-11-10" }, undefined, "2026-11-20")?.overdue).toBe(true)
  })
})

import { autoPerCheck, pagesInName, withPages } from "./projects"

describe("nome do hábito e páginas", () => {
  it("lê e troca o número de páginas", () => {
    expect(pagesInName("Ler 8 páginas")).toBe(8)
    expect(pagesInName("Ler 12 pág")).toBe(12)
    expect(pagesInName("Ler um capítulo")).toBeNull()
    expect(withPages("Ler 5 páginas", 10)).toBe("Ler 10 páginas")
    expect(withPages("Ler um capítulo", 10)).toBe("Ler um capítulo")
  })
})

describe("autoPerCheck", () => {
  const base: Project = {
    id: "p", name: "x", kind: "leitura", perCheck: 5, basePerCheck: 5, autoPace: true, deadline: "2026-11-29",
    steps: [{ id: "b", title: "L", total: 100, current: 20 }], status: "ativo", createdAt: "2026-11-01",
  }
  it("sobe até o necessário", () => expect(autoPerCheck(base, undefined, "2026-11-20")).toBe(8))
  it("respeita o teto de 2x o mínimo", () =>
    expect(autoPerCheck({ ...base, steps: [{ id: "b", title: "L", total: 400, current: 0 }] }, undefined, "2026-11-20")).toBe(10))
  it("volta ao mínimo quando está adiantado", () =>
    expect(autoPerCheck({ ...base, steps: [{ id: "b", title: "L", total: 100, current: 90 }] }, undefined, "2026-11-20")).toBe(5))
  it("desligado não mexe", () => expect(autoPerCheck({ ...base, autoPace: false }, undefined, "2026-11-20")).toBeNull())
})
