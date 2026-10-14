import "server-only";
import { COLORI_BUSTA, gruppoDi } from "./catalog";
import { validaDocs } from "./feste/valida";
import { serverAssets } from "./feste/server";
import { spuntiPer, spunto } from "./feste/spunti";
import { buildAll } from "./feste/spunti";
import type { ProjectData } from "./project";

const int = (v: unknown, max = 2000) => Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));
const cut = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

// Normalizza i dati arrivati dal browser prima di salvarli. L'evento non cambia; lo spunto deve essere della stessa sezione.
export function salvabili(attuali: ProjectData, nuovi: Partial<ProjectData>): ProjectData {
  const A = serverAssets();
  const g = gruppoDi(attuali.evento) ?? "bimbi";
  const sp = spunto(String(nuovi.spunto)) && spunto(String(nuovi.spunto))!.gruppo === g ? String(nuovi.spunto) : attuali.spunto || spuntiPer(g)[0].id;
  const riserva = attuali.docs ?? buildAll(A, sp);
  const q = (nuovi.qta ?? {}) as Partial<ProjectData["qta"]>;
  return {
    evento: attuali.evento,
    spunto: sp,
    docs: validaDocs(nuovi.docs, A, riserva),
    back: nuovi.back !== false,
    nomi: Array.isArray(nuovi.nomi) ? nuovi.nomi.slice(0, 500).map((n) => cut(n, 40)).filter(Boolean) : [],
    tipoSegnaposto: nuovi.tipoSegnaposto === "cavalierino" ? "cavalierino" : "piatto",
    qta: { invito: int(q.invito), busta: int(q.busta), menu: int(q.menu), segnaposto: int(q.segnaposto) },
    coloreBusta: (COLORI_BUSTA as readonly string[]).includes(String(nuovi.coloreBusta)) ? String(nuovi.coloreBusta) : "",
  };
}

// Progetti creati con il vecchio editor: si ripartono dal primo spunto della loro sezione
export function aggiorna(d: ProjectData): ProjectData {
  if (d.docs) return d;
  const g = gruppoDi(d.evento) ?? "bimbi";
  const sp = spuntiPer(g)[0].id;
  const old = d as unknown as { nomi?: string[]; tipoSegnaposto?: string; qta?: ProjectData["qta"]; coloreBusta?: string };
  return salvabili({ ...d, spunto: sp, docs: buildAll(serverAssets(), sp) }, { ...old, spunto: sp, tipoSegnaposto: old.tipoSegnaposto === "cavalierino" ? "cavalierino" : "piatto" } as Partial<ProjectData>);
}
