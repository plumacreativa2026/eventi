// Dal documento dell'editor alla scena vettoriale in millimetri (PDF di stampa e JPG).
// Il testo diventa tracciati con gli stessi font dell'anteprima, quindi il risultato non dipende dal computer.
import type { Font } from "opentype.js";
import type { Node, Scene } from "../engine/scene";
import { FONT_MAP, FORMATS, lineStep, type Assets, type Doc, type FmtId, type Item } from "./costanti";
import { framePath, linePath, lineStroke, patternTile } from "./geometria";

export type FontPick = (family: string, italic: boolean, bold: boolean) => { font: Font; skew: boolean };

export type SceneOpts = {
  nome?: string | null; // segnaposti: nome dell'invitato; null = senza nome (sfondo per InDesign)
  back?: boolean; // cavalierino: il motivo continua sul retro
  bleed?: number; // abbondanza in mm (0 per il digitale)
};

const SKEW = 0.25; // corsivo simulato per i font che non hanno la versione corsiva (come fa il browser)

// Tracciato SVG dai comandi del glifo (toPathData di opentype.js 2.0 a volte scrive NaN)
type Cmd = { type: string; x?: number; y?: number; x1?: number; y1?: number; x2?: number; y2?: number };
export function pathData(cmds: Cmd[]) {
  const r = (v?: number) => (Math.round((v ?? 0) * 100) / 100).toString();
  let d = "";
  for (const c of cmds) {
    if (c.type === "M" || c.type === "L") d += c.type + r(c.x) + " " + r(c.y);
    else if (c.type === "Q") d += "Q" + r(c.x1) + " " + r(c.y1) + " " + r(c.x) + " " + r(c.y);
    else if (c.type === "C") d += "C" + r(c.x1) + " " + r(c.y1) + " " + r(c.x2) + " " + r(c.y2) + " " + r(c.x) + " " + r(c.y);
    else if (c.type === "Z") d += "Z";
  }
  return d;
}

const SHAPE = { kerning: true, features: { liga: true, rlig: true } } as const;

function measure(font: Font, text: string, fs: number, ls: number) {
  return font.getAdvanceWidth(text, fs, { ...SHAPE, letterSpacing: ls / fs } as never);
}

function textNodes(it: Item, pick: FontPick, nome: string | null | undefined): Node[] {
  if (it.role === "nome") {
    if (nome === null) return [];
    if (nome !== undefined) it = { ...it, text: nome };
  }
  const fam = FONT_MAP[it.font ?? ""] ? it.font! : "Lora";
  const k = FONT_MAP[fam][3] || 1;
  const { font, skew } = pick(fam, !!it.italic, (it.weight ?? 400) >= 700);
  const ls = it.ls || 0;
  const raw = String(it.text ?? "").replace(/\r/g, "");
  const lines = (it.upper ? raw.toLocaleUpperCase("it-IT") : raw).split("\n");
  let size = it.size ?? 40;
  // i testi con larghezza massima (nomi) si riducono da soli, come nell'editor
  if (it.fit) {
    const w = Math.max(...lines.map((l) => measure(font, l, size * k, ls)));
    if (w > it.fit) size = (size * it.fit) / w;
  }
  const fs = size * k;
  const step = lineStep(size, fam, it.lh || 1);
  const y0 = it.y - ((lines.length - 1) * step) / 2;
  // dominant-baseline "middle": la linea di base sta mezza altezza della x sotto il punto indicato
  const xh = ((font.tables.os2 as { sxHeight?: number } | undefined)?.sxHeight || font.unitsPerEm * 0.5) / font.unitsPerEm;
  const out: Node[] = [];
  lines.forEach((l, i) => {
    if (!l.trim()) return;
    const w = measure(font, l, fs, ls);
    const x = it.align === "start" ? it.x : it.align === "end" ? it.x - w : it.x - w / 2;
    const base = y0 + i * step + (fs * xh) / 2;
    const d = pathData(font.getPath(l, x, base, fs, { ...SHAPE, letterSpacing: ls / fs } as never).commands);
    if (!d) return;
    const p: Node = { t: "path", d, fill: it.color };
    out.push(skew ? { t: "g", m: [1, 0, -SKEW, 1, SKEW * base, 0], c: [p] } : p);
  });
  return out;
}

