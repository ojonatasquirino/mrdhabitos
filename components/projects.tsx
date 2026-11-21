"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CalendarIcon,
  Check,
  ChevronRight,
  Flag,
  GraduationCap,
  Hammer,
  Library,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { AppShell, BottomSheet, IconButton, PageHeader } from "@/components/app-shell"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ptBR } from "react-day-picker/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHabits } from "@/hooks/use-habits"
import { toDateKey } from "@/lib/dates"
import {
  KIND_META,
  applyReading,
  MAX_ACTIVE,
  PACE_META,
  daysBetween,
  daysFed,
  nextStep,
  projectPace,
  projectProgress,
  readingForecast,
  readingPlan,
  type Project,
  type ProjectKind,
  type ProjectStep,
} from "@/lib/projects"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

const KIND_ICON: Record<ProjectKind, typeof BookOpen> = {
  leitura: BookOpen,
  construcao: Hammer,
  estudo: GraduationCap,
}

const fmtDate = (key: string) =>
  new Date(key + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")

/* ------------------------------------------------------------------ */
/* Lista                                                               */
/* ------------------------------------------------------------------ */

export function ProjectsPage() {
  const { projects, habits, ready } = useHabits()
  const active = projects.filter((p) => p.status === "ativo")
  const done = projects.filter((p) => p.status === "concluido")
  const full = active.length >= MAX_ACTIVE

  return (
    <AppShell>
      <PageHeader subtitle={`${active.length} de ${MAX_ACTIVE} ativos`} title="Projetos" />

      {ready && active.length > 0 && <Timeline projects={active} />}

      {ready && active.length === 0 && (
        <Empty className="mt-6 rounded-3xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flag />
            </EmptyMedia>
            <EmptyTitle>Hábito é o motor. Projeto é o destino.</EmptyTitle>
            <EmptyDescription>
              Um livro para terminar, um sistema para construir, um curso para concluir. Ligue um hábito diário e cada
              check avança o projeto.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="mt-5 grid gap-3 lg:grid-cols-2 lg:gap-5">
        {active.map((p) => (
          <ProjectCard key={p.id} project={p} habit={habits.find((h) => h.id === p.habitId)} />
        ))}
      </div>

      {full ? (
        <p className="mt-4 rounded-2xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
          Você está com {MAX_ACTIVE} projetos ativos. Conclua um para abrir espaço: poucos e constantes.
        </p>
      ) : (
        <Link
          href="/projetos/novo"
          className="pressable mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm font-semibold text-muted-foreground hover:bg-muted lg:max-w-sm"
        >
          <Plus className="h-4 w-4" />
          Novo projeto
        </Link>
      )}

      {done.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center gap-2">
            <Library className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Estante</h2>
            <span className="text-xs text-muted-foreground">projetos concluídos</span>
          </div>
          <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
            {done.map((p) => {
              const Icon = KIND_ICON[p.kind]
              return (
                <Link
                  key={p.id}
                  href={`/projetos/${p.id}`}
                  className="pressable flex items-center gap-3 rounded-2xl border border-border p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {p.takeaway ? `“${p.takeaway}”` : `Concluído em ${p.doneAt ? fmtDate(p.doneAt) : ""}`}
                    </span>
                  </span>
                  <Check className="h-4 w-4 text-green-600" />
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </AppShell>
  )
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out"
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  )
}

function PaceBadge({ project }: { project: Project }) {
  const pace = projectPace(project)
  const meta = PACE_META[pace]
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.className)}>{meta.label}</span>
  )
}

function progressLine(p: Project): string {
  if (p.kind === "leitura") {
    const book = nextStep(p) ?? p.steps[p.steps.length - 1]
    if (!book) return "Adicione um livro"
    const idx = p.steps.indexOf(book) + 1
    const prefix = p.steps.length > 1 ? `Livro ${idx} de ${p.steps.length} · ` : ""
    return `${prefix}p. ${book.current ?? 0} de ${book.total ?? 0}`
  }
  const done = p.steps.filter((s) => s.done).length
  return `${KIND_META[p.kind].stepLabel} ${Math.min(done + 1, p.steps.length)} de ${p.steps.length}`
}

function ProjectCard({ project: p, habit }: { project: Project; habit?: Habit }) {
  const Icon = KIND_ICON[p.kind]
  const pct = projectProgress(p)
  const step = nextStep(p)
  const todayKey = toDateKey(new Date())
  const fedToday = habit?.completions[todayKey] === true
  const left = p.deadline ? daysBetween(todayKey, p.deadline) : null

  return (
    <Link
      href={`/projetos/${p.id}`}
      className="pressable block min-w-0 rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {KIND_META[p.kind].label}
          </span>
          <span className="block truncate text-base font-semibold">{p.name}</span>
        </span>
        <PaceBadge project={p} />
      </div>

      <div className="mt-4 flex items-end justify-between">
        <span className="text-3xl font-semibold tabular-nums">{Math.round(pct * 100)}%</span>
        <span className="text-xs text-muted-foreground">
          {left == null ? progressLine(p) : left >= 0 ? `faltam ${left} dias` : `${-left} dias após o prazo`}
        </span>
      </div>
      <ProgressBar value={pct} className="mt-2" />
      {left != null && <p className="mt-1.5 text-[11px] text-muted-foreground">{progressLine(p)}</p>}
      <PlanLine project={p} habit={habit} />

      {step && (
        <div className="mt-4 rounded-2xl bg-muted/60 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {p.kind === "leitura" ? "Lendo agora" : "Próximo passo"}
          </p>
          <p className="mt-0.5 truncate text-sm font-medium">{step.title}</p>
        </div>
      )}

      {habit && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full",
              fedToday ? "bg-green-500 text-white" : "bg-muted",
            )}
          >
            {fedToday && <Check className="h-3 w-3" strokeWidth={3} />}
          </span>
          <span className="truncate text-muted-foreground">
            <b className="font-medium text-foreground">{habit.name}</b>
            {fedToday ? " · alimentado hoje" : " · ainda não hoje"}
          </span>
        </div>
      )}
    </Link>
  )
}

/** Visão geral: cada projeto como uma barra do início ao prazo, com a linha de hoje. */
function Timeline({ projects }: { projects: Project[] }) {
  const today = toDateKey(new Date())
  const withDates = projects.map((p) => ({
    p,
    start: p.createdAt,
    end: p.deadline ?? (readingForecast(p) ? toDateKey(readingForecast(p)!) : p.createdAt),
  }))
  const min = withDates.reduce((a, x) => (x.start < a ? x.start : a), today)
  const max = withDates.reduce((a, x) => (x.end > a ? x.end : a), today)
  const span = Math.max(1, daysBetween(min, max))
  const pos = (k: string) => (daysBetween(min, k) / span) * 100

  return (
    <section className="mt-2 rounded-3xl border border-border p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{fmtDate(min)}</span>
        <span className="font-medium text-foreground">Linha do tempo</span>
        <span>{fmtDate(max)}</span>
      </div>
      <div className="relative space-y-2.5">
        <div
          className="absolute -bottom-1 -top-1 z-10 w-px bg-foreground"
          style={{ left: `${pos(today)}%` }}
          aria-hidden="true"
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-foreground" />
        </div>
        {withDates.map(({ p, start, end }) => {
          const left = pos(start)
          const width = Math.max(4, pos(end) - left)
          const pct = projectProgress(p)
          return (
            <div key={p.id} className="relative h-7">
              <div
                className="absolute inset-y-0 overflow-hidden rounded-full bg-muted"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <div className="h-full bg-foreground/15" style={{ width: `${pct * 100}%` }} />
                <span className="absolute inset-0 flex items-center truncate px-3 text-[11px] font-medium">
                  {p.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        A linha marca hoje. {projects.some((p) => !p.deadline) ? "Leitura sem prazo usa a previsão do ritmo." : ""}
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Detalhe                                                             */
/* ------------------------------------------------------------------ */

export function ProjectDetailPage({ project: p }: { project: Project }) {
  const router = useRouter()
  const { habits, saveProject, deleteProject, setNote, notes, updateHabit } = useHabits()
  const habit = habits.find((h) => h.id === p.habitId)
  const [finishing, setFinishing] = useState(false)
  const [takeaway, setTakeaway] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const pct = projectProgress(p)
  const forecast = readingForecast(p)
  const Icon = KIND_ICON[p.kind]
  const todayKey = toDateKey(new Date())
  const isDone = p.status === "concluido"

  const updateStep = (id: string, patch: Partial<ProjectStep>) =>
    saveProject({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

  const finish = () => {
    const doneAt = todayKey
    saveProject({ ...p, status: "concluido", doneAt, takeaway: takeaway.trim() || undefined })
    if (takeaway.trim()) {
      const prev = notes[todayKey]
      setNote(todayKey, [prev, `${p.name}: ${takeaway.trim()}`].filter(Boolean).join("\n"))
    }
    setFinishing(false)
  }

  return (
    <AppShell nav={false} size="narrow">
      <PageHeader
        subtitle={KIND_META[p.kind].label}
        title={p.name}
        left={
          <IconButton aria-label="Voltar" onClick={() => router.push("/projetos")} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
        right={
          <span className="flex items-center">
            <IconButton
              aria-label="Editar projeto"
              onClick={() => router.push(`/projetos/${p.id}/editar`)}
              className="text-muted-foreground"
            >
              <Pencil className="h-5 w-5" />
            </IconButton>
            <IconButton aria-label="Excluir projeto" onClick={() => setConfirmDelete(true)} className="-mr-2 text-muted-foreground">
              <Trash2 className="h-5 w-5" />
            </IconButton>
          </span>
        }
      />

      <section className="rounded-3xl bg-foreground p-5 text-background">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-background/70">
            <Icon className="h-4 w-4" />
            {isDone ? `Concluído em ${p.doneAt ? fmtDate(p.doneAt) : ""}` : progressLine(p)}
          </span>
          {!isDone && <PaceBadge project={p} />}
        </div>
        <p className="mt-3 text-5xl font-semibold tabular-nums">{Math.round(pct * 100)}%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-background/15">
          <div className="h-full rounded-full bg-green-500" style={{ width: `${pct * 100}%` }} />
        </div>
        {p.goal && <p className="mt-4 text-sm leading-relaxed text-background/80">Pronto quando: {p.goal}</p>}
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Mini label="Dias alimentados" value={String(daysFed(p, habit))} />
        <Mini
          label="Prazo"
          value={p.deadline ? fmtDate(p.deadline) : "Livre"}
        />
        <Mini
          label={p.kind === "leitura" ? "Previsão" : "Etapas"}
          value={
            p.kind === "leitura"
              ? forecast
                ? fmtDate(toDateKey(forecast))
                : "–"
              : `${p.steps.filter((s) => s.done).length}/${p.steps.length}`
          }
        />
      </div>

      {!isDone && (
        <ReadingPlanCard
          project={p}
          habit={habit}
          onApply={(perDay) => {
            saveProject({ ...p, perCheck: perDay, basePerCheck: perDay })
            // "Ler 5 páginas" vira "Ler 8 páginas"
            if (habit && /\d+\s*p[áa]gina/i.test(habit.name))
              updateHabit({ ...habit, name: habit.name.replace(/\d+(\s*p[áa]gina)/i, `${perDay}$1`) })
          }}
        />
      )}

      {habit && (
        <Link
          href={`/habito/${habit.id}`}
          className="pressable mt-3 flex items-center gap-3 rounded-2xl border border-border p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Hábito que alimenta
            </span>
            <span className="block truncate text-sm font-semibold">
              {habit.name}
              {p.kind === "leitura" && p.perCheck ? ` · +${p.perCheck} páginas por check` : ""}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <h2 className="mb-2 mt-7 text-sm font-semibold">
        {p.kind === "leitura" ? "Livros" : p.kind === "estudo" ? "Módulos" : "Etapas"}
      </h2>
      <ul className="space-y-2">
        {p.steps.map((s, i) =>
          p.kind === "leitura" ? (
            <li key={s.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-semibold">{s.title}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {Math.round(((s.current ?? 0) / Math.max(1, s.total ?? 1)) * 100)}%
                </span>
              </div>
              <ProgressBar value={(s.current ?? 0) / Math.max(1, s.total ?? 1)} className="mt-2 h-1.5" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  página <b className="text-foreground tabular-nums">{s.current ?? 0}</b> de {s.total}
                </span>
                {!isDone && (
                  <span className="flex items-center gap-1">
                    <StepButton
                      label="Menos 1 página"
                      onClick={() => updateStep(s.id, { current: Math.max(0, (s.current ?? 0) - 1) })}
                    >
                      <Minus className="h-4 w-4" />
                    </StepButton>
                    <StepButton
                      label="Mais 1 página"
                      onClick={() => updateStep(s.id, { current: Math.min(s.total ?? 0, (s.current ?? 0) + 1) })}
                    >
                      <Plus className="h-4 w-4" />
                    </StepButton>
                  </span>
                )}
              </div>
            </li>
          ) : (
            <li key={s.id}>
              <button
                type="button"
                disabled={isDone}
                onClick={() => updateStep(s.id, { done: !s.done })}
                className="pressable flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                    s.done ? "border-green-500 bg-green-500 text-white" : "border-border",
                  )}
                >
                  {s.done ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="text-[11px]">{i + 1}</span>}
                </span>
                <span className={cn("text-sm font-medium", s.done && "text-muted-foreground line-through")}>
                  {s.title}
                </span>
                {!s.done && s === nextStep(p) && (
                  <span className="ml-auto rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
                    agora
                  </span>
                )}
              </button>
            </li>
          ),
        )}
      </ul>

      {!isDone && (
        <button
          type="button"
          onClick={() => setFinishing(true)}
          className={cn(
            "pressable mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-base font-semibold",
            pct >= 1 ? "bg-green-600 text-white" : "border border-border text-muted-foreground",
          )}
        >
          <Flag className="h-4 w-4" />
          Concluir projeto
        </button>
      )}

      {isDone && p.takeaway && (
        <blockquote className="mt-6 rounded-2xl bg-muted/60 p-4 text-sm italic leading-relaxed">
          “{p.takeaway}”
        </blockquote>
      )}

      <BottomSheet open={finishing} onClose={() => setFinishing(false)}>
        <h2 className="text-lg font-semibold">Concluir “{p.name}”</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ele vai para a sua Estante. {habit ? "O hábito continua na tela Hoje, se quiser manter." : ""}
        </p>
        <label className="mt-5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {p.kind === "leitura" ? "A frase que ficou" : "O que você aprendeu"}
        </label>
        <textarea
          value={takeaway}
          onChange={(e) => setTakeaway(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder={p.kind === "leitura" ? "Ex: Compare-se com quem você foi ontem." : "Uma linha basta."}
          className="mt-2 w-full resize-none rounded-xl bg-muted p-3 text-base outline-none"
        />
        <p className="mt-1 text-[11px] text-muted-foreground">Opcional. Também entra no seu Diário de hoje.</p>
        <button
          type="button"
          onClick={finish}
          className="pressable mb-2 mt-4 h-12 w-full rounded-2xl bg-foreground text-base font-semibold text-background"
        >
          Concluir e guardar na Estante
        </button>
      </BottomSheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Excluir “${p.name}”?`}
        description="As etapas e o progresso serão apagados. O hábito ligado e o histórico dele continuam. Não dá para desfazer."
        onConfirm={() => {
          router.replace("/projetos")
          deleteProject(p.id)
        }}
      />
    </AppShell>
  )
}

/** Linha curta no card: páginas por dia para terminar no prazo. */
function PlanLine({ project, habit }: { project: Project; habit?: Habit }) {
  const plan = readingPlan(project, habit)
  if (!plan?.perDay) return null
  return (
    <p
      className={cn(
        "mt-2 flex items-center gap-1.5 text-xs font-medium",
        plan.enough ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400",
      )}
    >
      <BookOpen className="h-3.5 w-3.5" />
      {plan.overdue
        ? `Prazo vencido · faltam ${plan.left} páginas`
        : `${plan.perDay} págs/dia para terminar até ${fmtDate(project.deadline!)}`}
    </p>
  )
}

/** Detalhe da leitura: ritmo necessário para o prazo e atalho para ajustar o hábito. */
function ReadingPlanCard({
  project: p,
  habit,
  onApply,
}: {
  project: Project
  habit?: Habit
  onApply: (perDay: number) => void
}) {
  const plan = readingPlan(p, habit)
  if (!plan || !plan.left) return null
  if (!plan.perDay)
    return (
      <p className="mt-3 rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
        Faltam <b className="text-foreground">{plan.left} páginas</b>. Defina um prazo (no lápis) para ver quantas
        páginas por dia você precisa ler.
      </p>
    )
  const current = p.perCheck ?? 0
  return (
    <section
      className={cn(
        "mt-3 rounded-2xl border p-4",
        plan.enough ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ritmo para o prazo</p>
      {plan.overdue ? (
        <p className="mt-1 text-sm">
          O prazo passou e faltam <b>{plan.left} páginas</b>. Ajuste o prazo no lápis para recalcular.
        </p>
      ) : (
        <>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">{plan.perDay}</span>
            <span className="text-sm text-muted-foreground">páginas por dia</span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Faltam {plan.left} páginas em {plan.days} {plan.days === 1 ? "dia" : "dias"} (até {fmtDate(p.deadline!)}
            {habit?.completions[toDateKey(new Date())] === true ? ", a partir de amanhã" : ", contando hoje"}).
          </p>
          {habit && (
            <p
              className={cn(
                "mt-3 text-sm font-medium",
                plan.enough ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400",
              )}
            >
              {plan.enough
                ? `Seu hábito de ${current} páginas por check dá conta. ✓`
                : `Seu hábito soma ${current} por check. Faltam ${plan.perDay - current} por dia para chegar no prazo.`}
            </p>
          )}
          {habit && !plan.enough && (
            <button
              type="button"
              onClick={() => onApply(plan.perDay!)}
              className="pressable mt-3 h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-background"
            >
              Ajustar hábito para {plan.perDay} páginas
            </button>
          )}
        </>
      )}
    </section>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-muted"
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Novo projeto / editar projeto                                       */
/* ------------------------------------------------------------------ */

interface StepDraft {
  id?: string
  title: string
  total: string
  current: string
  done?: boolean
}

export function NewProjectPage() {
  return <ProjectForm />
}

export function EditProjectPage({ project }: { project: Project }) {
  return <ProjectForm editing={project} />
}

function ProjectForm({ editing }: { editing?: Project }) {
  const router = useRouter()
  const { habits, addHabit, saveProject, projects } = useHabits()
  const [kind, setKind] = useState<ProjectKind>(editing?.kind ?? "leitura")
  const [name, setName] = useState(editing?.name ?? "")
  const [goal, setGoal] = useState(editing?.goal ?? "")
  const [deadline, setDeadline] = useState(editing?.deadline ?? "")
  const [steps, setSteps] = useState<StepDraft[]>(
    editing?.steps.length
      ? editing.steps.map((s) => ({
          id: s.id,
          title: s.title,
          total: s.total ? String(s.total) : "",
          current: s.current ? String(s.current) : "",
          done: s.done,
        }))
      : [{ title: "", total: "", current: "" }],
  )
  const [habitChoice, setHabitChoice] = useState<string>(
    editing ? (editing.habitId && habits.some((h) => h.id === editing.habitId) ? editing.habitId : "nenhum") : "novo",
  )
  const [newHabit, setNewHabit] = useState("")
  const [perCheck, setPerCheck] = useState(String(editing?.basePerCheck ?? editing?.perCheck ?? 5))
  const [autoPace, setAutoPace] = useState(editing?.autoPace ?? true)
  const [reopen, setReopen] = useState(false)
  const active = projects.filter((p) => p.status === "ativo" && p.id !== editing?.id).length
  const willBeActive = !editing || editing.status === "ativo" || reopen
  const blocked = willBeActive && active >= MAX_ACTIVE

  const cleanSteps = steps.filter((s) => s.title.trim() && (kind !== "leitura" || Number(s.total) > 0))
  const valid = name.trim() && cleanSteps.length > 0 && (habitChoice !== "novo" || newHabit.trim())
  const suggestedHabit = useMemo(
    () => (kind === "leitura" ? `Ler ${perCheck || 5} páginas` : kind === "estudo" ? "Assistir 1 aula" : "30 min no projeto"),
    [kind, perCheck],
  )

  const save = () => {
    if (!valid || blocked) return
    let habitId: string | undefined = habitChoice === "nenhum" ? undefined : habitChoice
    if (habitChoice === "novo") habitId = addHabit(newHabit.trim()).id
    const id = editing?.id ?? crypto.randomUUID()
    const status = editing ? (reopen ? "ativo" : editing.status) : "ativo"
    saveProject({
      ...(editing ?? {}),
      id,
      name: name.trim(),
      kind,
      goal: goal.trim() || undefined,
      deadline: deadline || undefined,
      habitId,
      perCheck: kind === "leitura" ? Math.max(1, Number(perCheck) || 5) : undefined,
      basePerCheck: kind === "leitura" ? Math.max(1, Number(perCheck) || 5) : undefined,
      autoPace: kind === "leitura" ? autoPace : undefined,
      steps: cleanSteps.map((s) => {
        const total = Number(s.total)
        return {
          id: s.id ?? crypto.randomUUID(),
          title: s.title.trim(),
          ...(kind === "leitura"
            ? { total, current: Math.min(total, Math.max(0, Number(s.current) || 0)) }
            : { done: !!s.done }),
        }
      }),
      status,
      createdAt: editing?.createdAt ?? toDateKey(new Date()),
      doneAt: status === "ativo" ? undefined : editing?.doneAt,
    })
    router.replace(`/projetos/${id}`)
  }

  const label = "block text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
  const input =
    "mt-2 w-full rounded-xl bg-muted px-3 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-foreground/10"
  const back = () => router.push(editing ? `/projetos/${editing.id}` : "/projetos")
  const setStep = (i: number, patch: Partial<StepDraft>) => setSteps(steps.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const moveStep = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSteps(next)
  }

  return (
    <AppShell nav={false} size="narrow">
      <PageHeader
        subtitle={editing ? "Editar projeto" : "Novo projeto"}
        title={editing ? editing.name : "Onde você quer chegar?"}
        left={
          <IconButton aria-label="Voltar" onClick={back} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />

      {blocked && (
        <p className="mb-4 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Você já tem {MAX_ACTIVE} projetos ativos. Conclua um antes de {editing ? "reabrir este" : "começar outro"}.
        </p>
      )}

      {editing?.status === "concluido" && (
        <label className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
          <span>
            <span className="block text-sm font-semibold">Reabrir projeto</span>
            <span className="block text-xs text-muted-foreground">Sai da Estante e volta para os ativos.</span>
          </span>
          <Switch checked={reopen} onCheckedChange={setReopen} aria-label="Reabrir projeto" />
        </label>
      )}

      <span className={label}>Tipo</span>
      <ToggleGroup
        type="single"
        variant="outline"
        value={kind}
        onValueChange={(v) => {
          if (!v || editing) return
          setKind(v as ProjectKind)
          setHabitChoice("novo")
          setNewHabit("")
        }}
        className="mt-2 w-full"
      >
        {(Object.keys(KIND_META) as ProjectKind[]).map((k) => {
          const Icon = KIND_ICON[k]
          return (
            <ToggleGroupItem
              key={k}
              value={k}
              disabled={!!editing && k !== kind}
              className="h-11 flex-1 gap-1.5 font-medium data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              <Icon className="size-4" />
              {KIND_META[k].label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {editing && <p className="mt-1.5 text-[11px] text-muted-foreground">O tipo não muda depois de criado.</p>}

      <label className={cn(label, "mt-6")}>
        Nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder={`Ex: ${KIND_META[kind].example}`}
          className={cn(input, "normal-case tracking-normal text-foreground")}
        />
      </label>

      <label className={cn(label, "mt-5")}>
        Pronto quando… <span className="normal-case">(opcional)</span>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          maxLength={140}
          placeholder={kind === "leitura" ? "Ex: Li e anotei as 12 regras" : "Ex: Vou de tema a vídeo pronto em 2h"}
          className={cn(input, "normal-case tracking-normal text-foreground")}
        />
      </label>

      <label className={cn(label, "mt-5")}>
        Prazo <span className="normal-case">(opcional)</span>
        <span className="mt-2 flex items-center gap-2 normal-case tracking-normal">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-12 flex-1 justify-start rounded-xl font-normal text-foreground">
                <CalendarIcon className="size-4" />
                {deadline
                  ? new Date(deadline + "T12:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  : "Escolher data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                locale={ptBR}
                selected={deadline ? new Date(deadline + "T12:00") : undefined}
                defaultMonth={deadline ? new Date(deadline + "T12:00") : undefined}
                onSelect={(d) => setDeadline(d ? toDateKey(d) : "")}
              />
            </PopoverContent>
          </Popover>
          {deadline && (
            <button
              type="button"
              onClick={() => setDeadline("")}
              className="shrink-0 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
            >
              Remover
            </button>
          )}
        </span>
      </label>

      <span className={cn(label, "mt-6")}>
        {kind === "leitura" ? "Livros" : kind === "estudo" ? "Módulos" : "Etapas"} (3 a 5 é o ideal)
      </span>
      <ul className="mt-2 space-y-2">
        {steps.map((s, i) => (
          <li key={s.id ?? `n${i}`} className="rounded-2xl bg-muted/50 p-2">
            <div className="flex gap-2">
              <input
                value={s.title}
                onChange={(e) => setStep(i, { title: e.target.value })}
                placeholder={kind === "leitura" ? "Ex: 12 Regras para a Vida" : `${KIND_META[kind].stepLabel} ${i + 1}`}
                className="min-w-0 flex-1 rounded-xl bg-muted px-3 py-3 text-base outline-none"
              />
              {steps.length > 1 && (
                <button
                  type="button"
                  aria-label="Remover"
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  className="flex w-9 items-center justify-center text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 px-1 text-xs text-muted-foreground">
              {kind === "leitura" ? (
                <>
                  <label className="flex items-center gap-1.5">
                    Páginas
                    <input
                      inputMode="numeric"
                      value={s.total}
                      onChange={(e) => setStep(i, { total: e.target.value.replace(/\D/g, "") })}
                      placeholder="448"
                      className="w-16 rounded-lg bg-muted px-2 py-1.5 text-sm text-foreground outline-none"
                    />
                  </label>
                  {editing && (
                    <label className="flex items-center gap-1.5">
                      Página atual
                      <input
                        inputMode="numeric"
                        value={s.current}
                        onChange={(e) => setStep(i, { current: e.target.value.replace(/\D/g, "") })}
                        placeholder="0"
                        className="w-16 rounded-lg bg-muted px-2 py-1.5 text-sm text-foreground outline-none"
                      />
                    </label>
                  )}
                </>
              ) : (
                editing && (
                  <label className="flex items-center gap-1.5">
                    <Checkbox checked={!!s.done} onCheckedChange={(c) => setStep(i, { done: c === true })} />
                    Concluída
                  </label>
                )
              )}
              {steps.length > 1 && (
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    aria-label="Subir"
                    disabled={i === 0}
                    onClick={() => moveStep(i, -1)}
                    className="rounded-lg px-2 py-1 disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Descer"
                    disabled={i === steps.length - 1}
                    onClick={() => moveStep(i, 1)}
                    className="rounded-lg px-2 py-1 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setSteps([...steps, { title: "", total: "", current: "" }])}
        className="mt-2 flex items-center gap-1 text-sm font-medium text-muted-foreground"
      >
        <Plus className="h-4 w-4" /> Adicionar {KIND_META[kind].stepLabel.toLowerCase()}
      </button>

      <span className={cn(label, "mt-7")}>Hábito que alimenta o projeto</span>
      <p className="mt-1 text-xs text-muted-foreground">O mínimo diário. Cada check dele avança o projeto.</p>
      <Select value={habitChoice} onValueChange={setHabitChoice}>
        <SelectTrigger className="mt-2 h-12! w-full rounded-xl text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="novo">Criar um hábito novo</SelectItem>
          {habits.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
          <SelectItem value="nenhum">Sem hábito por enquanto</SelectItem>
        </SelectContent>
      </Select>
      {habitChoice === "novo" && (
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          maxLength={60}
          placeholder={`Ex: ${suggestedHabit}`}
          onFocus={() => !newHabit && setNewHabit(suggestedHabit)}
          className={input}
        />
      )}
      {kind === "leitura" && habitChoice !== "nenhum" && (
        <label className="mt-3 flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
          {autoPace && deadline ? "Mínimo de páginas por check" : "Páginas por check"}
          <input
            inputMode="numeric"
            value={perCheck}
            onChange={(e) => setPerCheck(e.target.value.replace(/\D/g, ""))}
            className="w-14 rounded-lg bg-background px-2 py-1.5 text-right font-semibold outline-none"
          />
        </label>
      )}
      {kind === "leitura" && habitChoice !== "nenhum" && (
        <label
          className={cn(
            "mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border p-4",
            !deadline && "opacity-50",
          )}
        >
          <span>
            <span className="block text-sm font-semibold">Ajustar ao prazo automaticamente</span>
            <span className="block text-xs leading-relaxed text-muted-foreground">
              {deadline
                ? `Se o prazo apertar, sobe as páginas por check (até ${Math.max(1, Number(perCheck) || 5) * 2}) e volta ao mínimo quando você adiantar.`
                : "Defina um prazo para usar."}
            </span>
          </span>
          <Switch
            disabled={!deadline}
            checked={autoPace && !!deadline}
            onCheckedChange={setAutoPace}
            aria-label="Ajustar ao prazo automaticamente"
          />
        </label>
      )}

      <button
        type="button"
        disabled={!valid || blocked}
        onClick={save}
        className="pressable mb-6 mt-8 h-14 w-full rounded-2xl bg-foreground text-base font-semibold text-background disabled:bg-muted disabled:text-muted-foreground"
      >
        {editing ? "Salvar alterações" : "Criar projeto"}
      </button>
    </AppShell>
  )
}

/* ------------------------------------------------------------------ */
/* Aviso depois do check (tela Hoje)                                   */
/* ------------------------------------------------------------------ */

/** Aviso pequeno e opcional que aparece ao marcar um hábito ligado a projeto. Some sozinho. */
/** Mostra o aviso (toast) depois do check de um hábito ligado a projeto. Some sozinho. */
export function showProjectNudge(projectId: string, dayKey: string) {
  toast.custom((t) => <ProjectNudgeCard projectId={projectId} dayKey={dayKey} onClose={() => toast.dismiss(t)} />, {
    id: "project-nudge",
    duration: 7000,
  })
}

function ProjectNudgeCard({ projectId, dayKey, onClose }: { projectId: string; dayKey: string; onClose: () => void }) {
  const { projects, saveProject } = useHabits()
  const p = projects.find((x) => x.id === projectId)
  if (!p) return null
  const step = nextStep(p)
  const pages = p.log?.[dayKey] ?? 0
  const onReadingChange = (n: number) => saveProject(applyReading(p, dayKey, n))

  return (
    <div role="status" className="w-[min(356px,calc(100vw-2rem))]">
      <div className="flex items-center gap-3 rounded-2xl border bg-popover p-3 pl-4 text-popover-foreground shadow-lg">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          {(() => {
            const Icon = KIND_ICON[p.kind]
            return <Icon className="h-4 w-4" />
          })()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-muted-foreground">{p.name}</span>
          {p.kind === "leitura" ? (
            <span className="block truncate text-sm font-semibold">
              +{pages} págs{step ? ` · p. ${step.current ?? 0}/${step.total}` : " · livro concluído"}
            </span>
          ) : (
            <span className="block truncate text-sm font-semibold">
              {step ? `Concluiu “${step.title}”?` : "Todas as etapas feitas"}
            </span>
          )}
        </span>
        {p.kind === "leitura" ? (
          <span className="flex shrink-0 items-center gap-1">
            <StepButton label="Menos páginas" onClick={() => onReadingChange(Math.max(0, pages - 1))}>
              <Minus className="h-4 w-4" />
            </StepButton>
            <StepButton label="Mais páginas" onClick={() => onReadingChange(pages + 1)}>
              <Plus className="h-4 w-4" />
            </StepButton>
          </span>
        ) : (
          step && (
            <button
              type="button"
              onClick={() => {
                saveProject({ ...p, steps: p.steps.map((s) => (s.id === step.id ? { ...s, done: true } : s)) })
                onClose()
              }}
              className="pressable shrink-0 rounded-full bg-foreground px-3 py-2 text-xs font-semibold text-background"
            >
              Sim
            </button>
          )
        )}
        <button type="button" aria-label="Fechar" onClick={onClose} className="shrink-0 p-1 text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
