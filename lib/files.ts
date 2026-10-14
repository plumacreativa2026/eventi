import type { Progetto } from "./store";

// Il testo più grande dell'invito è di solito il nome del festeggiato
function festeggiato(p: Progetto) {
  const t = p.dati.docs.invito.items.filter((i) => i.type === "text" && i.text).sort((a, b) => (b.size ?? 0) - (a.size ?? 0))[0];
  return (t?.text ?? "").split("\n")[0];
}

// Nome file leggibile: invito-digitale-leonardo-EV-ABC123
export function nomeFile(p: Progetto, cosa: string) {
  const nome = festeggiato(p)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return [cosa, nome, p.codice].filter(Boolean).join("-");
}
