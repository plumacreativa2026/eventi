import { NextResponse, type NextRequest } from "next/server";
import { serverFonts } from "@/lib/engine/fonts-server";
import { sceneToJpg } from "@/lib/engine/output";
import { render } from "@/lib/engine/render";
import { leggiProgetto } from "@/lib/store";
import { nomeFile } from "@/lib/files";

type C = { params: Promise<{ id: string }> };

// Invito digitale in JPG, solo se pagato
export async function GET(_req: NextRequest, { params }: C) {
  const { id } = await params;
  const p = await leggiProgetto(id);
  if (!p) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  if (!p.digitale_pagato_at) return NextResponse.json({ error: "L'invito digitale non è ancora stato acquistato" }, { status: 402 });
  const jpg = await sceneToJpg(render(serverFonts(), p.dati, "invito"));
  return new NextResponse(new Uint8Array(jpg), {
    headers: {
      "content-type": "image/jpeg",
      "content-disposition": `attachment; filename="${nomeFile(p, "invito-digitale")}.jpg"`,
      "cache-control": "no-store",
    },
  });
}
