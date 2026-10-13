import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Controllo rapido della configurazione: dice solo cosa c'è, mai i valori
export async function GET() {
  const ok = (v?: string) => (v ? "ok" : "mancante");
  let database = "mancante";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await sb.from("eventi_progetti").select("id", { head: true, count: "exact" });
    database = error ? `errore: ${error.message}` : "ok";
  }
  return NextResponse.json({
    sito: ok(process.env.APP_URL),
    database,
    negozio: ok(process.env.WOO_SECRET),
    area_riservata: ok(process.env.ADMIN_PASSWORD),
    stripe: ok(process.env.STRIPE_SECRET_KEY),
    stripe_webhook: ok(process.env.STRIPE_WEBHOOK_SECRET),
  });
}
