"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  BarChart3,
  BedDouble,
  BookOpen,
  CalendarIcon,
  Check,
  ChevronRight,
  Flag,
  Flame,
  Home,
  ImagePlus,
  LogOut,
  MessageCircle,
  Moon,
  Pencil,
  Plus,
  Settings,
  Telescope,
  Trash2,
  ArrowUpToLine,
  ArrowDownToLine,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Kbd } from "@/components/ui/kbd"
import { Calendar } from "@/components/ui/calendar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ptBR } from "react-day-picker/locale"
import { cn } from "@/lib/utils"

/* Protótipo visual: telas do MRD com componentes oficiais do shadcn/ui. Não está ligado aos dados. */

const days = ["D", "S", "T", "Q", "Q", "S", "S"]
const habits = [
  { name: "Ler 5 páginas", streak: 12, project: "Decodificando Jordan Peterson", week: [1, 1, 1, 0, 1, 1, 2] },
  { name: "Orar 2 minutos", streak: 21, week: [1, 1, 1, 1, 1, 1, 2] },
  { name: "Treinar 1 série", streak: 4, week: [3, 1, 1, 0, 1, 1, 2] },
]

function Dots({ week }: { week: number[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {week.map((s, i) => (
        <span key={i} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground">{days[i]}</span>
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full",
              s === 1 && "bg-green-500 text-white",
              s === 0 && "bg-red-500 text-white",
              s === 2 && "bg-muted ring-2 ring-foreground ring-offset-2 ring-offset-card",
              s === 3 && "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/60",
            )}
          >
            {s === 1 && <Check className="size-4" strokeWidth={3} />}
            {s === 0 && <X className="size-4" strokeWidth={3} />}
            {s === 3 && <Moon className="size-3.5" />}
          </span>
        </span>
      ))}
    </div>
  )
}

function Phone({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background px-5 pb-28 pt-6">
      <header className="mb-5 text-center">
        {sub && <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{sub}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </header>
      {children}
    </div>
  )
}

function Nav({ active }: { active: string }) {
  const tabs = [
    ["Hoje", Home],
    ["Projetos", Flag],
    ["Visão", Telescope],
    ["Análise", BarChart3],
  ] as const
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md items-center gap-3 px-4 pb-4">
      <div className="glass flex h-16 flex-1 items-center rounded-full p-1.5">
        {tabs.map(([l, I]) => (
          <span
            key={l}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium",
              l === active ? "glass-pill text-foreground" : "text-muted-foreground",
            )}
          >
            <I className="size-[22px]" />
            {l}
          </span>
        ))}
      </div>
      <span className="glass flex size-16 items-center justify-center rounded-full">
        <Plus className="size-7" />
      </span>
    </nav>
  )
}

