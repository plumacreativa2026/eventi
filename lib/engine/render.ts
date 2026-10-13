import { ABBONDANZA, PEZZI, type PieceId } from "../catalog";
import type { ProjectData } from "../project";
import { modello, type Area, type Model, type Palette } from "./models";
import type { Node, Scene } from "./scene";
import { stack, textBlock, type Fonts } from "./text";

export type RenderOpts = {
  nome?: string | null; // segnaposto: nome dell'invitato; null = sfondo senza nome (per InDesign)
};

function seedOf(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Segnaposto (o faccia del cavalierino) di 80 × 50 mm
function placeCard(fonts: Fonts, d: ProjectData, m: Model, p: Palette, nome: string | null, w: number, h: number, seed: number): Node[] {
  const a: Area = { w, h, bleed: ABBONDANZA, seed, small: true };
  const dec = m.decor(a, p);
  const maxW = w - dec.safe.left - dec.safe.right;
  const cx = dec.safe.left + maxW / 2;
  const name = textBlock(fonts, nome ?? "", { font: m.fonts.name, size: m.fonts.nameSize * 0.6, color: p.accent, minScale: 0.35 }, maxW, h * 0.5);
  const riga = textBlock(fonts, d.testi.segnaposto.riga, { font: m.fonts.caps, size: 5, color: p.ink, tracking: 0.16, upper: true, minScale: 0.6 }, maxW);
  // senza nome la riga resta nella stessa posizione che avrebbe con il nome
  const ref = nome === null ? textBlock(fonts, "Nome", { font: m.fonts.name, size: m.fonts.nameSize * 0.6, color: p.accent }, maxW, h * 0.5) : name;
  const txt = stack([{ b: ref }, { b: riga, gap: 3 }], cx, dec.safe.top, h - dec.safe.bottom);
  const nodes = nome === null ? txt.slice(nameNodeCount(ref, cx)) : txt;
  return [...dec.back, ...nodes];
}

// numero di tracciati del blocco "nome" (per toglierlo dalla versione senza nome)
function nameNodeCount(b: { draw: (cx: number, top: number) => Node[] }, cx: number) {
  return b.draw(cx, 0).length;
}

export function render(fonts: Fonts, d: ProjectData, piece: PieceId, o: RenderOpts = {}): Scene {
  const m = modello(d.modello);
  const p = m.palettes[d.palette] ?? m.palettes[0];
  const { w, h } = PEZZI[piece];
  const b = ABBONDANZA;
  const seed = seedOf(d.modello + piece);
  const scene: Scene = { w: w + 2 * b, h: h + 2 * b, bleed: b, bg: p.bg, nodes: [] };

  if (piece === "invito") {
    const dec = m.decor({ w, h, bleed: b, seed, small: false }, p);
    const maxW = w - dec.safe.left - dec.safe.right;
    const cx = dec.safe.left + maxW / 2;
    const avail = h - dec.safe.top - dec.safe.bottom;
    const t = d.testi.invito;
    const sopra = textBlock(fonts, t.sopra, { font: m.fonts.caps, size: 7.5, color: p.ink, tracking: 0.18, upper: true, minScale: 0.6 }, maxW);
    const nome = textBlock(fonts, t.nome, { font: m.fonts.name, size: m.fonts.nameSize, color: p.accent, minScale: 0.4 }, maxW, avail * 0.3);
    const chiusura = textBlock(fonts, t.chiusura, { font: m.fonts.body, size: 7, color: p.ink, leading: 1.5, minScale: 0.65 }, maxW);
    const fixed = sopra.height + nome.height + chiusura.height + 5 + 7 + 9;
    const corpo = textBlock(fonts, t.corpo, { font: m.fonts.body, size: 9.5, color: p.ink, leading: 1.6, minScale: 0.55 }, maxW, Math.max(10, avail - fixed));
    scene.nodes = [...dec.back, ...stack([{ b: sopra }, { b: nome, gap: 5 }, { b: corpo, gap: 7 }, { b: chiusura, gap: 9 }], cx, dec.safe.top, h - dec.safe.bottom)];
  } else if (piece === "menu") {
    const dec = m.decor({ w, h, bleed: b, seed, small: false }, p);
    const maxW = w - dec.safe.left - dec.safe.right;
    const cx = dec.safe.left + maxW / 2;
    const t = d.testi.menu;
    const avail = h - dec.safe.top - dec.safe.bottom;
    const titolo = textBlock(fonts, t.titolo, { font: m.fonts.name, size: m.fonts.nameSize * 0.85, color: p.accent, minScale: 0.5 }, maxW);
    const nome = textBlock(fonts, t.nome, { font: m.fonts.caps, size: 6.5, color: p.ink, tracking: 0.16, upper: true, minScale: 0.6 }, maxW);
    const chiusura = textBlock(fonts, t.chiusura, { font: m.fonts.caps, size: 6, color: p.ink, tracking: 0.16, upper: true, minScale: 0.6 }, maxW);
    const fixed = titolo.height + nome.height + chiusura.height + 3 + 9 + 9;
    const portate = textBlock(fonts, t.portate, { font: m.fonts.body, size: 8.5, color: p.ink, leading: 1.7, minScale: 0.5 }, maxW, Math.max(10, avail - fixed));
    scene.nodes = [...dec.back, ...stack([{ b: titolo }, { b: nome, gap: 3 }, { b: portate, gap: 9 }, { b: chiusura, gap: 9 }], cx, dec.safe.top, h - dec.safe.bottom)];
  } else if (piece === "segnaposto") {
    scene.nodes = placeCard(fonts, d, m, p, o.nome === undefined ? "Nome Cognome" : o.nome, w, h, seed);
  } else {
    // cavalierino: faccia anteriore nella metà bassa, retro (facoltativo) nella metà alta ruotato di 180°
    const half = h / 2;
    const front = placeCard(fonts, d, m, p, o.nome === undefined ? "Nome Cognome" : o.nome, w, half, seed);
    scene.nodes.push({ t: "g", m: [1, 0, 0, 1, 0, half], c: front });
    if (d.retro) {
      const back = placeCard(fonts, d, m, p, null, w, half, seed + 1);
      scene.nodes.push({ t: "g", m: [-1, 0, 0, -1, w, half], c: back });
    }
  }
  return scene;
}
