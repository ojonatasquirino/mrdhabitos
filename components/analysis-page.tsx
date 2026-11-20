"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, ReferenceLine, XAxis, YAxis } from "recharts"
import { Trash2 } from "lucide-react"
import { BottomSheet } from "@/components/ui-kit"
import { useHabits } from "@/hooks/use-habits"
import { DEFAULT_SLEEP_GOAL, formatDiff, formatHours } from "@/components/sleep"
import { AppShell, PageHeader } from "@/components/app-shell"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { toDateKey } from "@/lib/dates"
import { anyHabitStreak, dayRate, habitRate, lastDays, rateOverDays, weekdayRates } from "@/lib/stats"
import type { Habit } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AnalysisPageProps {
  habits: Habit[]
  notes?: Record<string, string>
  sleep?: Record<string, number>
  sleepGoal?: number
  onBack?: () => void
}

const RANGES = [
  { days: 7, label: "7 dias", desktopOnly: false },
  { days: 30, label: "30 dias", desktopOnly: false },
  { days: 90, label: "90 dias", desktopOnly: false },
  // só aparece no desktop, onde cabe o ano inteiro
  { days: 365, label: "1 ano", desktopOnly: true },
] as const

const trendConfig = { rate: { label: "Concluído", color: "var(--chart-2)" } } satisfies ChartConfig
const weekdayConfig = { rate: { label: "Média", color: "var(--chart-1)" } } satisfies ChartConfig

export function AnalysisPage({ habits, notes = {}, sleep = {}, sleepGoal }: AnalysisPageProps) {
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
      <PageHeader
        subtitle="Seu progresso"
        title="Análise"
        right={
          <Link href="/revisao" className="pressable rounded-full bg-muted px-3 py-1.5 text-xs font-semibold">
            Revisão
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-3 rounded-2xl bg-muted p-1 lg:mb-6 lg:w-[28rem] lg:grid-cols-4">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setRange(r.days)}
            className={cn(
              "pressable rounded-xl py-2 text-sm font-medium transition-all",
              range === r.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              r.desktopOnly && "hidden lg:block",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="rounded-3xl bg-muted/60 p-8 text-center text-sm text-muted-foreground">
          Crie um hábito para ver seus gráficos aqui.
        </div>
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
          <ChartCard
            className="lg:col-span-2"
            title="Constância"
            description={`${range === 365 ? "Último ano" : `Últimos ${range} dias`} · cada quadrado é um dia`}
          >
            <Heatmap habits={habits} days={days} />
          </ChartCard>

          <div className="grid grid-cols-3 gap-2 lg:col-span-2 lg:gap-5">
            <Stat label="Concluído" value={`${periodRate}%`} />
            <Stat label="Sequência" value={String(streak)} hint={streak === 1 ? "dia" : "dias"} />
            <Stat label="Melhor dia" value={best.rate > 0 ? best.day : "—"} />
          </div>

          <ChartCard
            className="lg:col-span-2"
            title="Tendência"
            description={smooth ? "Média móvel de 7 dias" : "% dos hábitos feitos por dia"}
          >
            <ChartContainer config={trendConfig} className="aspect-auto h-44 w-full lg:h-64">
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
            <ChartContainer config={weekdayConfig} className="aspect-auto h-40 w-full lg:h-56">
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
                    <span className="font-mono tabular-nums text-muted-foreground">{rate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-[width] duration-700 ease-out"
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>

          <SleepChart sleep={sleep} days={days} range={range} habits={habits} goal={sleepGoal ?? DEFAULT_SLEEP_GOAL} />

          <Journal notes={notes} />
        </div>
      )}
    </AppShell>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border p-3 lg:rounded-3xl lg:p-5">
      <p className="text-[11px] font-medium text-muted-foreground lg:text-xs">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums lg:text-3xl">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-muted-foreground">{hint}</span>}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 lg:p-6",
        className,
      )}
    >
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mb-3 text-xs text-muted-foreground">{description}</p>}
      {children}
    </section>
  )
}

/**
 * Estilo "commits do GitHub": um quadradinho por dia do período selecionado,
 * em ordem cronológica (esquerda para a direita), sem números.
 */
