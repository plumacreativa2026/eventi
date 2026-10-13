import { Legal } from "@/components/Legal";
import { conIva, euro, PREZZI } from "@/lib/catalog";
import { AZIENDA, CONTATTO_EMAIL, SHOP_URL } from "@/lib/site";

export const metadata = { title: "Termini di vendita" };

export default function Termini() {
  return (
    <Legal title="Termini di vendita">
      <p>
        Il servizio eventi.plumacreativa.it è offerto da {AZIENDA.nome}, {AZIENDA.indirizzo}, P.IVA {AZIENDA.piva}
        {CONTATTO_EMAIL && <>, email {CONTATTO_EMAIL}</>}.
      </p>
      <h2>Il servizio</h2>
      <p>Il cliente crea gratuitamente inviti, menu e segnaposti partendo dai modelli disponibili. Creare e modificare un progetto non comporta alcun costo.</p>
      <h2>Invito digitale</h2>
      <p>
        L&apos;invito digitale è un&apos;immagine JPG che il cliente scarica dopo il pagamento con carta tramite Stripe. Costa {euro(PREZZI.digitale)} + IVA 22% ({euro(conIva(PREZZI.digitale))} in totale) per progetto.
        Trattandosi di contenuto digitale fornito subito dopo il pagamento, con il pagamento il cliente chiede l&apos;esecuzione immediata e accetta di perdere il diritto di recesso (art. 59, lett. o, Codice del Consumo).
      </p>
      <h2>Stampa</h2>
      <p>
        Gli ordini di stampa si concludono sul negozio <a href={SHOP_URL}>plumacreativa.it</a>, alle condizioni di vendita del negozio, che indicano anche spedizione, ritiro e tempi di consegna.
        Ogni ordine comprende un costo fisso di impostazione grafica di {euro(PREZZI.impostazione)} + IVA. Gli stampati sono realizzati sui dati forniti dal cliente: essendo personalizzati, sono esclusi dal diritto di recesso (art. 59, lett. c, Codice del Consumo).
        Il cliente è responsabile di controllare testi e nomi prima dell&apos;ordine; dopo l&apos;ordine il progetto viene bloccato.
      </p>
      <h2>Contenuti</h2>
      <p>Il cliente è responsabile dei testi che inserisce. Le grafiche dei modelli restano di proprietà di plūmacreativa e possono essere usate solo per l&apos;evento del cliente.</p>
      <h2>Reclami</h2>
      <p>Per qualsiasi problema contattaci{CONTATTO_EMAIL && <> a {CONTATTO_EMAIL}</>}. Foro competente: quello del consumatore.</p>
    </Legal>
  );
}
