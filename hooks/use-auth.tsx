"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { firebaseAuth, firebaseEnabled } from "@/lib/firebase"

interface AuthContextValue {
  user: User | null
  ready: boolean
  enabled: boolean
  signInGoogle: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  signUpEmail: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!firebaseEnabled)

  useEffect(() => {
    if (!firebaseEnabled) return
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u)
      setReady(true)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      enabled: firebaseEnabled,
      signInGoogle: async () => {
        await signInWithPopup(firebaseAuth(), new GoogleAuthProvider())
      },
      signInEmail: async (email, password) => {
        await signInWithEmailAndPassword(firebaseAuth(), email, password)
      },
      signUpEmail: async (name, email, password) => {
        const cred = await createUserWithEmailAndPassword(firebaseAuth(), email, password)
        if (name) await updateProfile(cred.user, { displayName: name })
      },
      logout: async () => {
        await signOut(firebaseAuth())
      },
    }),
    [user, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>")
  return ctx
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ""
  const map: Record<string, string> = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/email-already-in-use": "Este e-mail já tem conta. Faça login.",
    "auth/weak-password": "A senha precisa de pelo menos 6 caracteres.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/network-request-failed": "Sem conexão. Tente novamente.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos.",
  }
  return map[code] ?? "Não foi possível entrar. Tente novamente."
}
