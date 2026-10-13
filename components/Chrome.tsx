import Link from "next/link";
import { AZIENDA, CONTATTO_EMAIL, SHOP_URL } from "@/lib/site";

export function Header() {
  return (
    <header className="hdr">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Plumacreativa eventi, home">
          <span className="b">Plumacreativa</span>
          <span className="s">eventi</span>
        </Link>
        <nav>
          <a href={SHOP_URL}>Il negozio</a>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <span>
          {AZIENDA.nome} · {AZIENDA.indirizzo} · P.IVA {AZIENDA.piva}
        </span>
        <span>
          <Link href="/termini">Termini di vendita</Link> · <Link href="/privacy">Privacy</Link>
          {CONTATTO_EMAIL && (
            <>
              {" · "}
              <a href={`mailto:${CONTATTO_EMAIL}`}>{CONTATTO_EMAIL}</a>
            </>
          )}
        </span>
      </div>
    </footer>
  );
}
