"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "pressable flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted",
        className,
      )}
      {...props}
    />
  )
}

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!open || !mounted) return null

  // Portal no <body>: fica acima da barra de navegação e de qualquer animação da página
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center lg:p-6" role="dialog" aria-modal="true">
      <button
        aria-label="Fechar"
        className="absolute inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="safe-bottom relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pt-3 shadow-2xl animate-in slide-in-from-bottom duration-300 lg:rounded-3xl lg:px-6 lg:pt-6 lg:pb-4 lg:zoom-in-95 lg:slide-in-from-bottom-4">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border lg:hidden" />
        {children}
      </div>
    </div>,
    document.body,
  )
}
