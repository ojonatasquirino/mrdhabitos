"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore"
import { firebaseDb } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { VisionItem } from "@/lib/vision"

const LOCAL_ITEMS = "mrd-vision"
const LOCAL_IMAGES = "mrd-vision-images"

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T
  } catch {
    return fallback
  }
}

/**
 * Quadro de visão no Firestore "em partes":
 * users/{uid}/vision/board guarda só a posição dos itens (leve);
 * users/{uid}/visionImages/{id} guarda cada foto comprimida (até ~900 KB cada).
 * Sem conta (modo local), tudo fica no navegador.
 */
export function useVision() {
  const { user, ready: authReady, enabled } = useAuth()
  const uid = enabled ? user?.uid : undefined
  const [items, setItems] = useState<VisionItem[]>([])
  const [images, setImages] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const saveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!authReady) return
    let cancelled = false
    ;(async () => {
      if (!uid) {
        setItems(readLocal<VisionItem[]>(LOCAL_ITEMS, []))
        setImages(readLocal<Record<string, string>>(LOCAL_IMAGES, {}))
        setReady(true)
        return
      }
      try {
        const db = firebaseDb()
        const [board, imgs] = await Promise.all([
          getDoc(doc(db, "users", uid, "vision", "board")),
          getDocs(collection(db, "users", uid, "visionImages")),
        ])
        if (cancelled) return
        setItems((board.data()?.items as VisionItem[]) ?? [])
        const map: Record<string, string> = {}
        imgs.forEach((d) => (map[d.id] = d.data().data as string))
        setImages(map)
      } catch (e) {
        console.error(e)
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [authReady, uid])

  /** salva as posições com um pequeno atraso (arrastar gera muitas mudanças) */
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
      setImages((m) => ({ ...m, [id]: data }))
      if (!uid) {
        try {
          localStorage.setItem(LOCAL_IMAGES, JSON.stringify({ ...readLocal(LOCAL_IMAGES, {}), [id]: data }))
        } catch {}
        return
      }
      await setDoc(doc(firebaseDb(), "users", uid, "visionImages", id), { data })
    },
    [uid],
  )

  const removeImage = useCallback(
    (id: string) => {
      setImages((m) => {
        const n = { ...m }
        delete n[id]
        return n
      })
      if (!uid) {
        const all = readLocal<Record<string, string>>(LOCAL_IMAGES, {})
        delete all[id]
        try {
          localStorage.setItem(LOCAL_IMAGES, JSON.stringify(all))
        } catch {}
        return
      }
      deleteDoc(doc(firebaseDb(), "users", uid, "visionImages", id)).catch(console.error)
    },
    [uid],
  )

  return { ready, items, images, update, addImage, removeImage }
}
