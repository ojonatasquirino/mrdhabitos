"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Target } from "lucide-react"

interface LoginPageProps {
  onLogin: (userName: string) => void
}

interface User {
  name: string
  password: string
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loginData, setLoginData] = useState({ name: "", password: "" })
  const [registerData, setRegisterData] = useState({ name: "", password: "", confirmPassword: "" })
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const savedUsers = localStorage.getItem("mrd-users")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    }
  }, [])

  const saveUsers = (newUsers: User[]) => {
    localStorage.setItem("mrd-users", JSON.stringify(newUsers))
    setUsers(newUsers)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const user = users.find((u) => u.name === loginData.name && u.password === loginData.password)
    if (user) {
      localStorage.setItem("mrd-current-user", user.name)
      onLogin(user.name)
    } else {
      setError("Nome ou senha incorretos")
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()

    if (registerData.password !== registerData.confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (registerData.name.length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres")
      return
    }

    if (registerData.password.length < 4) {
      setError("Senha deve ter pelo menos 4 caracteres")
      return
    }

    const userExists = users.find((u) => u.name === registerData.name)
    if (userExists) {
      setError("Usuário já existe")
      return
    }

    const newUser: User = {
      name: registerData.name,
      password: registerData.password,
    }

    const newUsers = [...users, newUser]
    saveUsers(newUsers)
    localStorage.setItem("mrd-current-user", newUser.name)
    onLogin(newUser.name)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Seção de Branding - Lado Esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-center items-center p-12">
        <div className="max-w-md text-center space-y-6">
          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-black" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">MRD</h1>
            <h2 className="text-xl font-medium text-gray-300">Mínimo Ridículo Diário</h2>
            <p className="text-gray-400 leading-relaxed">Faça o mínimo ridículo diariamente. Este é o segredo.</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Construa hábitos com tarefas tão pequenas que será ridículo não executar. A consistência supera a
              intensidade.
            </p>
          </div>
        </div>
      </div>

      {/* Seção de Login - Lado Direito */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header Mobile */}
          <div className="lg:hidden text-center space-y-4 mb-8">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-black">MRD</h1>
              <p className="text-sm font-medium text-gray-800 mt-1">Mínimo Ridículo Diário • Rastreador de tarefas</p>
              <p className="text-sm text-gray-600 mt-2">Faça o mínimo ridículo diariamente. Este é o segredo.</p>
            </div>
          </div>

          <div className="space-y-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-black">
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-black">Bem-vindo de volta</h2>
                    <p className="text-sm text-gray-600">
                      Não tem uma conta?{" "}
                      <button
                        type="button"
                        className="text-black underline hover:no-underline"
                        onClick={() => {
                          const registerTab = document.querySelector('[value="register"]') as HTMLElement
                          registerTab?.click()
                        }}
                      >
                        Cadastre-se
                      </button>
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-name" className="text-black font-medium">
                        Nome
                      </Label>
                      <Input
                        id="login-name"
                        type="text"
                        value={loginData.name}
                        onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                        placeholder="Digite seu nome"
                        className="h-12 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-black font-medium">
                        Senha
                      </Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        placeholder="Digite sua senha"
                        className="h-12 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                    <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium">
                      Entrar
                    </Button>
                  </form>
                </div>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-black">Criar conta</h2>
                    <p className="text-sm text-gray-600">
                      Já tem uma conta?{" "}
                      <button
                        type="button"
                        className="text-black underline hover:no-underline"
                        onClick={() => {
                          const loginTab = document.querySelector('[value="login"]') as HTMLElement
                          loginTab?.click()
                        }}
                      >
                        Faça login
                      </button>
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-black font-medium">
                        Nome
                      </Label>
                      <Input
                        id="register-name"
                        type="text"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        placeholder="Escolha um nome"
                        className="h-12 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-black font-medium">
                        Senha
                      </Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        placeholder="Crie uma senha"
                        className="h-12 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-black font-medium">
                        Confirmar Senha
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        placeholder="Confirme sua senha"
                        className="h-12 border-gray-300 focus:border-black focus:ring-black"
                        required
                      />
                    </div>
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
                    <Button type="submit" className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium">
                      Cadastrar
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
