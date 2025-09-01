"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, TrendingUp, Target, Award, Calendar } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface Habit {
  id: string
  name: string
  completions: Record<string, boolean>
}

interface HabitDetailPageProps {
  habit: Habit
  onUpdate: (habit: Habit) => void
  onBack: () => void
}

export function HabitDetailPage({ habit, onUpdate, onBack }: HabitDetailPageProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const toggleDay = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const currentStatus = habit.completions[dateString]
    let newStatus: boolean | undefined

    if (currentStatus === undefined) {
      newStatus = true
    } else if (currentStatus === true) {
      newStatus = false
    } else {
      newStatus = undefined
    }

    const updatedCompletions = { ...habit.completions }
    if (newStatus === undefined) {
      delete updatedCompletions[dateString]
    } else {
      updatedCompletions[dateString] = newStatus
    }

    onUpdate({ ...habit, completions: updatedCompletions })
  }

  const getStatusIcon = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const completion = habit.completions[dateString]
    if (completion === true) return "✅"
    if (completion === false) return "❌"
    return "⚪️"
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getHabitChartData = () => {
    const data = []
    const today = new Date()

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i * 2) // A cada 2 dias para melhor visualização
      const dateString = date.toISOString().split("T")[0]
      const completion = habit.completions[dateString]

      data.push({
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        value: completion === true ? 100 : completion === false ? 0 : null,
      })
    }

    return data
  }

  const getHabitMetrics = () => {
    const today = new Date()

    // Streak atual
    let currentStreak = 0
    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      if (habit.completions[dateString] === true) {
        currentStreak++
      } else {
        break
      }
    }

    // Melhor streak
    let bestStreak = 0
    let tempStreak = 0
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      if (habit.completions[dateString] === true) {
        tempStreak++
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    // Taxa de sucesso dos últimos 30 dias
    let completed = 0
    const total = 30
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      if (habit.completions[dateString] === true) {
        completed++
      }
    }
    const successRate = Math.round((completed / total) * 100)

    // Dias este mês
    const thisMonth = currentDate.getMonth()
    const thisYear = currentDate.getFullYear()
    const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate()
    let monthCompleted = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(thisYear, thisMonth, day)
      const dateString = date.toISOString().split("T")[0]
      if (habit.completions[dateString] === true) {
        monthCompleted++
      }
    }

    return { currentStreak, bestStreak, successRate, monthCompleted, daysInMonth }
  }

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const metrics = getHabitMetrics()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={onBack} className="min-h-[44px] bg-transparent">
            ← Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-lg md:text-2xl font-bold truncate">{habit.name}</h1>
            <p className="text-sm text-muted-foreground">Detalhes e análise individual</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-green-500" />
              <span className="text-xs md:text-sm font-medium">Sequência</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.currentStreak}</div>
            <div className="text-xs text-muted-foreground">dias</div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-xs md:text-sm font-medium">Recorde</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.bestStreak}</div>
            <div className="text-xs text-muted-foreground">dias</div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs md:text-sm font-medium">30 dias</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.successRate}%</div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <span className="text-xs md:text-sm font-medium">Este mês</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.monthCompleted}</div>
            <div className="text-xs text-muted-foreground">de {metrics.daysInMonth}</div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="floating-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-base md:text-lg">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="min-h-[44px] min-w-[44px]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {dayNames.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentDate).map((date, index) => (
                  <div key={index} className="aspect-square">
                    {date ? (
                      <Button
                        variant="ghost"
                        className="w-full h-full flex flex-col items-center justify-center text-xs min-h-[44px]"
                        onClick={() => toggleDay(date)}
                      >
                        <span className="text-xs mb-1">{date.getDate()}</span>
                        <span className="text-sm">{getStatusIcon(date)}</span>
                      </Button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="floating-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <TrendingUp className="w-4 h-4 text-primary" />
                Tendência (últimas 2 semanas)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 md:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getHabitChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                      tickFormatter={(value) => (value === 100 ? "✓" : value === 0 ? "✗" : "")}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | null) => [
                        value === 100 ? "Feito" : value === 0 ? "Não feito" : "Não marcado",
                        "Status",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Progresso</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
