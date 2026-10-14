// Geometrie dell'editor feste: cornici adattabili, linee, motivi di sfondo. Stesse forme a video e in stampa.
import { HEART, type Assets, type Bg } from "./costanti";

const f1 = (v: number) => v.toFixed(1);
const PAIR = /(-?\d*\.?\d+) (-?\d*\.?\d+)/g;

// Candy: contorno di cerchi uguali lungo il bordo, angoli compresi (come la sagoma originale)
export function candyPath(x: number, y: number, w: number, h: number) {
  const p = Math.min(w, h) / 6.1, rb0 = p * 0.6;
  const ix0 = x + rb0, iy0 = y + rb0, ix1 = x + w - rb0, iy1 = y + h - rb0;
  const nx = Math.max(1, Math.round((ix1 - ix0) / p)), ny = Math.max(1, Math.round((iy1 - iy0) / p));
  const cx = (ix1 - ix0) / nx, cy = (iy1 - iy0) / ny, rb = Math.max(cx, cy) * 0.6;
  const P: number[][] = [];
  for (let i = 0; i < nx; i++) P.push([ix0 + i * cx, iy0]);
  for (let i = 0; i < ny; i++) P.push([ix1, iy0 + i * cy]);
  for (let i = 0; i < nx; i++) P.push([ix1 - i * cx, iy1]);
  for (let i = 0; i < ny; i++) P.push([ix0, iy1 - i * cy]);
  const mx = x + w / 2, my = y + h / 2, n = P.length;
  // tacca esterna tra due cerchi vicini
  const cusp = (A: number[], B: number[]) => {
    const d = Math.hypot(B[0] - A[0], B[1] - A[1]), hh = Math.sqrt(Math.max(0, rb * rb - (d * d) / 4));
    const Mx = (A[0] + B[0]) / 2, My = (A[1] + B[1]) / 2, ux = -(B[1] - A[1]) / d, uy = (B[0] - A[0]) / d;
    const p1 = [Mx + ux * hh, My + uy * hh], p2 = [Mx - ux * hh, My - uy * hh];
    return Math.hypot(p1[0] - mx, p1[1] - my) > Math.hypot(p2[0] - mx, p2[1] - my) ? p1 : p2;
  };
  const C = P.map((c, i) => cusp(c, P[(i + 1) % n]));
  let d = `M${f1(C[n - 1][0])} ${f1(C[n - 1][1])}`;
  for (let i = 0; i < n; i++) {
    const s = C[(i - 1 + n) % n], e = C[i], c = P[i];
    let da = Math.atan2(e[1] - c[1], e[0] - c[0]) - Math.atan2(s[1] - c[1], s[0] - c[0]);
    while (da < 0) da += 2 * Math.PI;
    d += `A${f1(rb)} ${f1(rb)} 0 ${da > Math.PI ? 1 : 0} 1 ${f1(e[0])} ${f1(e[1])}`;
  }
  return d + "Z";
}

// Onda continua lungo un rettangolo arrotondato: anche gli angoli restano morbidi
export function ondaPath(x: number, y: number, w: number, h: number) {
  const m = Math.min(w, h), a = m * 0.028, rc = m * 0.13;
  const X0 = x + a, Y0 = y + a, W0 = w - 2 * a, H0 = h - 2 * a, sx = W0 - 2 * rc, sy = H0 - 2 * rc, arc = (Math.PI * rc) / 2;
  const per = 2 * (sx + sy) + 4 * arc, nW = Math.max(4, Math.round(per / (m * 0.42))), N = Math.max(240, nW * 24);
  const corner = (cx: number, cy: number, t0: number) => (u: number) => {
    const t = t0 + u / rc;
    return [cx + Math.cos(t) * rc, cy + Math.sin(t) * rc, Math.cos(t), Math.sin(t)];
  };
  const segs: [number, (u: number) => number[]][] = [
    [sx, (u) => [X0 + rc + u, Y0, 0, -1]],
    [arc, corner(X0 + W0 - rc, Y0 + rc, -Math.PI / 2)],
    [sy, (u) => [X0 + W0, Y0 + rc + u, 1, 0]],
    [arc, corner(X0 + W0 - rc, Y0 + H0 - rc, 0)],
    [sx, (u) => [X0 + W0 - rc - u, Y0 + H0, 0, 1]],
    [arc, corner(X0 + rc, Y0 + H0 - rc, Math.PI / 2)],
    [sy, (u) => [X0, Y0 + H0 - rc - u, -1, 0]],
    [arc, corner(X0 + rc, Y0 + rc, Math.PI)],
  ];
  const at = (s: number) => {
    for (const [L, fn] of segs) {
      if (s <= L) return fn(s);
      s -= L;
    }
    return segs[0][1](0);
  };
  const pts: number[][] = [];
  for (let i = 0; i < N; i++) {
    const [px, py, nx, ny] = at((i / N) * per), o = a * Math.sin((2 * Math.PI * nW * i) / N);
    pts.push([px + nx * o, py + ny * o]);
  }
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + "Z";
}

