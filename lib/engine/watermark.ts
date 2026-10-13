import type { Fonts } from "./text";

// Filigrana diagonale per l'anteprima dell'invito digitale non ancora acquistato
export function watermark(fonts: Fonts, w: number, h: number) {
  const f = fonts.montserratMedium;
  const size = Math.min(w, h) * 0.055;
  const text = "ANTEPRIMA · PLUMACREATIVA";
  const tw = f.getAdvanceWidth(text, size, { letterSpacing: 0.2 });
  const parts: string[] = [];
  const step = size * 5.5;
  for (let y = -h; y < h * 2; y += step) {
    for (let x = -w; x < w * 2; x += tw + size * 3) {
      parts.push(f.getPath(text, x + ((y / step) % 2) * tw * 0.5, y, size, { letterSpacing: 0.2 }).toPathData(2));
    }
  }
  return `<g transform="rotate(-32 ${w / 2} ${h / 2})"><path d="${parts.join("")}" fill="#9F6C68" opacity="0.16"/></g>`;
}
