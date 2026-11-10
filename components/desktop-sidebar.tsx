"use client"

import Link from "next/link"
import { BarChart3, Home, Moon, Plus, Sun } from "lucide-react"
import { Avatar } from "@/components/avatar"
import { ReminderButton } from "@/components/reminder-button"
import { useAuth } from "@/hooks/use-auth"
import { useHabits } from "@/hooks/use-habits"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

/** Menu lateral fixo, só no desktop (>= 1024px). No celular não é renderizado na tela. */
export function DesktopSidebar({ pathname }: { pathname: string }) {
  const { habits, profile } = useHabits()
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const name = profile.name || user?.displayName?.split(" ")[0] || "Seu perfil"

  const link = (href: string, label: string, Icon: typeof Home) => {
    const active = pathname === href
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
          active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.4 : 2} />
        {label}
      </Link>
    )
  }

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 xl:w-64 flex-col border-r border-border bg-background px-4 py-6 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" />
        <span>
          <span className="block text-base font-semibold leading-tight">MRD</span>
          <span className="block text-[11px] leading-tight text-muted-foreground">Mínimo Ridículo Diário</span>
        </span>
      </Link>

      <Link
        href="/novo"
        className="mb-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Novo hábito
      </Link>

      <nav className="space-y-1">
        {link("/", "Hoje", Home)}
        {link("/analise", "Análise", BarChart3)}
      </nav>

      <div className="mt-auto space-y-1 border-t border-border pt-4">
        <ReminderButton habits={habits} variant="row" />
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {theme === "dark" ? "Tema claro" : "Tema escuro"}
        </button>
        <Link
          href="/perfil"
          className={cn(
            "mt-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors",
            pathname === "/perfil" ? "bg-muted" : "hover:bg-muted",
          )}
        >
          <Avatar photo={profile.photo} name={name} className="h-9 w-9 text-sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{user?.email ?? "Perfil"}</span>
          </span>
        </Link>
      </div>
    </aside>
  )
}
