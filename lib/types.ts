export interface Habit {
  id: string
  name: string
  /** chave YYYY-MM-DD (data local) -> true = feito, false = não feito */
  completions: Record<string, boolean>
  /** dias da semana de folga (0 = domingo ... 6 = sábado): não contam nem quebram a sequência */
  restDays?: number[]
  /** dias em que o coringa da semana foi usado (1 por semana, de domingo a sábado) */
  jokers?: Record<string, true>
}
