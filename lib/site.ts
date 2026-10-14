// Dati del sito e dell'attività
export const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const SHOP_URL = (process.env.WOO_SHOP_URL ?? "https://plumacreativa.it").replace(/\/$/, "");
// Pagina del sito che presenta il servizio: il logo dell'app riporta lì
export const PAGINA_SERVIZIO = "https://www.plumacreativa.it/inviti-eventi/";
export const CONTATTO_EMAIL = process.env.NEXT_PUBLIC_CONTATTO_EMAIL || "info@plumacreativa.it";

export const AZIENDA = {
  nome: "Plumacreativa di Macarena Gonzalez",
  indirizzo: "Via Fratelli Giuliano 40, 12012 Boves (CN)",
  piva: "10330450015",
};
