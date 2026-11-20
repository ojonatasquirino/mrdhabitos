"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart3, Flag, Home, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DesktopSidebar } from "@/components/desktop-sidebar"
import { PaceToast } from "@/components/pace-toast"

/**
 * Celular/tablet (< 1024px): coluna central estilo app com barra inferior.
 * Desktop (>= 1024px, prefixo lg:): menu lateral fixo e conteúdo largo.
 * Regra: estilos do mobile não são editados; o desktop só acrescenta classes lg:.
 */
const TABS = [
  { href: "/", label: "Hoje", Icon: Home },
  { href: "/projetos", label: "Projetos", Icon: Flag },
  { href: "/analise", label: "Análise", Icon: BarChart3 },
] as const

const tabIndex = (pathname: string) =>
  TABS.findIndex((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href)))

// Sobrevive à troca de tela (cada tela monta o próprio AppShell):
// guarda a aba anterior para a pílula deslizar dela até a nova, e a direção da transição.
let lastTab: number | null = null
let navDirection = 0

export function AppShell({
  children,
  nav = true,
  size = "wide",
}: {
  children: React.ReactNode
  nav?: boolean
  /** largura do conteúdo no desktop */
  size?: "wide" | "narrow"
}) {
  const pathname = usePathname()
  const router = useRouter()
  // direção da entrada da tela: vem da direita ao avançar de aba, da esquerda ao voltar
  const [enter] = useState(() => {
    const d = navDirection
    navDirection = 0
    return d > 0 ? "slide-in-from-right-8" : d < 0 ? "slide-in-from-left-8" : "slide-in-from-bottom-2"
  })

  // deslizar o dedo para os lados troca de aba, como no iPhone
  const touch = useRef<{ x: number; y: number; t: number } | null>(null)
  const current = tabIndex(pathname)
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY, t: Date.now() }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current
    touch.current = null
    if (!start || current < 0 || !nav) return
    const p = e.changedTouches[0]
    const dx = p.clientX - start.x
    const dy = p.clientY - start.y
    if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.6 || Date.now() - start.t > 600) return
    const next = current + (dx < 0 ? 1 : -1)
    if (next < 0 || next >= TABS.length) return
    navDirection = next > current ? 1 : -1
    lastTab = current
    router.push(TABS[next].href)
  }

  return (
    <div className="min-h-dvh bg-muted sm:py-6 lg:flex lg:bg-background lg:py-0">
      <DesktopSidebar pathname={pathname} />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl lg:mx-0 lg:min-h-dvh lg:max-w-none lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none">
        <main
          key={pathname}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className={cn(
            "flex-1 px-5 animate-in fade-in ease-out duration-[420ms]",
            enter,
            nav ? "pb-32" : "pb-10",
            "lg:mx-auto lg:w-full lg:px-10 lg:pb-16",
            size === "wide" ? "lg:max-w-6xl" : "lg:max-w-2xl",
          )}
        >
          {children}
        </main>
        {nav && <BottomNav pathname={pathname} />}
        <PaceToast />
      </div>
    </div>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  const router = useRouter()
  const current = tabIndex(pathname)
  // posição da pílula (em abas); começa na aba anterior e desliza até a atual
  const [pos, setPos] = useState<number>(lastTab ?? Math.max(0, current))
  const [drag, setDrag] = useState<number | null>(null)
  const [moving, setMoving] = useState(false)
  const bar = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; moved: boolean } | null>(null)

  useEffect(() => {
    if (current < 0) return
    lastTab = current
    if (pos === current) return
    setMoving(true)
    const raf = requestAnimationFrame(() => setPos(current))
    const t = window.setTimeout(() => setMoving(false), 450)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const go = (i: number) => {
    if (i === current || i < 0) return
    navDirection = i > current ? 1 : -1
    lastTab = current
    setMoving(true)
    setPos(i)
    try {
      navigator.vibrate?.(6)
    } catch {}
    router.push(TABS[i].href)
  }

  // arrastar o dedo pela barra leva a pílula junto; ao soltar, abre a aba embaixo dela
  const indexAt = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect()
    const x = Math.min(Math.max(clientX - r.left - 6, 0), r.width - 12)
    return (x / (r.width - 12)) * TABS.length - 0.5
  }
  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { startX: e.clientX, moved: false }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const st = dragState.current
    if (!st) return
    if (!st.moved && Math.abs(e.clientX - st.startX) < 8) return
    st.moved = true
    setDrag(Math.min(Math.max(indexAt(e.clientX), 0), TABS.length - 1))
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const st = dragState.current
    dragState.current = null
    if (!st?.moved) return
    const i = Math.round(Math.min(Math.max(indexAt(e.clientX), 0), TABS.length - 1))
    setDrag(null)
    setPos(i)
    if (i !== current) go(i)
  }

  const shown = drag ?? pos
  const highlighted = Math.round(shown)

  // Estilo iOS: cápsula de vidro com as abas + botão redondo de vidro ao lado
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md sm:absolute lg:hidden">
      <div className="safe-bottom mx-4 mb-2 flex items-center gap-3">
        <div
          ref={bar}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragState.current = null
            setDrag(null)
          }}
          className="glass pointer-events-auto relative flex h-16 flex-1 touch-pan-y select-none items-center rounded-full p-1.5"
        >
          {current >= 0 && (
            <span
              aria-hidden="true"
              className={cn(
                "glass-pill absolute bottom-1.5 left-1.5 top-1.5 rounded-full",
                drag == null && "transition-transform duration-[450ms] ease-[cubic-bezier(.3,1.35,.5,1)]",
              )}
              style={{
                width: "calc((100% - 12px) / 3)",
                transform: `translateX(${shown * 100}%) scale(${drag != null ? 1.08 : moving ? 1.05 : 1}, ${drag != null ? 1.04 : 1})`,
              }}
            />
          )}
          {TABS.map(({ href, label, Icon }, i) => {
            const active = i === highlighted && current >= 0
            return (
              <Link
                key={href}
                href={href}
                aria-current={i === current ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  go(i)
                }}
                draggable={false}
                className={cn(
                  "relative z-10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-[color,transform] duration-300 active:scale-95",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn("h-[22px] w-[22px] transition-transform duration-300", active && "scale-110")}
                  strokeWidth={active ? 2.3 : 1.9}
                />
                {label}
              </Link>
            )
          })}
        </div>
        <Link
          href="/novo"
          aria-label="Novo hábito"
          className="glass pressable pointer-events-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-foreground"
        >
          <Plus className="h-7 w-7" strokeWidth={2.2} />
        </Link>
      </div>
    </nav>
  )
}

