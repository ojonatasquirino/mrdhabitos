"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authErrorMessage, useAuth } from "@/hooks/use-auth"

type Mode = "login" | "register"

export default function LoginPage() {
  const { signInGoogle, signInEmail, signUpEmail } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setError("")
    setLoading(true)
    try {
      await action()
    } catch (e) {
      setError(authErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    run(() => (mode === "login" ? signInEmail(email, password) : signUpEmail(name.trim(), email, password)))
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Logo MRD" width={96} height={96} className="mx-auto h-24 w-24 rounded-3xl" />
          <h1 className="text-4xl font-bold">MRD</h1>
          <h2 className="text-xl font-medium text-gray-300">Mínimo Ridículo Diário</h2>
          <p className="text-gray-400 leading-relaxed">
            Construa hábitos com tarefas tão pequenas, tão pequenas, que será ridículo não executar. A
            consistência supera a intensidade.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Logo MRD" width={72} height={72} className="mx-auto h-[72px] w-[72px] rounded-2xl shadow-lg" />
            <h1 className="text-2xl font-bold text-foreground">MRD</h1>
            <p className="mx-auto max-w-xs text-sm text-muted-foreground">
              Construa hábitos com tarefas tão pequenas, tão pequenas, que será ridículo não executar.
            </p>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-muted-foreground">Seus hábitos sincronizados em qualquer dispositivo.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => run(signInGoogle)}
            className="w-full min-h-[48px] bg-background text-foreground border-border hover:bg-muted"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Continuar com Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            ou com e-mail
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                  className="min-h-[48px] bg-background text-foreground border-border" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" className="min-h-[48px] bg-background text-foreground border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="min-h-[48px] bg-background text-foreground border-border" />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-500">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full min-h-[48px] bg-foreground text-background hover:bg-foreground/90">
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Não tem uma conta? " : "Já tem conta? "}
            <button type="button" className="text-foreground underline hover:no-underline"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}>
              {mode === "login" ? "Cadastre-se" : "Faça login"}
            </button>
          </p>

          <footer className="pt-6 text-center text-xs text-muted-foreground">
            Feito com{" "}
            <Heart className="inline h-3.5 w-3.5 -translate-y-px fill-red-500 text-red-500" aria-label="amor" /> por{" "}
            <a
              href="https://ojonatasquirino.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              ojonatasquirino.com
            </a>
          </footer>
        </div>
      </div>
    </div>
  )
}
