// Catalogo: eventi, pezzi stampabili, prezzi. Unica fonte di verità per app e carrello.

export type Gruppo = "bimbi" | "adulti";
// Le due sezioni; i vecchi id (nascita, battesimo…) restano validi e confluiscono nella loro sezione
export type EventId = Gruppo | "nascita" | "battesimo" | "compleanno-bimbi" | "compleanno" | "laurea" | "anniversario";

export const EVENTI: { id: Gruppo; nome: string; descr: string; occasioni: string[] }[] = [
  { id: "bimbi", nome: "Feste per bambini", descr: "Nascite, battesimi, comunioni e compleanni dei più piccoli", occasioni: ["Nascita", "Battesimo", "Comunione", "Compleanno"] },
  { id: "adulti", nome: "Occasioni speciali", descr: "Compleanni, lauree e anniversari", occasioni: ["Compleanno", "Laurea", "Anniversario"] },
];

const SEZIONE: Record<EventId, Gruppo> = {
  bimbi: "bimbi",
  adulti: "adulti",
  nascita: "bimbi",
  battesimo: "bimbi",
  "compleanno-bimbi": "bimbi",
  compleanno: "adulti",
  laurea: "adulti",
  anniversario: "adulti",
};

export function gruppoDi(id: string): Gruppo | undefined {
  return SEZIONE[id as EventId];
}

export function evento(id: string) {
  const g = gruppoDi(id);
  return EVENTI.find((e) => e.id === g);
}

// Formati finiti in millimetri (larghezza × altezza). Il cavalierino si piega a metà altezza.
export type PieceId = "invito" | "menu" | "segnaposto" | "cavalierino";
export const PEZZI: Record<PieceId, { nome: string; w: number; h: number; formato: string }> = {
  invito: { nome: "Invito", w: 115, h: 170, formato: "11,5 × 17 cm" },
  menu: { nome: "Menu", w: 95, h: 200, formato: "9,5 × 20 cm" },
  segnaposto: { nome: "Segnaposto", w: 80, h: 50, formato: "8 × 5 cm" },
  cavalierino: { nome: "Segnaposto a cavalierino", w: 80, h: 100, formato: "8 × 10 cm aperto, 8 × 5 cm piegato" },
};

// Abbondanza per il PDF di stampa (mm per lato)
export const ABBONDANZA = 2;

// Prezzi IVA esclusa. Devono coincidere con i prezzi dei prodotti su plumacreativa.it.
export const IVA = 0.22;
export const PREZZI = {
  digitale: 9.9,
  invito: 2.0,
  busta: 1.0,
  menu: 1.2,
  cavalierino: 1.0,
  segnaposto: 0.8,
  impostazione: 15.0,
};

// Codici prodotto (SKU) su WooCommerce, creati dal plugin
export const SKU = {
  invito: "EVENTI-INVITO",
  busta: "EVENTI-BUSTA",
  menu: "EVENTI-MENU",
  cavalierino: "EVENTI-CAVALIERINO",
  segnaposto: "EVENTI-SEGNAPOSTO",
  impostazione: "EVENTI-IMPOSTAZIONE",
} as const;
export type Voce = keyof typeof SKU;

// Colori delle buste: devono coincidere con l'elenco del plugin WooCommerce
export const COLORI_BUSTA = [
  "Bianca martellata", "Bosco", "Oliva", "Mela", "Salvia", "Zaffiro", "Cobalto", "Acqua", "Blu pallido", "Terracotta", "Mandorla", "Senape", "Champagne", "Melanzana", "Vino", "Ciliegia", "Lilla", "Marsala", "Rosa Polvere", "Cipria", "Rosa Pallido",
] as const;

export const VOCI: { id: Voce; nome: string }[] = [
  { id: "invito", nome: "Inviti stampati" },
  { id: "busta", nome: "Buste" },
  { id: "menu", nome: "Menu" },
  { id: "segnaposto", nome: "Segnaposti" },
  { id: "cavalierino", nome: "Segnaposti a cavalierino" },
  { id: "impostazione", nome: "Impostazione grafica" },
];

export const euro = (n: number) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });
export const conIva = (n: number) => Math.round(n * (1 + IVA) * 100) / 100;

export type Quantita = { invito: number; busta: number; menu: number; segnaposto: number };

// Righe dell'ordine di stampa: la scelta piatto/cavalierino decide quale segnaposto si ordina
export function righeStampa(q: Quantita, tipoSegnaposto: "piatto" | "cavalierino") {
  const righe: { voce: Voce; qta: number; prezzo: number }[] = [];
  const add = (voce: Voce, qta: number) => {
    const n = Math.max(0, Math.floor(qta || 0));
    if (n > 0) righe.push({ voce, qta: n, prezzo: PREZZI[voce] });
  };
  add("invito", q.invito);
  add("busta", q.busta);
  add("menu", q.menu);
  add(tipoSegnaposto === "cavalierino" ? "cavalierino" : "segnaposto", q.segnaposto);
  if (righe.length) righe.push({ voce: "impostazione", qta: 1, prezzo: PREZZI.impostazione });
  const netto = righe.reduce((s, r) => s + r.qta * r.prezzo, 0);
  return { righe, netto: Math.round(netto * 100) / 100, totale: conIva(netto) };
}
