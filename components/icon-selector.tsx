"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface IconSelectorProps {
  selectedIcon: string
  onIconSelect: (icon: string) => void
}

const HABIT_ICONS = [
  "🎯", "💧", "📚", "🏃‍♂️", "🧘‍♀️", "🍎", "💤", "✍️",
  "🎵", "🌱", "💪", "🧠", "❤️", "☀️", "🌙", "⭐",
  "🔥", "🌈", "🎨", "📝", "🔔", "🎪", "🚀", "💎",
  "🌿", "🍃", "🌸", "🌺", "🌻", "🌷", "🌹", "🌼",
  "🎭", "🎪", "🎨", "🎬", "🎤", "🎧", "🎸", "🎹",
  "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️",
  "💡", "🔋", "⚡", "🌟", "✨", "💫", "🌠", "🔮",
  "🎲", "🎯", "🎳", "🎮", "🕹️", "🎰", "🃏", "🀄",
  "📱", "💻", "⌨️", "🖥️", "🖨️", "📷", "📹", "🎥",
  "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏧",
  "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
  "🍽️", "🍴", "🥄", "🍽️", "🥢", "🍱", "🍲", "🍳",
  "👕", "👖", "👗", "👘", "👙", "👚", "👛", "👜",
  "🎓", "👑", "🎩", "⛑️", "🪖", "👒", "🎒", "🧳"
]

export function IconSelector({ selectedIcon, onIconSelect }: IconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Ícone:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="min-h-[44px] min-w-[44px] p-2 text-2xl"
        >
          {selectedIcon}
        </Button>
        <span className="text-sm text-muted-foreground">
          Clique para escolher um ícone
        </span>
      </div>

      {isOpen && (
        <Card className="floating-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Escolha um ícone para seu hábito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
              {HABIT_ICONS.map((icon) => (
                <Button
                  key={icon}
                  type="button"
                  variant={selectedIcon === icon ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    onIconSelect(icon)
                    setIsOpen(false)
                  }}
                  className="min-h-[44px] min-w-[44px] p-2 text-xl hover:scale-110 transition-transform"
                >
                  {icon}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
