"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, BedDouble, BookOpen, Flag, Home, Moon, Plus, Search, Telescope, User } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { useHabits } from "@/hooks/use-habits"
import { useTheme } from "@/hooks/use-theme"

/** Busca rápida (⌘K / Ctrl+K) no desktop: ações, telas, projetos e hábitos. */
export function CommandMenu() {
  const router = useRouter()
  const { habits, projects, profile } = useHabits()
  const { toggle } = useTheme()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex h-10 w-full items-center gap-2 rounded-xl border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Buscar ou criar...</span>
        <Kbd>⌘K</Kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Busca rápida" description="Ações, telas e projetos">
        <CommandInput placeholder="O que você quer fazer?" />
        <CommandList>
          <CommandEmpty>Nada encontrado.</CommandEmpty>
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => go("/novo")}>
              <Plus /> Novo hábito
            </CommandItem>
            <CommandItem onSelect={() => go("/projetos/novo")}>
              <Flag /> Novo projeto
            </CommandItem>
            <CommandItem onSelect={() => go("/")}>
              <BedDouble /> Registrar sono
            </CommandItem>
            <CommandItem
              onSelect={() => {
                toggle()
                setOpen(false)
              }}
            >
              <Moon /> Trocar tema
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Telas">
            <CommandItem onSelect={() => go("/")}>
              <Home /> Hoje
            </CommandItem>
            <CommandItem onSelect={() => go("/projetos")}>
              <Flag /> Projetos
            </CommandItem>
            {profile.visionEnabled && (
              <CommandItem onSelect={() => go("/visao")}>
                <Telescope /> Visão
              </CommandItem>
            )}
            <CommandItem onSelect={() => go("/analise")}>
              <BarChart3 /> Análise
            </CommandItem>
            <CommandItem onSelect={() => go("/guia")}>
              <BookOpen /> Guia de uso
            </CommandItem>
            <CommandItem onSelect={() => go("/perfil")}>
              <User /> Perfil
            </CommandItem>
          </CommandGroup>
          {projects.some((p) => p.status === "ativo") && (
            <CommandGroup heading="Projetos">
              {projects
                .filter((p) => p.status === "ativo")
                .map((p) => (
                  <CommandItem key={p.id} onSelect={() => go(`/projetos/${p.id}`)}>
                    {p.kind === "leitura" ? <BookOpen /> : <Flag />} {p.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
          {habits.length > 0 && (
            <CommandGroup heading="Hábitos">
              {habits.map((h) => (
                <CommandItem key={h.id} onSelect={() => go(`/habito/${h.id}`)}>
                  {h.name}
                  <CommandShortcut>abrir</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
