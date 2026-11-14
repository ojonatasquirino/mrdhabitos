"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, ChevronRight, CircleCheck, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BottomSheet, IconButton } from "@/components/ui-kit"
import { useAuth } from "@/hooks/use-auth"
import { useHabits } from "@/hooks/use-habits"
import { cn } from "@/lib/utils"

/** Destino das sugestões (FormSubmit entrega no e-mail após a ativação única). */
const FEEDBACK_ENDPOINT = "https://formsubmit.co/ajax/ojonatasquirino@icloud.com"
const SENT_KEY = "mrd-feedback-sent"

interface SentItem {
  text: string
  at: string
}

function readSent(): SentItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(SENT_KEY) ?? "[]")
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Ícone de livro: abre a Ajuda com o Guia de uso e o envio de sugestões. */
export function HelpButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {variant === "row" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <BookOpen className="h-[18px] w-[18px]" />
          Ajuda e sugestões
        </button>
      ) : (
        <IconButton aria-label="Ajuda e sugestões" onClick={() => setOpen(true)} className="text-muted-foreground">
          <BookOpen className="h-5 w-5" />
        </IconButton>
      )}
      <BottomSheet open={open} onClose={() => setOpen(false)}>
        <HelpPanel onClose={() => setOpen(false)} />
      </BottomSheet>
    </>
  )
}

function HelpPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { profile } = useHabits()
  const pathname = usePathname()
  const [text, setText] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [sent, setSent] = useState<SentItem[]>([])

  useEffect(() => setSent(readSent()), [])

  const send = async () => {
    const message = text.trim()
    if (!message || state === "sending") return
    setState("sending")
    try {
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "MRD · Nova sugestão",
          _template: "table",
          _captcha: "false",
          nome: profile.name || user?.displayName || "Sem nome",
          email: user?.email || "não informado",
          sugestao: message,
          tela: pathname,
          enviado_em: new Date().toLocaleString("pt-BR"),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: string | boolean }
      if (!res.ok || String(data.success) !== "true") throw new Error("falha no envio")

      const item = { text: message, at: new Date().toISOString() }
      const next = [item, ...readSent()].slice(0, 20)
      try {
        localStorage.setItem(SENT_KEY, JSON.stringify(next))
      } catch {}
      setSent(next)
      setText("")
      setState("sent")
    } catch {
      setState("error")
    }
  }

  return (
    <div className="pb-2">
      <h2 className="text-lg font-semibold">Ajuda</h2>
      <p className="mt-1 text-sm text-muted-foreground">Dúvidas sobre o app ou uma ideia para melhorar?</p>

      <Link
        href="/guia"
        onClick={onClose}
        className="pressable mt-5 flex items-center gap-4 rounded-2xl border border-border p-4"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          <BookOpen className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">Guia de uso</span>
          <span className="block text-xs text-muted-foreground">Aprenda a usar o MRD da melhor forma possível</span>
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      <section className="mt-3 rounded-2xl border border-border p-4">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Lightbulb className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">Sugestões e melhorias</span>
            <span className="block text-xs text-muted-foreground">Vai direto para o criador do app</span>
          </span>
        </div>

        {state === "sent" ? (
          <div className="mt-4 flex flex-col items-center rounded-xl bg-green-500/10 px-4 py-5 text-center animate-in fade-in zoom-in-95 duration-300">
            <CircleCheck className="h-8 w-8 text-green-600 dark:text-green-500" />
            <p className="mt-2 text-sm font-semibold">Sugestão enviada</p>
            <p className="mt-1 text-xs text-muted-foreground">Obrigado! Ela já chegou para o Jônatas.</p>
            <button
              type="button"
              onClick={() => setState("idle")}
              className="mt-3 text-xs font-medium text-muted-foreground underline underline-offset-4"
            >
              Enviar outra
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                if (state === "error") setState("idle")
              }}
              maxLength={1000}
              rows={4}
              placeholder="O que poderia ser melhor? O que faltou?"
              className="mt-4 w-full resize-none rounded-xl bg-muted p-3 text-base leading-relaxed outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-foreground/10"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{user?.email ? "Seu e-mail vai junto para resposta." : ""}</span>
              <span className="tabular-nums">{text.length}/1000</span>
            </div>
            {state === "error" && (
              <p className="mt-2 text-sm text-red-500">Não foi possível enviar agora. Sua mensagem continua aqui, tente de novo.</p>
            )}
            <Button
              disabled={!text.trim() || state === "sending"}
              onClick={send}
              className="mt-3 h-12 w-full rounded-xl text-base"
            >
              {state === "sending" ? "Enviando..." : "Enviar sugestão"}
            </Button>
          </>
        )}

        {sent.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Enviadas por você ({sent.length})
            </p>
            <ul className="mt-2 space-y-2">
              {sent.slice(0, 3).map((s) => (
                <li key={s.at} className="flex items-start gap-2 text-xs">
                  <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1">{s.text}</span>
                    <span className={cn("text-muted-foreground")}>
                      Enviada em {new Date(s.at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
