"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useHabits } from "@/hooks/use-habits"
import { Button } from "@/components/ui/button"

const HabitDetailPage = dynamic(
  () => import("@/components/habit-detail-page").then((m) => m.HabitDetailPage),
  { ssr: false, loading: () => <div className="min-h-screen bg-background" aria-busy="true" /> },
)

export default function HabitRoute() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { habits, ready, updateHabit, deleteHabit } = useHabits()

  if (!ready) return <div className="min-h-screen bg-background" aria-busy="true" />

  const habit = habits.find((h) => h.id === id)
  if (!habit) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-muted-foreground">Hábito não encontrado.</p>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    )
  }

  return <HabitDetailPage
      habit={habit}
      onUpdate={updateHabit}
      onBack={() => router.push("/")}
      onDelete={(habitId) => {
        router.replace("/")
        deleteHabit(habitId)
      }}
    />
}
