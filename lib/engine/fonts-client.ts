import { parse } from "opentype.js";
import { FONT_FILES, type FontId, type Fonts } from "./text";

let loading: Promise<Fonts> | null = null;

// Scarica i font una volta sola per pagina
export function loadFonts(): Promise<Fonts> {
  if (!loading) {
    loading = (async () => {
      const entries = await Promise.all(
        (Object.entries(FONT_FILES) as [FontId, string][]).map(async ([id, file]) => {
          const r = await fetch(`/fonts/${file}`);
          if (!r.ok) throw new Error(`Font ${file} non trovato`);
          return [id, parse(await r.arrayBuffer())] as const;
        }),
      );
      return Object.fromEntries(entries) as Fonts;
    })();
    loading.catch(() => (loading = null));
  }
  return loading;
}