/**
 * Cabeçalho fixo e opaco que cobre a área do status bar.
 * Fundo sólido evita o efeito de desfoque do iOS por cima do conteúdo.
 */
export function PageHeader({
  title,
  subtitle,
  left,
  right,
  spread = false,
}: {
  /** tela Hoje: 2 ícones de cada lado, espaçados (o de dentro fica entre a borda e o título) */
  spread?: boolean
  title: React.ReactNode
  subtitle?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <header className="safe-top sticky top-0 z-20 -mx-5 mb-5 bg-background px-5 pb-3 sm:rounded-t-[2rem] lg:-mx-10 lg:mb-8 lg:rounded-none lg:px-10 lg:pb-5 lg:pt-10">
      <div
        className={cn(
          "grid items-center lg:grid-cols-[auto_1fr_auto] lg:gap-3",
          spread
            ? "grid-cols-[minmax(5rem,1fr)_minmax(0,auto)_minmax(5rem,1fr)]"
            : "grid-cols-[5.5rem_1fr_5.5rem]",
        )}
      >
        <div className={cn("flex items-center gap-0.5", spread ? "" : "justify-start")}>
          {left}
        </div>
        <div className="min-w-0 text-center lg:text-left">
          {subtitle && (
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          )}
          <h1
            className={cn(
              "truncate font-semibold tracking-tight lg:text-3xl",
              "text-xl",
            )}
          >
            {title}
          </h1>
        </div>
        <div className={cn("flex items-center gap-0.5", spread ? "" : "justify-end")}>
          {right}
        </div>
      </div>
    </header>
  )
}

export { IconButton, BottomSheet } from "@/components/ui-kit"
