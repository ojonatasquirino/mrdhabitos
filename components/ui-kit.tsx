"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"

import { useEffect, useState } from "react"
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

/**
 * Painel de ações: Drawer (vaul) no celular, que fecha puxando para baixo,
 * e Dialog centralizado no desktop. Mesma API de antes (open, onClose).
 */
export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const desktop = useIsDesktop()
  if (desktop)
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-3xl sm:max-w-md" showCloseButton={false}>
          <DialogTitle className="sr-only">Painel</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    )
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[92dvh] rounded-t-3xl">
        <DrawerTitle className="sr-only">Painel</DrawerTitle>
        <div className="safe-bottom mx-auto w-full max-w-md overflow-y-auto px-5 pt-2">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const on = () => setDesktop(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return desktop
}
