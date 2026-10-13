import { gruppoDi, type Gruppo } from "../catalog";
import type { FontId } from "./text";
import { circle, ellipse, rect, rng, rotateAbout, type Node } from "./scene";

export type Palette = { nome: string; bg: string; ink: string; accent: string; soft: string; extra: string[] };

// Zona da decorare: un pezzo intero, oppure la faccia di un cavalierino
export type Area = { w: number; h: number; bleed: number; seed: number; small: boolean };
export type Safe = { top: number; bottom: number; left: number; right: number };
export type Decor = { back: Node[]; safe: Safe };

export type Model = {
  id: string;
  nome: string;
  descr: string;
  gruppi: Gruppo[];
  palettes: Palette[];
  fonts: { name: FontId; nameSize: number; caps: FontId; body: FontId };
  decor: (a: Area, p: Palette) => Decor;
};

// ---------- utilità colore ----------
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export function mix(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

// stellina a quattro punte
const sparkle = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r}Q${cx} ${cy} ${cx + r} ${cy}Q${cx} ${cy} ${cx} ${cy + r}Q${cx} ${cy} ${cx - r} ${cy}Q${cx} ${cy} ${cx} ${cy - r}Z`;

// foglia a punta, lunga L, orientata lungo l'asse x a partire dall'origine
const leaf = (L: number) => `M0 0Q${L * 0.5} ${-L * 0.36} ${L} 0Q${L * 0.5} ${L * 0.36} 0 0Z`;

// ---------- Nuvole ----------
function nuvole(a: Area, p: Palette): Decor {
  const { w, h, bleed, small } = a;
  const k = Math.min(w, h) / 115;
  const back: Node[] = [];
  const R = rng(a.seed);
  // due file di nuvole sul fondo, da bordo a bordo (abbondanza compresa)
  const band = (baseY: number, color: string, rMin: number, rMax: number) => {
    const d: string[] = [];
    let x = -bleed - rMax * k * 0.5;
    while (x < w + bleed + rMax * k) {
      const r = (rMin + (rMax - rMin) * R()) * k;
      d.push(circle(x, baseY - r * 0.35, r));
      x += r * 1.35;
    }
    d.push(rect(-bleed, baseY, w + 2 * bleed, h - baseY + bleed + 1));
    back.push({ t: "path", d: d.join(""), fill: color });
  };
  const top1 = h - (small ? 9 : 26) * k;
  band(top1, p.soft, 9, 15);
  band(top1 + 9 * k, mix(p.soft, "#ffffff", 0.55), 8, 13);
  // stelline in alto
  const stars = small
    ? [[0.12, 0.2, 2.2], [0.88, 0.24, 1.6]]
    : [[0.2, 0.09, 3.2], [0.8, 0.12, 2.4], [0.5, 0.06, 1.6], [0.12, 0.2, 1.4], [0.9, 0.22, 1.8]];
  for (const [x, y, r] of stars) back.push({ t: "path", d: sparkle(x * w, y * h, r * k * (small ? 1.6 : 1)), fill: p.accent });
  return { back, safe: { top: small ? 4 : h * 0.17, bottom: h - top1 + (small ? 3 : 6) * k, left: small ? 7 : 10, right: small ? 7 : 10 } };
}

// ---------- Palloncini ----------
function palloncini(a: Area, p: Palette): Decor {
  const { w, h, small } = a;
  const back: Node[] = [];
  const balloon = (cx: number, cy: number, r: number, color: string, tilt: number, stringLen: number) => {
    const knot = `M${cx - r * 0.12} ${cy + r * 1.22}L${cx + r * 0.12} ${cy + r * 1.22}L${cx} ${cy + r * 1.12}Z`;
    const sx = cx;
    const sy = cy + r * 1.22;
    const str = `M${sx} ${sy}q${-r * 0.35} ${stringLen * 0.25} 0 ${stringLen * 0.5}t0 ${stringLen * 0.5}`;
    back.push({
      t: "g",
      m: rotateAbout(tilt, cx, cy + r * 1.2 + stringLen),
      c: [
        { t: "stroke", d: str, stroke: p.ink, w: 0.2, op: 0.55 },
        { t: "path", d: ellipse(cx, cy, r, r * 1.2) + knot, fill: color },
        { t: "path", d: ellipse(cx - r * 0.38, cy - r * 0.45, r * 0.16, r * 0.3), fill: "#ffffff", op: 0.45 },
      ],
    });
  };
  const c = p.extra;
  if (small) {
    // un mazzetto per lato
    const r = 4.2;
    balloon(7, h * 0.36, r, c[0], -8, h * 0.4);
    balloon(12.5, h * 0.3, r * 0.85, c[1], 6, h * 0.45);
    balloon(w - 12.5, h * 0.3, r * 0.85, c[2], -6, h * 0.45);
    balloon(w - 7, h * 0.36, r, c[3 % c.length], 8, h * 0.4);
    return { back, safe: { top: 4, bottom: 4, left: 19, right: 19 } };
  }
  const k = w / 115;
  const r = 9.5 * k;
  const cx = w / 2;
  const cy = 22 * k;
  const len = 18 * k;
  balloon(cx - 13 * k, cy + 4 * k, r * 0.92, c[0], -14, len);
  balloon(cx + 13 * k, cy + 4 * k, r * 0.92, c[2], 14, len);
  balloon(cx, cy - 2 * k, r, c[1], 0, len + 6 * k);
  // coriandoli sparsi
  const R = rng(a.seed + 7);
  for (let i = 0; i < 14; i++) {
    const x = R() * w;
    const y = R() < 0.5 ? R() * h * 0.12 : h - R() * h * 0.1;
    back.push({ t: "path", d: circle(x, y, (0.6 + R() * 0.9) * k), fill: c[i % c.length], op: 0.8 });
  }
  return { back, safe: { top: cy + r * 1.2 + len + 12 * k, bottom: h * 0.08, left: 9, right: 9 } };
}

// ---------- Alloro ----------
function corona(cx: number, cy: number, R: number, color: string, stem: string): Node[] {
  const out: Node[] = [];
  const L = R * 0.42;
  const branch = (from: number, to: number) => {
    const p = (deg: number) => [cx + R * Math.cos((deg * Math.PI) / 180), cy + R * Math.sin((deg * Math.PI) / 180)];
    const [x1, y1] = p(from);
    const [x2, y2] = p(to);
    const sweep = to > from ? 1 : 0;
    out.push({ t: "stroke", d: `M${x1} ${y1}A${R} ${R} 0 0 ${sweep} ${x2} ${y2}`, stroke: stem, w: R * 0.035 });
    const n = 7;
    for (let i = 0; i < n; i++) {
      const deg = from + ((to - from) * (i + 0.6)) / n;
      const [x, y] = p(deg);
      const tangent = deg + (to > from ? 90 : -90); // direzione di crescita del ramo
      const scale = 1 - (i / n) * 0.35;
      for (const side of [-1, 1]) {
        const ang = tangent + side * 38;
        const m = rotateAbout(ang, 0, 0);
        m[0] *= scale; m[1] *= scale; m[2] *= scale; m[3] *= scale;
        m[4] = x; m[5] = y;
        out.push({ t: "g", m, c: [{ t: "path", d: leaf(L), fill: color }] });
      }
    }
    const [tx, ty] = p(to + (to > from ? 4 : -4));
    out.push({ t: "path", d: ellipse(tx, ty, L * 0.16, L * 0.16), fill: color });
  };
  branch(100, 235);
  branch(80, -55);
  return out;
}

function alloro(a: Area, p: Palette): Decor {
  const { w, h, small } = a;
  if (small) {
    // rametti ai lati
    const R = h * 0.62;
    return {
      back: [
        { t: "g", m: [1, 0, 0, 1, 0, 0], c: corona(R * 0.75 - 2, h / 2, R * 0.5, p.accent, p.accent).slice(0, 16) },
        { t: "g", m: [-1, 0, 0, 1, w, 0], c: corona(R * 0.75 - 2, h / 2, R * 0.5, p.accent, p.accent).slice(0, 16) },
      ],
      safe: { top: 4, bottom: 4, left: 14, right: 14 },
    };
  }
  const k = w / 115;
  const R = 15 * k;
  const cy = 12 * k + R;
  return { back: corona(w / 2, cy, R, p.accent, p.accent), safe: { top: cy + R + 9 * k, bottom: 12 * k, left: 10, right: 10 } };
}

// ---------- Cornice ----------
function cornice(a: Area, p: Palette): Decor {
  const { w, h, small } = a;
  const m = small ? 3.2 : 6;
  const g = small ? 1 : 1.6;
  const d = (i: number) => rect(m + i, m + i, w - 2 * (m + i), h - 2 * (m + i));
  const back: Node[] = [
    { t: "stroke", d: d(0), stroke: p.accent, w: small ? 0.3 : 0.4 },
    { t: "stroke", d: d(g), stroke: p.accent, w: 0.15 },
  ];
  const dia = (x: number, y: number, r: number) => `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;
  const r = small ? 1 : 1.8;
  for (const [x, y] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    back.push({ t: "path", d: dia(x, y, r + 0.6), fill: p.bg }, { t: "path", d: dia(x, y, r), fill: p.accent });
  }
  const s = m + g + (small ? 4 : 9);
  return { back, safe: { top: s + (small ? 0 : 4), bottom: s, left: s, right: s } };
}

