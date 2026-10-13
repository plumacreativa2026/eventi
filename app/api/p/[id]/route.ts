import { NextResponse, type NextRequest } from "next/server";
import type { ProjectData } from "@/lib/project";
import { salvabili } from "@/lib/salva";
import { aggiornaProgetto, bloccato, leggiProgetto } from "@/lib/store";

type C = { params: Promise<{ id: string }> };

// Salvataggio automatico dall'editor
export async function PUT(req: NextRequest, { params }: C) {
  const { id } = await params;
  const p = await leggiProgetto(id);
  if (!p) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  if (bloccato(p)) return NextResponse.json({ error: "Il progetto è bloccato perché c'è un ordine di stampa" }, { status: 409 });
  let body: ProjectData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const dati = salvabili(p.dati, body);
  await aggiornaProgetto(id, { dati });
  return NextResponse.json({ ok: true });
}
