// Costanti dell'editor feste: formati, font, colori, motivi. Condivise da editor (browser) e stampa (server).

export type FmtId = "digitale" | "invito" | "menu" | "segnaposto" | "cavalierino";

// Unità del foglio: 10 unità = 1 mm per la stampa; per il digitale 1 unità = 1 px
export const FORMATS: Record<FmtId, { label: string; dim: string; W: number; H: number; u: number; k: number; fold?: boolean }> = {
  digitale: { label: "Invito digitale", dim: "1080 × 1920 px", W: 1080, H: 1920, u: 1.1, k: 0.84 },
  invito: { label: "Invito stampa", dim: "11,5 × 17 cm", W: 1150, H: 1700, u: 1, k: 0.8 },
  menu: { label: "Menu", dim: "9,5 × 20 cm", W: 950, H: 2000, u: 1, k: 0.68 },
  segnaposto: { label: "Segnaposto semplice", dim: "8 × 5 cm", W: 800, H: 500, u: 1, k: 0.6 },
  cavalierino: { label: "Segnaposto a cavalierino", dim: "8 × 10 cm · piegato 8 × 5", W: 800, H: 500, u: 1, k: 0.6, fold: true },
};
export const FMT_IDS = Object.keys(FORMATS) as FmtId[];

export type Bg = { type: string; color: string; scale: number };
export type Item = {
  id: string;
  type: "frame" | "icon" | "line" | "text";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  // cornice
  shape?: string;
  rot?: boolean;
  sw?: number;
  fill?: string;
  // illustrazione
  name?: string;
  // linea
  style?: string;
  // testo
  text?: string;
  font?: string;
  size?: number;
  align?: "start" | "middle" | "end";
  ls?: number;
  lh?: number;
  italic?: boolean;
  upper?: boolean;
  weight?: number;
  fit?: number;
  role?: "nome"; // segnaposto: il testo diventa il nome di ogni invitato
  _fs?: number; // corpo ridotto per stare nella larghezza (calcolato, non salvato)
};
export type Doc = { bg: Bg; items: Item[] };
export type Docs = Record<FmtId, Doc>;

export type Assets = {
  icons: Record<string, { vb: number[]; d: string }>;
  frames: Record<string, { r: number; d: string }>;
  ondaLunga: { r: number; d: string };
};

// Font: [famiglia, nome mostrato, CSS, fattore di corpo]. Il nome del font non si mostra mai.
export const FONTS: [string, string, string, number][] = [
  ["Playfair Display", "Moderno", "'Playfair Display',Georgia,serif", 1],
  ["Cormorant Garamond", "Classico", "'Cormorant Garamond',Georgia,serif", 1.1],
  ["Pinyon Script", "Romantico", "'Pinyon Script',cursive", 1.25],
  ["Cinzel", "Elegante", "Cinzel,Georgia,serif", 0.9],
  ["Marcellus", "Sobrio", "Marcellus,Georgia,serif", 0.95],
  ["Mea Culpa", "Poetico", "'Mea Culpa',cursive", 1.3],
  ["Lora", "Letterario", "Lora,Georgia,serif", 1],
  ["Montserrat", "Lineare", "Montserrat,system-ui,sans-serif", 0.9],
  ["Sniglet", "Giocoso", "Sniglet,'Arial Rounded MT Bold',sans-serif", 1],
  ["Mali", "A mano", "Mali,sans-serif", 1],
  ["Sacramento", "Delicato", "Sacramento,cursive", 1.4],
  ["Cedarville Cursive", "Quaderno", "'Cedarville Cursive',cursive", 1.1],
];
export const FONT_MAP: Record<string, [string, string, string, number]> = Object.fromEntries(FONTS.map((f) => [f[0], f]));

// File dei font in /public/fonts (licenza OFL): n = normale, i = corsivo, b = grassetto
export const FONT_FILES: Record<string, { n: string; i?: string; b?: string }> = {
  "Playfair Display": { n: "PlayfairDisplay-Regular.ttf", i: "PlayfairDisplay-Italic.ttf" },
  "Cormorant Garamond": { n: "CormorantGaramond-Regular.ttf", i: "CormorantGaramond-Italic.ttf" },
  "Pinyon Script": { n: "PinyonScript-Regular.ttf" },
  Cinzel: { n: "Cinzel-Regular.ttf" },
  Marcellus: { n: "Marcellus-Regular.ttf" },
  "Mea Culpa": { n: "MeaCulpa-Regular.ttf" },
  Lora: { n: "Lora-Regular.ttf", i: "Lora-Italic.ttf" },
  Montserrat: { n: "Montserrat-Regular.ttf", i: "Montserrat-Italic.ttf" },
  Sniglet: { n: "Sniglet-Regular.ttf", b: "Sniglet-ExtraBold.ttf" },
  Mali: { n: "Mali-Regular.ttf" },
  Sacramento: { n: "Sacramento-Regular.ttf" },
  "Cedarville Cursive": { n: "CedarvilleCursive-Regular.ttf" },
};

