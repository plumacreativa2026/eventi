import Link from "next/link";
import { Footer, Header } from "@/components/Chrome";
import { euro, EVENTI, PREZZI } from "@/lib/catalog";
import { CONTATTO_EMAIL } from "@/lib/site";

const RIGHE: [string, number][] = [
  ["Invito stampato (11,5 × 17 cm)", PREZZI.invito],
  ["Busta", PREZZI.busta],
  ["Menu (9,5 × 20 cm)", PREZZI.menu],
  ["Segnaposto (8 × 5 cm)", PREZZI.segnaposto],
  ["Segnaposto a cavalierino", PREZZI.cavalierino],
  ["Impostazione grafica, per ordine", PREZZI.impostazione],
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="wrap">
        <section className="hero">
          <p className="eyebrow">Per i vostri eventi speciali</p>
          <h1>
            Ogni festa merita il suo <em className="t">invito</em>
          </h1>
          <p className="lead">
            Parti da uno spunto e cambia tutto quello che vuoi: sfondo, cornice, illustrazioni, caratteri e colori. Guardi il risultato mentre lo crei. Puoi acquistare l&apos;invito digitale da mandare su WhatsApp a {euro(PREZZI.digitale)} + IVA, oppure creare inviti, menu e segnaposti coordinati e farli stampare da noi su carta pregiata.
          </p>
        </section>

        <div className="steps">
          <div>
            <b>1. Scegli</b>
            <span className="small">uno spunto da cui partire</span>
          </div>
          <div>
            <b>2. Personalizza</b>
            <span className="small">ogni dettaglio, su invito, menu e segnaposti</span>
          </div>
          <div>
            <b>3. Ricevi</b>
            <span className="small">l&apos;invito digitale subito, o la stampa a casa tua</span>
          </div>
        </div>

        <section className="group">
          <div className="sezioni">
            {EVENTI.map((e) => (
              <Link className="ev big" key={e.id} href={`/evento/${e.id}`}>
                <h2>{e.nome}</h2>
                <span className="muted">{e.occasioni.join(" · ")}</span>
                <span className="go">Scegli lo spunto →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="group">
          <div className="group-h">
            <h2>Prezzi</h2>
            <span className="muted small">IVA esclusa · IVA 22%</span>
          </div>
          <div className="prices">
            <div>
              <h3>Invito digitale</h3>
              <p className="muted small" style={{ margin: "6px 0 14px" }}>
                Un&apos;immagine JPG da mandare su WhatsApp o per email. La crei e la scarichi subito dopo il pagamento.
              </p>
              <p style={{ fontFamily: "var(--f-title)", fontSize: "1.8rem", color: "var(--marsala)" }}>{euro(PREZZI.digitale)}</p>
              <p className="muted small">+ IVA</p>
            </div>
            <div>
              <h3>Stampa</h3>
              <table>
                <tbody>
                  {RIGHE.map(([n, p]) => (
                    <tr key={n}>
                      <td>{n}</td>
                      <td>{euro(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted small" style={{ marginTop: 10 }}>
                Prezzi cadauno + IVA. Spedizione con corriere tracciabile o ritiro in negozio, da scegliere al momento dell&apos;ordine.
              </p>
            </div>
          </div>
          <div className="custom">
            <div>
              <h3>Vuoi qualcosa di unico?</h3>
              <p className="muted small">Grafica su misura, carte speciali, illustrazioni personalizzate: raccontaci la tua idea e ti prepariamo un preventivo.</p>
            </div>
            {CONTATTO_EMAIL && (
              <a className="btn" href={`mailto:${CONTATTO_EMAIL}?subject=${encodeURIComponent("Preventivo personalizzato evento")}`}>
                Chiedi un preventivo
              </a>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
