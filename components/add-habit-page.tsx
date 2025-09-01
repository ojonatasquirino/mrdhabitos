"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus } from "lucide-react";

interface AddHabitPageProps {
  onAdd: (name: string) => void;
  onCancel: () => void;
}

export function AddHabitPage({ onAdd, onCancel }: AddHabitPageProps) {
  const [habitName, setHabitName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (habitName.trim()) {
      onAdd(habitName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Novo Hábito</h1>
            <p className="text-sm text-muted-foreground">
              Crie um novo hábito para acompanhar
            </p>
          </div>
        </div>

        <Card className="floating-card border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Cadastro de Hábito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="habitName" className="text-base font-medium">
                  Nome do Hábito
                </Label>
                <Input
                  id="habitName"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="Ex: Beber 2 copos de água"
                  required
                  className="min-h-[48px] text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Dica: Seja específico e comece pequeno. Ler 1 página é melhor
                  que Ler mais.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="flex-1 min-h-[48px] shadow-lg"
                  disabled={!habitName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Hábito
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 bg-transparent min-h-[48px]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