// Interlinea base del testo: i corsivi calligrafici hanno ascendenti alti, quindi righe più strette
export const lineStep = (size: number, font: string, lh = 1) => size * ((FONT_MAP[font]?.[3] ?? 1) > 1.15 ? 1.05 : 1.32) * lh;

export const BG_COLORS: [string, string][] = [
  ["Rosa cipria", "#f1e8eb"], ["Burro", "#f9eab3"], ["Pesca", "#f9e6df"], ["Azzurro", "#e2ebf4"],
  ["Salvia", "#e3ece1"], ["Lilla", "#ede8f4"], ["Menta", "#d9eee9"], ["Sabbia", "#f0e9dd"],
];
export const INKS: [string, string][] = [
  ["Rosa cipria", "#dca0ae"], ["Azzurro polvere", "#93abc8"], ["Caramello", "#d2a47f"], ["Salvia", "#93a891"],
  ["Lavanda", "#a99cc5"], ["Malva", "#b77a8e"], ["Tortora", "#9b8d80"], ["Grigio caldo", "#86807b"], ["Rosso laurea", "#a3284e"],
];
export const PATTERNS: [string, string][] = [
  ["nulla", "Nessuno"], ["righe", "Righe"], ["quadretti", "Quadretti"], ["pois", "Pois"],
  ["rombi", "Rombi"], ["fiorellini", "Fiorellini"], ["stelle", "Stelle"], ["cuori", "Cuori"],
];
export const LINES: [string, string][] = [
  ["dritta", "Dritta"], ["doppia", "Doppia"], ["tratteggio", "Tratteggio"], ["puntini", "Puntini"], ["onda", "Onda"], ["smerlo", "Smerlo"],
];
export const FRAME_NAMES = ["Arco", "Mezzo arco", "Doppio arco", "Ovale", "Elegance", "Antico", "Onda", "Obliquo", "Gemme", "Candy"];

export const OCC: Record<string, string[]> = {
  "Fiocchi e decorazioni": ["Fiocchetto", "Fiocco con nastri", "Nastro", "Festone", "Ciliegie", "Fiore", "Busta", "Corona", "Ramo di alloro", "Corona di alloro"],
  "Battesimo e nascita": ["Orsetto", "Paperella", "Barchetta", "Gattino", "Cagnolino", "Scarpine", "Cavallo a dondolo", "Elefantino", "Corona"],
  Religiose: ["Calice con ostia", "Colomba", "Croce", "Candela", "Angioletto", "Rosario", "Spiga di grano", "Ramo d'ulivo"],
  Compleanno: ["Palloncini", "Torta con candeline", "Cupcake", "Dinosauro", "Regalo", "Aeroplano", "Elefantino", "Festone"],
  Laurea: ["Tocco di laurea", "Corona di alloro", "Ramo di alloro", "Bottiglia", "Brindisi", "Calici in festa"],
  "Anniversario e cerimonia": ["Torta a piani", "Torta su alzata", "Piramide di calici", "Calici in festa", "Calici di vino", "Coppa", "Cocktail", "Secchiello", "Bouquet", "Tulipani", "Lampadario", "Vaso su colonna"],
};

export const HEART = "M50 86C22 64 6 48 7 28 8 13 20 5 32 6c9 1 15 7 18 15 3-8 10-14 19-15 12-1 24 7 24 22 0 20-17 36-43 58z";

// Solo tinte chiare per lo sfondo: sotto questa luminosità il colore viene schiarito, così la stampa resta pulita
const hex2rgb = (h: string) => {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const rgb2hex = (a: number[]) => "#" + a.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const lum = ([r, g, b]: number[]) => {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
export const MIN_LUM = 0.82;
export function lighten(hex: string): { hex: string; adj: boolean } {
  const c = hex2rgb(hex);
  if (lum(c) >= MIN_LUM) return { hex: rgb2hex(c), adj: false };
  let t = 0;
  while (t < 1) {
    t += 0.02;
    const m = c.map((v) => v + (255 - v) * t);
    if (lum(m) >= MIN_LUM) return { hex: rgb2hex(m), adj: true };
  }
  return { hex: "#ffffff", adj: true };
}
export const isHex = (s: unknown): s is string => typeof s === "string" && /^#[0-9a-fA-F]{6}$/.test(s);
