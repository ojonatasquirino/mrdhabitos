import { Skeleton } from "@/components/ui/skeleton"

/** Esqueleto de carregamento das telas de detalhe, no lugar da tela em branco. */
export function PageSkeleton() {
  return (
    <div className="mx-auto min-h-screen max-w-md space-y-3 bg-background px-5 pt-8" aria-busy="true">
      <Skeleton className="mx-auto mb-6 h-7 w-44" />
      <Skeleton className="h-36 rounded-3xl" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      <Skeleton className="h-48 rounded-3xl" />
    </div>
  )
}
