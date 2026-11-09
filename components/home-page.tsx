"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, ChevronRight, Flame, LogOut, Plus, X } from "lucide-react"
import { AppShell, IconButton, PageHeader } from "@/components/app-shell"
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
  const { habits, ready, updateHabit } = useHabits()
  const { user, enabled: authEnabled, logout } = useAuth()
  const today = new Date()
  const todayKey = toDateKey(today)
  const weekDays = useMemo(() => getWeekDays(), [])

  const doneToday = habits.filter((h) => h.completions[todayKey] === true).length
  const pct = habits.length ? Math.round((doneToday / habits.length) * 100) : 0
  const firstName = user?.displayName?.split(" ")[0]
  const dateLabel = today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

  const toggle = (habit: Habit, key: string) => {
    haptic()
    updateHabit(toggleDay(habit, key))
  }

  if (!ready) {
    return (
      <AppShell>
        <div className="space-y-4 pt-16">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-neutral-100" />
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
        right={
          <>
            <ReminderButton habits={habits} />
            {authEnabled && user && (
              <IconButton aria-label="Sair" onClick={() => logout()} className="text-neutral-400">
                <LogOut className="h-5 w-5" />
              </IconButton>
            )}
          </>
        }
      />

      {habits.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <TodaySummary pct={pct} done={doneToday} total={habits.length} />

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
          <p className="mt-6 text-center text-xs text-neutral-400">
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
    <section className="flex items-center gap-5 rounded-3xl bg-black p-5 text-white">
      <div className="relative h-[76px] w-[76px] shrink-0">
        <svg viewBox="0 0 76 76" className="h-full w-full -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
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
          <span className="text-white/40">/{total}</span>
        </p>
        <p className="text-sm text-white/60">{message}</p>
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
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Link href={`/habito/${habit.id}`} className="pressable -m-1 flex items-center gap-2 rounded-2xl p-1">
        <span className="min-w-0 flex-1 truncate text-base font-semibold">{habit.name}</span>
        {streak > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-600">
            <Flame className="h-3.5 w-3.5" />
            {streak}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-neutral-300" />
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
      <span className={cn("text-[11px] font-medium", isToday ? "text-foreground" : "text-neutral-400")}>{label}</span>
      <span
        key={bump}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-200",
          bump > 0 && "animate-pop",
          status === true && "bg-green-500 text-white",
          status === false && "bg-red-500 text-white",
          status === undefined && "bg-neutral-100 text-transparent",
          isToday && status === undefined && "ring-2 ring-black ring-offset-2",
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
    <section className="flex flex-col items-center px-4 pt-16 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
        <Plus className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold">Comece pequeno</h2>
      <p className="mt-2 max-w-xs text-sm text-neutral-500">
        Um hábito tão pequeno que seria ridículo não fazer. &quot;Ler 1 página&quot; vence &quot;ler mais&quot;.
      </p>
      <Link
        href="/novo"
        className="pressable mt-8 flex h-12 items-center gap-2 rounded-2xl bg-black px-6 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Criar primeiro hábito
      </Link>
    </section>
  )
}