function HabitCard({ h, menu }: { h: (typeof habits)[number]; menu?: boolean }) {
  const card = (
    <div className="rounded-3xl border bg-card p-4 shadow-xs">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{h.name}</p>
          {h.project && (
            <Badge variant="secondary" className="mt-1 gap-1 font-normal">
              <Flag className="size-3" /> {h.project}
            </Badge>
          )}
        </div>
        <Badge variant="outline" className="gap-1 border-orange-500/30 bg-orange-500/10 text-orange-600">
          <Flame className="size-3.5" /> {h.streak}
        </Badge>
      </div>
      <Dots week={h.week} />
    </div>
  )
  if (!menu) return card
  return (
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>{card}</DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuLabel>{h.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Pencil /> Renomear
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Moon /> Dias de folga
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Flag /> Ligar a um projeto
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 /> Excluir hábito
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Screen({ tela }: { tela: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 11, 31))
  useEffect(() => {
    if (tela === "toast") {
      toast("Decodificando Jordan Peterson", { description: "+5 páginas · p. 85 de 448" })
      toast.success("Prazo apertou: hábito ajustado para 10 páginas", {
        action: { label: "Desfazer", onClick: () => {} },
      })
    }
  }, [tela])

  if (tela === "login")
    return (
      <div className="flex min-h-dvh items-center justify-center bg-muted/40 p-5">
        <div className="w-full max-w-sm rounded-3xl border bg-card p-6 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp?v=2" alt="" className="mx-auto size-14 rounded-2xl" />
          <h1 className="mt-4 text-center text-xl font-semibold">Entrar no MRD</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Mínimo Ridículo Diário</p>
          <FieldGroup className="mt-6">
            <Field>
              <FieldLabel htmlFor="e">E-mail</FieldLabel>
              <Input id="e" defaultValue="jonatas@email.com" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="s">Senha</FieldLabel>
              <Input id="s" type="password" defaultValue="123456" aria-invalid />
              <FieldDescription className="text-destructive">Senha incorreta. Tente de novo.</FieldDescription>
            </Field>
            <Button className="h-11" disabled>
              <Spinner /> Entrando...
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Separator className="flex-1" /> ou <Separator className="flex-1" />
            </div>
            <Button variant="outline" className="h-11">
              Continuar com Google
            </Button>
          </FieldGroup>
        </div>
      </div>
    )

  if (tela === "hoje" || tela === "menu" || tela === "toast")
    return (
      <Phone title="Olá, Jônatas" sub="Sábado, 21 de nov.">
        <div className="mb-4 rounded-3xl border bg-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Hoje</p>
              <p className="text-3xl font-semibold tabular-nums">2 de 3</p>
            </div>
            <span className="text-sm font-medium text-muted-foreground">67%</span>
          </div>
          <Progress value={67} className="mt-3 h-2" />
        </div>
        <div className="space-y-3">
          {habits.map((h, i) => (
            <HabitCard key={h.name} h={h} menu={tela === "menu" && i === 0} />
          ))}
        </div>
        <Nav active="Hoje" />
      </Phone>
    )

  if (tela === "loading")
    return (
      <Phone title="Olá, Jônatas" sub="Carregando">
        <Skeleton className="mb-4 h-24 rounded-3xl" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-3 rounded-3xl border p-4">
            <Skeleton className="mb-4 h-5 w-40" />
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((_, j) => (
                <Skeleton key={j} className="mx-auto size-9 rounded-full" />
              ))}
            </div>
          </div>
        ))}
        <Nav active="Hoje" />
      </Phone>
    )

  if (tela === "sono")
    return (
      <>
        <Phone title="Olá, Jônatas" sub="Sábado, 21 de nov.">
          {habits.map((h) => (
            <div key={h.name} className="mb-3">
              <HabitCard h={h} />
            </div>
          ))}
        </Phone>
        <Drawer open>
          <DrawerContent>
            <div className="mx-auto w-full max-w-md px-5">
              <DrawerHeader className="px-0 text-left">
                <DrawerTitle className="flex items-center gap-2">
                  <BedDouble className="size-5 text-indigo-500" /> Sono desta noite
                </DrawerTitle>
                <DrawerDescription>Puxe para baixo para fechar.</DrawerDescription>
              </DrawerHeader>
              <div className="rounded-3xl bg-muted py-5 text-center">
                <p className="text-5xl font-semibold tabular-nums">6h45</p>
                <Badge className="mt-2 border-amber-500/30 bg-amber-500/10 text-amber-700" variant="outline">
                  −0h15 da meta
                </Badge>
              </div>
              <Slider defaultValue={[6.75]} min={0} max={12} step={0.25} className="mt-6" />
              <ToggleGroup type="single" variant="outline" defaultValue="7" className="mt-5 w-full">
                {["5", "6", "7", "8", "9"].map((v) => (
                  <ToggleGroupItem key={v} value={v} className="flex-1">
                    {v}h
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <Item variant="outline" className="mt-5 rounded-2xl">
                <ItemContent>
                  <ItemTitle>Meta por noite</ItemTitle>
                  <ItemDescription>Adultos: 7 a 9 horas</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary" className="text-sm">
                    7h
                  </Badge>
                </ItemActions>
              </Item>
              <DrawerFooter className="px-0">
                <Button className="h-12 rounded-2xl text-base">Salvar</Button>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )

  if (tela === "projeto" || tela === "prazo")
    return (
      <Phone title="Onde você quer chegar?" sub="Novo projeto">
        <FieldGroup>
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <ToggleGroup type="single" variant="outline" defaultValue="leitura" className="w-full">
              <ToggleGroupItem value="leitura" className="flex-1">
                <BookOpen /> Leitura
              </ToggleGroupItem>
              <ToggleGroupItem value="construcao" className="flex-1">
                Construção
              </ToggleGroupItem>
              <ToggleGroupItem value="estudo" className="flex-1">
                Estudo
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>
          <Field>
            <FieldLabel>Nome</FieldLabel>
            <Input defaultValue="Decodificando Jordan Peterson" />
          </Field>
          <Field>
            <FieldLabel>Prazo</FieldLabel>
            <Popover open={tela === "prazo"}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start font-normal">
                  <CalendarIcon /> {date?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" locale={ptBR} selected={date} onSelect={setDate} defaultMonth={date} />
              </PopoverContent>
            </Popover>
          </Field>
          <Field>
            <FieldLabel>Hábito que alimenta o projeto</FieldLabel>
            <Select defaultValue="ler">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ler">Ler 5 páginas</SelectItem>
                <SelectItem value="novo">Criar um hábito novo</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Item variant="outline" className="rounded-2xl">
            <ItemContent>
              <ItemTitle>Ajustar ao prazo automaticamente</ItemTitle>
              <ItemDescription>Sobe as páginas por check até 10 quando o prazo aperta.</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch defaultChecked />
            </ItemActions>
          </Item>
          <Field>
            <FieldLabel>Etapas (construção)</FieldLabel>
            {["Estudar o método", "Gerador de roteiro", "Narração com IA"].map((e, i) => (
              <label key={e} className="flex items-center gap-3 rounded-xl border p-3 text-sm">
                <Checkbox defaultChecked={i === 0} /> {e}
              </label>
            ))}
          </Field>
          <Button className="h-12 rounded-2xl text-base">Criar projeto</Button>
        </FieldGroup>
      </Phone>
    )

  if (tela === "excluir")
    return (
      <>
        <Phone title="Sistema YouTube Dark" sub="Construção">
          <Skeleton className="h-40 rounded-3xl" />
        </Phone>
        <AlertDialog open>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “Sistema YouTube Dark”?</AlertDialogTitle>
              <AlertDialogDescription>
                As etapas e o progresso serão apagados. O hábito ligado e o histórico dele continuam. Não dá para
                desfazer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )

  if (tela === "perfil")
    return (
      <Phone title="Perfil" sub="Configurações">
        <div className="flex flex-col items-center">
          <Avatar className="size-24">
            <AvatarFallback className="text-2xl">JQ</AvatarFallback>
          </Avatar>
          <p className="mt-3 text-lg font-semibold">Jônatas</p>
          <p className="text-sm text-muted-foreground">jonatas@email.com</p>
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl border">
          {[
            ["Quadro de visão", "Aba Visão na barra", true],
            ["Tema escuro", "Segue o sistema", false],
            ["Lembrete diário", "Às 21h no Calendário", true],
          ].map(([t, d, on], i) => (
            <div key={String(t)}>
              {i > 0 && <Separator />}
              <Item className="rounded-none px-5">
                <ItemContent>
                  <ItemTitle>{t}</ItemTitle>
                  <ItemDescription>{d}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch defaultChecked={!!on} />
                </ItemActions>
              </Item>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-3xl border">
          <Item className="rounded-none px-5">
            <ItemMedia>
              <BookOpen className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Guia de uso</ItemTitle>
            </ItemContent>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Item>
          <Separator />
          <Item className="rounded-none px-5 text-destructive">
            <ItemMedia>
              <LogOut className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Sair da conta</ItemTitle>
            </ItemContent>
          </Item>
        </div>
      </Phone>
    )

  if (tela === "guia")
    return (
      <Phone title="Guia de uso" sub="Aprenda o MRD">
        <Accordion type="single" collapsible defaultValue="projetos" className="rounded-3xl border px-5">
          {[
            ["comeco", "Comece por aqui", ""],
            ["marcar", "Marcar o dia", ""],
            [
              "projetos",
              "Projetos",
              "O hábito é o motor e o projeto é o destino. Cada check do hábito ligado avança o projeto: páginas na leitura, etapas na construção. O app calcula o ritmo para o prazo.",
            ],
            ["sono", "Sono", ""],
            ["visao", "Bônus: Quadro de visão", ""],
            ["faq", "Perguntas frequentes", ""],
          ].map(([v, t, c]) => (
            <AccordionItem key={v} value={v}>
              <AccordionTrigger className="text-base">{t}</AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">{c || "…"}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Phone>
    )

  if (tela === "vazio")
    return (
      <Phone title="Projetos" sub="0 de 3 ativos">
        <Empty className="rounded-3xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Flag />
            </EmptyMedia>
            <EmptyTitle>Hábito é o motor. Projeto é o destino.</EmptyTitle>
            <EmptyDescription>
              Um livro para terminar, um sistema para construir. Ligue um hábito e cada check avança o projeto.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>
              <Plus /> Novo projeto
            </Button>
          </EmptyContent>
        </Empty>
        <Nav active="Projetos" />
      </Phone>
    )

  if (tela === "visao")
    return (
      <Phone title="Visão" sub="Quadro de visão">
        <div className="relative h-[60vh] rounded-[2rem] bg-muted/50">
          <Button variant="outline" className="absolute left-3 top-3 rounded-full">
            <ImagePlus /> Imagem
          </Button>
          <div className="absolute left-8 top-20 h-36 w-52 rounded-2xl bg-gradient-to-br from-sky-300 to-blue-600 shadow-lg" />
          <DropdownMenu open>
            <DropdownMenuTrigger asChild>
              <div className="absolute right-6 top-48 h-44 w-36 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-600 shadow-2xl" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem>
                <MessageCircle /> Comentário
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowUpToLine /> Trazer para frente
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowDownToLine /> Mandar para trás
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 /> Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Nav active="Visão" />
      </Phone>
    )

  if (tela === "desktop")
    return (
      <div className="flex min-h-dvh bg-background">
        <aside className="flex w-64 flex-col border-r p-4">
          <div className="mb-6 flex items-center gap-3 px-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp?v=2" alt="" className="size-9 rounded-xl" />
            <div>
              <p className="font-semibold leading-tight">MRD</p>
              <p className="text-[11px] text-muted-foreground">Mínimo Ridículo Diário</p>
            </div>
          </div>
          <Button variant="outline" className="mb-4 justify-between text-muted-foreground">
            Buscar ou criar... <Kbd>⌘K</Kbd>
          </Button>
          {[
            ["Hoje", Home, true],
            ["Projetos", Flag],
            ["Visão", Telescope],
            ["Análise", BarChart3],
          ].map(([l, I, a]) => {
            const Icon = I as typeof Home
            return (
              <span
                key={String(l)}
                className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm", a ? "bg-muted font-medium" : "text-muted-foreground")}
              >
                <Icon className="size-4" /> {String(l)}
              </span>
            )
          })}
          <div className="mt-auto flex items-center gap-2">
            <Avatar>
              <AvatarFallback>JQ</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium">Jônatas</span>
            <Tooltip open>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Configurações <Kbd>⌘,</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
        <main className="flex-1 p-10">
          <h1 className="text-3xl font-semibold">Olá, Jônatas</h1>
          <div className="mt-6 grid grid-cols-2 gap-4">
            {habits.map((h) => (
              <HabitCard key={h.name} h={h} />
            ))}
          </div>
        </main>
        <CommandDialog open>
          <CommandInput placeholder="O que você quer fazer?" />
          <CommandList>
            <CommandEmpty>Nada encontrado.</CommandEmpty>
            <CommandGroup heading="Ações">
              <CommandItem>
                <Plus /> Novo hábito <CommandShortcut>N</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <BedDouble /> Registrar sono <CommandShortcut>S</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Moon /> Trocar tema <CommandShortcut>⌘J</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Projetos">
              <CommandItem>
                <BookOpen /> Decodificando Jordan Peterson
              </CommandItem>
              <CommandItem>
                <Flag /> Sistema YouTube Dark
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    )

  return <Textarea defaultValue="tela desconhecida" />
}

function Inner() {
  const tela = useSearchParams().get("tela") ?? "hoje"
  return (
    <TooltipProvider>
      <Screen tela={tela} />
      <Toaster position="top-center" />
    </TooltipProvider>
  )
}

export default function PrototypePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  )
}
