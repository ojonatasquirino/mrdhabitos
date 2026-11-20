import { NextResponse, type NextRequest } from "next/server";

/**
 * Recebe o sono enviado pelo app Atalhos do iPhone.
 * Corpo JSON: { "chave": "mrd_...", "valor": <horas | minutos | segundos>, "data"?: "AAAA-MM-DD" }
 * O valor é convertido automaticamente: até 16 = horas, até 960 = minutos, acima = segundos.
 */
const KEY_RE = /^mrd_[a-z0-9]{20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function toHours(raw: number) {
  if (raw <= 16) return raw;
  if (raw <= 960) return raw / 60;
  return raw / 3600;
}

function fmt(h: number) {
  const m = Math.round(h * 60);
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
}

const reply = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status });

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return reply(400, {
      ok: false,
      texto: "MRD: corpo inválido. Envie JSON com chave e valor.",
    });
  }

  const chave = String(body.chave ?? "").trim();
  if (!KEY_RE.test(chave))
    return reply(400, {
      ok: false,
      texto: "MRD: chave inválida. Copie de novo no app.",
    });

  const raw = Number(
    String(body.valor ?? body.horas ?? "")
      .replace(",", ".")
      .trim(),
  );
  if (!Number.isFinite(raw) || raw <= 0) {
    return reply(422, {
      ok: false,
      texto: "MRD: nenhum sono encontrado no app Saúde para esta noite.",
    });
  }
  const horas = Math.round(toHours(raw) * 4) / 4;
  if (horas < 0.25 || horas > 16)
    return reply(422, {
      ok: false,
      texto: "MRD: valor de sono fora do esperado.",
    });

  const data =
    typeof body.data === "string" && DATE_RE.test(body.data)
      ? body.data
      : todayIn("America/Sao_Paulo");

  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!project || !apiKey)
    return reply(503, { ok: false, texto: "MRD: servidor não configurado." });

  const url =
    `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/sleepInbox/${chave}/dias/${data}` +
    `?key=${apiKey}&updateMask.fieldPaths=horas&updateMask.fieldPaths=recebidoEm`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          horas: { doubleValue: horas },
          recebidoEm: { timestampValue: new Date().toISOString() },
        },
      }),
      cache: "no-store",
    });
  } catch {
    return reply(502, {
      ok: false,
      texto: "MRD: não foi possível salvar agora. Tente mais tarde.",
    });
  }

  if (res.status === 403 || res.status === 404) {
    return reply(404, {
      ok: false,
      texto: "MRD: chave não encontrada. Abra o app e copie a chave de novo.",
    });
  }
  if (!res.ok)
    return reply(502, {
      ok: false,
      texto: "MRD: não foi possível salvar agora. Tente mais tarde.",
    });

  return reply(200, {
    ok: true,
    data,
    horas,
    texto: `MRD: sono de ${fmt(horas)} registrado ✓`,
  });
}

export function GET() {
  return reply(200, {
    ok: true,
    texto: "MRD: envie POST com { chave, valor } pelo app Atalhos.",
  });
}
