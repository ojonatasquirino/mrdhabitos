/** Cache mínimo no IndexedDB (fotos do quadro): evita baixar de novo e funciona offline. */
const DB = "mrd-cache"
const STORE = "kv"

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

let dbp: Promise<IDBDatabase> | null = null
const db = () => (dbp ??= open())

export async function idbGet(key: string): Promise<string | undefined> {
  try {
    const d = await db()
    return await new Promise((resolve) => {
      const r = d.transaction(STORE).objectStore(STORE).get(key)
      r.onsuccess = () => resolve(r.result as string | undefined)
      r.onerror = () => resolve(undefined)
    })
  } catch {
    return undefined
  }
}

export async function idbSet(key: string, value: string): Promise<void> {
  try {
    const d = await db()
    d.transaction(STORE, "readwrite").objectStore(STORE).put(value, key)
  } catch {}
}

export async function idbDel(key: string): Promise<void> {
  try {
    const d = await db()
    d.transaction(STORE, "readwrite").objectStore(STORE).delete(key)
  } catch {}
}
