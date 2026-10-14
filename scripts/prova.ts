// Anteprime PNG e PDF di prova di tutti gli spunti in tutti i formati:  npx tsx scripts/prova.ts [cartella]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse, type Font } from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { toSvg } from "../lib/engine/scene";
import { FMT_IDS, FONT_FILES, type Assets } from "../lib/feste/costanti";
import { buildAll, SPUNTI } from "../lib/feste/spunti";
import { docToScene, type FontPick } from "../lib/feste/stampa";

const out = process.argv[2] || "prova";
mkdirSync(out, { recursive: true });
const A = JSON.parse(readFileSync("public/feste/assets.json", "utf8")) as Assets;
const cache = new Map<string, Font>();
const load = (f: string) => {
  if (!cache.has(f)) {
    const b = readFileSync(path.join("public/fonts", f));
    cache.set(f, parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));
  }
  return cache.get(f)!;
};
const pick: FontPick = (fam, it, bo) => {
  const ff = FONT_FILES[fam];
  if (bo && ff.b) return { font: load(ff.b), skew: false };
  if (it && ff.i) return { font: load(ff.i), skew: false };
  return { font: load(ff.n), skew: it };
};
for (const s of SPUNTI) {
  const docs = buildAll(A, s.id);
  for (const f of FMT_IDS) {
    const sc = docToScene(A, docs[f], f, pick, { back: true });
    writeFileSync(path.join(out, `${s.id}-${f}.png`), new Resvg(toSvg(sc, { trim: true, widthPx: 600 }), { background: "#fff" }).render().asPng());
  }
}
console.log("Anteprime in", out);
