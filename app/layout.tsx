import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { HabitsProvider } from "@/hooks/use-habits"
import { AuthProvider } from "@/hooks/use-auth"
import { AuthGate } from "@/components/auth-gate"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { Splash } from "@/components/splash"
import "./globals.css"

export const metadata: Metadata = {
  title: "minimo ridículo - Rastreador de Hábitos",
  description: "Um rastreador de hábitos minimalista e sem distrações",
  icons: { icon: "/favicon.ico", apple: "/apple-icon.png" },
  appleWebApp: { capable: true, title: "MRD", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Splash />
        <Suspense fallback={null}><AuthProvider>
            <AuthGate>
              <HabitsProvider>{children}</HabitsProvider>
            </AuthGate>
          </AuthProvider>
        </Suspense>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
