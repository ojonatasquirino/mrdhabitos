"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { AppShell, PageHeader } from "@/components/app-shell"
import { useHabits } from "@/hooks/use-habits"

const VisionBoard = dynamic(() => import("@/components/vision-board").then((m) => m.VisionBoard), {
  ssr: false,
  loading: () => <div className="h-[60vh] animate-pulse rounded-[2rem] bg-muted" />,
})

export default function VisionRoute() {
  const { profile, ready } = useHabits()
  return (
    <AppShell>
      <PageHeader subtitle="Quadro de visão" title="Visão" />
      {ready && !profile.visionEnabled ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-semibold">O quadro de visão está desligado.</p>
          <Link href="/perfil" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
            Ligar no Perfil
          </Link>
        </div>
      ) : (
        <VisionBoard />
      )}
    </AppShell>
  )
}
