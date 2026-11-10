"use client"

import { useState } from "react"
import { Bell, BellRing, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomSheet, IconButton } from "@/components/ui-kit"
import { useReminder } from "@/hooks/use-reminder"
import type { Habit } from "@/lib/types"

export function ReminderButton({ habits, variant = "icon" }: { habits: Habit[]; variant?: "icon" | "row" }) {
  const { settings, permission, enable, disable, test } = useReminder(habits)
  const [open, setOpen] = useState(false)
  const [time, setTime] = useState(settings.time)
  const [msg, setMsg] = useState("")
  const active = settings.enabled && permission === "granted"

  return (
    <>
      {variant === "row" ? (
        <button
          type="button"
          onClick={() => {
            setTime(settings.time)
            setMsg("")
            setOpen(true)
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {active ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
          <span className="flex-1 text-left">Lembrete</span>
          {active && <span className="text-xs tabular-nums">{settings.time}</span>}
        </button>
      ) : (
        <IconButton
          aria-label="Lembrete diário"
          onClick={() => {
            setTime(settings.time)
            setMsg("")
            setOpen(true)
          }}
          className={active ? "text-foreground" : "text-muted-foreground"}
        >
          {active ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </IconButton>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold">Lembrete diário</h2>
        <p className="mt-1 text-sm text-muted-foreground">Escolha o horário do seu aviso.</p>

        <div className="mt-4 overflow-hidden rounded-2xl bg-muted">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="block w-full min-w-0 appearance-none bg-transparent px-4 py-4 text-center text-3xl font-semibold tabular-nums outline-none [&::-webkit-date-and-time-value]:text-center"
          />
        </div>

        <div className="mt-5 rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold">Alarme no Calendário do iPhone</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Recomendado. O iOS avisa todo dia nesse horário, mesmo com o app fechado e a tela bloqueada.
            Toque abaixo e confirme em &quot;Adicionar ao Calendário&quot;.
          </p>
          <Button asChild className="mt-3 h-12 w-full rounded-2xl text-base">
            <a href={`/api/lembrete?t=${encodeURIComponent(time)}`}>
              <CalendarPlus className="mr-2 h-5 w-5" />
              Adicionar ao Calendário
            </a>
          </Button>
        </div>

        {permission !== "unsupported" && (
          <div className="mt-3 rounded-2xl border border-border p-4">
            <p className="text-sm font-semibold">Aviso dentro do app</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Só aparece se o app estiver aberto no horário e ainda houver hábito sem marcar.
            </p>
            {permission === "denied" && (
              <p className="mt-2 text-xs text-red-500">
                Notificações bloqueadas. Libere em Ajustes do iPhone &gt; Notificações &gt; MRD.
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button
                variant={active ? "outline" : "default"}
                className="h-11 flex-1 rounded-xl"
                onClick={async () => {
                  if (active) {
                    disable()
                    setMsg("Aviso no app desligado.")
                    return
                  }
                  const ok = await enable(time)
                  setMsg(ok ? `Aviso no app ativado para ${time}.` : "Permissão de notificação não concedida.")
                }}
              >
                {active ? "Desligar" : "Ativar"}
              </Button>
              {permission === "granted" && (
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl"
                  onClick={async () => setMsg((await test()) ? "Notificação de teste enviada." : "Não foi possível notificar.")}
                >
                  Testar agora
                </Button>
              )}
            </div>
          </div>
        )}

        {msg && <p className="mt-3 text-center text-sm text-muted-foreground">{msg}</p>}
        <div className="h-3" />
      </BottomSheet>
    </>
  )
}
