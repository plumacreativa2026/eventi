import { NextResponse, type NextRequest } from "next/server";
import { segnaDigitalePagato } from "@/lib/pagamenti";
import { stripe } from "@/lib/stripe";

// Conferma del pagamento da Stripe (anche se il cliente chiude la pagina prima del ritorno)
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook non configurato" }, { status: 500 });
  const body = await req.text();
  let event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "firma non valida" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    if (s.metadata?.tipo === "eventi-digitale" && s.metadata.progetto && s.payment_status === "paid") await segnaDigitalePagato(s.metadata.progetto, s.id);
  }
  return NextResponse.json({ received: true });
}
