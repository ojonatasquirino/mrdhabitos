"use client"

import { useEffect, useState } from "react"
import { BedDouble, Minus, Plus, Target } from "lucide-react"
import { useHabits } from "@/hooks/use-habits"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { BottomSheet } from "@/components/ui-kit"
import { addDays, toDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

export const DEFAULT_SLEEP_GOAL = 7

/** "+0h30" / "−0h45" em relação à meta */
export function formatDiff(h: number): string {
  const sign = h >= 0 ? "+" : "−"
  return sign + formatHours(Math.abs(h)).replace(/^(\d+)h$/, "$1h00")
}

export function formatHours(h: number): string {
  const total = Math.round(h * 60)
  const hh = Math.floor(total / 60)
  const mm = total % 60
  return mm ? `${hh}h${String(mm).padStart(2, "0")}` : `${hh}h`
}

/** Card da tela Hoje: sono da noite passada + mini gráfico da semana. */
export function SleepCard({
  sleep,
  onSave,
}: {
  sleep: Record<string, number>
  onSave: (key: string, hours: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const { profile, setProfile } = useHabits()
  const goal = profile.sleepGoal ?? DEFAULT_SLEEP_GOAL
  const today = new Date()
  const todayKey = toDateKey(today)
  const value = sleep[todayKey]
  const week = Array.from({ length: 7 }, (_, i) => sleep[toDateKey(addDays(today, i - 6))] ?? 0)
  const max = Math.max(9, ...week)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pressable mt-3 flex w-full items-center gap-4 rounded-3xl border border-border bg-card px-5 py-4 text-left"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
          <BedDouble className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Sono desta noite
          </span>
          {value ? (
            <span className="flex items-baseline gap-2">
              <span className="text-xl font-semibold tabular-nums">{formatHours(value)}</span>
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  value >= goal ? "text-green-600 dark:text-green-500" : "text-amber-600 dark:text-amber-400",
                )}
              >
                {value >= goal ? "na meta ✓" : `${formatDiff(value - goal)} da meta`}
              </span>
            </span>
          ) : (
            <span className="block text-sm text-muted-foreground">Quanto você dormiu? Toque para registrar.</span>
          )}
        </span>
        <span className="relative flex h-9 items-end gap-[3px]" aria-hidden="true">
          {/* linha da meta */}
          <span
            className="absolute inset-x-[-2px] border-t border-dashed border-foreground/30"
            style={{ bottom: `${(goal / max) * 100}%` }}
          />
          {week.map((h, i) => (
            <span
              key={i}
              className={cn("w-1.5 rounded-full", !h ? "bg-muted" : h >= goal ? "bg-indigo-500" : "bg-amber-400")}
              style={{ height: `${Math.max(12, (h / max) * 100)}%` }}
            />
          ))}
        </span>
      </button>

      <SleepSheet
        open={open}
        initial={value}
        goal={goal}
        onGoal={(g) => setProfile({ ...profile, sleepGoal: g })}
        onClose={() => setOpen(false)}
        onSave={(h) => {
          onSave(todayKey, h)
          setOpen(false)
        }}
      />
    </>
  )
}

function SleepSheet({
  open,
  initial,
  goal,
  onGoal,
  onClose,
  onSave,
}: {
  open: boolean
  initial?: number
  goal: number
  onGoal: (hours: number) => void
  onClose: () => void
  onSave: (hours: number | null) => void
}) {
  const [h, setH] = useState(initial ?? 7.5)
  useEffect(() => {
    if (open) setH(initial ?? 7.5)
  }, [open, initial])
  const step = (d: number) => setH((v) => Math.min(14, Math.max(0, Math.round((v + d) * 4) / 4)))

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold">Sono desta noite</h2>
      <p className="mt-1 text-sm text-muted-foreground">Quanto tempo você dormiu de ontem para hoje?</p>

      <div className="mt-5 flex items-center justify-between rounded-3xl bg-muted px-3 py-5">
        <button
          type="button"
          aria-label="Menos 15 minutos"
          onClick={() => step(-0.25)}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <Minus className="h-5 w-5" />
        </button>
        <span className="flex flex-col items-center">
          <span className="text-5xl font-semibold tabular-nums tracking-tight">{formatHours(h)}</span>
          <span
            className={cn(
              "mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              h >= goal
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            )}
          >
            {h >= goal ? `Na meta${h > goal ? ` · ${formatDiff(h - goal)}` : ""}` : `${formatDiff(h - goal)} da meta`}
          </span>
        </span>
        <button
          type="button"
          aria-label="Mais 15 minutos"
          onClick={() => step(0.25)}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <Slider
        min={0}
        max={14}
        step={0.25}
        value={[h]}
        onValueChange={([v]) => setH(v)}
        aria-label="Horas de sono"
        className="mt-6"
      />

      <ToggleGroup
        type="single"
        variant="outline"
        value={Number.isInteger(h) && h >= 5 && h <= 9 ? String(h) : ""}
        onValueChange={(v) => v && setH(Number(v))}
        className="mt-4 w-full"
      >
        {[5, 6, 7, 8, 9].map((v) => (
          <ToggleGroupItem
            key={v}
            value={String(v)}
            className="flex-1 font-medium data-[state=on]:bg-foreground data-[state=on]:text-background"
          >
            {v}h
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="mt-5 flex flex-col gap-2">
        <Button className="h-12 rounded-2xl text-base" onClick={() => onSave(h)}>
          Salvar
        </Button>
        {initial != null && (
          <Button variant="ghost" className="h-11 rounded-2xl text-muted-foreground" onClick={() => onSave(null)}>
            Apagar registro de hoje
          </Button>
        )}
      </div>

      <div className="mb-2 mt-5 flex items-center gap-3 rounded-2xl border border-border p-3 pl-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
          <Target className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Meta por noite</span>
          <span className="block text-[11px] text-muted-foreground">Adultos: 7 a 9 horas</span>
        </span>
        <button
          type="button"
          aria-label="Diminuir meta"
          onClick={() => onGoal(Math.max(4, goal - 0.5))}
          className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-base font-semibold tabular-nums">{formatHours(goal)}</span>
        <button
          type="button"
          aria-label="Aumentar meta"
          onClick={() => onGoal(Math.min(12, goal + 0.5))}
          className="pressable flex h-8 w-8 items-center justify-center rounded-full bg-muted"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </BottomSheet>
  )
}
