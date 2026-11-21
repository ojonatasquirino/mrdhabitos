"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import { idbDel, idbGet, idbSet } from "@/lib/idb"
import { makeThumb, type VisionItem } from "@/lib/vision"

const LOCAL_ITEMS = "mrd-vision"

/**
 * Quadro de visão, leve:
 * - users/{uid}/vision/board: só as posições (1 leitura ao abrir)
 * - users/{uid}/visionThumbs/{id}: miniatura (~20 KB) usada no quadro
 * - users/{uid}/visionImages/{id}: foto cheia, baixada só no zoom ou na apresentação
 * Tudo fica em cache no aparelho (IndexedDB): reabrir não gasta leituras e funciona offline.
 */
export function useVision() {
  const { user, ready: authReady, enabled } = useAuth()
  const uid = enabled ? user?.uid : undefined
  const [items, setItems] = useState<VisionItem[]>([])
  const [thumbs, setThumbs] = useState<Record<string, string>>({})
  const [full, setFull] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)
  const pendingFull = useRef(new Set<string>())

  const fetchDoc = useCallback(
    async (col: "visionThumbs" | "visionImages", id: string) => {
      if (!uid) return undefined
      const snap = await getDoc(doc(firebaseDb(), "users", uid, col, id)).catch(() => null)
      return snap?.data()?.data as string | undefined
    },
    [uid],
  )

  /** miniatura: cache -> nuvem -> (fotos antigas) gera a partir da foto cheia e guarda */
  const loadThumb = useCallback(
    async (id: string) => {
      let t = await idbGet(`t:${id}`)
      if (!t) {
        t = await fetchDoc("visionThumbs", id)
        if (!t) {
          const f = (await idbGet(`f:${id}`)) ?? (await fetchDoc("visionImages", id))
          if (!f) return
          idbSet(`f:${id}`, f)
          t = await makeThumb(f)
          if (uid) setDoc(doc(firebaseDb(), "users", uid, "visionThumbs", id), { data: t }).catch(console.error)
        }
        idbSet(`t:${id}`, t)
      }
      setThumbs((m) => ({ ...m, [id]: t! }))
    },
    [fetchDoc, uid],
  )

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    ;(async () => {
      let list: VisionItem[] = []
      if (!uid) {
        try {
          list = JSON.parse(localStorage.getItem(LOCAL_ITEMS) ?? "[]")
        } catch {}
      } else {
        const snap = await getDoc(doc(firebaseDb(), "users", uid, "vision", "board")).catch(() => null)
        list = (snap?.data()?.items as VisionItem[]) ?? []
      }
      list = list.filter((i) => i.type === "image")
      if (cancelled) return
      setItems(list)
      setReady(true)
      await Promise.all(list.map((i) => (i.imageId ? loadThumb(i.imageId) : null)))
    })()
    return () => {
      cancelled = true
    }
  }, [authReady, uid, loadThumb])

  /** foto cheia sob demanda (zoom/apresentação), com cache */
  const needFull = useCallback(
    async (id: string) => {
      if (full[id] || pendingFull.current.has(id)) return
      pendingFull.current.add(id)
      const f = (await idbGet(`f:${id}`)) ?? (await fetchDoc("visionImages", id))
      if (f) {
        idbSet(`f:${id}`, f)
        setFull((m) => ({ ...m, [id]: f }))
      }
      pendingFull.current.delete(id)
    },
    [full, fetchDoc],
  )

  const persistItems = useCallback(
    (next: VisionItem[]) => {
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => {
        const clean = JSON.parse(JSON.stringify(next))
        if (!uid) {
          try {
            localStorage.setItem(LOCAL_ITEMS, JSON.stringify(clean))
          } catch {}
          return
        }
        setDoc(doc(firebaseDb(), "users", uid, "vision", "board"), { items: clean }).catch(console.error)
      }, 500)
    },
    [uid],
  )

  const update = useCallback(
    (fn: (prev: VisionItem[]) => VisionItem[]) =>
      setItems((prev) => {
        const next = fn(prev)
        persistItems(next)
        return next
      }),
    [persistItems],
  )

  const addImage = useCallback(
    async (id: string, data: string) => {
      const t = await makeThumb(data)
      setThumbs((m) => ({ ...m, [id]: t }))
      setFull((m) => ({ ...m, [id]: data }))
      idbSet(`t:${id}`, t)
      idbSet(`f:${id}`, data)
      if (uid) {
        const db = firebaseDb()
        await Promise.all([
          setDoc(doc(db, "users", uid, "visionImages", id), { data }),
          setDoc(doc(db, "users", uid, "visionThumbs", id), { data: t }),
        ])
      }
    },
    [uid],
  )

  const removeImage = useCallback(
    (id: string) => {
      setThumbs((m) => {
        const n = { ...m }
        delete n[id]
        return n
      })
      idbDel(`t:${id}`)
      idbDel(`f:${id}`)
      if (uid) {
        const db = firebaseDb()
        deleteDoc(doc(db, "users", uid, "visionImages", id)).catch(console.error)
        deleteDoc(doc(db, "users", uid, "visionThumbs", id)).catch(console.error)
      }
    },
    [uid],
  )

  return { ready, items, thumbs, full, needFull, update, addImage, removeImage }
}
