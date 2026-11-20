"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Flag,
  GraduationCap,
  Hammer,
  Library,
  Minus,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { AppShell, BottomSheet, IconButton, PageHeader } from "@/components/app-shell"
import { useHabits } from "@/hooks/use-habits"
import { toDateKey } from "@/lib/dates"
import {
  KIND_META,
  MAX_ACTIVE,
  PACE_META,
  daysBetween,
  daysFed,
  nextStep,
  projectPace,
  projectProgress,
  readingForecast,
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
        <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Flag className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Hábito é o motor. Projeto é o destino.</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Um livro para terminar, um sistema para construir, um curso para concluir. Ligue um hábito diário e cada
            check avança o projeto.
          </p>
        </div>
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
  const { habits, saveProject, deleteProject, setNote, notes } = useHabits()
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
          <IconButton aria-label="Excluir projeto" onClick={() => setConfirmDelete(true)} className="text-muted-foreground">
            <Trash2 className="h-5 w-5" />
          </IconButton>
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

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2 className="text-lg font-semibold">Excluir projeto?</h2>
        <p className="mt-1 text-sm text-muted-foreground">O hábito ligado e o histórico dele continuam.</p>
        <div className="mb-2 mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="pressable h-12 flex-1 rounded-2xl bg-muted font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              router.replace("/projetos")
              deleteProject(p.id)
            }}
            className="pressable h-12 flex-1 rounded-2xl bg-red-600 font-semibold text-white"
          >
            Excluir
          </button>
        </div>
      </BottomSheet>
    </AppShell>
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
/* Novo projeto                                                        */
/* ------------------------------------------------------------------ */

export function NewProjectPage() {
  const router = useRouter()
  const { habits, addHabit, saveProject, projects } = useHabits()
  const [kind, setKind] = useState<ProjectKind>("leitura")
  const [name, setName] = useState("")
  const [goal, setGoal] = useState("")
  const [deadline, setDeadline] = useState("")
  const [steps, setSteps] = useState<{ title: string; total: string }[]>([{ title: "", total: "" }])
  const [habitChoice, setHabitChoice] = useState<string>("novo")
  const [newHabit, setNewHabit] = useState("")
  const [perCheck, setPerCheck] = useState("5")
  const active = projects.filter((p) => p.status === "ativo").length

  const cleanSteps = steps.filter((s) => s.title.trim() && (kind !== "leitura" || Number(s.total) > 0))
  const valid = name.trim() && cleanSteps.length > 0 && (habitChoice !== "novo" || newHabit.trim())
  const suggestedHabit = useMemo(
    () => (kind === "leitura" ? `Ler ${perCheck || 5} páginas` : kind === "estudo" ? "Assistir 1 aula" : "30 min no projeto"),
    [kind, perCheck],
  )

  const create = () => {
    if (!valid) return
    let habitId: string | undefined = habitChoice === "nenhum" ? undefined : habitChoice
    if (habitChoice === "novo") habitId = addHabit(newHabit.trim()).id
    const id = crypto.randomUUID()
    saveProject({
      id,
      name: name.trim(),
      kind,
      goal: goal.trim() || undefined,
      deadline: deadline || undefined,
      habitId,
      perCheck: kind === "leitura" ? Math.max(1, Number(perCheck) || 5) : undefined,
      steps: cleanSteps.map((s) => ({
        id: crypto.randomUUID(),
        title: s.title.trim(),
        ...(kind === "leitura" ? { total: Number(s.total), current: 0 } : { done: false }),
      })),
      status: "ativo",
      createdAt: toDateKey(new Date()),
    })
    router.replace(`/projetos/${id}`)
  }

  const label = "block text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
  const input =
    "mt-2 w-full rounded-xl bg-muted px-3 py-3 text-base outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-foreground/10"

  return (
    <AppShell nav={false} size="narrow">
      <PageHeader
        subtitle="Novo projeto"
        title="Onde você quer chegar?"
        left={
          <IconButton aria-label="Voltar" onClick={() => router.push("/projetos")} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />

      {active >= MAX_ACTIVE && (
        <p className="mb-4 rounded-2xl bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
          Você já tem {MAX_ACTIVE} projetos ativos. Conclua um antes de começar outro.
        </p>
      )}

      <span className={label}>Tipo</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(Object.keys(KIND_META) as ProjectKind[]).map((k) => {
          const Icon = KIND_ICON[k]
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                setHabitChoice("novo")
                setNewHabit("")
              }}
              className={cn(
                "pressable flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium",
                kind === k ? "border-foreground bg-foreground text-background" : "border-border",
              )}
            >
              <Icon className="h-5 w-5" />
              {KIND_META[k].label}
            </button>
          )
        })}
      </div>

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
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={cn(input, "normal-case tracking-normal text-foreground")}
        />
      </label>

      <span className={cn(label, "mt-6")}>
        {kind === "leitura" ? "Livros" : kind === "estudo" ? "Módulos" : "Etapas"} (3 a 5 é o ideal)
      </span>
      <ul className="mt-2 space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <input
              value={s.title}
              onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
              placeholder={kind === "leitura" ? "Ex: 12 Regras para a Vida" : `${KIND_META[kind].stepLabel} ${i + 1}`}
              className="min-w-0 flex-1 rounded-xl bg-muted px-3 py-3 text-base outline-none"
            />
            {kind === "leitura" && (
              <input
                inputMode="numeric"
                value={s.total}
                onChange={(e) =>
                  setSteps(steps.map((x, j) => (j === i ? { ...x, total: e.target.value.replace(/\D/g, "") } : x)))
                }
                placeholder="págs"
                className="w-20 rounded-xl bg-muted px-3 py-3 text-base outline-none"
              />
            )}
            {steps.length > 1 && (
              <button
                type="button"
                aria-label="Remover"
                onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                className="flex w-10 items-center justify-center text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setSteps([...steps, { title: "", total: "" }])}
        className="mt-2 flex items-center gap-1 text-sm font-medium text-muted-foreground"
      >
        <Plus className="h-4 w-4" /> Adicionar {KIND_META[kind].stepLabel.toLowerCase()}
      </button>

      <span className={cn(label, "mt-7")}>Hábito que alimenta o projeto</span>
      <p className="mt-1 text-xs text-muted-foreground">
        O mínimo diário. Cada check dele avança o projeto.
      </p>
      <select
        value={habitChoice}
        onChange={(e) => setHabitChoice(e.target.value)}
        className="mt-2 w-full rounded-xl bg-muted px-3 py-3 text-base outline-none"
      >
        <option value="novo">Criar um hábito novo</option>
        {habits.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
        <option value="nenhum">Sem hábito por enquanto</option>
      </select>
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
          Páginas por check
          <input
            inputMode="numeric"
            value={perCheck}
            onChange={(e) => setPerCheck(e.target.value.replace(/\D/g, ""))}
            className="w-14 rounded-lg bg-background px-2 py-1.5 text-right font-semibold outline-none"
          />
        </label>
      )}

      <button
        type="button"
        disabled={!valid || active >= MAX_ACTIVE}
        onClick={create}
        className="pressable mb-6 mt-8 h-14 w-full rounded-2xl bg-foreground text-base font-semibold text-background disabled:bg-muted disabled:text-muted-foreground"
      >
        Criar projeto
      </button>
    </AppShell>
  )
}

