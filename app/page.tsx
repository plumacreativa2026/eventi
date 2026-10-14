import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/Chrome";
import { EVENTI } from "@/lib/catalog";
import { serverAssets } from "@/lib/feste/server";
import { SPUNTI, spunto } from "@/lib/feste/spunti";
import { nuovoProgetto } from "@/lib/project";
import { creaProgetto } from "@/lib/store";

// Pagina d'ingresso dell'app: tutti gli spunti insieme. La presentazione del servizio (prezzi, modalità) sta sul sito.
async function crea(formData: FormData) {
  "use server";
  const s = spunto(String(formData.get("spunto")));
  if (!s) redirect("/");
  const p = await creaProgetto(nuovoProgetto(serverAssets(), s.gruppo, s.id));
  redirect(`/p/${p.id}`);
}

export default function Home() {
  return (
    <>
      <Header />
      <main className="wrap">
        <section className="hero">
          <p className="eyebrow">Inviti, menu e segnaposti</p>
          <h1>
            Feste per bambini <em className="t">&amp;</em> occasioni speciali
          </h1>
          <p className="lead">Scegli uno spunto da cui partire: è solo un&apos;idea. Puoi cambiare tutto, dallo sfondo alla cornice, dalle illustrazioni ai testi.</p>
        </section>
        {EVENTI.map((e) => (
          <section className="group" key={e.id}>
            <div className="group-h">
              <h2>{e.nome}</h2>
              <span className="muted small">{e.occasioni.join(" · ")}</span>
            </div>
            <div className="models">
              {SPUNTI.filter((s) => s.gruppo === e.id).map((s) => (
                <form action={crea} className="model" key={s.id}>
                  <input type="hidden" name="spunto" value={s.id} />
                  <div className="thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/anteprima/${s.gruppo}/${s.id}.png`} alt={`Spunto ${s.nome}`} width={520} height={769} loading="lazy" />
                  </div>
                  <h3>{s.nome}</h3>
                  <button className="btn main full" type="submit">
                    Parti da qui
                  </button>
                </form>
              ))}
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
