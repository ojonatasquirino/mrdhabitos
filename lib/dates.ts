/** Chave YYYY-MM-DD no fuso local (toISOString usa UTC e muda o dia à noite). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** 7 chaves da semana atual, de domingo a sábado. */
export function getWeekDays(today: Date = new Date()): string[] {
  const sunday = addDays(today, -today.getDay())
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(sunday, i)))
}

export const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"]
