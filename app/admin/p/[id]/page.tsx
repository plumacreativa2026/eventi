import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/Chrome";
import { evento, PEZZI, righeStampa, VOCI, euro } from "@/lib/catalog";
import { isAdmin } from "@/lib/admin";
import { toSvg } from "@/lib/engine/scene";
import type { FmtId } from "@/lib/feste/costanti";
import { scena } from "@/lib/feste/server";
import { spunto } from "@/lib/feste/spunti";
import { aggiornaProgetto, leggiProgetto } from "@/lib/store";
import { SHOP_URL } from "@/lib/site";
import { Stato } from "../../Stato";

type P = { params: Promise<{ id: string }> };
export const metadata = { title: "Progetto", robots: { index: false } };

async function sblocca(fd: FormData) {
  "use server";
  if (!(await isAdmin())) redirect("/admin");
  const id = String(fd.get("id"));
  await aggiornaProgetto(id, { stampa_stato: null });
  redirect(`/admin/p/${id}`);
}

export default async function AdminProgetto({ params }: P) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const p = await leggiProgetto(id);
  if (!p) notFound();
  const d = p.dati;
  const sp = d.tipoSegnaposto === "cavalierino" ? "cavalierino" : "segnaposto";
  const fig = (fmt: FmtId, nome?: string | null) => toSvg(scena(d, fmt, nome), { trim: true, fold: fmt === "cavalierino" ? PEZZI.cavalierino.h / 2 : undefined });
  const ord = righeStampa(d.qta, d.tipoSegnaposto);
  const dl = (file: string, label: string) => (
    <a className="btn sm" href={`/api/admin/p/${p.id}/${file}`}>
      {label}
    </a>
  );
  return (
    <>
      <Header />
      <main className="wrap adm" style={{ paddingTop: 30, display: "flex", flexDirection: "column", gap: 26 }}>
        <Link href="/admin" className="small">← Ordini</Link>
        <div>
          <p className="eyebrow">{evento(d.evento)?.nome} · partito dallo spunto «{spunto(d.spunto)?.nome}»</p>
          <h1 style={{ fontSize: "2.2rem", marginTop: 6 }}>{p.codice}</h1>
          <p style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            Stampa: <Stato s={p.stampa_stato} />
            {p.woo_ordine && <a href={`${SHOP_URL}/wp-admin/post.php?post=${p.woo_ordine}&action=edit`}>Ordine WooCommerce #{p.woo_ordine}</a>}
            {p.digitale_pagato_at && <span className="tag on">Digitale pagato</span>}
          </p>
        </div>

        <section className="sec">
          <h3>File di stampa</h3>
          <p className="small muted">PDF con 2 mm di abbondanza, senza crocini, testi convertiti in tracciati, colori CMYK. Segnaposti: pagina 1 sfondo senza nome per l&apos;unione dati, pagina 2 esempio con il primo nome; c&apos;è anche il PDF con una pagina per ogni invitato.</p>
          <div className="dl">
            {dl("invito.pdf", "Invito PDF")}
            {dl("menu.pdf", "Menu PDF")}
            {dl("segnaposti.pdf", d.tipoSegnaposto === "cavalierino" ? "Cavalierini PDF" : "Segnaposti PDF")}
            {dl("segnaposti-tutti.pdf", `Tutti i segnaposti con i nomi (${d.nomi.length})`)}
            {dl("nomi.csv", `Nomi CSV (${d.nomi.length})`)}
            {dl("invito.jpg", "Invito JPG")}
          </div>
        </section>

        <section className="sec">
          <h3>Quantità richieste</h3>
          {ord.righe.length ? (
            <table style={{ maxWidth: 520 }}>
              <tbody>
                {ord.righe.map((r) => (
                  <tr key={r.voce}>
                    <td>{VOCI.find((v) => v.id === r.voce)?.nome}{r.voce === "busta" && d.coloreBusta ? ` · ${d.coloreBusta}` : ""}</td>
                    <td>{r.qta}</td>
                    <td>{euro(r.qta * r.prezzo)}</td>
                  </tr>
                ))}
                <tr>
                  <td><b>Totale IVA esclusa</b></td>
                  <td />
                  <td><b>{euro(ord.netto)}</b></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="muted small">Nessuna quantità di stampa.</p>
          )}
          <p className="small muted">Fa fede l&apos;ordine su WooCommerce.</p>
        </section>

        <section className="sec">
          <h3>Anteprime</h3>
          <div className="previews">
            <figure><div dangerouslySetInnerHTML={{ __html: fig("digitale") }} /><figcaption>Invito digitale</figcaption></figure>
            <figure><div dangerouslySetInnerHTML={{ __html: fig("invito") }} /><figcaption>Invito</figcaption></figure>
            <figure><div dangerouslySetInnerHTML={{ __html: fig("menu") }} /><figcaption>Menu</figcaption></figure>
            <figure><div dangerouslySetInnerHTML={{ __html: fig(sp, d.nomi[0] ?? "Nome Cognome") }} /><figcaption>{PEZZI[sp].nome}</figcaption></figure>
          </div>
        </section>

        <section className="sec">
          <h3>Nomi ({d.nomi.length})</h3>
          <p className="small" style={{ columns: 3, whiteSpace: "pre-line" }}>{d.nomi.join("\n") || "–"}</p>
        </section>

        {p.stampa_stato && (
          <form action={sblocca} className="sec">
            <input type="hidden" name="id" value={p.id} />
            <p className="small muted">Se il cliente deve correggere qualcosa, sblocca il progetto: potrà modificarlo dal suo link.</p>
            <button className="btn sm" style={{ alignSelf: "flex-start" }}>Sblocca le modifiche</button>
          </form>
        )}
      </main>
    </>
  );
}
