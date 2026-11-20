"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BedDouble, Check, Flag, Flame, Sparkles, TrendingDown, X } from "lucide-react"
import { useHabits } from "@/hooks/use-habits"
import { DEFAULT_SLEEP_GOAL, formatDiff, formatHours } from "@/components/sleep"
import { PACE_META, projectPace } from "@/lib/projects"
import { addDays, toDateKey } from "@/lib/dates"
import { buildReview } from "@/lib/review"
import { cn } from "@/lib/utils"

const dotColor = (r: number | null, future: boolean) =>
  future || r == null
    ? "bg-muted"
    : r === 0
      ? "bg-muted-foreground/25"
      : r < 34
        ? "bg-green-200"
        : r < 67
          ? "bg-green-400"
          : r < 100
            ? "bg-green-500"
            : "bg-green-700"

function headline(pct: number) {
  if (pct >= 90) return "Semana impecável. Ridículo de bom."
  if (pct >= 70) return "Semana sólida. A constância está vencendo."
  if (pct >= 40) return "Semana irregular, mas você apareceu."
  return "Semana difícil. O mínimo ainda está grande demais?"
}

/** Revisão de sábado: 5 telas curtas no estilo Stories. */
export function WeeklyReview({ weekKey }: { weekKey: string }) {
  const router = useRouter()
  const { habits, sleep, profile, setProfile, projects, notes, setNote } = useHabits()
  const goal = profile.sleepGoal ?? DEFAULT_SLEEP_GOAL
  const r = useMemo(() => buildReview(weekKey, habits, sleep, goal, projects), [weekKey, habits, sleep, goal, projects])
  const [focus, setFocus] = useState("")
  const nextWeek = toDateKey(addDays(new Date(weekKey + "T12:00"), 7))
  const prevFocus = profile.weekFocus?.week === weekKey ? profile.weekFocus.text : null

  const screens = ["semana", "habitos", ...(r.sleep ? ["sono"] : []), ...(r.projects.length ? ["projetos"] : []), "foco"]
  const [i, setI] = useState(0)
  const touchX = useRef<number | null>(null)
  const last = i === screens.length - 1
  const next = () => setI((v) => Math.min(v + 1, screens.length - 1))
  const prev = () => setI((v) => Math.max(v - 1, 0))

  const close = (save: boolean) => {
    if (save) {
      setProfile({
        ...profile,
        lastReview: weekKey,
        weekFocus: focus.trim() ? { week: nextWeek, text: focus.trim() } : profile.weekFocus,
      })
      const satKey = toDateKey(addDays(new Date(weekKey + "T12:00"), 6))
      const line = `Revisão da semana: ${r.pct}% de constância${focus.trim() ? ` · Foco: ${focus.trim()}` : ""}`
      setNote(satKey, [notes[satKey], line].filter(Boolean).join("\n"))
    }
    router.push("/")
  }

  const screen = screens[i]
  const diff = r.prevPct == null ? null : r.pct - r.prevPct

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center bg-background"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx < -50) next()
        if (dx > 50) prev()
        touchX.current = null
      }}
    >
      <div className="safe-top safe-bottom flex w-full max-w-md flex-col px-6">
        {/* barras de progresso estilo Stories */}
        <div className="flex gap-1.5 pt-3">
          {screens.map((s, n) => (
            <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn("block h-full rounded-full bg-foreground transition-all duration-500", n <= i ? "w-full" : "w-0")}
              />
            </span>
          ))}
        </div>
        <div className="flex h-12 items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revisão da semana</span>
          <button type="button" aria-label="Fechar" onClick={() => close(false)} className="-mr-2 p-2 text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div key={screen} className="flex flex-1 flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
          {screen === "semana" && (
            <>
              <p className="text-sm text-muted-foreground">Sua constância</p>
              <p className="text-8xl font-semibold tracking-tight tabular-nums">{r.pct}%</p>
              {diff != null && (
                <p className={cn("mt-1 text-sm font-semibold", diff >= 0 ? "text-green-600" : "text-amber-600")}>
                  {diff >= 0 ? "+" : ""}
                  {diff}% vs semana passada
                </p>
              )}
              <div className="mt-8 grid grid-cols-7 gap-2">
                {r.days.map((d) => (
                  <span key={d.key} className="flex flex-col items-center gap-2">
                    <span className={cn("aspect-square w-full rounded-xl", dotColor(d.rate, d.future))} />
                    <span className="text-[11px] font-medium text-muted-foreground">{d.label}</span>
                  </span>
                ))}
              </div>
              <p className="mt-8 text-xl font-semibold leading-snug text-balance">{headline(r.pct)}</p>
              {prevFocus && (
                <p className="mt-4 rounded-2xl bg-muted/70 p-4 text-sm">
                  Seu foco desta semana era: <b>{prevFocus}</b>
                </p>
              )}
            </>
          )}

          {screen === "habitos" && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">Seus hábitos</h2>
              {r.best && (
                <div className="mt-6 rounded-3xl border border-border p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-green-600">
                    <Sparkles className="h-3.5 w-3.5" /> Mais forte
                  </p>
                  <p className="mt-1 text-lg font-semibold">{r.best.habit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.best.done} de {r.best.total} dias
                  </p>
                </div>
              )}
              {r.worst && (
                <div className="mt-3 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-amber-600">
                    <TrendingDown className="h-3.5 w-3.5" /> Escorregou
                  </p>
                  <p className="mt-1 text-lg font-semibold">{r.worst.habit.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.worst.done} de {r.worst.total} dias. Se não está saindo, o mínimo está grande demais.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={next} className="pressable h-10 flex-1 rounded-xl bg-muted text-sm font-semibold">
                      Manter igual
                    </button>
                    <Link
                      href={`/habito/${r.worst.habit.id}`}
                      className="pressable flex h-10 flex-1 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background"
                    >
                      Diminuir o mínimo
                    </Link>
                  </div>
                </div>
              )}
              {r.streak && (
                <p className="mt-4 flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Maior sequência: <b>{r.streak.habit.name}</b> · {r.streak.days} dias
                </p>
              )}
            </>
          )}

          {screen === "sono" && r.sleep && (
            <>
              <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                <BedDouble className="h-6 w-6 text-indigo-500" /> Seu sono
              </h2>
              <p className="mt-6 text-6xl font-semibold tabular-nums">{formatHours(r.sleep.avg)}</p>
              <p
                className={cn(
                  "mt-1 text-sm font-semibold",
                  r.sleep.avg >= goal ? "text-green-600" : "text-amber-600",
                )}
              >
                média por noite · meta {formatHours(goal)} · {formatDiff(r.sleep.avg - goal)}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                {r.sleep.onGoal} de {r.sleep.nights} noites na meta
              </p>
              {r.sleep.perfOn != null && r.sleep.perfOff != null && (
                <div className="mt-6 space-y-3 rounded-3xl border border-border p-5">
                  <Bar label="Depois de dormir bem" value={r.sleep.perfOn} good />
                  <Bar label="Depois de dormir pouco" value={r.sleep.perfOff} />
                  <p className="text-xs text-muted-foreground">Percentual dos hábitos cumpridos no dia.</p>
                </div>
              )}
            </>
          )}

          {screen === "projetos" && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight">Seus projetos</h2>
              <div className="mt-6 space-y-3">
                {r.projects.map(({ project: p, pages, pct }) => {
                  const pace = PACE_META[projectPace(p)]
                  return (
                    <div key={p.id} className="rounded-3xl border border-border p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex items-center gap-2 font-semibold">
                          <Flag className="h-4 w-4 shrink-0" />
                          {p.name}
                        </p>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", pace.className)}>
                          {pace.label}
                        </span>
                      </div>
                      <p className="mt-3 text-3xl font-semibold tabular-nums">{pct}%</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-foreground" style={{ width: `${pct}%` }} />
                      </div>
                      {p.kind === "leitura" && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {pages ? `+${pages} páginas nesta semana` : "Nenhuma página nesta semana"}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {screen === "foco" && (
            <>
              <h2 className="text-2xl font-semibold tracking-tight text-balance">Qual o seu foco da próxima semana?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Uma frase. Ela aparece no topo da tela Hoje durante a semana.
              </p>
              <input
                autoFocus
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                maxLength={80}
                placeholder="Ex: Treinar mesmo cansado"
                className="mt-6 w-full border-b-2 border-border bg-transparent pb-3 text-xl font-semibold outline-none placeholder:text-muted-foreground/50 focus:border-foreground"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {["Não zerar nenhum dia", "Dormir na meta", "Ler todos os dias"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFocus(s)}
                    className="pressable rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-foreground/80"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pb-4 pt-4">
          {i > 0 && (
            <button type="button" onClick={prev} className="pressable h-14 rounded-2xl px-5 font-semibold text-muted-foreground">
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={() => (last ? close(true) : next())}
            className="pressable flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground text-base font-semibold text-background"
          >
            {last ? (
              <>
                <Check className="h-5 w-5" /> Fechar semana
              </>
            ) : (
              "Próximo"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function Bar({ label, value, good }: { label: string; value: number; good?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <b className="tabular-nums">{value}%</b>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", good ? "bg-indigo-500" : "bg-amber-500")} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
