"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { DesktopSidebar } from "@/components/desktop-sidebar"

/**
 * Celular/tablet (< 1024px): coluna central estilo app com barra inferior.
 * Desktop (>= 1024px, prefixo lg:): menu lateral fixo e conteúdo largo.
 * Regra: estilos do mobile não são editados; o desktop só acrescenta classes lg:.
 */
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

  return (
    <div className="min-h-dvh bg-muted sm:py-6 lg:flex lg:bg-background lg:py-0">
      <DesktopSidebar pathname={pathname} />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border sm:border-border sm:shadow-2xl lg:mx-0 lg:min-h-dvh lg:max-w-none lg:flex-1 lg:rounded-none lg:border-0 lg:shadow-none">
        <main
          key={pathname}
          className={cn(
            "flex-1 px-5 animate-in fade-in duration-300",
            nav ? "pb-32" : "pb-10",
            "lg:mx-auto lg:w-full lg:px-10 lg:pb-16",
            size === "wide" ? "lg:max-w-6xl" : "lg:max-w-2xl",
          )}
        >
          {children}
        </main>
        {nav && <BottomNav pathname={pathname} />}
      </div>
    </div>
  )
}

function BottomNav({ pathname }: { pathname: string }) {
  const item = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "pressable flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
        {label}
      </Link>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md sm:absolute lg:hidden">
      <div className="safe-bottom mx-3 mb-2 flex items-center rounded-3xl border border-border bg-card/85 px-2 pt-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {item("/", "Hoje", Home)}
        <Link
          href="/novo"
          aria-label="Novo hábito"
          className="pressable -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-black/25"
        >
          <Plus className="h-6 w-6" />
        </Link>
        {item("/analise", "Análise", BarChart3)}
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
  wideSides = false,
}: {
  /** colunas laterais mais largas (3 ícones à esquerda) */
  wideSides?: boolean
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
          wideSides
            ? "grid-cols-[6.5rem_1fr_6.5rem] min-[390px]:grid-cols-[7rem_1fr_7rem]"
            : "grid-cols-[5.5rem_1fr_5.5rem]",
        )}
      >
        <div className="flex items-center justify-start gap-0.5">{left}</div>
        <div className="min-w-0 text-center lg:text-left">
          {subtitle && (
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {subtitle}
            </p>
          )}
          <h1
            className={cn(
              "truncate font-semibold tracking-tight lg:text-3xl",
              wideSides ? "text-[17px] min-[375px]:text-lg min-[390px]:text-xl" : "text-xl",
            )}
          >
            {title}
          </h1>
        </div>
        <div className="flex items-center justify-end gap-0.5">{right}</div>
      </div>
    </header>
  )
}

export { IconButton, BottomSheet } from "@/components/ui-kit"
