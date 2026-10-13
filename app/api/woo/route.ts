import { NextResponse, type NextRequest } from "next/server";
import { firmaValida } from "@/lib/firma";
import { aggiornaProgetto, progettoDaCodice, type Progetto } from "@/lib/store";

// Il plugin di plumacreativa.it avvisa quando cambia lo stato di un ordine con progetti eventi
const STATI: Record<string, Progetto["stampa_stato"] | undefined> = {
  "on-hold": "in_attesa",
  processing: "pagato",
  completed: "pagato",
  cancelled: "annullato",
  refunded: "annullato",
  failed: "annullato",
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!firmaValida(body, req.headers.get("x-pluma-firma"))) return NextResponse.json({ error: "firma non valida" }, { status: 401 });
  let msg: { codici?: string[]; ordine?: string | number; stato?: string };
  try {
    msg = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "json" }, { status: 400 });
  }
  const stato = STATI[msg.stato ?? ""];
  if (!stato || !Array.isArray(msg.codici)) return NextResponse.json({ ok: true, ignorato: true });
  for (const c of msg.codici.slice(0, 20)) {
    const p = await progettoDaCodice(String(c));
    if (!p) continue;
    // un ordine annullato sblocca solo se riguarda lo stesso ordine
    if (stato === "annullato" && p.woo_ordine && p.woo_ordine !== String(msg.ordine)) continue;
    await aggiornaProgetto(p.id, { stampa_stato: stato, woo_ordine: String(msg.ordine ?? "") });
  }
  return NextResponse.json({ ok: true });
}
