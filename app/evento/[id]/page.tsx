import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Footer, Header } from "@/components/Chrome";
import { evento, type EventId } from "@/lib/catalog";
import { modelliPer } from "@/lib/engine/models";
import { nuovoProgetto } from "@/lib/project";
import { creaProgetto } from "@/lib/store";

type P = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: P) {
  const e = evento((await params).id);
  return { title: e ? `Inviti per ${e.nome.toLowerCase()}` : "Evento" };
}

async function crea(formData: FormData) {
  "use server";
  const ev = evento(String(formData.get("evento")));
  const mod = modelliPer((ev?.id ?? "nascita") as EventId).find((m) => m.id === formData.get("modello"));
  if (!ev || !mod) redirect("/");
  const p = await creaProgetto(nuovoProgetto(ev.id, mod.id));
  redirect(`/p/${p.id}`);
}

export default async function Evento({ params }: P) {
  const e = evento((await params).id);
  if (!e) notFound();
  const models = modelliPer(e.id);
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingTop: 44 }}>
        <Link href="/" className="small">
          ← Tutti gli eventi
        </Link>
        <h1 style={{ marginTop: 14 }}>{e.nome}</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Scegli un modello: potrai cambiare testi e colori e vedere subito il risultato. Creare e provare è gratis.
        </p>
        <div className="models">
          {models.map((m) => {
            return (
              <form action={crea} className="model" key={m.id}>
                <input type="hidden" name="evento" value={e.id} />
                <input type="hidden" name="modello" value={m.id} />
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/anteprima/${e.id}/${m.id}.png`} alt={`Modello ${m.nome}`} width={520} height={769} loading="lazy" />
                </div>
                <div>
                  <h3>{m.nome}</h3>
                  <p className="muted small">{m.descr}</p>
                </div>
                <div className="sw" aria-label="Colori disponibili">
                  {m.palettes.map((p) => (
                    <i key={p.nome} title={p.nome} style={{ background: p.accent }} />
                  ))}
                </div>
                <button className="btn main full" type="submit">
                  Usa questo modello
                </button>
              </form>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
