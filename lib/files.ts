import type { Progetto } from "./store";

// Nome file leggibile: invito-digitale-leonardo-EV-ABC123
export function nomeFile(p: Progetto, cosa: string) {
  const nome = p.dati.testi.invito.nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return [cosa, nome, p.codice].filter(Boolean).join("-");
}
