"use client"

import { useState } from "react"
import { Bell, BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomSheet, IconButton } from "@/components/app-shell"
import { useReminder } from "@/hooks/use-reminder"
import type { Habit } from "@/lib/types"

export function ReminderButton({ habits }: { habits: Habit[] }) {
  const { settings, permission, enable, disable } = useReminder(habits)
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(settings.time)
  const [msg, setMsg] = useState("")

  if (permission === "unsupported") return null
  const active = settings.enabled && permission === "granted"

  return (
    <>
      <IconButton
        aria-label={active ? `Lembrete às ${settings.time}` : "Configurar lembrete"}
        onClick={() => {
          setTime(settings.time)
          setMsg("")
          setOpen(true)
        }}
        className={active ? "text-foreground" : "text-neutral-400"}
      >
        {active ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
      </IconButton>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold">Lembrete diário</h2>
        <p className="mt-1 text-sm text-neutral-500">Um aviso no horário, só se ainda houver hábito sem marcar.</p>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-5 w-full rounded-2xl bg-neutral-100 px-4 py-4 text-center text-3xl font-semibold tabular-nums outline-none focus:ring-2 focus:ring-black/10"
        />

        {permission === "denied" && (
          <p className="mt-3 text-sm text-red-600">Notificações bloqueadas. Libere nas configurações do navegador.</p>
        )}
        {msg && <p className="mt-3 text-sm text-neutral-500">{msg}</p>}

        <div className="mt-5 flex flex-col gap-2 pb-2">
          <Button
            className="h-12 rounded-2xl text-base"
            onClick={async () => {
              const ok = await enable(time)
              if (ok) setOpen(false)
              else setMsg("Permissão de notificação não concedida.")
            }}
          >
            {active ? "Salvar horário" : "Ativar lembrete"}
          </Button>
          {active && (
            <Button
              variant="ghost"
              className="h-12 rounded-2xl text-base text-neutral-500"
              onClick={() => {
                disable()
                setOpen(false)
              }}
            >
              Desligar
            </Button>
          )}
        </div>
      </BottomSheet>
    </>
  )
}
