import { Legal } from "@/components/Legal";
import { AZIENDA, CONTATTO_EMAIL } from "@/lib/site";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <Legal title="Informativa privacy">
      <p>Titolare del trattamento: {AZIENDA.nome}, {AZIENDA.indirizzo}, P.IVA {AZIENDA.piva}{CONTATTO_EMAIL && <>, {CONTATTO_EMAIL}</>}.</p>
      <h2>Quali dati</h2>
      <p>I testi dei progetti (nomi, date, luoghi) e i nomi degli invitati inseriti per i segnaposti. Per i pagamenti, i dati necessari a Stripe; per gli ordini di stampa, i dati raccolti dal negozio plumacreativa.it.</p>
      <h2>Perché</h2>
      <p>Solo per realizzare inviti, menu e segnaposti richiesti e gestire pagamenti e ordini (esecuzione del contratto). Non usiamo i dati per pubblicità.</p>
      <h2>Dove</h2>
      <p>I progetti sono salvati su server in Unione Europea (Supabase). Il sito è ospitato da Vercel; i pagamenti sono gestiti da Stripe.</p>
      <h2>Per quanto tempo</h2>
      <p>I progetti senza ordini vengono cancellati dopo 12 mesi; quelli con ordini sono conservati per il tempo richiesto dagli obblighi fiscali.</p>
      <h2>I tuoi diritti</h2>
      <p>Puoi chiedere accesso, correzione o cancellazione dei dati scrivendoci{CONTATTO_EMAIL && <> a {CONTATTO_EMAIL}</>}, e puoi rivolgerti al Garante per la protezione dei dati personali.</p>
    </Legal>
  );
}
