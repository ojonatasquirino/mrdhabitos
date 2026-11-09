"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Home, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

/** Coluna central estilo app: largura de celular, centralizada no desktop. */
export function AppShell({ children, nav = true }: { children: React.ReactNode; nav?: boolean }) {
  const pathname = usePathname()

  return (
    <div className="min-h-dvh bg-neutral-100 sm:py-6">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white sm:min-h-[calc(100dvh-3rem)] sm:overflow-hidden sm:rounded-[2rem] sm:border sm:border-neutral-200 sm:shadow-2xl">
        <main
          key={pathname}
          className={cn(
            "flex-1 px-5 safe-top animate-in fade-in slide-in-from-bottom-2 duration-300",
            nav ? "pb-32" : "pb-10",
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
          active ? "text-foreground" : "text-neutral-400",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
        {label}
      </Link>
    )
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md sm:absolute">
      <div className="safe-bottom mx-3 mb-2 flex items-center rounded-3xl border border-neutral-200 bg-white/85 px-2 pt-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl">
        {item("/", "Hoje", Home)}
        <Link
          href="/novo"
          aria-label="Novo hábito"
          className="pressable -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg shadow-black/25"
        >
          <Plus className="h-6 w-6" />
        </Link>
        {item("/analise", "Análise", BarChart3)}
      </div>
    </nav>
  )
}

export function PageHeader({
  title,
  subtitle,
  left,
  right,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex items-start gap-3">
      {left}
      <div className="min-w-0 flex-1">
        {subtitle && <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">{subtitle}</p>}
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
    </header>
  )
}

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "pressable flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-neutral-100",
        className,
      )}
      {...props}
    />
  )
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="safe-bottom relative w-full max-w-md rounded-t-3xl bg-white px-5 pt-3 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-200" />
        {children}
      </div>
    </div>
  )
}
