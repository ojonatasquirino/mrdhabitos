import { toDateKey } from "@/lib/dates"
import type { Habit } from "@/lib/types"

export type ProjectKind = "leitura" | "construcao" | "estudo"

/** Etapa: livro (leitura, com páginas) ou marco/módulo (construção, estudo). */
export interface ProjectStep {
  id: string
  title: string
  /** leitura: total de páginas do livro */
  total?: number
  /** leitura: página atual */
  current?: number
  /** construção/estudo: etapa concluída */
  done?: boolean
}

export interface Project {
  id: string
  name: string
  kind: ProjectKind
  /** definição de pronto, em uma frase */
  goal?: string
  /** prazo YYYY-MM-DD (opcional) */
  deadline?: string
  /** hábito diário que alimenta o projeto */
  habitId?: string
  /** leitura: páginas lidas a cada check do hábito */
  perCheck?: number
  steps: ProjectStep[]
  status: "ativo" | "concluido"
  createdAt: string
  doneAt?: string
  /** leitura: a frase que ficou, guardada ao concluir */
  takeaway?: string
  /** leitura: páginas somadas por dia (para desfazer se o check for removido) */
  log?: Record<string, number>
}

export const MAX_ACTIVE = 3

export const KIND_META: Record<ProjectKind, { label: string; stepLabel: string; example: string }> = {
  leitura: { label: "Leitura", stepLabel: "Livro", example: "Decodificando Jordan Peterson" },
  construcao: { label: "Construção", stepLabel: "Etapa", example: "Sistema YouTube Dark" },
  estudo: { label: "Estudo", stepLabel: "Módulo", example: "Curso de edição de vídeo" },
}

export function projectProgress(p: Project): number {
  if (!p.steps.length) return p.status === "concluido" ? 1 : 0
  if (p.kind === "leitura") {
    const total = p.steps.reduce((a, s) => a + (s.total ?? 0), 0)
    const read = p.steps.reduce((a, s) => a + Math.min(s.current ?? 0, s.total ?? 0), 0)
    return total ? read / total : 0
  }
  return p.steps.filter((s) => s.done).length / p.steps.length
}

/** Próxima etapa: livro em andamento ou primeiro marco não concluído. */
export function nextStep(p: Project): ProjectStep | undefined {
  if (p.kind === "leitura") return p.steps.find((s) => (s.current ?? 0) < (s.total ?? 0))
  return p.steps.find((s) => !s.done)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T12:00").getTime() - new Date(a + "T12:00").getTime()) / 86400000)
}

export type Pace = "ritmo" | "atencao" | "atrasado" | "sem-prazo"

/** Compara o progresso com o tempo já passado até o prazo. */
export function projectPace(p: Project, today = toDateKey(new Date())): Pace {
  if (!p.deadline) return "sem-prazo"
  const span = Math.max(1, daysBetween(p.createdAt, p.deadline))
  const elapsed = Math.min(1, Math.max(0, daysBetween(p.createdAt, today) / span))
  const diff = projectProgress(p) - elapsed
  if (daysBetween(today, p.deadline) < 0 && projectProgress(p) < 1) return "atrasado"
  if (diff >= -0.05) return "ritmo"
  if (diff >= -0.2) return "atencao"
  return "atrasado"
}

export const PACE_META: Record<Pace, { label: string; className: string }> = {
  ritmo: { label: "No ritmo", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  atencao: { label: "Atenção", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  atrasado: { label: "Atrasado", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  "sem-prazo": { label: "Sem prazo", className: "bg-muted text-muted-foreground" },
}

/** Leitura: dia previsto para terminar no ritmo do hábito ligado. */
export function readingForecast(p: Project, today = new Date()): Date | null {
  if (p.kind !== "leitura" || !p.perCheck) return null
  const left = p.steps.reduce((a, s) => a + Math.max(0, (s.total ?? 0) - (s.current ?? 0)), 0)
  if (!left) return null
  const d = new Date(today)
  d.setDate(d.getDate() + Math.ceil(left / p.perCheck))
  return d
}

/** Dias em que o hábito ligado foi feito desde o início do projeto. */
export function daysFed(p: Project, habit?: Habit): number {
  if (!habit) return 0
  const end = p.doneAt ?? "9999-12-31"
  return Object.entries(habit.completions).filter(([k, v]) => v === true && k >= p.createdAt && k <= end).length
}

/** Soma (ou desfaz) páginas no livro em andamento quando o hábito é marcado. */
export function applyReading(p: Project, dayKey: string, pages: number): Project {
  const log = { ...(p.log ?? {}) }
  const prev = log[dayKey] ?? 0
  const delta = pages - prev
  if (!delta) return p
  if (pages) log[dayKey] = pages
  else delete log[dayKey]
  const steps = p.steps.map((s) => ({ ...s }))
  let left = delta
  if (left > 0) {
    for (const s of steps) {
      const room = (s.total ?? 0) - (s.current ?? 0)
      if (room <= 0) continue
      const add = Math.min(room, left)
      s.current = (s.current ?? 0) + add
      left -= add
      if (!left) break
    }
  } else {
    for (const s of [...steps].reverse()) {
      const has = s.current ?? 0
      if (has <= 0) continue
      const sub = Math.min(has, -left)
      s.current = has - sub
      left += sub
      if (!left) break
    }
  }
  return { ...p, steps, log }
}

export interface ReadingPlan {
  /** páginas que faltam em todos os livros */
  left: number
  /** dias disponíveis até o prazo, contando hoje se ainda não leu */
  days: number | null
  /** páginas por dia para terminar no prazo */
  perDay: number | null
  /** o hábito atual (páginas por check) já dá conta do prazo */
  enough: boolean
  /** prazo já passou com páginas faltando */
  overdue: boolean
}

/** Leitura: quantas páginas por dia são necessárias para terminar até o prazo. */
export function readingPlan(p: Project, habit?: Habit, today = toDateKey(new Date())): ReadingPlan | null {
  if (p.kind !== "leitura") return null
  const left = p.steps.reduce((a, s) => a + Math.max(0, (s.total ?? 0) - (s.current ?? 0)), 0)
  if (!p.deadline || !left) return { left, days: null, perDay: null, enough: true, overdue: false }
  const readToday = habit?.completions[today] === true
  const days = daysBetween(today, p.deadline) + (readToday ? 0 : 1)
  if (days <= 0) return { left, days: 0, perDay: left, enough: false, overdue: true }
  const perDay = Math.ceil(left / days)
  return { left, days, perDay, enough: (p.perCheck ?? 0) >= perDay, overdue: false }
}