/* ------------------------------------------------------------------ */
/* Aviso depois do check (tela Hoje)                                   */
/* ------------------------------------------------------------------ */

export interface ProjectNudge {
  projectId: string
  dayKey: string
  /** id para reiniciar o tempo do aviso */
  stamp: number
}

/** Aviso pequeno e opcional que aparece ao marcar um hábito ligado a projeto. Some sozinho. */
export function ProjectToast({
  nudge,
  onClose,
  onReadingChange,
}: {
  nudge: ProjectNudge | null
  onClose: () => void
  onReadingChange: (projectId: string, dayKey: string, pages: number) => void
}) {
  const { projects, saveProject } = useHabits()
  const p = nudge ? projects.find((x) => x.id === nudge.projectId) : undefined
  if (!nudge || !p) return null
  const step = nextStep(p)
  const pages = p.log?.[nudge.dayKey] ?? 0

  return (
    <div
      key={nudge.stamp}
      role="status"
      className="fixed inset-x-0 bottom-[6.5rem] z-40 mx-auto w-full max-w-md px-4 animate-in fade-in slide-in-from-bottom-3 duration-300 sm:absolute lg:bottom-8 lg:left-auto lg:right-8 lg:mx-0"
    >
      <div className="glass flex items-center gap-3 rounded-3xl p-3 pl-4">
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
            <StepButton label="Menos páginas" onClick={() => onReadingChange(p.id, nudge.dayKey, Math.max(0, pages - 1))}>
              <Minus className="h-4 w-4" />
            </StepButton>
            <StepButton label="Mais páginas" onClick={() => onReadingChange(p.id, nudge.dayKey, pages + 1)}>
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
