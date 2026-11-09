"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

/** Redireciona para /login quando o Firebase está ativo e não há sessão. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready, enabled } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === "/login"

  useEffect(() => {
    if (!enabled || !ready) return
    if (!user && !isLogin) router.replace("/login")
    if (user && isLogin) router.replace("/")
  }, [enabled, ready, user, isLogin, router])

  if (enabled && (!ready || (!user && !isLogin) || (user && isLogin))) {
    return <div className="min-h-screen bg-background" aria-busy="true" />
  }
  return <>{children}</>
}
