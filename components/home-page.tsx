"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddHabitPage } from "@/components/add-habit-page"
import { HabitDetailPage } from "@/components/habit-detail-page"
import { AnalysisPage } from "@/components/analysis-page"
import { Trash2, Plus, BarChart3, TrendingUp, LogOut } from "lucide-react"

interface Habit {
  id: string
  name: string
  completions: Record<string, boolean> // date string -> completed
}

export interface HomePageProps {
  onLogout: () => void
}

export function HomePage({ onLogout }: HomePageProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [currentPage, setCurrentPage] = useState<"home" | "add" | "detail" | "analysis">("home")
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)

  useEffect(() => {
    // Load habits from localStorage
    const savedHabits = localStorage.getItem("minimo-ridiculo-habits")
    if (savedHabits) {
      setHabits(JSON.parse(savedHabits))
    }
  }, [])

  const saveHabits = (newHabits: Habit[]) => {
    setHabits(newHabits)
    localStorage.setItem("minimo-ridiculo-habits", JSON.stringify(newHabits))
  }

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      completions: {},
    }
    saveHabits([...habits, newHabit])
    setCurrentPage("home")
  }

  const deleteHabit = (id: string) => {
    saveHabits(habits.filter((habit) => habit.id !== id))
  }

  const updateHabit = (updatedHabit: Habit) => {
    saveHabits(habits.map((habit) => (habit.id === updatedHabit.id ? updatedHabit : habit)))
  }

  const getWeekDays = () => {
    const today = new Date()
    const currentDay = today.getDay() // 0 = domingo, 1 = segunda, etc.
    const days = []

    // Calcular o domingo da semana atual
    const sunday = new Date(today)
    sunday.setDate(today.getDate() - currentDay)

    // Gerar os 7 dias da semana começando no domingo
    for (let i = 0; i < 7; i++) {
      const date = new Date(sunday)
      date.setDate(sunday.getDate() + i)
      days.push(date.toISOString().split("T")[0])
    }

    return days
  }

  const getHabitProgress = (habit: Habit) => {
    const weekDays = getWeekDays()
    const completedDays = weekDays.filter((date) => habit.completions[date] === true).length
    return { completed: completedDays, total: 7, percentage: (completedDays / 7) * 100 }
  }

  const CircularProgress = ({ percentage, size = 40 }: { percentage: number; size?: number }) => {
    const radius = (size - 4) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-muted"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="text-primary progress-ring"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-semibold text-foreground">{Math.round(percentage)}%</span>
      </div>
    )
  }

  const HabitDayIndicator = ({ habit, date, dayName }: { habit: Habit; date: string; dayName: string }) => {
    const completion = habit.completions[date]
    let bgColor = "bg-muted"
    let textColor = "text-muted-foreground"
    let icon = "○"

    if (completion === true) {
      bgColor = "bg-green-500"
      textColor = "text-white"
      icon = "✓"
    } else if (completion === false) {
      bgColor = "bg-red-500"
      textColor = "text-white"
      icon = "✕"
    }

    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground">{dayName}</span>
        <div
          className={`w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center text-sm font-semibold habit-day cursor-pointer`}
        >
          {icon}
        </div>
      </div>
    )
  }

  const getDayName = (index: number) => {
    const dayNames = ["D", "S", "T", "Q", "Q", "S", "S"]
    return dayNames[index]
  }

  if (currentPage === "add") {
    return <AddHabitPage onAdd={addHabit} onCancel={() => setCurrentPage("home")} />
  }

  if (currentPage === "detail" && selectedHabitId) {
    const habit = habits.find((h) => h.id === selectedHabitId)
    if (habit) {
      return <HabitDetailPage habit={habit} onUpdate={updateHabit} onBack={() => setCurrentPage("home")} />
    }
  }

  if (currentPage === "analysis") {
    return <AnalysisPage habits={habits} onBack={() => setCurrentPage("home")} />
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">MRD</h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-1 font-medium">
              {"Faça o mínimo ridículo diariamente. Este é o segredo.\n"}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage("analysis")}
              className="shadow-sm flex-1 sm:flex-none min-h-[44px]"
            >
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Análise</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="shadow-sm bg-transparent flex-1 sm:flex-none min-h-[44px]"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {habits.length === 0 ? (
            <Card className="floating-card gradient-card border-0">
              <CardContent className="text-center py-8 sm:py-12 px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Comece sua jornada</h3>
                <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                  Nenhum hábito cadastrado ainda. Que tal começar com algo pequeno?
                </p>
                <Button
                  onClick={() => setCurrentPage("add")}
                  size="lg"
                  className="shadow-lg w-full sm:w-auto min-h-[48px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Hábito
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {habits.map((habit) => {
                const progress = getHabitProgress(habit)
                const weekDays = getWeekDays()

                return (
                  <Card key={habit.id} className="floating-card gradient-card border-0 overflow-hidden">
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <CircularProgress percentage={progress.percentage} size={40} />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-semibold text-balance leading-tight">
                              {habit.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {progress.completed} de {progress.total} dias esta semana
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHabit(habit.id)}
                          className="text-muted-foreground hover:text-destructive shrink-0 min-h-[44px] min-w-[44px]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex gap-2 sm:gap-3 justify-center sm:justify-start overflow-x-auto pb-1">
                          {weekDays.map((date, index) => (
                            <HabitDayIndicator key={date} habit={habit} date={date} dayName={getDayName(index)} />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedHabitId(habit.id)
                            setCurrentPage("detail")
                          }}
                          className="shadow-sm w-full sm:w-auto min-h-[44px]"
                        >
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              <Card
                className="floating-card border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer active:scale-95"
                onClick={() => setCurrentPage("add")}
              >
                <CardContent className="text-center py-6 sm:py-8">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-primary mb-1 text-sm sm:text-base">Adicionar Novo Hábito</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Expanda sua rotina de crescimento</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
