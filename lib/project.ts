import type { EventId, Quantita } from "./catalog";

// Cosa contiene un progetto del cliente (salvato come JSON)
export type Testi = {
  invito: { sopra: string; nome: string; corpo: string; chiusura: string };
  menu: { titolo: string; nome: string; portate: string; chiusura: string };
  segnaposto: { riga: string };
};

export type ProjectData = {
  evento: EventId;
  modello: string;
  palette: number;
  testi: Testi;
  nomi: string[]; // un invitato per riga, per i segnaposti
  tipoSegnaposto: "piatto" | "cavalierino";
  retro: boolean; // cavalierino: grafica fissa sul retro, ruotata di 180°
  qta: Quantita;
};

const PORTATE_STD = `Antipasti
Selezione di salumi e formaggi del territorio
Vitello tonnato

Primi
Risotto alla zucca e amaretti
Tajarin al ragù

Secondo
Arrosto con patate al forno

Dolce
Torta della festa`;

const DEFAULT_TESTI: Record<EventId, Testi> = {
  nascita: {
    invito: { sopra: "È nata", nome: "Giulia", corpo: "Festeggiamo il suo arrivo\nsabato 15 maggio 2027 alle ore 16:00\nCascina Le Rose · Boves", chiusura: "Vi aspettiamo! Conferma a Laura · 333 123 4567" },
    menu: { titolo: "Menù", nome: "Benvenuta Giulia", portate: PORTATE_STD, chiusura: "15 maggio 2027" },
    segnaposto: { riga: "Benvenuta Giulia" },
  },
  battesimo: {
    invito: { sopra: "Il battesimo di", nome: "Leonardo", corpo: "domenica 18 aprile 2027 alle ore 11:00\nChiesa di San Bartolomeo · Boves\n\nSeguirà il pranzo al Ristorante Il Glicine", chiusura: "Conferma entro il 1° aprile · Marta 333 123 4567" },
    menu: { titolo: "Menù", nome: "Battesimo di Leonardo", portate: PORTATE_STD, chiusura: "18 aprile 2027" },
    segnaposto: { riga: "Battesimo di Leonardo" },
  },
  "compleanno-bimbi": {
    invito: { sopra: "Vieni alla festa di", nome: "Sofia", corpo: "che compie 5 anni!\nsabato 20 marzo 2027 dalle 16:00 alle 19:00\nLudoteca Arcobaleno · Via Roma 12, Cuneo", chiusura: "Conferma alla mamma Anna · 333 123 4567" },
    menu: { titolo: "Menù", nome: "La festa di Sofia", portate: "Pizzette e focaccine\nPanini al latte\nPatatine\n\nTorta di compleanno\nMacedonia e succhi", chiusura: "20 marzo 2027" },
    segnaposto: { riga: "La festa di Sofia" },
  },
  compleanno: {
    invito: { sopra: "Festeggiamo i 40 anni di", nome: "Marco", corpo: "sabato 12 giugno 2027 alle ore 20:00\nVilla Belvedere · Cuneo\n\nCena, musica e tanta allegria", chiusura: "Conferma entro il 1° giugno · 333 123 4567" },
    menu: { titolo: "Menù", nome: "I 40 anni di Marco", portate: PORTATE_STD, chiusura: "12 giugno 2027" },
    segnaposto: { riga: "I 40 anni di Marco" },
  },
  laurea: {
    invito: { sopra: "Festeggiamo la laurea di", nome: "Chiara", corpo: "Dottoressa in Architettura\n\nvenerdì 16 luglio 2027 alle ore 19:30\nTerrazza sul Viale · Cuneo", chiusura: "Conferma entro il 5 luglio · 333 123 4567" },
    menu: { titolo: "Menù", nome: "Dott.ssa Chiara", portate: PORTATE_STD, chiusura: "16 luglio 2027" },
    segnaposto: { riga: "La laurea di Chiara" },
  },
  anniversario: {
    invito: { sopra: "25 anni insieme", nome: "Paola & Luca", corpo: "Festeggiamo le nostre nozze d'argento\nsabato 9 ottobre 2027 alle ore 12:30\nAgriturismo La Collina · Boves", chiusura: "Conferma entro il 25 settembre · 333 123 4567" },
    menu: { titolo: "Menù", nome: "Paola & Luca · 25 anni", portate: PORTATE_STD, chiusura: "9 ottobre 2027" },
    segnaposto: { riga: "Paola & Luca · 25 anni" },
  },
};

export const NOMI_ESEMPIO = ["Nonna Maria", "Zio Giorgio", "Francesca"];

export function nuovoProgetto(evento: EventId, modello: string): ProjectData {
  return {
    evento,
    modello,
    palette: 0,
    testi: structuredClone(DEFAULT_TESTI[evento]),
    nomi: [],
    tipoSegnaposto: "piatto",
    retro: false,
    qta: { invito: 0, busta: 0, menu: 0, segnaposto: 0 },
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

// Limiti di lunghezza: proteggono l'impaginazione e il database
const LIM = { breve: 80, nome: 40, lungo: 600 };
const cut = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const int = (v: unknown, max = 2000) => Math.min(max, Math.max(0, Math.floor(Number(v) || 0)));

// Normalizza i dati arrivati dal browser prima di salvarli
export function sanifica(d: ProjectData): ProjectData {
  const t = d.testi ?? ({} as Testi);
  return {
    evento: d.evento,
    modello: cut(d.modello, 40),
    palette: int(d.palette, 20),
    testi: {
      invito: { sopra: cut(t.invito?.sopra, LIM.breve), nome: cut(t.invito?.nome, LIM.nome), corpo: cut(t.invito?.corpo, LIM.lungo), chiusura: cut(t.invito?.chiusura, LIM.breve * 2) },
      menu: { titolo: cut(t.menu?.titolo, LIM.nome), nome: cut(t.menu?.nome, LIM.breve), portate: cut(t.menu?.portate, LIM.lungo * 2), chiusura: cut(t.menu?.chiusura, LIM.breve) },
      segnaposto: { riga: cut(t.segnaposto?.riga, LIM.breve) },
    },
    nomi: Array.isArray(d.nomi) ? d.nomi.slice(0, 500).map((n) => cut(n, LIM.nome)).filter(Boolean) : [],
    tipoSegnaposto: d.tipoSegnaposto === "cavalierino" ? "cavalierino" : "piatto",
    retro: !!d.retro,
    qta: { invito: int(d.qta?.invito), busta: int(d.qta?.busta), menu: int(d.qta?.menu), segnaposto: int(d.qta?.segnaposto) },
  };
}
