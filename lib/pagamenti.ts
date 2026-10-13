import "server-only";
import { aggiornaProgetto, leggiProgetto } from "./store";

export async function segnaDigitalePagato(id: string, sessionId: string) {
  const p = await leggiProgetto(id);
  if (!p || p.digitale_pagato_at) return;
  await aggiornaProgetto(id, { digitale_pagato_at: new Date().toISOString(), stripe_session_id: sessionId });
}
