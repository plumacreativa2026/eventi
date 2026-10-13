import type { Progetto } from "@/lib/store";

export function Stato({ s }: { s: Progetto["stampa_stato"] }) {
  if (s === "pagato") return <span className="tag on">Pagato</span>;
  if (s === "in_attesa") return <span className="tag wait">In attesa di pagamento</span>;
  if (s === "annullato") return <span className="tag">Annullato</span>;
  return <span className="muted">–</span>;
}
