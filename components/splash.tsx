"use client"

import { useEffect, useState } from "react"

/** Tela de abertura com a logo, exibida uma vez por sessão ao abrir o app. */
export function Splash() {
  const [phase, setPhase] = useState<"show" | "hide" | "gone">("show")

  useEffect(() => {
    let seen = false
    try {
      seen = sessionStorage.getItem("mrd-splash") === "1"
      sessionStorage.setItem("mrd-splash", "1")
    } catch {}
    if (seen) {
      setPhase("gone")
      return
    }
    const t1 = setTimeout(() => setPhase("hide"), 1100)
    const t2 = setTimeout(() => setPhase("gone"), 1500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (phase === "gone") return null

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-400 ${
        phase === "hide" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.webp"
        alt=""
        width={112}
        height={112}
        className="h-28 w-28 rounded-[28px] shadow-2xl shadow-white/10 animate-in fade-in zoom-in-75 duration-700"
      />
      <p className="mt-6 text-sm font-semibold tracking-[0.3em] text-white/80 animate-in fade-in slide-in-from-bottom-2 fill-mode-both delay-300 duration-700">
        MRD
      </p>
    </div>
  )
}
