"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Flame, LogOut, Moon, NotebookPen, Plus, Quote as QuoteIcon, Sun, X } from "lucide-react"
import { AppShell, BottomSheet, IconButton, PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"
import { QUOTES, quoteIndexFor } from "@/lib/quotes"
import { ReminderButton } from "@/components/reminder-button"
import { useHabits } from "@/hooks/use-habits"
import { useAuth } from "@/hooks/use-auth"
import { getWeekDays, toDateKey, WEEKDAY_INITIALS } from "@/lib/dates"
import { currentStreak, toggleDay } from "@/lib/stats"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

function haptic() {
  try {
    navigator.vibrate?.(8)
  } catch {}
}

export function HomePage() {
  const { habits, ready, updateHabit, notes, setNote } = useHabits()
  const { theme, toggle: toggleTheme } = useTheme()
  const { user, enabled: authEnabled, logout } = useAuth()
  const today = new Date()
  const todayKey = toDateKey(today)
  const weekDays = useMemo(() => getWeekDays(), [])

  const doneToday = habits.filter((h) => h.completions[todayKey] === true).length
  const pct = habits.length ? Math.round((doneToday / habits.length) * 100) : 0
  const firstName = user?.displayName?.split(" ")[0]
  const weekday = today.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0]
  const dateLabel = `${weekday}, ${today.getDate()} ${today.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}`

  const toggle = (habit: Habit, key: string) => {
    haptic()
    updateHabit(toggleDay(habit, key))
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="space-y-4 pt-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        subtitle={dateLabel}
        title={firstName ? `Olá, ${firstName}` : "Hoje"}
        left={
          <>
            <IconButton
              aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
              onClick={toggleTheme}
              className="text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </IconButton>
            <ReminderButton habits={habits} />
          </>
        }
        right={
          <>
            {authEnabled && user && (
              <IconButton aria-label="Sair" onClick={() => logout()} className="text-muted-foreground">
                <LogOut className="h-5 w-5" />
              </IconButton>
            )}
          </>
        }
      />

      <DailyQuote date={today} />

      {habits.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <TodaySummary pct={pct} done={doneToday} total={habits.length} />
          <DayNote value={notes[todayKey] ?? ""} onSave={(text) => setNote(todayKey, text)} />

          <ul className="mt-6 space-y-3">
            {habits.map((habit, i) => (
              <li
                key={habit.id}
                className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <HabitCard habit={habit} weekDays={weekDays} todayKey={todayKey} onToggle={toggle} />
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Toque no dia para marcar · toque de novo para &quot;não feito&quot;
          </p>
        </>
      )}
    </AppShell>
  )
}

function TodaySummary({ pct, done, total }: { pct: number; done: number; total: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  const message =
    done === total ? "Dia completo. Ridículo de bom." : done === 0 ? "Comece pelo menor." : "Continue, falta pouco."

  return (
    <section className="flex items-center gap-5 rounded-3xl bg-foreground p-5 text-background">
      <div className="relative h-[76px] w-[76px] shrink-0">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth="8" />
          <circle
            cx="38"
            cy="38"
            r={r}
            fill="none"
            stroke="#22c55e"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (pct / 100) * c}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums">
          {done}
          <span className="text-background/40">/{total}</span>
        </p>
        <p className="text-sm text-background/60">{message}</p>
      </div>
    </section>
  )
}

function HabitCard({
  habit,
  weekDays,
  todayKey,
  onToggle,
}: {
  habit: Habit
  weekDays: string[]
  todayKey: string
  onToggle: (habit: Habit, key: string) => void
}) {
  const streak = currentStreak(habit)

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Link href={`/habito/${habit.id}`} className="pressable -m-1 flex items-center gap-2 rounded-2xl p-1">
        <span className="min-w-0 flex-1 truncate text-base font-semibold">{habit.name}</span>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
            <Flame className="h-3.5 w-3.5" />
            {streak}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </Link>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {weekDays.map((key, i) => (
          <DayDot
            key={key}
            label={WEEKDAY_INITIALS[i]}
            status={habit.completions[key]}
            isToday={key === todayKey}
            isFuture={key > todayKey}
            onClick={() => onToggle(habit, key)}
          />
        ))}
      </div>
    </div>
  )
}

function DayDot({
  label,
  status,
  isToday,
  isFuture,
  onClick,
}: {
  label: string
  status: boolean | undefined
  isToday: boolean
  isFuture: boolean
  onClick: () => void
}) {
  const [bump, setBump] = useState(0)
  const stateLabel = status === true ? "feito" : status === false ? "não feito" : "sem marcação"

  return (
    <button
      type="button"
      disabled={isFuture}
      onClick={() => {
        setBump((b) => b + 1)
        onClick()
      }}
      aria-label={`${label}${isToday ? " (hoje)" : ""}: ${stateLabel}`}
      className="flex flex-col items-center gap-1.5 py-1 disabled:opacity-30"
    >
      <span className={cn("text-[11px] font-medium", isToday ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span
        key={bump}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200",
          bump > 0 && "animate-pop",
          status === true && "bg-green-500 text-white",
          status === false && "bg-red-500 text-white",
          status === undefined && "bg-muted text-transparent",
          isToday && status === undefined && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
        )}
      >
        {status === true && <Check className="h-5 w-5" strokeWidth={3} />}
        {status === false && <X className="h-5 w-5" strokeWidth={3} />}
      </span>
    </button>
  )
}

function EmptyState() {
  return (
    <section className="flex flex-col items-center px-4 pt-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Plus className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold">Comece pequeno</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Um hábito tão pequeno que seria ridículo não fazer. &quot;Ler 1 página&quot; vence &quot;ler mais&quot;.
      </p>
      <Link
        href="/novo"
        className="pressable mt-8 flex h-12 items-center gap-2 rounded-2xl bg-foreground px-6 text-sm font-semibold text-background"
      >
        <Plus className="h-4 w-4" />
        Criar primeiro hábito
      </Link>
    </section>
  )
}

function DailyQuote({ date }: { date: Date }) {
  const [offset, setOffset] = useState(0)
  const quote = QUOTES[(quoteIndexFor(date) + offset) % QUOTES.length]

  return (
    <button
      type="button"
      onClick={() => setOffset((o) => o + 1)}
      aria-label="Frase do dia. Toque para ver outra"
      className="pressable mb-4 block w-full rounded-3xl bg-muted/70 px-5 py-4 text-left"
    >
      <div key={offset} className="animate-in fade-in duration-500">
        <QuoteIcon className="mb-2 h-4 w-4 text-muted-foreground" />
        <p className="text-[15px] font-medium leading-snug text-balance">{quote.text}</p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">— {quote.author}</p>
      </div>
    </button>
  )
}

function DayNote({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)

  const openSheet = () => {
    setDraft(value)
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className={cn(
          "pressable mt-3 flex w-full items-start gap-3 rounded-3xl px-5 py-4 text-left",
          value ? "border border-border bg-card" : "border border-dashed border-border",
        )}
      >
        <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        {value ? (
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Nota de hoje
            </span>
            <span className="mt-1 block whitespace-pre-line text-sm leading-relaxed line-clamp-3">{value}</span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Algo memorável hoje? Toque para anotar.</span>
        )}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold">Nota do dia</h2>
        <p className="mt-1 text-sm text-muted-foreground">Opcional. Uma conquista, um aprendizado, algo que valeu o dia.</p>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          rows={5}
          placeholder="Hoje eu..."
          className="mt-4 w-full resize-none rounded-2xl bg-muted p-4 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-foreground/10"
        />
        <p className="mt-1 text-right text-[11px] tabular-nums text-muted-foreground">{draft.length}/500</p>
        <div className="mt-3 flex flex-col gap-2 pb-2">
          <Button
            className="h-12 rounded-2xl text-base"
            onClick={() => {
              onSave(draft)
              setOpen(false)
            }}
          >
            Salvar nota
          </Button>
          {value && (
            <Button
              variant="ghost"
              className="h-12 rounded-2xl text-base text-muted-foreground"
              onClick={() => {
                onSave("")
                setOpen(false)
              }}
            >
              Apagar nota
            </Button>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
