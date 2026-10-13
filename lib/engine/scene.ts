// Scena vettoriale in millimetri: la stessa per anteprima (SVG), JPG e PDF di stampa.
// Tutto il testo è già convertito in tracciati, così il risultato è identico ovunque.

export type Node =
  | { t: "path"; d: string; fill: string; op?: number }
  | { t: "stroke"; d: string; stroke: string; w: number; op?: number }
  | { t: "g"; m?: [number, number, number, number, number, number]; c: Node[] };

export type Scene = {
  w: number; // larghezza totale, abbondanza compresa (mm)
  h: number;
  bleed: number;
  bg: string;
  nodes: Node[]; // in coordinate del formato finito (0,0 = angolo del taglio)
};

const n = (v: number) => +v.toFixed(3);

export const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;

export const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${n(cx - rx)} ${n(cy)}a${n(rx)} ${n(ry)} 0 1 0 ${n(2 * rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-2 * rx)} 0Z`;

export const circle = (cx: number, cy: number, r: number) => ellipse(cx, cy, r, r);

export const line = (x1: number, y1: number, x2: number, y2: number) => `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;

// Matrice di rotazione (gradi) attorno a un punto
export function rotateAbout(deg: number, cx: number, cy: number): [number, number, number, number, number, number] {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy];
}

// Generatore pseudo-casuale ripetibile: la stessa grafica a ogni rendering
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function attrOp(op?: number) {
  return op !== undefined && op < 1 ? ` opacity="${op}"` : "";
}

function nodeSvg(node: Node): string {
  if (node.t === "path") return `<path d="${node.d}" fill="${node.fill}"${attrOp(node.op)}/>`;
  if (node.t === "stroke")
    return `<path d="${node.d}" fill="none" stroke="${node.stroke}" stroke-width="${node.w}" stroke-linecap="round" stroke-linejoin="round"${attrOp(node.op)}/>`;
  const m = node.m ? ` transform="matrix(${node.m.map(n).join(" ")})"` : "";
  return `<g${m}>${node.c.map(nodeSvg).join("")}</g>`;
}

export type SvgOpts = {
  widthPx?: number; // per il JPG
  trim?: boolean; // ritaglia l'abbondanza (anteprima, JPG)
  extra?: string; // SVG aggiuntivo sopra (es. filigrana), in coordinate del formato finito
  fold?: number; // linea tratteggiata della piega, a questa altezza (mm)
};

export function toSvg(s: Scene, o: SvgOpts = {}) {
  const b = s.bleed;
  const vb = o.trim ? `${b} ${b} ${n(s.w - 2 * b)} ${n(s.h - 2 * b)}` : `0 0 ${n(s.w)} ${n(s.h)}`;
  const vw = o.trim ? s.w - 2 * b : s.w;
  const vh = o.trim ? s.h - 2 * b : s.h;
  const size = o.widthPx ? ` width="${o.widthPx}" height="${Math.round((o.widthPx * vh) / vw)}"` : "";
  const fold =
    o.fold !== undefined
      ? `<path d="${line(0, o.fold, s.w - 2 * b, o.fold)}" stroke="#9F6C68" stroke-width="0.25" stroke-dasharray="1.5 1.2" opacity="0.6"/>`
      : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${size}>` +
    `<rect x="0" y="0" width="${n(s.w)}" height="${n(s.h)}" fill="${s.bg}"/>` +
    `<g transform="translate(${b} ${b})">${s.nodes.map(nodeSvg).join("")}${fold}${o.extra ?? ""}</g>` +
    `</svg>`
  );
}
