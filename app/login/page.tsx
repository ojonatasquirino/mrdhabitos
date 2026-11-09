"use client"

import { useState } from "react"
import { Target } from "lucide-react"
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
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-4xl font-bold">MRD</h1>
          <h2 className="text-xl font-medium text-gray-300">Mínimo Ridículo Diário</h2>
          <p className="text-gray-400 leading-relaxed">
            Construa hábitos com tarefas tão pequenas que será ridículo não executar. A consistência supera a
            intensidade.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden text-center space-y-3">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-black">MRD</h1>
            <p className="text-sm text-gray-600">Faça o mínimo ridículo diariamente. Este é o segredo.</p>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-semibold text-black">
              {mode === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
            </h2>
            <p className="text-sm text-gray-600">Seus hábitos sincronizados em qualquer dispositivo.</p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => run(signInGoogle)}
            className="w-full min-h-[48px] bg-white text-black border-gray-300 hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Continuar com Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-gray-200" />
            ou com e-mail
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-black">Nome</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                  className="min-h-[48px] bg-white text-black border-gray-300" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" className="min-h-[48px] bg-white text-black border-gray-300" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="min-h-[48px] bg-white text-black border-gray-300" />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="w-full min-h-[48px] bg-black text-white hover:bg-gray-800">
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600">
            {mode === "login" ? "Não tem uma conta? " : "Já tem conta? "}
            <button type="button" className="text-black underline hover:no-underline"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}>
              {mode === "login" ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
