import type { Font } from "opentype.js";
import type { Node } from "./scene";

// Font disponibili nei modelli (file in /public/fonts, licenza OFL: uso web e PDF consentiti)
export const FONT_FILES = {
  playfair: "PlayfairDisplay-Regular.ttf",
  playfairItalic: "PlayfairDisplay-Italic.ttf",
  montserratLight: "Montserrat-Light.ttf",
  montserratMedium: "Montserrat-Medium.ttf",
  greatVibes: "GreatVibes-Regular.ttf",
  amatic: "AmaticSC-Bold.ttf",
  sniglet: "Sniglet-Regular.ttf",
  snigletBold: "Sniglet-ExtraBold.ttf",
} as const;
export type FontId = keyof typeof FONT_FILES;
export type Fonts = Record<FontId, Font>;

export const PT = 25.4 / 72; // 1 punto tipografico in mm

export type TextStyle = {
  font: FontId;
  size: number; // punti
  color: string;
  tracking?: number; // spaziatura lettere in em
  upper?: boolean;
  leading?: number; // interlinea, multiplo della dimensione
  minScale?: number; // quanto può rimpicciolirsi per stare nello spazio (default 0.45)
};

type Line = { text: string; width: number };

function measure(font: Font, text: string, sizeMm: number, tracking: number) {
  if (!text) return 0;
  const w = font.getAdvanceWidth(text, sizeMm, { kerning: true, letterSpacing: tracking });
  return w - tracking * sizeMm; // senza spazio dopo l'ultima lettera
}

// Blocco di testo centrato, una riga per ogni a capo, ridotto se non entra in larghezza/altezza.
// Restituisce i tracciati e l'altezza occupata.
export type Block = { height: number; draw: (cx: number, top: number) => Node[] };

export function textBlock(fonts: Fonts, raw: string, st: TextStyle, maxW: number, maxH = Infinity): Block {
  const font = fonts[st.font];
  const tracking = st.tracking ?? 0;
  const leading = st.leading ?? 1.35;
  const text = (st.upper ? raw.toLocaleUpperCase("it-IT") : raw).replace(/\r/g, "");
  const rawLines = text.split("\n").map((s) => s.trim());
  // togli righe vuote all'inizio e alla fine
  while (rawLines.length && !rawLines[0]) rawLines.shift();
  while (rawLines.length && !rawLines[rawLines.length - 1]) rawLines.pop();
  if (!rawLines.length) return { height: 0, draw: () => [] };

  let size = st.size * PT;
  const minSize = size * (st.minScale ?? 0.45);
  const desc = -font.descender / font.unitsPerEm;
  // altezza visiva: prima riga dall'altezza delle maiuscole, le vuote valgono mezza riga
  const capH = ((font.tables.os2 as { sCapHeight?: number } | undefined)?.sCapHeight || font.ascender * 0.7) / font.unitsPerEm;

  const layout = (sz: number) => {
    const lines: Line[] = rawLines.map((t) => ({ text: t, width: measure(font, t, sz, tracking) }));
    const step = sz * leading;
    let h = sz * capH;
    for (let i = 1; i < lines.length; i++) h += lines[i].text ? step : step * 0.55;
    h += sz * Math.min(desc, 0.25);
    const w = Math.max(...lines.map((l) => l.width));
    return { lines, h, w, step };
  };

  let L = layout(size);
  if (L.w > maxW || L.h > maxH) {
    const k = Math.min(maxW / L.w, maxH / L.h);
    size = Math.max(minSize, size * k * 0.995);
    L = layout(size);
  }

  return {
    height: L.h,
    draw: (cx, top) => {
      const out: Node[] = [];
      let y = top + size * capH;
      L.lines.forEach((l, i) => {
        if (i > 0) y += l.text ? L.step : L.step * 0.55;
        if (!l.text) return;
        const x = cx - l.width / 2;
        const d = font.getPath(l.text, x, y, size, { kerning: true, letterSpacing: tracking }).toPathData(3);
        if (d) out.push({ t: "path", d, fill: st.color });
      });
      return out;
    },
  };
}

// Impila più blocchi in verticale con spazi tra loro, centrati nell'area [top, bottom]
export function stack(items: { b: Block; gap?: number }[], cx: number, top: number, bottom: number): Node[] {
  const visible = items.filter((i) => i.b.height > 0);
  const total = visible.reduce((s, i, k) => s + i.b.height + (k > 0 ? (i.gap ?? 0) : 0), 0);
  let y = top + Math.max(0, (bottom - top - total) / 2);
  const out: Node[] = [];
  visible.forEach((i, k) => {
    if (k > 0) y += i.gap ?? 0;
    out.push(...i.b.draw(cx, y));
    y += i.b.height;
  });
  return out;
}
