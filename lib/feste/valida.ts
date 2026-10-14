// Controllo dei documenti arrivati dal browser: solo valori ammessi, numeri entro limiti, testi di lunghezza ragionevole.
import { FMT_IDS, FONT_MAP, FRAME_NAMES, isHex, lighten, LINES, PATTERNS, type Assets, type Bg, type Doc, type Docs, type Item } from "./costanti";

const num = (v: unknown, min: number, max: number, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
};
const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
const PAT = new Set(PATTERNS.map((p) => p[0]));
const LIN = new Set(LINES.map((l) => l[0]));
const MAX_ITEMS = 60;

function bg(v: unknown): Bg {
  const b = (v ?? {}) as Partial<Bg>;
  const type = PAT.has(String(b.type)) ? String(b.type) : "nulla";
  return { type, color: isHex(b.color) ? lighten(b.color).hex : "#f1e8eb", scale: num(b.scale, 0.5, 2, 1) };
}

function item(v: unknown, A: Assets, i: number): Item | null {
  const o = (v ?? {}) as Record<string, unknown>;
  const base = {
    id: str(o.id, 12) || "e" + (i + 1),
    x: num(o.x, -3000, 5000, 0),
    y: num(o.y, -3000, 5000, 0),
    w: num(o.w, 0, 6000, 0),
    h: num(o.h, 0, 6000, 0),
    color: isHex(o.color) ? o.color : "#86807b",
  };
  switch (o.type) {
    case "frame":
      if (!FRAME_NAMES.includes(String(o.shape))) return null;
      return { ...base, type: "frame", shape: String(o.shape), rot: !!o.rot, sw: num(o.sw, 0.5, 20, 4), fill: o.fill === "none" ? "none" : "#ffffff", w: Math.max(40, base.w), h: Math.max(40, base.h) };
    case "icon":
      if (!A.icons[String(o.name)]) return null;
      return { ...base, type: "icon", name: String(o.name), w: Math.max(10, base.w), h: Math.max(10, base.h) };
    case "line":
      return { ...base, type: "line", style: LIN.has(String(o.style)) ? String(o.style) : "dritta", sw: num(o.sw, 0.5, 20, 4), w: Math.max(40, base.w), h: num(o.h, 10, 200, 40) };
    case "text": {
      const t: Item = {
        ...base,
        type: "text",
        text: str(o.text, 1500),
        font: FONT_MAP[String(o.font)] ? String(o.font) : "Lora",
        size: num(o.size, 4, 600, 40),
        align: o.align === "start" || o.align === "end" ? o.align : "middle",
        ls: num(o.ls, -10, 60, 0),
        lh: num(o.lh, 0.5, 3, 1),
        italic: !!o.italic,
        upper: !!o.upper,
      };
      if (Number(o.weight) >= 700) t.weight = 800;
      if (o.fit !== undefined) t.fit = num(o.fit, 50, 6000, 800);
      if (o.role === "nome") t.role = "nome";
      return t;
    }
  }
  return null;
}

function doc(v: unknown, A: Assets): Doc {
  const d = (v ?? {}) as Partial<Doc>;
  const raw = Array.isArray(d.items) ? d.items.slice(0, MAX_ITEMS) : [];
  return { bg: bg(d.bg), items: raw.map((x, i) => item(x, A, i)).filter((x): x is Item => !!x) };
}

// Documenti validi per tutti i formati; quelli mancanti si prendono dai valori di riserva
export function validaDocs(v: unknown, A: Assets, riserva: Docs): Docs {
  const src = (v ?? {}) as Partial<Docs>;
  const out = {} as Docs;
  for (const f of FMT_IDS) out[f] = src[f] ? doc(src[f], A) : riserva[f];
  return out;
}
