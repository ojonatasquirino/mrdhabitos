"use client"

import { useRouter } from "next/navigation"
import { AddHabitPage } from "@/components/add-habit-page"
import { useHabits } from "@/hooks/use-habits"

export default function NewHabitRoute() {
  const router = useRouter()
  const { addHabit } = useHabits()

  return (
    <AddHabitPage
      onAdd={(name) => {
        addHabit(name)
        router.push("/")
      }}
      onCancel={() => router.back()}
    />
  )
}