function Heatmap({ habits, days }: { habits: Habit[]; days: Date[] }) {
  const cols = days.length <= 7 ? 7 : 15
  // desktop: mais colunas para os quadradinhos ficarem pequenos como no GitHub
  const colsLg = days.length <= 7 ? 7 : days.length <= 90 ? 30 : 53
  const level = (rate: number | null) => {
    if (!rate) return "bg-muted"
    if (rate < 34) return "bg-green-200"
    if (rate < 67) return "bg-green-400"
    if (rate < 100) return "bg-green-500"
    return "bg-green-700"
  }

  return (
    <div>
      <div
        className={cn(
          "grid gap-[3px] [grid-template-columns:repeat(var(--cols),minmax(0,1fr))]",
          "lg:gap-1 lg:[grid-template-columns:repeat(var(--cols-lg),minmax(0,1fr))]",
          cols === 7 && "lg:max-w-xl",
        )}
        style={{ "--cols": cols, "--cols-lg": colsLg } as React.CSSProperties}
      >
        {days.map((d) => {
          const key = toDateKey(d)
          const rate = dayRate(habits, key)
          return (
            <div
              key={key}
              title={`${d.toLocaleDateString("pt-BR")}: ${rate ?? 0}%`}
              className={cn("aspect-square", cols === 7 ? "rounded-lg" : "rounded-[4px]", level(rate))}
            />
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground lg:text-xs">
        <span>
          {days[0]?.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")} → hoje
        </span>
        <span className="flex items-center gap-1">
          menos
          {["bg-muted", "bg-green-200", "bg-green-400", "bg-green-500", "bg-green-700"].map((c) => (
            <span key={c} className={cn("h-2.5 w-2.5 rounded-[3px]", c)} />
          ))}
          mais
        </span>
      </div>
    </div>
  )
}

function noteDate(key: string) {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}

function Journal({ notes }: { notes: Record<string, string> }) {
  const { setNote } = useHabits()
  const [all, setAll] = useState(false)
  const entries = Object.entries(notes).sort(([a], [b]) => (a < b ? 1 : -1))
  if (!entries.length) return null

  return (
    <ChartCard className="lg:col-span-2" title="Diário" description="Suas notas mais recentes">
      {entries.length > 3 && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="pressable -mt-9 mb-4 ml-auto block rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
        >
          Ver todas ({entries.length})
        </button>
      )}
      <ol className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
        {entries.slice(0, 3).map(([key, text]) => (
          <li key={key} className="border-l-2 border-border pl-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{noteDate(key)}</p>
            <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">{text}</p>
          </li>
        ))}
      </ol>

      <BottomSheet open={all} onClose={() => setAll(false)}>
        <h2 className="text-lg font-semibold">Todas as notas</h2>
        <p className="mt-1 text-sm text-muted-foreground">{entries.length} registros</p>
        <ol className="mb-2 mt-4 max-h-[60vh] space-y-3 overflow-y-auto">
          {entries.map(([key, text]) => (
            <li key={key} className="flex gap-3 rounded-2xl border border-border p-3">
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {noteDate(key)}
                </span>
                <span className="mt-0.5 block whitespace-pre-line text-sm leading-relaxed">{text}</span>
              </span>
              <button
                type="button"
                aria-label="Apagar nota"
                onClick={() => setNote(key, "")}
                className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ol>
      </BottomSheet>
    </ChartCard>
  )
}

const sleepConfig = {
  hours: { label: "Dormiu", color: "var(--chart-sleep)" },
  trend: { label: "Tendência", color: "var(--chart-sleep)" },
} satisfies ChartConfig

/** Barras de horas dormidas por noite, no período selecionado (estilo "sleep tracker"). */
function SleepChart({
  sleep,
  days,
  range,
  habits,
  goal,
}: {
  sleep: Record<string, number>
  days: Date[]
  range: number
  habits: Habit[]
  goal: number
}) {
  const data = days.map((d) => {
    // tendência: média das noites registradas nos últimos 7 dias
    const win = lastDays(7, d)
      .map((x) => sleep[toDateKey(x)])
      .filter((v): v is number => v != null)
    return {
      label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
      long: d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }),
      hours: sleep[toDateKey(d)] ?? null,
      trend: win.length ? Math.round((win.reduce((a, b) => a + b, 0) / win.length) * 100) / 100 : null,
    }
  })
  const logged = data.filter((d) => d.hours != null).map((d) => d.hours as number)
  const avg = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : 0
  const good = logged.filter((h) => h >= goal).length
  const balance = avg - goal

  // indicador de performance: hábitos cumpridos no dia seguinte a uma noite na meta vs abaixo dela
  const perf = (() => {
    const on: number[] = []
    const off: number[] = []
    days.forEach((d) => {
      const h = sleep[toDateKey(d)]
      const r = dayRate(habits, toDateKey(d))
      if (h == null || r == null) return
      ;(h >= goal ? on : off).push(r)
    })
    const mean = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null)
    return { on: mean(on), off: mean(off), onN: on.length, offN: off.length }
  })()

  return (
    <ChartCard className="lg:col-span-2" title="Sono" description="Horas dormidas por noite">
      {logged.length === 0 ? (
        <p className="rounded-2xl bg-muted/60 p-6 text-center text-sm text-muted-foreground">
          Registre seu sono na tela Hoje para ver o gráfico aqui.
        </p>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 lg:gap-5">
            <MiniStat label="Média por noite" value={formatHours(avg)} />
            <MiniStat label={`Na meta (${formatHours(goal)})`} value={`${good}/${logged.length}`} />
            <MiniStat
              label="Saldo médio"
              value={formatDiff(balance)}
              tone={balance >= 0 ? "good" : "warn"}
            />
          </div>
          <ChartContainer config={sleepConfig} className="aspect-auto h-52 w-full lg:h-72">
            <ComposedChart data={data} margin={{ left: 0, right: 4, top: 8 }} barCategoryGap={range > 30 ? 1 : "22%"}>
              <defs>
                <linearGradient id="fillSleep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-trend)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-trend)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={24}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                tickLine={false}
                axisLine={false}
                width={36}
                tickFormatter={(v) => `${v}h`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent labelKey="long" formatter={(v) => formatHours(Number(v))} />}
              />
              <Bar dataKey="hours" radius={[6, 6, 2, 2]} animationDuration={600}>
                {data.map((d) => (
                  <Cell
                    key={d.long}
                    fill={d.hours != null && d.hours < goal ? "#f59e0b" : "var(--color-hours)"}
                    fillOpacity={d.hours != null && d.hours < goal ? 0.55 : 0.65}
                  />
                ))}
              </Bar>
              <ReferenceLine
                y={goal}
                stroke="currentColor"
                strokeOpacity={0.55}
                strokeDasharray="5 5"
                label={{ value: `meta ${formatHours(goal)}`, position: "insideTopRight", fontSize: 11, fill: "currentColor" }}
              />
              <Area
                dataKey="trend"
                type="monotone"
                stroke="var(--color-trend)"
                strokeWidth={2}
                fill="url(#fillSleep)"
                connectNulls
                dot={false}
                animationDuration={800}
              />
            </ComposedChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[var(--chart-sleep)] opacity-60" />
              Na meta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-amber-500 opacity-70" />
              Abaixo da meta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-[var(--chart-sleep)]" />
              Tendência (7 dias)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t border-dashed border-foreground/60" />
              Meta
            </span>
          </div>

          {perf.on != null && perf.off != null && (
            <div className="mt-5 rounded-2xl border border-border p-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Sono e performance
              </p>
              <div className="mt-3 space-y-2.5">
                <PerfRow label="Dormindo na meta" value={perf.on} n={perf.onN} tone="good" />
                <PerfRow label="Abaixo da meta" value={perf.off} n={perf.offN} tone="warn" />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {perf.on > perf.off
                  ? `Depois de noites com ${formatHours(goal)} ou mais, você cumpriu ${perf.on}% dos hábitos, contra ${perf.off}% quando dormiu menos.`
                  : perf.on < perf.off
                    ? "No período, dormir menos não derrubou seus hábitos. Vale observar por mais tempo."
                    : "No período, o sono não mudou o quanto você cumpriu os hábitos."}
              </p>
            </div>
          )}
        </>
      )}
    </ChartCard>
  )
}

function PerfRow({ label, value, n, tone }: { label: string; value: number; n: number; tone: "good" | "warn" }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          {label} <span className="text-muted-foreground">· {n} {n === 1 ? "noite" : "noites"}</span>
        </span>
        <span className="font-semibold tabular-nums">{value}% dos hábitos</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", tone === "good" ? "bg-[var(--chart-sleep)]" : "bg-amber-500")}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-lg font-semibold tabular-nums",
          tone === "good" && "text-green-600 dark:text-green-500",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
    </div>
  )
}
