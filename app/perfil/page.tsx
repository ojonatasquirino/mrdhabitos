"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BookOpen, Camera, ChevronRight, LogOut, Moon, Sun, Trash2 } from "lucide-react"
import { AppShell, IconButton, PageHeader } from "@/components/app-shell"
import { Avatar, imageToAvatar } from "@/components/avatar"
import { Button } from "@/components/ui/button"
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
  const [msg, setMsg] = useState("")
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
              setMsg("")
            } catch {
              setMsg("Não consegui ler essa imagem. Tente outra.")
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

      <label className="mt-8 block">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nome ou apelido</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder={fallbackName ?? "Como quer ser chamado?"}
          className="mt-2 w-full rounded-2xl bg-muted px-4 py-4 text-lg font-medium outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-foreground/10"
        />
      </label>

      <Button
        disabled={!dirty}
        className="mt-4 h-12 w-full rounded-2xl text-base"
        onClick={() => {
          setProfile({ ...profile, name, photo })
          setMsg("Perfil salvo.")
        }}
      >
        Salvar
      </Button>
      {msg && <p className="mt-3 text-center text-sm text-muted-foreground">{msg}</p>}

      <div className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border">
        <Link href="/guia" className="flex w-full items-center gap-3 px-5 py-4 text-left">
          <BookOpen className="h-5 w-5" />
          <span className="flex-1 text-sm font-medium">Guia de uso</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <button type="button" onClick={toggle} className="flex w-full items-center gap-3 px-5 py-4 text-left">
          {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span className="flex-1 text-sm font-medium">Tema</span>
          <span className="text-sm text-muted-foreground">{theme === "dark" ? "Escuro" : "Claro"}</span>
        </button>
        {user?.email && (
          <div className="flex items-center gap-3 px-5 py-4">
            <span className="flex-1 text-sm font-medium">Conta</span>
            <span className="truncate text-sm text-muted-foreground">{user.email}</span>
          </div>
        )}
        {authEnabled && user && (
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-3 px-5 py-4 text-left text-red-500"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Sair da conta</span>
          </button>
        )}
      </div>
    </AppShell>
  )
}
