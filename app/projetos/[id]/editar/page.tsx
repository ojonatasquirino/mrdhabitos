"use client"

import { PageSkeleton } from "@/components/page-skeleton"
import Link from "next/link"
import { useParams } from "next/navigation"
import { EditProjectPage } from "@/components/projects"
import { useHabits } from "@/hooks/use-habits"

export default function EditProjectRoute() {
  const { id } = useParams<{ id: string }>()
  const { projects, ready } = useHabits()
  if (!ready) return <PageSkeleton />
  const project = projects.find((p) => p.id === id)
  if (!project)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
        <Link href="/projetos" className="font-semibold underline">
          Ver projetos
        </Link>
      </div>
    )
  return <EditProjectPage project={project} />
}
