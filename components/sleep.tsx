"use client"

import { useEffect, useState } from "react"
import { BedDouble, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomSheet } from "@/components/ui-kit"
import { addDays, toDateKey } from "@/lib/dates"
import { cn } from "@/lib/utils"

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
            <span className="block text-xl font-semibold tabular-nums">{formatHours(value)}</span>
          ) : (
            <span className="block text-sm text-muted-foreground">Quanto você dormiu? Toque para registrar.</span>
          )}
        </span>
        <span className="flex h-9 items-end gap-[3px]" aria-hidden="true">
          {week.map((h, i) => (
            <span
              key={i}
              className={cn("w-1.5 rounded-full", h ? "bg-indigo-400" : "bg-muted")}
              style={{ height: `${Math.max(12, (h / max) * 100)}%` }}
            />
          ))}
        </span>
      </button>

      <SleepSheet
        open={open}
        initial={value}
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
  onClose,
  onSave,
}: {
  open: boolean
  initial?: number
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
        <span className="text-5xl font-semibold tabular-nums tracking-tight">{formatHours(h)}</span>
        <button
          type="button"
          aria-label="Mais 15 minutos"
          onClick={() => step(0.25)}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={14}
        step={0.25}
        value={h}
        onChange={(e) => setH(Number(e.target.value))}
        aria-label="Horas de sono"
        className="mt-4 w-full accent-indigo-500"
      />

      <div className="mt-3 flex justify-between gap-2">
        {[5, 6, 7, 8, 9].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setH(v)}
            className={cn(
              "pressable flex-1 rounded-full py-2 text-sm font-medium",
              h === v ? "bg-foreground text-background" : "bg-muted text-foreground/80",
            )}
          >
            {v}h
          </button>
        ))}
      </div>

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

      <div className="h-2" />
    </BottomSheet>
  )
}
