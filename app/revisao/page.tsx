"use client"

import { PageSkeleton } from "@/components/page-skeleton"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { WeeklyReview } from "@/components/weekly-review"
import { useHabits } from "@/hooks/use-habits"
import { toDateKey } from "@/lib/dates"
import { weekStart } from "@/lib/review"

function Inner() {
  const params = useSearchParams()
  const { ready } = useHabits()
  if (!ready) return <PageSkeleton />
  const now = new Date()
  // domingo: revisa a semana que acabou ontem
  const fallback = toDateKey(weekStart(now.getDay() === 0 ? new Date(now.getTime() - 86400000) : now))
  return <WeeklyReview weekKey={params.get("semana") ?? fallback} />
}

export default function ReviewRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Inner />
    </Suspense>
  )
}
