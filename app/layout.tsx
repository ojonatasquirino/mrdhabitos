import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { HabitsProvider } from "@/hooks/use-habits"
import "./globals.css"

export const metadata: Metadata = {
  title: "minimo ridículo - Rastreador de Hábitos",
  description: "Um rastreador de hábitos minimalista e sem distrações",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}><HabitsProvider>{children}</HabitsProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
