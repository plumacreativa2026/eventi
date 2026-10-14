import { NextResponse, type NextRequest } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { gruppoDi } from "@/lib/catalog";
import { toSvg } from "@/lib/engine/scene";
import { docToScene } from "@/lib/feste/stampa";
import { pickFont, serverAssets } from "@/lib/feste/server";
import { buildAll, spunto } from "@/lib/feste/spunti";

type C = { params: Promise<{ evento: string; modello: string }> };

// Miniatura PNG dell'invito di uno spunto (evento = sezione, modello = id dello spunto)
export async function GET(_req: NextRequest, { params }: C) {
  const { evento: ev, modello } = await params;
  const g = gruppoDi(ev);
  const s = spunto(modello.replace(/\.png$/, ""));
  if (!g || !s || s.gruppo !== g) return NextResponse.json({ error: "non trovato" }, { status: 404 });
  const A = serverAssets();
  const sc = docToScene(A, buildAll(A, s.id).invito, "invito", pickFont, { bleed: 0 });
  const png = new Resvg(toSvg(sc, { trim: true, widthPx: 520 }), { background: "#ffffff" }).render().asPng();
  return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, s-maxage=604800" } });
}
