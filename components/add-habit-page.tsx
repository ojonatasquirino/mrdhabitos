"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { AppShell, IconButton, PageHeader } from "@/components/app-shell"

interface AddHabitPageProps {
  onAdd: (name: string) => void
  onCancel: () => void
}

const SUGGESTIONS = ["Ler 1 página", "Beber 1 copo de água", "1 flexão", "Orar 2 minutos", "Escrever 1 frase"]

export function AddHabitPage({ onAdd, onCancel }: AddHabitPageProps) {
  const [name, setName] = useState("")
  const valid = name.trim().length > 0

  return (
    <AppShell nav={false}>
      <PageHeader
        subtitle="Novo hábito"
        title="O que é ridículo de fácil?"
        left={
          <IconButton aria-label="Voltar" onClick={onCancel} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onAdd(name.trim())
        }}
      >
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ler 1 página"
          maxLength={60}
          className="w-full border-b-2 border-border bg-transparent pb-3 text-2xl font-semibold outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-foreground"
        />

        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">Sugestões</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setName(s)}
              className="pressable rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground/80 hover:bg-muted/70"
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mt-8 rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
          Seja específico e comece pequeno. A consistência supera a intensidade.
        </p>

        <div className="safe-bottom fixed inset-x-0 bottom-0 mx-auto w-full max-w-md px-5 sm:absolute">
          <button
            type="submit"
            disabled={!valid}
            className="pressable h-14 w-full rounded-2xl bg-foreground text-base font-semibold text-background disabled:bg-muted disabled:text-muted-foreground"
          >
            Criar hábito
          </button>
        </div>
      </form>
    </AppShell>
  )
}
