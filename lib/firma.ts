import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Firma HMAC condivisa con il plugin di plumacreativa.it (variabile WOO_SECRET, uguale nelle due parti)
export function firma(dati: string, secret = process.env.WOO_SECRET ?? "") {
  if (!secret) throw new Error("WOO_SECRET mancante");
  return createHmac("sha256", secret).update(dati).digest("hex");
}

export function firmaValida(dati: string, sig: string | null, secret = process.env.WOO_SECRET ?? "") {
  if (!secret || !sig) return false;
  const a = Buffer.from(firma(dati, secret));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}