function itemNodes(A: Assets, it: Item, pick: FontPick, nome: string | null | undefined): Node[] {
  if (it.type === "frame") {
    const d = framePath(A, it.shape ?? "Elegance", it.x, it.y, it.w, it.h, it.rot);
    const out: Node[] = [];
    if (it.fill && it.fill !== "none") out.push({ t: "path", d, fill: it.fill });
    out.push({ t: "stroke", d, stroke: it.color, w: it.sw ?? 5 });
    return out;
  }
  if (it.type === "icon") {
    const ic = A.icons[it.name ?? ""];
    if (!ic) return [];
    const [vx, vy, vw, vh] = ic.vb, sx = it.w / vw, sy = it.h / vh;
    return [{ t: "g", m: [sx, 0, 0, sy, it.x - vx * sx, it.y - vy * sy], c: [{ t: "path", d: ic.d, fill: it.color }] }];
  }
  if (it.type === "line") {
    const st = lineStroke(it.style ?? "dritta", it.sw ?? 4);
    return [{ t: "g", m: [1, 0, 0, 1, it.x, it.y], c: [{ t: "stroke", d: linePath(it.style ?? "dritta", it.w, it.h), stroke: it.color, w: st.w, dash: st.dash, cap: st.cap }] }];
  }
  return textNodes(it, pick, nome);
}

// Motivo di sfondo ripetuto sull'area [x0, x1] × [y0, y1] (unità del foglio), con origine in (0, 0)
function patternNodes(doc: Doc, u: number, x0: number, y0: number, x1: number, y1: number): Node[] {
  const t = patternTile(doc.bg, u);
  if (!t) return [];
  const out: Node[] = [];
  for (let ty = Math.floor(y0 / t.P); ty * t.P < y1; ty++) {
    for (let tx = Math.floor(x0 / t.P); tx * t.P < x1; tx++) {
      const c: Node[] = t.shapes.map((s) => (s.m ? { t: "g", m: s.m, c: [{ t: "path", d: s.d, fill: s.fill }] } : { t: "path", d: s.d, fill: s.fill }));
      out.push({ t: "g", m: [1, 0, 0, 1, tx * t.P, ty * t.P], c });
    }
  }
  return [{ t: "g", c: out }];
}

export function docToScene(A: Assets, doc: Doc, fmt: FmtId, pick: FontPick, o: SceneOpts = {}): Scene {
  const F = FORMATS[fmt];
  const s = 0.1; // unità del foglio → mm (per il digitale 1 px = 0,1 "mm": 1080 px = 108)
  const b = o.bleed ?? (fmt === "digitale" ? 0 : 2);
  const bu = b / s;
  const items = doc.items.flatMap((it) => itemNodes(A, it, pick, o.nome));
  if (fmt === "cavalierino") {
    // foglio 8 × 10 cm: il fronte sta nella metà bassa; sul retro al massimo continua il motivo
    const pat = patternNodes(doc, F.u, -bu, o.back ? -F.H - bu : 0, F.W + bu, F.H + bu);
    return {
      w: F.W * s + 2 * b,
      h: F.H * 2 * s + 2 * b,
      bleed: b,
      bg: "#ffffff",
      nodes: [{ t: "g", m: [s, 0, 0, s, 0, F.H * s], c: [...pat, ...items] }],
    };
  }
  const pat = patternNodes(doc, F.u, -bu, -bu, F.W + bu, F.H + bu);
  return { w: F.W * s + 2 * b, h: F.H * s + 2 * b, bleed: b, bg: "#ffffff", nodes: [{ t: "g", m: [s, 0, 0, s, 0, 0], c: [...pat, ...items] }] };
}
