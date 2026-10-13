// Prova locale del PDF di stampa e del JPG (npx tsx --conditions=react-server scripts/prova-pdf.ts <cartella>)
import { writeFileSync, mkdirSync } from "node:fs";
import { serverFonts } from "../lib/engine/fonts-server";
import { render } from "../lib/engine/render";
import { scenesToPdf, sceneToJpg } from "../lib/engine/output";
import { nuovoProgetto } from "../lib/project";

const out = process.argv[2] ?? "prova";
mkdirSync(out, { recursive: true });
const f = serverFonts();
const d = nuovoProgetto("battesimo", "alloro");
d.retro = true;
(async () => {
  writeFileSync(`${out}/invito.pdf`, await scenesToPdf([render(f, d, "invito")], "Invito"));
  writeFileSync(`${out}/cavalierino.pdf`, await scenesToPdf([render(f, d, "cavalierino", { nome: null }), render(f, d, "cavalierino", { nome: "Nonna Maria" })], "Cavalierini"));
  writeFileSync(`${out}/invito.jpg`, await sceneToJpg(render(f, d, "invito")));
  console.log("ok");
})();
