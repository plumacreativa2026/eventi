import { NextResponse, type NextRequest } from "next/server";
import { righeStampa, SKU } from "@/lib/catalog";
import { firma } from "@/lib/firma";
import type { ProjectData } from "@/lib/project";
import { salvabili } from "@/lib/salva";
import { aggiornaProgetto, bloccato, leggiProgetto } from "@/lib/store";
import { APP_URL, SHOP_URL } from "@/lib/site";

type C = { params: Promise<{ id: string }> };

// Salva l'ultima versione e manda il cliente al carrello di plumacreativa.it con un link firmato
export async function POST(req: NextRequest, { params }: C) {
  const { id } = await params;
  const p = await leggiProgetto(id);
  if (!p) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  if (bloccato(p)) return NextResponse.json({ error: "Questo progetto è già stato ordinato." }, { status: 409 });
  let body: ProjectData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const dati = salvabili(p.dati, body);
  await aggiornaProgetto(id, { dati });

  const { righe } = righeStampa(dati.qta, dati.tipoSegnaposto);
  if (!righe.length) return NextResponse.json({ error: "Indica almeno una quantità da stampare." }, { status: 400 });
  if (dati.qta.segnaposto > 0 && !dati.nomi.length) return NextResponse.json({ error: "Scrivi i nomi degli invitati per i segnaposti." }, { status: 400 });

  const payload = {
    v: 1,
    id: p.id,
    c: p.codice,
    r: Object.fromEntries(righe.map((r) => [SKU[r.voce], r.qta])),
    t: Math.floor(Date.now() / 1000),
    a: APP_URL,
  };
  let token: string;
  try {
    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    token = `${data}.${firma(data)}`;
  } catch {
    return NextResponse.json({ error: "Il collegamento con il negozio non è ancora attivo." }, { status: 503 });
  }
  return NextResponse.json({ url: `${SHOP_URL}/?pluma_eventi=${token}` });
}
