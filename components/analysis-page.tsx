"use client"

import { useMemo, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { AppShell, PageHeader } from "@/components/app-shell"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { addDays, toDateKey } from "@/lib/dates"
import { anyHabitStreak, dayRate, habitRate, lastDays, rateOverDays, weekdayRates } from "@/lib/stats"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AnalysisPageProps {
  habits: Habit[]
  onBack?: () => void
}

const RANGES = [
  { days: 7, label: "7 dias" },
  { days: 30, label: "30 dias" },
  { days: 90, label: "90 dias" },
] as const

const trendConfig = { rate: { label: "Concluído", color: "var(--chart-2)" } } satisfies ChartConfig
const weekdayConfig = { rate: { label: "Média", color: "var(--chart-1)" } } satisfies ChartConfig

export function AnalysisPage({ habits }: AnalysisPageProps) {
  const [range, setRange] = useState<number>(30)
  const days = useMemo(() => lastDays(range), [range])

  // 7 dias: valor diário. 30/90: média móvel de 7 dias, para mostrar a tendência sem serrilhado.
  const smooth = range > 7
  const trend = useMemo(
    () =>
      days.map((d) => {
        const window = smooth ? lastDays(7, d) : [d]
        const rates = window.map((w) => dayRate(habits, toDateKey(w)) ?? 0)
        return {
          label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
          rate: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
        }
      }),
    [days, habits, smooth],
  )
  const weekdays = useMemo(() => weekdayRates(habits, Math.max(range, 28)), [habits, range])
  const best = weekdays.reduce((a, b) => (b.rate > a.rate ? b : a), weekdays[0])
  const periodRate = rateOverDays(habits, days)
  const streak = anyHabitStreak(habits)
  const ranking = [...habits]
    .map((h) => ({ habit: h, rate: habitRate(h, days) }))
    .sort((a, b) => b.rate - a.rate)

  return (
    <AppShell>
      <PageHeader subtitle="Seu progresso" title="Análise" />

      <div className="mb-5 grid grid-cols-3 rounded-2xl bg-neutral-100 p-1">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setRange(r.days)}
            className={cn(
              "pressable rounded-xl py-2 text-sm font-medium transition-all",
              range === r.days ? "bg-white text-foreground shadow-sm" : "text-neutral-500",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="rounded-3xl bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          Crie um hábito para ver seus gráficos aqui.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Concluído" value={`${periodRate}%`} />
            <Stat label="Sequência" value={String(streak)} hint={streak === 1 ? "dia" : "dias"} />
            <Stat label="Melhor dia" value={best.rate > 0 ? best.day : "—"} />
          </div>

          <ChartCard
            title="Tendência"
            description={smooth ? "Média móvel de 7 dias" : "% dos hábitos feitos por dia"}
          >
            <ChartContainer config={trendConfig} className="aspect-auto h-44 w-full">
              <AreaChart data={trend} margin={{ left: 0, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="fillRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                />
                <YAxis hide domain={[0, 100]} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent labelKey="label" formatter={(v) => `${v}%`} />}
                />
                <Area
                  dataKey="rate"
                  type="monotone"
                  stroke="var(--color-rate)"
                  strokeWidth={2.5}
                  fill="url(#fillRate)"
                  animationDuration={700}
                />
              </AreaChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Por dia da semana" description="Onde você é mais constante">
            <ChartContainer config={weekdayConfig} className="aspect-auto h-40 w-full">
              <BarChart data={weekdays} margin={{ left: 0, right: 0, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis hide domain={[0, 100]} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent labelKey="long" formatter={(v) => `${v}%`} />}
                />
                <Bar dataKey="rate" radius={8} animationDuration={600}>
                  {weekdays.map((d) => (
                    <Cell
                      key={d.day}
                      fill={d.day === best.day && best.rate > 0 ? "var(--chart-2)" : "var(--color-rate)"}
                      fillOpacity={d.day === best.day && best.rate > 0 ? 1 : 0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </ChartCard>

          <ChartCard title="Hábitos" description={`Taxa nos últimos ${range} dias`}>
            <ul className="space-y-3">
              {ranking.map(({ habit, rate }) => (
                <li key={habit.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{habit.name}</span>
                    <span className="font-mono tabular-nums text-neutral-500">{rate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-black transition-[width] duration-700 ease-out"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard title="Constância" description="Últimas 15 semanas">
            <Heatmap habits={habits} />
          </ChartCard>
        </div>
      )}
    </AppShell>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-3">
      <p className="text-[11px] font-medium text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-neutral-400">{hint}</span>}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 p-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mb-3 text-xs text-neutral-400">{description}</p>}
      {children}
    </section>
  )
}

/** Grade estilo GitHub: colunas = semanas, linhas = dias (dom a sáb). */
function Heatmap({ habits }: { habits: Habit[] }) {
  const weeks = 15
  const today = new Date()
  const start = addDays(today, -(weeks * 7 - 1) - (6 - today.getDay()))
  const todayKey = toDateKey(today)

  const level = (rate: number | null) => {
    if (!rate) return "bg-neutral-100"
    if (rate < 34) return "bg-green-200"
    if (rate < 67) return "bg-green-400"
    if (rate < 100) return "bg-green-500"
    return "bg-green-700"
  }

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const d = addDays(start, i)
          const key = toDateKey(d)
          const future = key > todayKey
          const rate = future ? null : dayRate(habits, key)
          return (
            <div
              key={key}
              title={`${d.toLocaleDateString("pt-BR")}: ${rate ?? 0}%`}
              className={cn("aspect-square rounded-[4px]", future ? "bg-transparent" : level(rate))}
            />
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-neutral-400">
        menos
        {["bg-neutral-100", "bg-green-200", "bg-green-400", "bg-green-500", "bg-green-700"].map((c) => (
          <span key={c} className={cn("h-2.5 w-2.5 rounded-[3px]", c)} />
        ))}
        mais
      </div>
    </div>
  )
}
