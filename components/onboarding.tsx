"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Bell, Check, Flame, NotebookPen, Share, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = true | false | undefined

interface Step {
  title: string
  body: React.ReactNode
  visual: React.ReactNode
}

/**
 * Introdução em passos, mostrada no primeiro acesso.
 * Um conceito por tela; "Pular" sempre visível; deslizar ou setas para navegar.
 */
export function Onboarding({
  open,
  onClose,
  onFinish,
  finishLabel = "Criar meu primeiro hábito",
}: {
  finishLabel?: string
  open: boolean
  /** pulou ou fechou */
  onClose: () => void
  /** tocou no botão final */
  onFinish: () => void
}) {
  const [i, setI] = useState(0)
  const [mounted, setMounted] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (open) setI(0)
  }, [open])

  const steps: Step[] = [
    {
      title: "Pequeno todo dia vence grande de vez em quando",
      body: "O MRD te ajuda a manter hábitos tão pequenos que seria ridículo não fazer. É o que você consegue cumprir no pior dia que constrói quem você é.",
      visual: <LogoVisual />,
    },
    {
      title: "Pequeno demais para falhar",
      body: "Se começar exige coragem, o hábito está grande demais. Escreva a menor versão que ainda conta e tenha de 5 a 10 hábitos.",
      visual: <SizeVisual />,
    },
    {
      title: "Marque com um toque",
      body: (
        <>
          Um toque: <b className="text-green-600 dark:text-green-500">feito</b>. Dois:{" "}
          <b className="text-red-500">não feito</b>. Três: limpa. Experimente aqui em cima.
        </>
      ),
      visual: <TapVisual />,
    },
    {
      title: "Nunca zere o dia",
      body: "Num dia ruim, faça só o mínimo e sua sequência continua. Se quiser, anote algo memorável do dia.",
      visual: <StreakVisual />,
    },
    {
      title: "Veja sua constância",
      body: "Na Análise, cada quadrado é um dia. Quanto mais verde, mais hábitos você cumpriu.",
      visual: <HeatVisual />,
    },
    {
      title: "Deixe tudo no jeito",
      body: "Adicione o MRD à tela de início e ative o lembrete diário no sino. O guia completo fica no seu Perfil.",
      visual: <SetupVisual />,
    },
  ]

  const last = i === steps.length - 1
  const next = () => (last ? onFinish() : setI((v) => Math.min(v + 1, steps.length - 1)))
  const prev = () => setI((v) => Math.max(v - 1, 0))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (!open || !mounted) return null
  const step = steps[i]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Introdução ao MRD"
      className="fixed inset-0 z-[70] flex items-stretch justify-center bg-background animate-in fade-in duration-300 lg:items-center lg:bg-black/50 lg:p-6"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx < -50) next()
        if (dx > 50) prev()
        touchX.current = null
      }}
    >
      <div className="safe-top safe-bottom flex w-full max-w-md flex-col bg-background px-6 lg:max-h-[46rem] lg:rounded-[2rem] lg:border lg:border-border lg:py-8 lg:shadow-2xl">
        <div className="flex h-9 items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Passo ${i + 1} de ${steps.length}`}>
            {steps.map((_, n) => (
              <span
                key={n}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  n === i ? "w-6 bg-foreground" : n < i ? "w-1.5 bg-foreground/60" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          {!last && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Pular
            </button>
          )}
        </div>

        <div key={i} className="flex flex-1 flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex h-60 items-center justify-center">{step.visual}</div>
          <h2 className="mt-8 text-2xl font-semibold leading-tight tracking-tight text-balance">{step.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{step.body}</p>
        </div>

        <div className="flex items-center gap-3 pb-2 pt-6">
          {i > 0 && (
            <button
              type="button"
              onClick={prev}
              className="pressable h-14 rounded-2xl px-5 text-base font-semibold text-muted-foreground hover:bg-muted"
            >
              Voltar
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="pressable h-14 flex-1 rounded-2xl bg-foreground text-base font-semibold text-background"
          >
            {last ? finishLabel : i === 0 ? "Começar" : "Próximo"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ---------- ilustrações de cada passo ---------- */

function LogoVisual() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.webp?v=2"
      alt=""
      className="h-40 w-40 rounded-[2.5rem] shadow-2xl shadow-black/30 animate-in zoom-in-90 duration-500"
    />
  )
}

function SizeVisual() {
  return (
    <div className="w-full max-w-xs space-y-3">
      {[
        ["Ler 30 páginas", false],
        ["Ler 1 página", true],
        ["Treinar 1 hora", false],
        ["Fazer 1 flexão", true],
      ].map(([label, ok], n) => (
        <div
          key={String(label)}
          className={cn(
            "flex items-center gap-3 rounded-2xl border px-4 py-3 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-500",
            ok ? "border-green-500/40 bg-green-500/10" : "border-border opacity-60",
          )}
          style={{ animationDelay: `${n * 90}ms` }}
        >
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-white",
              ok ? "bg-green-500" : "bg-red-500",
            )}
          >
            {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
          </span>
          <span className={cn("text-sm font-medium", !ok && "line-through")}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function TapVisual() {
  const [days, setDays] = useState<Status[]>([true, true, false, true, undefined, undefined, undefined])
  const labels = ["D", "S", "T", "Q", "Q", "S", "S"]
  const cycle = (s: Status): Status => (s === undefined ? true : s === true ? false : undefined)

  return (
    <div className="w-full max-w-xs rounded-3xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-3 text-base font-semibold">Ler 1 página</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((s, n) => (
          <button
            key={n}
            type="button"
            onClick={() => setDays((d) => d.map((v, k) => (k === n ? cycle(v) : v)))}
            className="flex flex-col items-center gap-1.5"
            aria-label={`Dia ${labels[n]}`}
          >
            <span className={cn("text-[11px] font-medium", n === 4 ? "text-foreground" : "text-muted-foreground")}>
              {labels[n]}
            </span>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                s === true && "bg-green-500 text-white",
                s === false && "bg-red-500 text-white",
                s === undefined && "bg-muted",
                n === 4 && s === undefined && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
            >
              {s === true && <Check className="h-4 w-4" strokeWidth={3} />}
              {s === false && <X className="h-4 w-4" strokeWidth={3} />}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted-foreground">toque nas bolinhas</p>
    </div>
  )
}

function StreakVisual() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div className="flex items-center justify-between rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
        <span className="text-base font-semibold">Orar 2 minutos</span>
        <span className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-sm font-semibold text-orange-600">
          <Flame className="h-4 w-4" />
          12
        </span>
      </div>
      <div className="flex items-start gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-sm">
        <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Nota de hoje
          </span>
          <span className="mt-1 block text-sm">Dia corrido, mas não zerei.</span>
        </span>
      </div>
    </div>
  )
}

function HeatVisual() {
  const levels = ["bg-muted", "bg-green-200", "bg-green-400", "bg-green-500", "bg-green-700"]
  // padrão fixo que "esquenta" ao longo do tempo
  const pattern = [0, 1, 0, 2, 1, 0, 2, 1, 2, 3, 0, 2, 3, 2, 3, 3, 1, 3, 4, 3, 2, 3, 4, 4, 3, 4, 2, 4, 4, 4]
  return (
    <div className="grid w-full max-w-xs grid-cols-10 gap-1">
      {pattern.map((l, n) => (
        <span
          key={n}
          className={cn("aspect-square rounded-[4px] animate-in zoom-in-50 fill-mode-both duration-300", levels[l])}
          style={{ animationDelay: `${n * 25}ms` }}
        />
      ))}
    </div>
  )
}

function SetupVisual() {
  return (
    <div className="grid w-full max-w-xs grid-cols-2 gap-3">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Share className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium leading-snug">
          Compartilhar
          <br />
          &gt; Tela de Início
        </span>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Bell className="h-5 w-5" />
        </span>
        <span className="text-xs font-medium leading-snug">
          Sino
          <br />
          &gt; Calendário
        </span>
      </div>
    </div>
  )
}