// ---------- Coriandoli ----------
function coriandoli(a: Area, p: Palette): Decor {
  const { w, h, bleed, small } = a;
  const R = rng(a.seed + 3);
  const back: Node[] = [];
  const count = Math.round(((w * h) / 115 / 170) * 60) + (small ? 10 : 0);
  const rx = w * 0.4;
  const ry = h * 0.36;
  let tries = 0;
  for (let i = 0; i < count && tries < 3000; tries++) {
    const x = -bleed + R() * (w + 2 * bleed);
    const y = -bleed + R() * (h + 2 * bleed);
    const dx = (x - w / 2) / rx;
    const dy = (y - h / 2) / ry;
    if (dx * dx + dy * dy < 1) continue;
    const color = p.extra[i % p.extra.length];
    const s = (small ? 0.8 : 1.3) + R() * (small ? 0.8 : 1.4);
    const kind = R();
    if (kind < 0.45) back.push({ t: "path", d: circle(x, y, s * 0.6), fill: color });
    else if (kind < 0.8) back.push({ t: "g", m: rotateAbout(R() * 180, x, y), c: [{ t: "path", d: rect(x - s * 0.9, y - s * 0.35, s * 1.8, s * 0.7), fill: color }] });
    else back.push({ t: "g", m: rotateAbout(R() * 180, x, y), c: [{ t: "stroke", d: `M${x - s * 1.4} ${y}q${s * 0.7} ${-s} ${s * 1.4} 0t${s * 1.4} 0`, stroke: color, w: s * 0.3 }] });
    i++;
  }
  const sx = small ? 10 : w * 0.12;
  return { back, safe: { top: h * 0.14, bottom: h * 0.12, left: sx, right: sx } };
}