export const fRatio = (A: Assets, shape: string, rot?: boolean) => (rot ? 1 / A.frames[shape].r : A.frames[shape].r);

export function fitFrame(A: Assets, shape: string, rot: boolean, cx: number, cy: number, maxW: number, maxH: number) {
  const r = fRatio(A, shape, rot);
  let w = maxW, h = w * r;
  if (h > maxH) {
    h = maxH;
    w = h / r;
  }
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// Cornici che si adattano a qualsiasi formato senza deformarsi:
// Candy e Onda si ridisegnano con il numero giusto di onde; le altre allungano solo la fascia centrale dei lati.
export function framePath(A: Assets, shape: string, x: number, y: number, w: number, h: number, rot?: boolean) {
  const fr = A.frames[shape] ?? A.frames.Elegance;
  const r = fr.r, Rn = rot ? 1 / r : r;
  const s = Math.min(w, h / Rn), eW = w - s, eH = h - Rn * s, stretched = eW > w * 0.03 || eH > h * 0.03;
  if (stretched && shape === "Candy") return candyPath(x, y, w, h);
  if (shape === "Onda") {
    // versione lunga disegnata a mano (menu verticale, o ruotata per il segnaposto)
    const L = A.ondaLunga, br = h / w;
    if (Math.abs(br / L.r - 1) < 0.26) return L.d.replace(PAIR, (_m, p, q) => f1(x + p * w) + " " + f1(y + q * h));
    if (Math.abs(br * L.r - 1) < 0.3) return L.d.replace(PAIR, (_m, p, q) => f1(x + (1 - q) * w) + " " + f1(y + p * h));
    if (stretched) return ondaPath(x, y, w, h);
  }
  if (shape === "Ovale") return fr.d.replace(PAIR, (_m, p, q) => f1(x + p * w) + " " + f1(y + q * h)); // ellisse: si allunga in modo naturale
  const mp = (v: number, L: number, e: number) => {
    if (e <= 0.5) return v * s;
    const a = 0.3 * L, b = 0.7 * L;
    if (v < a) return v * s;
    if (v > b) return v * s + e;
    return a * s + ((v - a) * (0.4 * L * s + e)) / (0.4 * L);
  };
  const ox = x + (eW <= 0.5 ? (w - s) / 2 : 0), oy = y + (eH <= 0.5 ? (h - Rn * s) / 2 : 0);
  return fr.d.replace(PAIR, (_m, p, q) => {
    let X: number, Y: number;
    if (rot) {
      X = 1 - q;
      Y = p / r;
    } else {
      X = +p;
      Y = q * r;
    }
    return f1(ox + mp(X, 1, eW)) + " " + f1(oy + mp(Y, Rn, eH));
  });
}

export function linePath(st: string, w: number, h: number) {
  const c = h / 2;
  if (st === "dritta" || st === "tratteggio" || st === "puntini") return `M0 ${c}H${w}`;
  if (st === "doppia") return `M0 ${c - 7}H${w}M0 ${c + 7}H${w}`;
  const p = st === "onda" ? 44 : 36, n = Math.max(1, Math.round(w / p)), s = w / n;
  let d = `M0 ${c}`;
  for (let i = 0; i < n; i++) {
    const x0 = i * s;
    if (st === "onda") d += `Q${x0 + s / 4} ${c - 10} ${x0 + s / 2} ${c}T${x0 + s} ${c}`;
    else d += `A${s / 2} ${(s / 2) * 0.9} 0 0 1 ${x0 + s} ${c}`;
  }
  return d;
}

// Tratteggio delle linee: [trattino, spazio], larghezza del tratto, estremità
export function lineStroke(st: string, sw: number): { w: number; dash?: [number, number]; cap: "round" | "butt" } {
  if (st === "tratteggio") return { w: sw, dash: [sw * 5, sw * 4], cap: "butt" };
  if (st === "puntini") return { w: sw * 2.2, dash: [0.001, sw * 4], cap: "round" };
  return { w: sw, cap: "round" };
}

const circ = (cx: number, cy: number, r: number) =>
  `M${f1(cx - r)} ${f1(cy)}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
const rectP = (x: number, y: number, w: number, h: number) => `M${f1(x)} ${f1(y)}h${f1(w)}v${f1(h)}h${f1(-w)}Z`;

export type Shape = { d: string; fill: string; m?: [number, number, number, number, number, number] };

// Motivo di sfondo: una piastrella P × P da ripetere, con le sue forme
export function patternTile(bg: Bg, u: number): { P: number; shapes: Shape[] } | null {
  const c = bg.color, k = (bg.scale || 1) * u;
  switch (bg.type) {
    case "righe": {
      const P = 140 * k;
      return { P, shapes: [{ d: rectP(0, 0, P / 2, P), fill: c }] };
    }
    case "quadretti": {
      const P = 200 * k;
      return { P, shapes: [{ d: rectP(0, 0, P / 2, P / 2) + rectP(P / 2, P / 2, P / 2, P / 2), fill: c }] };
    }
    case "pois": {
      const P = 110 * k;
      return { P, shapes: [{ d: circ(P / 4, P / 4, 13 * k) + circ((P * 3) / 4, (P * 3) / 4, 13 * k), fill: c }] };
    }
    case "rombi": {
      const P = 170 * k;
      return { P, shapes: [{ d: `M${f1(P / 2)} 0L${f1(P)} ${f1(P / 2)}L${f1(P / 2)} ${f1(P)}L0 ${f1(P / 2)}Z`, fill: c }] };
    }
    case "fiorellini": {
      const P = 96 * k;
      const petals = (cx: number, cy: number, r: number) => {
        let s = "";
        for (let i = 0; i < 5; i++) {
          const a = (i * 72 * Math.PI) / 180;
          s += circ(cx + Math.sin(a) * r, cy - Math.cos(a) * r, r * 0.62);
        }
        return s;
      };
      return {
        P,
        shapes: [
          { d: petals(P / 4, P / 4, 7 * k) + petals((P * 3) / 4, (P * 3) / 4, 5.5 * k) + circ((P * 3) / 4, P / 4, 2.2 * k) + circ(P / 4, (P * 3) / 4, 2.2 * k), fill: c },
          { d: circ(P / 4, P / 4, 7 * k * 0.42) + circ((P * 3) / 4, (P * 3) / 4, 5.5 * k * 0.42), fill: "#ffffff" },
        ],
      };
    }
    case "stelle": {
      const P = 170 * k;
      const star = (cx: number, cy: number, r: number) => {
        let p = "";
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
          p += (i ? "L" : "M") + f1(cx + Math.cos(a) * rr) + " " + f1(cy + Math.sin(a) * rr);
        }
        return p + "Z";
      };
      return { P, shapes: [{ d: star(P / 4, P / 4, 18 * k) + star((P * 3) / 4, (P * 3) / 4, 18 * k), fill: c }] };
    }
    case "cuori": {
      const P = 170 * k, s = 0.34 * k;
      const at = (cx: number, cy: number): Shape => ({ d: HEART, fill: c, m: [s, 0, 0, s, cx - 50 * s, cy - 46 * s] });
      return { P, shapes: [at(P / 4, P / 4), at((P * 3) / 4, (P * 3) / 4)] };
    }
  }
  return null;
}

// Motivo come <pattern> SVG (anteprima nel browser)
export function patternSvg(bg: Bg, u: number, id: string) {
  const t = patternTile(bg, u);
  if (!t) return "";
  const body = t.shapes.map((s) => `<path d="${s.d}" fill="${s.fill}"${s.m ? ` transform="matrix(${s.m.join(" ")})"` : ""}/>`).join("");
  return `<pattern id="${id}" width="${t.P}" height="${t.P}" patternUnits="userSpaceOnUse">${body}</pattern>`;
}

export const aspect = (A: Assets, name: string) => {
  const v = (A.icons[name] ?? Object.values(A.icons)[0]).vb;
  return v[3] / v[2];
};
