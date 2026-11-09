"use client"

import { useCallback, useEffect, useState } from "react"
import type { Habit } from "@/lib/types"
import { toDateKey } from "@/lib/dates"

const KEY = "mrd-reminder"
const LAST_KEY = "mrd-reminder-last"

interface ReminderSettings {
  enabled: boolean
  time: string // HH:MM
}

const DEFAULT: ReminderSettings = { enabled: false, time: "20:00" }

function load(): ReminderSettings {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }
  } catch {
    return DEFAULT
  }
}

async function notify(pending: number) {
  const body =
    pending === 1 ? "Falta 1 hábito hoje. É ridículo de tão pequeno." : `Faltam ${pending} hábitos hoje. Bora no mínimo.`
  const reg = await navigator.serviceWorker?.getRegistration()
  const options = { body, icon: "/icon-192.png", badge: "/icon-192.png", tag: "mrd-daily" }
  if (reg) await reg.showNotification("MRD", options)
  else new Notification("MRD", options)
}

/**
 * Lembrete diário local. Dispara no horário escolhido enquanto o app estiver aberto,
 * ou na próxima abertura do dia se o horário já passou e ainda há hábitos pendentes.
 */
export function useReminder(habits: Habit[]) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")

  useEffect(() => {
    setSettings(load())
    setPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission)
  }, [])

  const save = useCallback((next: ReminderSettings) => {
    setSettings(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {}
  }, [])

  const enable = useCallback(
    async (time: string) => {
      if (typeof Notification === "undefined") return false
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== "granted") return false
      save({ enabled: true, time })
      return true
    },
    [save],
  )

  const disable = useCallback(() => save({ ...settings, enabled: false }), [save, settings])

  useEffect(() => {
    if (!settings.enabled || permission !== "granted") return

    const check = () => {
      const now = new Date()
      const today = toDateKey(now)
      const [h, m] = settings.time.split(":").map(Number)
      const due = new Date(now)
      due.setHours(h, m, 0, 0)
      if (now < due || localStorage.getItem(LAST_KEY) === today) return

      const pending = habits.filter((habit) => habit.completions[today] === undefined).length
      if (pending === 0) return
      localStorage.setItem(LAST_KEY, today)
      notify(pending).catch(console.error)
    }

    check()
    const id = window.setInterval(check, 60_000)
    return () => window.clearInterval(id)
  }, [settings, permission, habits])

  return { settings, permission, enable, disable }
}
