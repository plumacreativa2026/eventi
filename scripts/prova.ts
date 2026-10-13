// Prova locale: genera le anteprime PNG di tutti i modelli (npx tsx scripts/prova.ts <cartella>)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { parse } from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import { FONT_FILES, type Fonts } from "../lib/engine/text";
import { render } from "../lib/engine/render";
import { toSvg } from "../lib/engine/scene";
import { MODELLI } from "../lib/engine/models";
import { nuovoProgetto } from "../lib/project";

const out = process.argv[2] ?? "prova";
mkdirSync(out, { recursive: true });
const fonts = {} as Fonts;
for (const [id, f] of Object.entries(FONT_FILES)) {
  const b = readFileSync("public/fonts/" + f);
  (fonts as Record<string, unknown>)[id] = parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
for (const m of MODELLI) {
  const d = nuovoProgetto(m.gruppi[0], m.id);
  d.retro = true;
  for (const piece of ["invito", "menu", "segnaposto", "cavalierino"] as const) {
    const s = render(fonts, d, piece, { nome: "Nonna Maria" });
    const svg = toSvg(s, { widthPx: 600, fold: piece === "cavalierino" ? 50 : undefined });
    const png = new Resvg(svg).render().asPng();
    writeFileSync(`${out}/${m.id}-${piece}.png`, png);
  }
}
console.log("ok");