// ---------- Modelli ----------

export const MODELLI: Model[] = [
  {
    id: "nuvole",
    nome: "Nuvole",
    descr: "Nuvole morbide e stelline, per accogliere i più piccoli",
    gruppi: ["bimbi"],
    fonts: { name: "greatVibes", nameSize: 54, caps: "montserratMedium", body: "montserratLight" },
    palettes: [
      { nome: "Azzurro", bg: "#F6F9FC", ink: "#44525F", accent: "#7FA7C9", soft: "#DCE8F2", extra: [] },
      { nome: "Rosa", bg: "#FCF6F4", ink: "#5E4644", accent: "#D5A39B", soft: "#F2DFDA", extra: [] },
      { nome: "Salvia", bg: "#F6F8F3", ink: "#4A5546", accent: "#8FA586", soft: "#DFE7D9", extra: [] },
    ],
    decor: nuvole,
  },
  {
    id: "palloncini",
    nome: "Palloncini",
    descr: "Un mazzo di palloncini colorati e coriandoli",
    gruppi: ["bimbi", "adulti"],
    fonts: { name: "snigletBold", nameSize: 40, caps: "montserratMedium", body: "montserratLight" },
    palettes: [
      { nome: "Festa", bg: "#FFFDF9", ink: "#3D405B", accent: "#E07A5F", soft: "#F4F1DE", extra: ["#E07A5F", "#F2CC8F", "#81B29A", "#3D405B"] },
      { nome: "Pastello", bg: "#FFFCFB", ink: "#5B4F57", accent: "#D5A39B", soft: "#F8F1EC", extra: ["#E8BEBA", "#F6D8AE", "#B8D8D0", "#C7B8E0"] },
      { nome: "Mare", bg: "#FAFDFE", ink: "#23445A", accent: "#2A7FA8", soft: "#E3F1F6", extra: ["#2A7FA8", "#F2B33D", "#7CC6D9", "#E8665A"] },
    ],
    decor: palloncini,
  },
  {
    id: "coriandoli",
    nome: "Coriandoli",
    descr: "Una pioggia di coriandoli tutt'intorno, allegra e semplice",
    gruppi: ["bimbi", "adulti"],
    fonts: { name: "amatic", nameSize: 66, caps: "montserratMedium", body: "montserratLight" },
    palettes: [
      { nome: "Arcobaleno", bg: "#FFFFFF", ink: "#333333", accent: "#E4572E", soft: "#FFF3E8", extra: ["#E4572E", "#F3A712", "#29335C", "#669BBC", "#A8C686"] },
      { nome: "Rosa e oro", bg: "#FFFBF8", ink: "#4A3836", accent: "#9F6C68", soft: "#F8F1EC", extra: ["#D5A39B", "#E8BEBA", "#C9A45C", "#9F6C68"] },
      { nome: "Blu e oro", bg: "#FFFFFF", ink: "#1F2A44", accent: "#1F2A44", soft: "#EEF1F6", extra: ["#1F2A44", "#C9A45C", "#8DA3C4"] },
    ],
    decor: coriandoli,
  },
  {
    id: "alloro",
    nome: "Alloro",
    descr: "Una corona d'alloro elegante, perfetta per lauree e traguardi",
    gruppi: ["adulti", "bimbi"],
    fonts: { name: "greatVibes", nameSize: 54, caps: "montserratMedium", body: "montserratLight" },
    palettes: [
      { nome: "Rosso laurea", bg: "#FFFFFF", ink: "#3A2A28", accent: "#A32D2D", soft: "#F6E9E7", extra: [] },
      { nome: "Salvia", bg: "#FBFBF8", ink: "#3E463B", accent: "#7E9474", soft: "#E9EEE5", extra: [] },
      { nome: "Marsala", bg: "#FFFCFA", ink: "#4A3836", accent: "#9F6C68", soft: "#F8F1EC", extra: [] },
    ],
    decor: alloro,
  },
  {
    id: "cornice",
    nome: "Cornice",
    descr: "Doppia cornice sottile, essenziale e raffinata",
    gruppi: ["adulti", "bimbi"],
    fonts: { name: "playfairItalic", nameSize: 40, caps: "montserratMedium", body: "montserratLight" },
    palettes: [
      { nome: "Marsala", bg: "#FFFCFA", ink: "#4A3836", accent: "#9F6C68", soft: "#F8F1EC", extra: [] },
      { nome: "Blu notte", bg: "#FFFFFF", ink: "#1F2A44", accent: "#1F2A44", soft: "#EEF1F6", extra: [] },
      { nome: "Oro", bg: "#FFFDF8", ink: "#3B3428", accent: "#B08D4C", soft: "#F6F0E3", extra: [] },
    ],
    decor: cornice,
  },
];

export function modello(id: string) {
  return MODELLI.find((m) => m.id === id) ?? MODELLI[0];
}

export function modelliPer(evento: string) {
  const g = gruppoDi(evento) ?? "bimbi";
  // prima i modelli pensati per la sezione, poi gli altri
  return MODELLI.filter((m) => m.gruppi.includes(g)).sort((a, b) => a.gruppi.indexOf(g) - b.gruppi.indexOf(g));
}
