"use client"

import { useEffect, useRef } from "react"
import { BookOpen } from "lucide-react"
import { useHabits } from "@/hooks/use-habits"

/* ------------------------------------------------------------------ */
/* Aviso do ritmo automático                                           */
/* ------------------------------------------------------------------ */

export function PaceToast() {
  const { paceNotice, dismissPace, undoPace } = useHabits()
  useEffectOnce(paceNotice?.stamp, dismissPace)
  if (!paceNotice) return null
  const up = paceNotice.to > paceNotice.from
  return (
    <div
      key={paceNotice.stamp}
      role="status"
      className="fixed inset-x-0 top-3 z-[60] mx-auto w-full max-w-md px-4 animate-in fade-in slide-in-from-top-3 duration-300 sm:absolute lg:left-auto lg:right-8 lg:top-6 lg:mx-0"
    >
      <div className="glass flex items-center gap-3 rounded-3xl p-3 pl-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-medium text-muted-foreground">{paceNotice.name}</span>
          <span className="block text-sm font-semibold leading-snug">
            {up ? "Prazo apertou" : "Você adiantou"}: hábito ajustado para {paceNotice.to} páginas
          </span>
        </span>
        <button
          type="button"
          onClick={undoPace}
          className="pressable shrink-0 rounded-full bg-muted px-3 py-2 text-xs font-semibold"
        >
          Desfazer
        </button>
      </div>
    </div>
  )
}

/** Fecha o aviso sozinho alguns segundos depois de aparecer. */
function useEffectOnce(stamp: number | undefined, close: () => void) {
  const ref = useRef(close)
  ref.current = close
  useEffect(() => {
    if (!stamp) return
    const t = window.setTimeout(() => ref.current(), 8000)
    return () => window.clearTimeout(t)
  }, [stamp])
}
