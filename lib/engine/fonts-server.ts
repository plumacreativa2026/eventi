import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "opentype.js";
import { FONT_FILES, type FontId, type Fonts } from "./text";

let cache: Fonts | null = null;

export function serverFonts(): Fonts {
  if (cache) return cache;
  const dir = path.join(process.cwd(), "public", "fonts");
  const out = {} as Fonts;
  for (const [id, file] of Object.entries(FONT_FILES) as [FontId, string][]) {
    const b = readFileSync(path.join(dir, file));
    out[id] = parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer);
  }
  cache = out;
  return out;
}
