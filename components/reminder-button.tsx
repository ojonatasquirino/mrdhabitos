"use client"

import { useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="relative flex-1 sm:flex-none">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setTime(settings.time)
          setMsg("")
          setOpen(!open)
        }}
        aria-label="Lembrete diário"
        className="shadow-sm w-full min-h-[44px]"
      >
        {active ? <Bell className="w-4 h-4 sm:mr-2" /> : <BellOff className="w-4 h-4 sm:mr-2" />}
        <span className="hidden sm:inline">{active ? settings.time : "Lembrete"}</span>
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border bg-card p-4 shadow-lg space-y-3">
          <p className="text-sm font-medium">Lembrete diário</p>
          <p className="text-xs text-muted-foreground">Aviso no horário se ainda houver hábito não marcado.</p>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {permission === "denied" && (
            <p className="text-xs text-red-500">Notificações bloqueadas. Libere nas configurações do navegador.</p>
          )}
          {msg && <p className="text-xs text-muted-foreground">{msg}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={async () => {
                const ok = await enable(time)
                setMsg(ok ? `Ativado para ${time}.` : "Permissão não concedida.")
                if (ok) setOpen(false)
              }}
            >
              Salvar
            </Button>
            {active && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  disable()
                  setOpen(false)
                }}
              >
                Desligar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
