import { describe, expect, it } from "vitest"
import { addDays, getWeekDays, toDateKey } from "./dates"

describe("toDateKey", () => {
  it("usa a data local, não UTC (bug das 21h no Brasil)", () => {
    const lateNight = new Date(2026, 10, 9, 23, 30) // 09/11 às 23:30 local
    expect(toDateKey(lateNight)).toBe("2026-11-09")
  })

  it("preenche mês e dia com zero", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05")
  })
})

describe("addDays", () => {
  it("atravessa virada de mês e ano", () => {
    expect(toDateKey(addDays(new Date(2026, 11, 31), 1))).toBe("2027-01-01")
  })
})

describe("getWeekDays", () => {
  it("sempre começa no domingo e tem 7 dias", () => {
    const days = getWeekDays(new Date(2026, 10, 11)) // quarta
    expect(days).toHaveLength(7)
    expect(days[0]).toBe("2026-11-08")
    expect(days[6]).toBe("2026-11-14")
  })

  it("no próprio domingo começa nele mesmo", () => {
    expect(getWeekDays(new Date(2026, 10, 8))[0]).toBe("2026-11-08")
  })
})
