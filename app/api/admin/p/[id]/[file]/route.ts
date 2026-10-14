import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/admin";
import { scenesToPdf, sceneToJpg } from "@/lib/engine/output";
import { scena } from "@/lib/feste/server";
import { nomeFile } from "@/lib/files";
import { leggiProgetto } from "@/lib/store";

type C = { params: Promise<{ id: string; file: string }> };

// CSV per l'Unione dati di InDesign: UTF-16 con BOM, così accenti e apostrofi arrivano giusti
function csv(nomi: string[]) {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const txt = ["Nome", ...nomi].map(q).join("\r\n") + "\r\n";
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(txt, "utf16le")]);
}

export async function GET(_req: NextRequest, { params }: C) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Accesso riservato" }, { status: 401 });
  const { id, file } = await params;
  const p = await leggiProgetto(id);
  if (!p) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  const d = p.dati;
  const sp = d.tipoSegnaposto === "cavalierino" ? "cavalierino" : "segnaposto";
  const send = (buf: Buffer, type: string, name: string) =>
    new NextResponse(new Uint8Array(buf), { headers: { "content-type": type, "content-disposition": `attachment; filename="${name}"`, "cache-control": "no-store" } });

  switch (file) {
    case "invito.pdf":
      return send(await scenesToPdf([scena(d, "invito")], `Invito ${p.codice}`), "application/pdf", `${nomeFile(p, "invito")}.pdf`);
    case "menu.pdf":
      return send(await scenesToPdf([scena(d, "menu")], `Menu ${p.codice}`), "application/pdf", `${nomeFile(p, "menu")}.pdf`);
    case "segnaposti.pdf": {
      // pagina 1 senza nome (per l'Unione dati di InDesign), pagina 2 esempio con il primo nome
      const pages = [scena(d, sp, null), scena(d, sp, d.nomi[0] ?? "Nome Cognome")];
      return send(await scenesToPdf(pages, `Segnaposti ${p.codice}`), "application/pdf", `${nomeFile(p, sp === "cavalierino" ? "cavalierini" : "segnaposti")}.pdf`);
    }
    case "segnaposti-tutti.pdf": {
      // una pagina per ogni invitato, già con il nome
      const pages = (d.nomi.length ? d.nomi : ["Nome Cognome"]).map((n) => scena(d, sp, n));
      return send(await scenesToPdf(pages, `Segnaposti ${p.codice}`), "application/pdf", `${nomeFile(p, sp === "cavalierino" ? "cavalierini-tutti" : "segnaposti-tutti")}.pdf`);
    }
    case "nomi.csv":
      return send(csv(d.nomi), "text/csv; charset=utf-16le", `${nomeFile(p, "nomi")}.csv`);
    case "invito.jpg":
      return send(await sceneToJpg(scena(d, "digitale"), 1080), "image/jpeg", `${nomeFile(p, "invito-digitale")}.jpg`);
  }
  return NextResponse.json({ error: "File sconosciuto" }, { status: 404 });
}
