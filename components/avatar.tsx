"use client"

import { cn } from "@/lib/utils"

/** Foto do perfil; sem foto, mostra a logo do MRD (nunca iniciais). */
export function Avatar({ photo, className }: { photo?: string; name?: string; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo || "/logo.webp?v=2"}
        alt={photo ? "Foto de perfil" : "MRD"}
        className="h-full w-full object-cover"
      />
    </span>
  )
}

/** Recorta no centro e reduz para um JPEG quadrado leve (cabe no Firestore). */
export async function imageToAvatar(file: File, size = 256): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("canvas indisponível")
    ctx.drawImage(
      img,
      (img.naturalWidth - side) / 2,
      (img.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    )
    return canvas.toDataURL("image/jpeg", 0.82)
  } finally {
    URL.revokeObjectURL(url)
  }
}
