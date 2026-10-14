import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Footer, Header } from "@/components/Chrome";
import { evento, gruppoDi } from "@/lib/catalog";
import { serverAssets } from "@/lib/feste/server";
import { spuntiPer, spunto } from "@/lib/feste/spunti";
import { nuovoProgetto } from "@/lib/project";
import { creaProgetto } from "@/lib/store";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P) {
  const e = evento((await params).id);
  return { title: e ? e.nome : "Evento" };
}

async function crea(formData: FormData) {
  "use server";
  const ev = evento(String(formData.get("evento")));
  const s = spunto(String(formData.get("spunto")));
  if (!ev || !s || s.gruppo !== gruppoDi(ev.id)) redirect("/");
  const p = await creaProgetto(nuovoProgetto(serverAssets(), ev.id, s.id));
  redirect(`/p/${p.id}`);
}

export default async function Evento({ params }: P) {
  const id = (await params).id;
  const e = evento(id);
  if (!e) notFound();
  if (id !== e.id) redirect(`/evento/${e.id}`);
  const lista = spuntiPer(e.id);
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 44 }}>
        <Link href="/" className="small">
          ← Tutti gli eventi
        </Link>
        <h1 style={{ marginTop: 14 }}>{e.nome}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Scegli uno spunto da cui partire: sono solo idee. Potrai cambiare tutto, dallo sfondo alla cornice, dalle illustrazioni ai caratteri e ai colori, e vedere subito il risultato su invito, menu e segnaposti. Creare e provare è gratis.
        </p>
        <div className="models">
          {lista.map((s) => (
            <form action={crea} className="model" key={s.id}>
              <input type="hidden" name="evento" value={e.id} />
              <input type="hidden" name="spunto" value={s.id} />
              <div className="thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/anteprima/${e.id}/${s.id}.png`} alt={`Spunto ${s.nome}`} width={520} height={769} loading="lazy" />
              </div>
              <div>
                <h3>{s.nome}</h3>
              </div>
              <button className="btn main full" type="submit">
                Parti da qui
              </button>
            </form>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
