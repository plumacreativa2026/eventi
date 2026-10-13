import { NextResponse, type NextRequest } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { evento } from "@/lib/catalog";
import { serverFonts } from "@/lib/engine/fonts-server";
import { modelliPer } from "@/lib/engine/models";
import { render } from "@/lib/engine/render";
import { toSvg } from "@/lib/engine/scene";
import { nuovoProgetto } from "@/lib/project";

type C = { params: Promise<{ evento: string; modello: string }> };

// Miniatura PNG del modello con i testi di esempio dell'evento (?c=indice colore)
export async function GET(req: NextRequest, { params }: C) {
  const { evento: ev, modello } = await params;
  const e = evento(ev);
  const m = e && modelliPer(e.id).find((x) => x.id === modello.replace(/\.png$/, ""));
  if (!e || !m) return NextResponse.json({ error: "non trovato" }, { status: 404 });
  const d = nuovoProgetto(e.id, m.id);
  d.palette = Math.min(m.palettes.length - 1, Math.max(0, Number(req.nextUrl.searchParams.get("c")) || 0));
  const png = new Resvg(toSvg(render(serverFonts(), d, "invito"), { trim: true, widthPx: 520 })).render().asPng();
  return new NextResponse(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "public, max-age=86400, s-maxage=604800" } });
}
