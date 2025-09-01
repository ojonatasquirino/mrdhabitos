"use client"

import { useEffect, useState } from "react"
import { LoginPage } from "@/components/login-page"
import { HomePage } from "@/components/home-page"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const currentUserName = localStorage.getItem("mrd-current-user")
    if (currentUserName) {
      setIsAuthenticated(true)
      setCurrentUser(currentUserName)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (userName: string) => {
    setIsAuthenticated(true)
    setCurrentUser(userName)
  }

  const handleLogout = () => {
    localStorage.removeItem("mrd-current-user")
    setIsAuthenticated(false)
    setCurrentUser("")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />
  }

  return <HomePage onLogout={handleLogout} currentUser={currentUser} />
}
