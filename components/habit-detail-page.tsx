"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Pencil, Trash2, X } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { AppShell, BottomSheet, IconButton, PageHeader } from "@/components/app-shell"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { addDays, toDateKey } from "@/lib/dates"
import { bestStreak, currentStreak, habitRate, lastDays, toggleDay } from "@/lib/stats"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

interface HabitDetailPageProps {
  habit: Habit
  onUpdate: (habit: Habit) => void
  onBack: () => void
  onDelete?: (id: string) => void
}

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
const WEEK = ["D", "S", "T", "Q", "Q", "S", "S"]
const weeklyConfig = { done: { label: "Dias feitos", color: "var(--chart-2)" } } satisfies ChartConfig

export function HabitDetailPage({ habit, onUpdate, onBack, onDelete }: HabitDetailPageProps) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(habit.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const todayKey = toDateKey(new Date())

  const weekly = useMemo(() => {
    const today = new Date()
    const thisSunday = addDays(today, -today.getDay())
    return Array.from({ length: 8 }, (_, i) => {
      const start = addDays(thisSunday, (i - 7) * 7)
      const done = Array.from({ length: 7 }, (_, j) => toDateKey(addDays(start, j))).filter(
        (k) => habit.completions[k] === true,
      ).length
      return { label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), done }
    })
  }, [habit.completions])

  const firstWeekday = month.getDay()
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth()

  const saveName = () => {
    const trimmed = name.trim()
    if (trimmed && trimmed !== habit.name) onUpdate({ ...habit, name: trimmed })
    else setName(habit.name)
    setEditing(false)
  }

  return (
    <AppShell nav={false}>
      <PageHeader
        subtitle="Hábito"
        title={
          editing ? (
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName()
                if (e.key === "Escape") {
                  setName(habit.name)
                  setEditing(false)
                }
              }}
              className="w-full border-b-2 border-black bg-transparent outline-none"
            />
          ) : (
            habit.name
          )
        }
        left={
          <IconButton aria-label="Voltar" onClick={onBack} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
        right={
          <>
            <IconButton aria-label="Renomear" onClick={() => setEditing(true)}>
              <Pencil className="h-[18px] w-[18px]" />
            </IconButton>
            {onDelete && (
              <IconButton aria-label="Excluir" onClick={() => setConfirmDelete(true)} className="text-red-500">
                <Trash2 className="h-[18px] w-[18px]" />
              </IconButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Sequência" value={currentStreak(habit)} unit="dias" />
        <Stat label="Recorde" value={bestStreak(habit)} unit="dias" />
        <Stat label="30 dias" value={habitRate(habit, lastDays(30))} unit="%" />
      </div>

      <section className="mt-4 rounded-3xl border border-neutral-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <IconButton
            aria-label="Mês anterior"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </IconButton>
          <h2 className="text-sm font-semibold">
            {MONTHS[month.getMonth()]} {month.getFullYear()}
          </h2>
          <IconButton
            aria-label="Próximo mês"
            disabled={isCurrentMonth}
            className="disabled:opacity-20"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {WEEK.map((d, i) => (
            <span key={i} className="pb-1 text-[11px] font-medium text-neutral-400">
              {d}
            </span>
          ))}
          {Array.from({ length: firstWeekday }, (_, i) => (
            <span key={`e${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const key = toDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1))
            const status = habit.completions[key]
            const future = key > todayKey
            return (
              <button
                key={key}
                type="button"
                disabled={future}
                onClick={() => {
                  try {
                    navigator.vibrate?.(8)
                  } catch {}
                  onUpdate(toggleDay(habit, key))
                }}
                aria-label={`Dia ${i + 1}`}
                className={cn(
                  "pressable relative flex aspect-square items-center justify-center rounded-full text-sm font-medium transition-colors disabled:opacity-25",
                  status === true && "bg-green-500 text-white",
                  status === false && "bg-red-500 text-white",
                  status === undefined && "hover:bg-neutral-100",
                  key === todayKey && status === undefined && "ring-2 ring-black",
                )}
              >
                {status === true ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : status === false ? (
                  <X className="h-4 w-4" strokeWidth={3} />
                ) : (
                  i + 1
                )}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold">Por semana</h2>
        <p className="mb-3 text-xs text-neutral-400">Dias feitos nas últimas 8 semanas</p>
        <ChartContainer config={weeklyConfig} className="aspect-auto h-40 w-full">
          <BarChart data={weekly} margin={{ left: 0, right: 0, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
            <YAxis hide domain={[0, 7]} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelKey="label" formatter={(v) => `${v} de 7`} />}
            />
            <Bar dataKey="done" fill="var(--color-done)" radius={8} animationDuration={600} />
          </BarChart>
        </ChartContainer>
      </section>

      <BottomSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <h2 className="text-lg font-semibold">Excluir &quot;{habit.name}&quot;?</h2>
        <p className="mt-1 text-sm text-neutral-500">Todo o histórico deste hábito será apagado.</p>
        <div className="mt-5 flex flex-col gap-2 pb-2">
          <Button
            className="h-12 rounded-2xl bg-red-600 text-base hover:bg-red-700"
            onClick={() => onDelete?.(habit.id)}
          >
            Excluir hábito
          </Button>
          <Button variant="ghost" className="h-12 rounded-2xl text-base" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
        </div>
      </BottomSheet>
    </AppShell>
  )
}

function Stat({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-3">
      <p className="text-[11px] font-medium text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value}
        <span className="ml-0.5 text-xs font-normal text-neutral-400">{unit}</span>
      </p>
    </div>
  )
}
