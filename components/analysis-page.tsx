"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { TrendingUp, Target, Calendar, Award } from "lucide-react"

interface Habit {
  id: string
  name: string
  completions: Record<string, boolean>
}

interface AnalysisPageProps {
  habits: Habit[]
  onBack: () => void
}

export function AnalysisPage({ habits, onBack }: AnalysisPageProps) {
  const getGeneralMetrics = () => {
    const today = new Date()
    const todayString = today.toISOString().split("T")[0]

    // Taxa de sucesso hoje
    const todayCompletions = habits.filter((habit) => habit.completions[todayString] === true).length
    const todayRate = habits.length > 0 ? Math.round((todayCompletions / habits.length) * 100) : 0

    // Streak atual (dias consecutivos com pelo menos 1 hábito completo)
    let currentStreak = 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      const dayCompletions = habits.filter((habit) => habit.completions[dateString] === true).length
      if (dayCompletions > 0) {
        currentStreak++
      } else {
        break
      }
    }

    // Taxa de sucesso dos últimos 7 dias
    let totalPossible = 0
    let totalCompleted = 0
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]

      totalPossible += habits.length
      totalCompleted += habits.filter((habit) => habit.completions[dateString] === true).length
    }
    const weeklyRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0

    // Melhor dia da semana
    const dayStats = Array(7)
      .fill(0)
      .map(() => ({ total: 0, completed: 0 }))
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      const dayOfWeek = date.getDay()

      dayStats[dayOfWeek].total += habits.length
      dayStats[dayOfWeek].completed += habits.filter((habit) => habit.completions[dateString] === true).length
    }

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    let bestDay = "Domingo"
    let bestRate = 0
    dayStats.forEach((stat, index) => {
      if (stat.total > 0) {
        const rate = (stat.completed / stat.total) * 100
        if (rate > bestRate) {
          bestRate = rate
          bestDay = dayNames[index]
        }
      }
    })

    return { todayRate, currentStreak, weeklyRate, bestDay }
  }

  const getLast7Days = () => {
    const days = []
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split("T")[0]
      const dayName = dayNames[date.getDay()]

      // Calculate performance (percentage of habits completed)
      const totalHabits = habits.length
      const completedHabits = habits.filter((habit) => habit.completions[dateString] === true).length
      const performance = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0

      days.push({
        day: dayName,
        performance,
        completed: completedHabits,
        total: totalHabits,
      })
    }

    return days
  }

  const chartData = getLast7Days()
  const metrics = getGeneralMetrics()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="outline" size="sm" onClick={onBack} className="min-h-[44px] bg-transparent">
            ← Voltar
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Análise Semanal</h1>
            <p className="text-sm text-muted-foreground">Visão geral do seu progresso</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-orange-500" />
              <span className="text-xs md:text-sm font-medium">Hoje</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.todayRate}%</div>
          </Card>

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
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span className="text-xs md:text-sm font-medium">7 dias</span>
            </div>
            <div className="text-xl md:text-2xl font-bold">{metrics.weeklyRate}%</div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-xs md:text-sm font-medium">Melhor dia</span>
            </div>
            <div className="text-sm md:text-base font-bold">{metrics.bestDay}</div>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Desempenho da Semana</CardTitle>
            <p className="text-sm text-muted-foreground">Porcentagem de hábitos completados por dia</p>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="day"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(
                      value: number,
                      name: string,
                      props: { payload?: { completed: number; total: number } },
                    ) => {
                      const completed = props?.payload?.completed || 0
                      const total = props?.payload?.total || 0
                      return [`${value}% (${completed}/${total})`, "Completados"]
                    }}
                  />
                  <Bar dataKey="performance" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {habits.length === 0 && (
          <Card className="mt-4">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Adicione alguns hábitos para ver a análise de desempenho.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
