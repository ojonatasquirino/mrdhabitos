"use client"

import { PageSkeleton } from "@/components/page-skeleton"
import dynamic from "next/dynamic"
import { useHabits } from "@/hooks/use-habits"

// Recharts só é baixado quando a tela de análise abre
const AnalysisPage = dynamic(() => import("@/components/analysis-page").then((m) => m.AnalysisPage), {
  ssr: false,
  loading: () => <PageSkeleton />,
})

export default function AnalysisRoute() {
  const { habits, notes, sleep, profile } = useHabits()
  return <AnalysisPage habits={habits} notes={notes} sleep={sleep} sleepGoal={profile.sleepGoal} />
}
