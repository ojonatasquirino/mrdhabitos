export type VisionFont = "sans" | "serif" | "mono" | "hand"

export interface VisionItem {
  id: string
  type: "image" | "text"
  /** posição e largura em pixels do quadro (o zoom não altera esses valores) */
  x: number
  y: number
  w: number
  /** camada: maior fica na frente */
  z: number
  /** imagem: id do documento com os bytes e proporção largura/altura */
  imageId?: string
  ratio?: number
  /** comentário ao tocar na imagem */
  comment?: string
  /** texto */
  text?: string
  font?: VisionFont
  size?: number
  bold?: boolean
  italic?: boolean
}

export const FONT_FAMILY: Record<VisionFont, string> = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "ui-serif, 'New York', Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), ui-monospace, monospace",
  hand: "'Caveat', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
}

export const FONT_LABEL: Record<VisionFont, string> = { sans: "Sans", serif: "Serif", mono: "Mono", hand: "Manuscrita" }

export const SIZES = [
  { label: "P", px: 20 },
  { label: "M", px: 32 },
  { label: "G", px: 48 },
  { label: "T", px: 72 },
]

/**
 * Comprime a foto no próprio aparelho: lado maior até 1600px, WebP.
 * Fica bem abaixo do limite de 1 MB por documento do Firestore, sem perda visível.
 */
export async function compressImage(file: File): Promise<{ data: string; ratio: number }> {
  const bitmap = await createImageBitmap(file)
  const max = 1600
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  let quality = 0.82
  let data = canvas.toDataURL("image/webp", quality)
  // navegadores sem WebP devolvem PNG: usa JPEG
  if (!data.startsWith("data:image/webp")) data = canvas.toDataURL("image/jpeg", quality)
  while (data.length > 900_000 && quality > 0.4) {
    quality -= 0.12
    data = canvas.toDataURL(data.startsWith("data:image/webp") ? "image/webp" : "image/jpeg", quality)
  }
  return { data, ratio: w / h }
}
