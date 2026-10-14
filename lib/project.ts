import type { EventId, Quantita } from "./catalog";
import type { Assets, Docs } from "./feste/costanti";
import { buildAll } from "./feste/spunti";

// Cosa contiene un progetto del cliente (salvato come JSON)
export type ProjectData = {
  evento: EventId;
  spunto: string; // lo spunto da cui è partito (serve solo come riferimento)
  docs: Docs; // grafica di ogni formato, modificabile al 100%
  back: boolean; // cavalierino: il motivo continua sul retro
  nomi: string[]; // un invitato per riga, per i segnaposti
  tipoSegnaposto: "piatto" | "cavalierino";
  qta: Quantita;
  coloreBusta: string; // uno di COLORI_BUSTA, obbligatorio se si ordinano buste
};

export const NOMI_ESEMPIO = ["Nonna Maria", "Zio Giorgio", "Francesca"];

export function nuovoProgetto(A: Assets, evento: EventId, spunto: string): ProjectData {
  return {
    evento,
    spunto,
    docs: buildAll(A, spunto),
    back: true,
    nomi: [],
    tipoSegnaposto: "piatto",
    qta: { invito: 0, busta: 0, menu: 0, segnaposto: 0 },
    coloreBusta: "",
  };
}

// Nomi dall'area di testo: uno per riga, senza righe vuote né doppi spazi
export function pulisciNomi(testo: string): string[] {
  return testo
    .split(/\r?\n/)
    .map((s) => s.split("\t")[0].replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 500);
}
