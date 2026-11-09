export interface Habit {
  id: string
  name: string
  /** chave YYYY-MM-DD (data local) -> true = feito, false = não feito */
  completions: Record<string, boolean>
}
