import type { NextRequest } from "next/server"

/**
 * Gera um evento diário (.ics) com alarme no horário escolhido.
 * Abrir este link no iPhone mostra "Adicionar ao Calendário": o alerta passa a
 * tocar todo dia pelo próprio iOS, mesmo com o app fechado.
 */
export function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "20:00"
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t)
  const [hh, mm] = match ? [match[1], match[2]] : ["20", "00"]

  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  const today = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  const origin = req.nextUrl.origin

  // Horário "flutuante" (sem fuso): toca às HH:MM no fuso em que o iPhone estiver.
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MRD//Minimo Ridiculo Diario//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:mrd-lembrete-${hh}${mm}@mrdhabitos`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${today}T${hh}${mm}00`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:MRD: faça o mínimo ridículo",
    `DESCRIPTION:Marque seus hábitos de hoje: ${origin}`,
    `URL:${origin}`,
    "TRANSP:TRANSPARENT",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Faça o mínimo ridículo de hoje",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n")

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="mrd-lembrete-${hh}${mm}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
