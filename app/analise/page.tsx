"use client"

import dynamic from "next/dynamic"
import { useHabits } from "@/hooks/use-habits"

// Recharts só é baixado quando a tela de análise abre
const AnalysisPage = dynamic(() => import("@/components/analysis-page").then((m) => m.AnalysisPage), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-background" aria-busy="true" />,
})

export default function AnalysisRoute() {
  const { habits, notes } = useHabits()
  return <AnalysisPage habits={habits} notes={notes} />
}
