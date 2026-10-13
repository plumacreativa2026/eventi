import { NextResponse, type NextRequest } from "next/server";
import { segnaDigitalePagato } from "@/lib/pagamenti";
import { stripe } from "@/lib/stripe";
import { APP_URL } from "@/lib/site";

type C = { params: Promise<{ id: string }> };

// Ritorno da Stripe: controlliamo subito il pagamento, senza aspettare il webhook
export async function GET(req: NextRequest, { params }: C) {
  const { id } = await params;
  const sid = req.nextUrl.searchParams.get("session_id");
  if (sid) {
    try {
      const s = await stripe().checkout.sessions.retrieve(sid);
      if (s.payment_status === "paid" && s.metadata?.progetto === id) await segnaDigitalePagato(id, s.id);
    } catch (e) {
      console.error("stripe retrieve", e);
    }
  }
  return NextResponse.redirect(`${APP_URL}/p/${id}?digitale=ok`, 303);
}
