import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { ProjectData } from "./project";
import { aggiorna } from "./salva";

// i progetti del vecchio editor si convertono alla lettura
const conv = (p: Progetto | null): Progetto | null => (p ? { ...p, dati: aggiorna(p.dati) } : null);

// Un progetto salvato. Chi conosce l'id (il link segreto) può modificarlo; il codice è quello che compare nell'ordine.
export type Progetto = {
  id: string;
  codice: string;
  dati: ProjectData;
  email: string | null;
  digitale_pagato_at: string | null;
  stripe_session_id: string | null;
  stampa_stato: null | "in_attesa" | "pagato" | "annullato";
  woo_ordine: string | null;
  created_at: string;
  updated_at: string;
};

const TABLE = "eventi_progetti";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function nuovoCodice() {
  const b = randomBytes(6);
  return "EV-" + Array.from(b, (x) => ALFABETO[x % ALFABETO.length]).join("");
}

// Modificabile finché non c'è un ordine di stampa attivo
export const bloccato = (p: Progetto) => p.stampa_stato === "in_attesa" || p.stampa_stato === "pagato";

const conSupabase = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---- archivio locale (solo sviluppo, senza Supabase) ----
const FILE = path.join(process.cwd(), ".data", "progetti.json");
function readLocal(): Progetto[] {
  if (process.env.NODE_ENV === "production" && !process.env.EVENTI_LOCAL_STORE) throw new Error("Supabase non configurato");
  return existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
}
function writeLocal(all: Progetto[]) {
  mkdirSync(path.dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(all, null, 1));
}

export async function creaProgetto(dati: ProjectData): Promise<Progetto> {
  const now = new Date().toISOString();
  const p: Progetto = {
    id: randomUUID(),
    codice: nuovoCodice(),
    dati,
    email: null,
    digitale_pagato_at: null,
    stripe_session_id: null,
    stampa_stato: null,
    woo_ordine: null,
    created_at: now,
    updated_at: now,
  };
  if (conSupabase()) {
    const { data, error } = await sb().from(TABLE).insert(p).select().single();
    if (error) throw error;
    return data as Progetto;
  }
  writeLocal([...readLocal(), p]);
  return p;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function leggiProgetto(id: string): Promise<Progetto | null> {
  if (!UUID.test(id)) return null;
  if (conSupabase()) {
    const { data } = await sb().from(TABLE).select("*").eq("id", id).maybeSingle();
    return conv((data as Progetto) ?? null);
  }
  return conv(readLocal().find((p) => p.id === id) ?? null);
}

export async function progettoDaCodice(codice: string): Promise<Progetto | null> {
  if (conSupabase()) {
    const { data } = await sb().from(TABLE).select("*").eq("codice", codice).maybeSingle();
    return conv((data as Progetto) ?? null);
  }
  return conv(readLocal().find((p) => p.codice === codice) ?? null);
}

export async function aggiornaProgetto(id: string, patch: Partial<Omit<Progetto, "id" | "codice" | "created_at">>) {
  const upd = { ...patch, updated_at: new Date().toISOString() };
  if (conSupabase()) {
    const { error } = await sb().from(TABLE).update(upd).eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().map((p) => (p.id === id ? { ...p, ...upd } : p)));
}

// Per l'area riservata: prima gli ordini di stampa, poi i più recenti
export async function elencoProgetti(filtro: "ordini" | "tutti", limit = 200): Promise<Progetto[]> {
  if (conSupabase()) {
    let q = sb().from(TABLE).select("*").order("updated_at", { ascending: false }).limit(limit);
    if (filtro === "ordini") q = q.or("stampa_stato.not.is.null,digitale_pagato_at.not.is.null");
    const { data, error } = await q;
    if (error) throw error;
    return (data as Progetto[]).map((p) => conv(p)!);
  }
  return readLocal()
    .map((p) => conv(p)!)
    .filter((p) => filtro === "tutti" || p.stampa_stato || p.digitale_pagato_at)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
}
