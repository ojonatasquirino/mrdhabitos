"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { useHabits } from "@/hooks/use-habits"

/** Aviso do ritmo automático da leitura, no padrão de toasts do app (Sonner), com Desfazer. */
export function PaceToast() {
  const { paceNotice, dismissPace, undoPace } = useHabits()
  useEffect(() => {
    if (!paceNotice) return
    const up = paceNotice.to > paceNotice.from
    toast.success(`${up ? "Prazo apertou" : "Você adiantou"}: hábito ajustado para ${paceNotice.to} páginas`, {
      id: "pace",
      description: paceNotice.name,
      duration: 8000,
      action: { label: "Desfazer", onClick: undoPace },
      onAutoClose: dismissPace,
      onDismiss: dismissPace,
    })
  }, [paceNotice, dismissPace, undoPace])
  return null
}
