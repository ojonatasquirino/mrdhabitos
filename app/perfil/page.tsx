"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Camera, ChevronRight, Telescope, LogOut, Moon, Sun, Trash2 } from "lucide-react"
import { AppShell, IconButton, PageHeader } from "@/components/app-shell"
import { Avatar, imageToAvatar } from "@/components/avatar"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useAuth } from "@/hooks/use-auth"
import { useHabits } from "@/hooks/use-habits"
import { useTheme } from "@/hooks/use-theme"

export default function ProfilePage() {
  const router = useRouter()
  const { user, enabled: authEnabled, logout } = useAuth()
  const { profile, setProfile, ready } = useHabits()
  const { theme, toggle } = useTheme()
  const [name, setName] = useState("")
  const [photo, setPhoto] = useState<string | undefined>()
  const [confirmOut, setConfirmOut] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!ready) return
    setName(profile.name ?? "")
    setPhoto(profile.photo)
  }, [ready, profile.name, profile.photo])

  const dirty = (name.trim() || undefined) !== (profile.name || undefined) || photo !== profile.photo
  const fallbackName = user?.displayName?.split(" ")[0]

  return (
    <AppShell nav={false} size="narrow">
      <PageHeader
        subtitle="Configurações"
        title="Perfil"
        left={
          <IconButton aria-label="Voltar" onClick={() => router.push("/")} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />

      <section className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="pressable relative"
          aria-label="Trocar foto de perfil"
        >
          <Avatar photo={photo} name={name || fallbackName} className="h-28 w-28 text-3xl" />
          <span className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-4 border-background bg-foreground text-background">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ""
            if (!file) return
            try {
              setPhoto(await imageToAvatar(file))
            } catch {
              toast.error("Não consegui ler essa imagem. Tente outra.")
            }
          }}
        />
        {photo && (
          <button
            type="button"
            onClick={() => setPhoto(undefined)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remover foto
          </button>
        )}
      </section>

      <Field className="mt-8">
        <FieldLabel htmlFor="nome">Nome ou apelido</FieldLabel>
        <Input
          id="nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder={fallbackName ?? "Como quer ser chamado?"}
          className="h-12 rounded-2xl text-base"
        />
      </Field>

      <Button
        disabled={!dirty}
        className="mt-4 h-12 w-full rounded-2xl text-base"
        onClick={() => {
          setProfile({ ...profile, name, photo })
          toast.success("Perfil salvo.")
        }}
      >
        Salvar
      </Button>

      <div className="mt-8 overflow-hidden rounded-3xl border">
        <Item className="rounded-none px-5">
          <ItemMedia>
            <Telescope className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Quadro de visão</ItemTitle>
            <ItemDescription>Fotos do futuro que você quer. Adiciona a aba Visão na barra.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch
              aria-label="Quadro de visão"
              checked={!!profile.visionEnabled}
              onCheckedChange={(v) => setProfile({ ...profile, visionEnabled: v })}
            />
          </ItemActions>
        </Item>
        <Separator />
        <Item className="rounded-none px-5">
          <ItemMedia>{theme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}</ItemMedia>
          <ItemContent>
            <ItemTitle>Tema escuro</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Switch aria-label="Tema escuro" checked={theme === "dark"} onCheckedChange={toggle} />
          </ItemActions>
        </Item>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border">
        <Item asChild className="rounded-none px-5">
          <Link href="/guia">
            <ItemMedia>
              <BookOpen className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Guia de uso</ItemTitle>
            </ItemContent>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </Item>
        {user?.email && (
          <>
            <Separator />
            <Item className="rounded-none px-5">
              <ItemContent>
                <ItemTitle>Conta</ItemTitle>
              </ItemContent>
              <span className="truncate text-sm text-muted-foreground">{user.email}</span>
            </Item>
          </>
        )}
        {authEnabled && user && (
          <>
            <Separator />
            <Item asChild className="rounded-none px-5 text-destructive">
              <button type="button" onClick={() => setConfirmOut(true)}>
                <ItemMedia>
                  <LogOut className="size-5" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Sair da conta</ItemTitle>
                </ItemContent>
              </button>
            </Item>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmOut}
        onOpenChange={setConfirmOut}
        title="Sair da conta?"
        description="Seus dados continuam salvos na nuvem. É só entrar de novo para ver tudo."
        confirm="Sair"
        onConfirm={() => logout()}
      />
    </AppShell>
  )
}
