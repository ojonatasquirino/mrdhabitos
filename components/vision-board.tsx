"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Bold,
  Copy,
  ImagePlus,
  Italic,
  Maximize2,
  MessageCircle,
  Minimize2,
  Scan,
  Trash2,
  Type,
  X,
} from "lucide-react"
import { BottomSheet } from "@/components/ui-kit"
import { useVision } from "@/hooks/use-vision"
import { FONT_FAMILY, FONT_LABEL, SIZES, compressImage, type VisionFont, type VisionItem } from "@/lib/vision"
import { cn } from "@/lib/utils"

interface View {
  x: number
  y: number
  s: number
}

type Gesture =
  | { mode: "move"; id: string; px: number; py: number; ox: number; oy: number; moved: boolean }
  | { mode: "resize"; id: string; px: number; w0: number }
  | { mode: "pan"; px: number; py: number; vx: number; vy: number; moved: boolean }
  | { mode: "pinch"; d0: number; cx: number; cy: number; v0: View }

const clampS = (s: number) => Math.min(3, Math.max(0.2, s))

/** Quadro livre estilo moodboard: arrastar, pinçar para zoom, redimensionar mantendo a proporção. */
export function VisionBoard() {
  const { ready, items, images, update, addImage, removeImage } = useVision()
  const [view, setView] = useState<View>({ x: 0, y: 0, s: 1 })
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showComment, setShowComment] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState<{ id: string; text: string } | null>(null)
  const [presenting, setPresenting] = useState(false)
  const [busy, setBusy] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const lastTap = useRef<{ id: string; t: number } | null>(null)
  const fitted = useRef(false)

  const sel = items.find((i) => i.id === selected)
  const patch = useCallback(
    (id: string, p: Partial<VisionItem>) => update((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i))),
    [update],
  )
  const heightOf = (i: VisionItem) => (i.type === "image" ? i.w / (i.ratio || 1) : (i.size ?? 32) * 1.4)

  /** enquadra todos os itens na tela */
  const fit = useCallback(() => {
    const el = box.current
    if (!el || !items.length) {
      setView({ x: 24, y: 24, s: 1 })
      return
    }
    const minX = Math.min(...items.map((i) => i.x))
    const minY = Math.min(...items.map((i) => i.y))
    const maxX = Math.max(...items.map((i) => i.x + i.w))
    const maxY = Math.max(...items.map((i) => i.y + heightOf(i)))
    const pad = 32
    const s = clampS(Math.min((el.clientWidth - pad * 2) / (maxX - minX || 1), (el.clientHeight - pad * 2) / (maxY - minY || 1), 1.2))
    setView({
      s,
      x: (el.clientWidth - (maxX - minX) * s) / 2 - minX * s,
      y: (el.clientHeight - (maxY - minY) * s) / 2 - minY * s,
    })
  }, [items])

  useEffect(() => {
    if (ready && !fitted.current) {
      fitted.current = true
      requestAnimationFrame(fit)
    }
  }, [ready, fit])

  useEffect(() => {
    if (presenting) requestAnimationFrame(fit)
  }, [presenting, fit])

  /** ponto central da área visível, em coordenadas do quadro */
  const center = () => {
    const el = box.current!
    return { x: (el.clientWidth / 2 - view.x) / view.s, y: (el.clientHeight / 2 - view.y) / view.s }
  }
  const topZ = () => Math.max(0, ...items.map((i) => i.z)) + 1

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const c = center()
    const created: VisionItem[] = []
    let z = topZ()
    for (const [n, file] of Array.from(files).entries()) {
      try {
        const { data, ratio } = await compressImage(file)
        const imageId = crypto.randomUUID()
        await addImage(imageId, data)
        const w = 260 / view.s
        created.push({
          id: crypto.randomUUID(),
          type: "image",
          imageId,
          ratio,
          w,
          x: c.x - w / 2 + n * 24,
          y: c.y - w / ratio / 2 + n * 24,
          z: z++,
        })
      } catch (e) {
        console.error(e)
      }
    }
    update((list) => [...list, ...created])
    if (created.length) setSelected(created[created.length - 1].id)
    setBusy(false)
  }

  const addText = (below?: VisionItem) => {
    const c = center()
    const item: VisionItem = {
      id: crypto.randomUUID(),
      type: "text",
      text: "",
      font: "serif",
      size: below ? 20 : 32,
      w: below ? below.w : 280 / view.s,
      x: below ? below.x : c.x - 140 / view.s,
      y: below ? below.y + heightOf(below) + 10 : c.y - 20,
      z: topZ(),
    }
    update((list) => [...list, item])
    setSelected(item.id)
    setEditing(item.id)
  }

  const remove = (id: string) => {
    const it = items.find((i) => i.id === id)
    update((list) => list.filter((i) => i.id !== id))
    if (it?.imageId && !items.some((i) => i.id !== id && i.imageId === it.imageId)) removeImage(it.imageId)
    setSelected(null)
  }

  /* ---------------- gestos ---------------- */

  const startItem = (e: React.PointerEvent, it: VisionItem, mode: "move" | "resize") => {
    if (presenting || editing === it.id) return
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    setSelected(it.id)
    if (mode === "resize") gesture.current = { mode, id: it.id, px: e.clientX, w0: it.w }
    else gesture.current = { mode, id: it.id, px: e.clientX, py: e.clientY, ox: it.x, oy: it.y, moved: false }
  }

  const onBoardDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        mode: "pinch",
        d0: Math.hypot(a.x - b.x, a.y - b.y),
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
        v0: view,
      }
      return
    }
    if (gesture.current?.mode === "move" || gesture.current?.mode === "resize") return
    gesture.current = { mode: "pan", px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false }
  }

  const onMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    if (g.mode === "move") {
      const dx = (e.clientX - g.px) / view.s
      const dy = (e.clientY - g.py) / view.s
      if (Math.abs(dx) + Math.abs(dy) > 2) g.moved = true
      patchLocal(g.id, { x: g.ox + dx, y: g.oy + dy })
    } else if (g.mode === "resize") {
      const w = Math.max(60, g.w0 + (e.clientX - g.px) / view.s)
      patchLocal(g.id, { w })
    } else if (g.mode === "pan") {
      if (Math.abs(e.clientX - g.px) + Math.abs(e.clientY - g.py) > 3) g.moved = true
      setView((v) => ({ ...v, x: g.vx + e.clientX - g.px, y: g.vy + e.clientY - g.py }))
    } else if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const r = box.current!.getBoundingClientRect()
      const s = clampS(g.v0.s * (Math.hypot(a.x - b.x, a.y - b.y) / g.d0))
      const cx = g.cx - r.left
      const cy = g.cy - r.top
      const ncx = (a.x + b.x) / 2 - r.left
      const ncy = (a.y + b.y) / 2 - r.top
      setView({ s, x: ncx - ((cx - g.v0.x) / g.v0.s) * s, y: ncy - ((cy - g.v0.y) / g.v0.s) * s })
    }
  }

  // durante o arrasto só atualiza a tela; grava no fim do gesto
  const [live, setLive] = useState<Record<string, Partial<VisionItem>>>({})
  const patchLocal = (id: string, p: Partial<VisionItem>) => setLive((l) => ({ ...l, [id]: { ...l[id], ...p } }))

  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (g && (g.mode === "move" || g.mode === "resize")) {
      const p = live[g.id]
      if (p) patch(g.id, { ...p, ...(g.mode === "move" && g.moved ? { z: topZ() } : {}) })
      setLive((l) => {
        const n = { ...l }
        delete n[g.id]
        return n
      })
      // toque duplo no texto: editar; toque na foto: mostra o comentário
      if (g.mode === "move" && !g.moved) {
        const it = items.find((i) => i.id === g.id)
        const now = Date.now()
        if (it?.type === "text" && lastTap.current?.id === it.id && now - lastTap.current.t < 350) setEditing(it.id)
        if (it?.type === "image" && it.comment) setShowComment((c) => (c === it.id ? null : it.id))
        lastTap.current = { id: g.id, t: now }
      }
    }
    if (g?.mode === "pan" && !g.moved) {
      setSelected(null)
      setShowComment(null)
    }
    if (pointers.current.size === 0) gesture.current = null
    else if (g?.mode === "pinch") gesture.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    const r = box.current!.getBoundingClientRect()
    if (e.ctrlKey || e.metaKey) {
      const s = clampS(view.s * Math.exp(-e.deltaY * 0.01))
      const cx = e.clientX - r.left
      const cy = e.clientY - r.top
      setView({ s, x: cx - ((cx - view.x) / view.s) * s, y: cy - ((cy - view.y) / view.s) * s })
    } else setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
  }

  /* ---------------- render ---------------- */

  const board = (
    <div
      ref={box}
      onPointerDown={onBoardDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onWheel={onWheel}
      className={cn(
        "relative touch-none select-none overflow-hidden",
        presenting ? "h-full w-full" : "h-full w-full rounded-[2rem] bg-muted/50",
      )}
      style={{
        backgroundImage: presenting ? undefined : "radial-gradient(circle, var(--border) 1px, transparent 1px)",
        backgroundSize: `${24 * view.s}px ${24 * view.s}px`,
        backgroundPosition: `${view.x}px ${view.y}px`,
      }}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
        {[...items]
          .sort((a, b) => a.z - b.z)
          .map((raw) => {
            const it = { ...raw, ...live[raw.id] }
            const isSel = selected === it.id && !presenting
            return (
              <div
                key={it.id}
                onPointerDown={(e) => startItem(e, it, "move")}
                className="absolute"
                style={{ left: it.x, top: it.y, width: it.w, zIndex: showComment === it.id ? 100000 : it.z }}
              >
                {it.type === "image" ? (
                  <div className="relative" style={{ height: it.w / (it.ratio || 1) }}>
                    {images[it.imageId!] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={images[it.imageId!]}
                        alt=""
                        draggable={false}
                        className="pointer-events-none h-full w-full rounded-2xl object-cover shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse rounded-2xl bg-muted" />
                    )}
                    {it.comment && !presenting && (
                      <span
                        className="absolute -right-2 -top-2 flex items-center justify-center rounded-full bg-foreground text-background shadow"
                        style={{ width: 26 / view.s, height: 26 / view.s }}
                      >
                        <MessageCircle style={{ width: 13 / view.s, height: 13 / view.s }} />
                      </span>
                    )}
                    {showComment === it.id && it.comment && (
                      <div
                        className="glass absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 rounded-2xl px-4 py-3 text-sm leading-snug"
                        style={{ transform: `translateX(-50%) scale(${1 / view.s})`, transformOrigin: "top center", width: 240 }}
                      >
                        {it.comment}
                      </div>
                    )}
                  </div>
                ) : editing === it.id ? (
                  <textarea
                    autoFocus
                    defaultValue={it.text}
                    onPointerDown={(e) => e.stopPropagation()}
                    onBlur={(e) => {
                      const text = e.target.value.trim()
                      setEditing(null)
                      if (!text) remove(it.id)
                      else patch(it.id, { text })
                    }}
                    rows={2}
                    placeholder="Escreva aqui"
                    className="w-full resize-none rounded-lg bg-background/80 p-1 outline-none ring-2 ring-sky-500"
                    style={fontStyle(it)}
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words leading-tight" style={fontStyle(it)}>
                    {it.text}
                  </p>
                )}

                {isSel && editing !== it.id && (
                  <>
                    <span
                      className="pointer-events-none absolute -inset-1 rounded-[1.1rem] border-sky-500"
                      style={{ borderWidth: 2 / view.s }}
                    />
                    <span
                      onPointerDown={(e) => startItem(e, it, "resize")}
                      aria-label="Redimensionar"
                      className="absolute -bottom-3 -right-3 flex cursor-nwse-resize items-center justify-center rounded-full border-sky-500 bg-white shadow"
                      style={{ width: 26 / view.s, height: 26 / view.s, borderWidth: 2 / view.s }}
                    />
                  </>
                )}
              </div>
            )
          })}
      </div>

      {ready && !items.length && !presenting && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-sm">
            <ImagePlus className="h-6 w-6" />
          </span>
          <p className="mt-4 text-lg font-semibold">Visualize o futuro que você está construindo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Fotos da família, do setup, dos lugares e das conquistas. Arraste, aumente e escreva por cima.
          </p>
        </div>
      )}
    </div>
  )

  if (presenting)
    return (
      <div className="fixed inset-0 z-[80] bg-background">
        {board}
        <button
          type="button"
          aria-label="Sair da apresentação"
          onClick={() => setPresenting(false)}
          className="glass safe-top absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      </div>
    )

  return (
    <div className="relative -mx-5 h-[calc(100dvh-13rem)] lg:-mx-10 lg:h-[calc(100dvh-11rem)] lg:mx-0">
      {board}

      {/* ações do quadro */}
      <div className="absolute right-3 top-3 flex gap-2">
        <ToolBtn label="Enquadrar tudo" onClick={fit}>
          <Scan className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn label="Apresentar" onClick={() => setPresenting(true)} disabled={!items.length}>
          <Maximize2 className="h-4 w-4" />
        </ToolBtn>
      </div>
      <div className="absolute left-3 top-3 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="glass pressable flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" /> {busy ? "Enviando..." : "Imagem"}
        </button>
        <button
          type="button"
          onClick={() => addText()}
          className="glass pressable flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold"
        >
          <Type className="h-4 w-4" /> Texto
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {/* barra do item selecionado */}
      {sel && !editing && (
        <div className="absolute inset-x-3 bottom-3 flex justify-center">
          <div className="glass flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {sel.type === "text" ? (
              <>
                <select
                  value={sel.font ?? "serif"}
                  onChange={(e) => patch(sel.id, { font: e.target.value as VisionFont })}
                  className="h-9 rounded-full bg-muted px-3 text-sm font-medium outline-none"
                  aria-label="Fonte"
                >
                  {(Object.keys(FONT_LABEL) as VisionFont[]).map((f) => (
                    <option key={f} value={f}>
                      {FONT_LABEL[f]}
                    </option>
                  ))}
                </select>
                {SIZES.map((sz) => (
                  <ToolBtn
                    key={sz.px}
                    label={`Tamanho ${sz.label}`}
                    active={(sel.size ?? 32) === sz.px}
                    onClick={() => patch(sel.id, { size: sz.px })}
                    flat
                  >
                    <span className="text-xs font-bold">{sz.label}</span>
                  </ToolBtn>
                ))}
                <ToolBtn label="Negrito" active={sel.bold} onClick={() => patch(sel.id, { bold: !sel.bold })} flat>
                  <Bold className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn label="Itálico" active={sel.italic} onClick={() => patch(sel.id, { italic: !sel.italic })} flat>
                  <Italic className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn label="Editar texto" onClick={() => setEditing(sel.id)} flat>
                  <Type className="h-4 w-4" />
                </ToolBtn>
              </>
            ) : (
              <>
                <ToolBtn
                  label="Comentário"
                  onClick={() => setCommentDraft({ id: sel.id, text: sel.comment ?? "" })}
                  active={!!sel.comment}
                  flat
                >
                  <MessageCircle className="h-4 w-4" />
                </ToolBtn>
                <ToolBtn label="Texto abaixo" onClick={() => addText(sel)} flat>
                  <Type className="h-4 w-4" />
                </ToolBtn>
              </>
            )}
            <ToolBtn label="Trazer para frente" onClick={() => patch(sel.id, { z: topZ() })} flat>
              <ArrowUpToLine className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              label="Mandar para trás"
              onClick={() => patch(sel.id, { z: Math.min(0, ...items.map((i) => i.z)) - 1 })}
              flat
            >
              <ArrowDownToLine className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn
              label="Duplicar"
              onClick={() => {
                const copy = { ...sel, id: crypto.randomUUID(), x: sel.x + 24, y: sel.y + 24, z: topZ() }
                update((l) => [...l, copy])
                setSelected(copy.id)
              }}
              flat
            >
              <Copy className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn label="Apagar" onClick={() => remove(sel.id)} flat danger>
              <Trash2 className="h-4 w-4" />
            </ToolBtn>
          </div>
        </div>
      )}

      <BottomSheet open={!!commentDraft} onClose={() => setCommentDraft(null)}>
        <h2 className="text-lg font-semibold">Comentário</h2>
        <p className="mt-1 text-sm text-muted-foreground">Aparece ao tocar na imagem.</p>
        <textarea
          autoFocus
          value={commentDraft?.text ?? ""}
          onChange={(e) => setCommentDraft((d) => (d ? { ...d, text: e.target.value } : d))}
          rows={3}
          maxLength={280}
          placeholder="Ex: Nossa casa na serra, 2028."
          className="mt-4 w-full resize-none rounded-xl bg-muted p-3 text-base outline-none"
        />
        <div className="mb-2 mt-3 flex gap-2">
          {commentDraft?.text && (
            <button
              type="button"
              onClick={() => {
                if (commentDraft) patch(commentDraft.id, { comment: undefined })
                setCommentDraft(null)
              }}
              className="pressable h-12 rounded-2xl bg-muted px-4 font-semibold"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (commentDraft) patch(commentDraft.id, { comment: commentDraft.text.trim() || undefined })
              setCommentDraft(null)
            }}
            className="pressable h-12 flex-1 rounded-2xl bg-foreground font-semibold text-background"
          >
            Salvar
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

function fontStyle(it: VisionItem): React.CSSProperties {
  return {
    fontFamily: FONT_FAMILY[it.font ?? "serif"],
    fontSize: it.size ?? 32,
    fontWeight: it.bold ? 700 : 500,
    fontStyle: it.italic ? "italic" : "normal",
  }
}

function ToolBtn({
  label,
  onClick,
  children,
  active,
  disabled,
  flat,
  danger,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  flat?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-40",
        !flat && "glass h-10 w-10",
        active && "bg-foreground text-background",
        danger && "text-red-500",
      )}
    >
      {children}
    </button>
  )
}
