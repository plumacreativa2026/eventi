import "server-only";
import PDFDocument from "pdfkit";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import { toSvg, type Node, type Scene } from "./scene";

const MM = 72 / 25.4;

// Conversione semplice RGB → CMYK (0-100). I colori vanno comunque controllati in InDesign.
function cmyk(hex: string): [number, number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return [0, 0, 0, 100];
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map((v) => Math.round(v * 1000) / 10) as [number, number, number, number];
}

function draw(doc: PDFKit.PDFDocument, node: Node) {
  if (node.t === "g") {
    doc.save();
    if (node.m) doc.transform(...node.m);
    node.c.forEach((c) => draw(doc, c));
    doc.restore();
    return;
  }
  doc.save();
  if (node.t === "path") {
    if (node.op !== undefined) doc.fillOpacity(node.op);
    doc.path(node.d).fill(cmyk(node.fill), "non-zero");
  } else {
    if (node.op !== undefined) doc.strokeOpacity(node.op);
    if (node.dash) doc.dash(node.dash[0], { space: node.dash[1] });
    doc.path(node.d).lineWidth(node.w).lineCap(node.cap ?? "round").lineJoin("round").stroke(cmyk(node.stroke));
  }
  doc.restore();
}

// PDF vettoriale, una pagina per scena, formato finito + abbondanza, senza crocini, testo in tracciati, CMYK
export function scenesToPdf(scenes: Scene[], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ autoFirstPage: false, margin: 0, info: { Title: title, Author: "Plumacreativa", Creator: "eventi.plumacreativa.it" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    for (const s of scenes) {
      doc.addPage({ size: [s.w * MM, s.h * MM], margin: 0 });
      // TrimBox = formato finito, BleedBox = con abbondanza (InDesign li riconosce quando si importa il PDF)
      const b = s.bleed * MM;
      const page = doc.page as unknown as { dictionary: { data: Record<string, number[]> } };
      page.dictionary.data.TrimBox = [b, b, s.w * MM - b, s.h * MM - b];
      page.dictionary.data.BleedBox = [0, 0, s.w * MM, s.h * MM];
      doc.save();
      doc.scale(MM);
      doc.rect(0, 0, s.w, s.h).fill(cmyk(s.bg));
      doc.translate(s.bleed, s.bleed);
      s.nodes.forEach((n) => draw(doc, n));
      doc.restore();
    }
    doc.end();
  });
}

// JPG per WhatsApp: formato finito senza abbondanza
export async function sceneToJpg(s: Scene, widthPx = 1240): Promise<Buffer> {
  const png = new Resvg(toSvg(s, { trim: true, widthPx }), { background: s.bg }).render().asPng();
  return sharp(png).jpeg({ quality: 90, chromaSubsampling: "4:4:4" }).withMetadata({ density: 300 }).toBuffer();
}
