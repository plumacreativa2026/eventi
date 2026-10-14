import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse, type Font } from "opentype.js";
import type { ProjectData } from "../project";
import { FONT_FILES, type Assets, type FmtId } from "./costanti";
import { docToScene, type FontPick } from "./stampa";

let assets: Assets | null = null;
const fonts = new Map<string, Font>();

// Illustrazioni e cornici (stesso file che usa l'editor nel browser)
export function serverAssets(): Assets {
  if (!assets) assets = JSON.parse(readFileSync(path.join(process.cwd(), "public", "feste", "assets.json"), "utf8")) as Assets;
  return assets;
}

function load(file: string) {
  let f = fonts.get(file);
  if (!f) {
    const b = readFileSync(path.join(process.cwd(), "public", "fonts", file));
    f = parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
    fonts.set(file, f);
  }
  return f;
}

// Sceglie il file giusto; se manca il corsivo lo simula inclinando le lettere
export const pickFont: FontPick = (family, italic, bold) => {
  const ff = FONT_FILES[family] ?? FONT_FILES.Lora;
  if (bold && ff.b) return { font: load(ff.b), skew: false };
  if (italic && ff.i) return { font: load(ff.i), skew: false };
  return { font: load(ff.n), skew: italic };
};

// Scena pronta per PDF/JPG di un formato del progetto
export function scena(d: ProjectData, fmt: FmtId, nome?: string | null) {
  return docToScene(serverAssets(), d.docs[fmt], fmt, pickFont, { nome, back: d.back });
}
