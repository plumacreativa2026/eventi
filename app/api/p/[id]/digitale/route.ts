import { NextResponse, type NextRequest } from "next/server";
import { conIva, evento, PREZZI } from "@/lib/catalog";
import { leggiProgetto } from "@/lib/store";
import { stripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/site";

type C = { params: Promise<{ id: string }> };

// Pagamento dell'invito digitale con Stripe Checkout
export async function POST(_req: NextRequest, { params }: C) {
  const { id } = await params;
  const p = await leggiProgetto(id);
  if (!p) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
  if (p.digitale_pagato_at) return NextResponse.json({ url: `${APP_URL}/p/${id}` });
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "it",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(conIva(PREZZI.digitale) * 100),
            product_data: {
              name: `Invito digitale · ${evento(p.dati.evento)?.nome ?? "Evento"}`,
              description: `Immagine JPG da mandare su WhatsApp. ${PREZZI.digitale.toFixed(2).replace(".", ",")} € + IVA 22%. Codice ${p.codice}.`,
            },
          },
        },
      ],
      metadata: { progetto: p.id, codice: p.codice, tipo: "eventi-digitale" },
      payment_intent_data: { metadata: { progetto: p.id, codice: p.codice } },
      success_url: `${APP_URL}/p/${id}/pagato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/p/${id}?digitale=annullato`,
      custom_text: { submit: { message: "Pagando chiedi la consegna immediata del file e accetti i Termini di vendita: il diritto di recesso non si applica ai contenuti digitali consegnati subito (art. 59 Codice del Consumo)." } },
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout", e);
    return NextResponse.json({ error: "Il pagamento non è disponibile in questo momento. Riprova tra poco." }, { status: 502 });
  }
}
