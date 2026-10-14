import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Chrome";
import { evento } from "@/lib/catalog";
import { isAdmin, login, logout } from "@/lib/admin";
import { spunto } from "@/lib/feste/spunti";
import { elencoProgetti } from "@/lib/store";
import { Stato } from "./Stato";

export const metadata = { title: "Area riservata", robots: { index: false } };

async function entra(fd: FormData) {
  "use server";
  const ok = await login(String(fd.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin?errore=1");
}
async function esci() {
  "use server";
  await logout();
  redirect("/admin");
}

type P = { searchParams: Promise<{ errore?: string; tutti?: string }> };

export default async function Admin({ searchParams }: P) {
  const sp = await searchParams;
  if (!(await isAdmin()))
    return (
      <>
        <Header />
        <main className="wrap" style={{ maxWidth: 420, paddingTop: 60 }}>
          <h1 style={{ fontSize: "2rem" }}>Area riservata</h1>
          <form action={entra} className="sec">
            {sp.errore && <p className="msg err">Password errata.</p>}
            <label className="f">
              Password
              <input type="password" name="password" required autoComplete="current-password" />
            </label>
            <button className="btn main">Entra</button>
          </form>
        </main>
      </>
    );

  const tutti = sp.tutti === "1";
  const list = await elencoProgetti(tutti ? "tutti" : "ordini");
  return (
    <>
      <Header />
      <main className="wrap adm" style={{ paddingTop: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          <h1 style={{ fontSize: "2rem" }}>{tutti ? "Tutti i progetti" : "Ordini"}</h1>
          <span className="small">
            <Link href={tutti ? "/admin" : "/admin?tutti=1"}>{tutti ? "Solo ordini" : "Mostra anche le bozze"}</Link>
            {" · "}
            <form action={esci} style={{ display: "inline" }}>
              <button className="linkbtn">Esci</button>
            </form>
          </span>
        </div>
        {list.length === 0 ? (
          <p className="muted">Ancora niente qui.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Codice</th>
                <th>Evento</th>
                <th>Stampa</th>
                <th>Digitale</th>
                <th>Ordine</th>
                <th>Aggiornato</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/p/${p.id}`}>
                      <b>{p.codice}</b>
                    </Link>
                  </td>
                  <td>
                    {evento(p.dati.evento)?.nome} · {spunto(p.dati.spunto)?.nome}
                  </td>
                  <td><Stato s={p.stampa_stato} /></td>
                  <td>{p.digitale_pagato_at ? <span className="tag on">Pagato</span> : <span className="muted">–</span>}</td>
                  <td>{p.woo_ordine ? `#${p.woo_ordine}` : "–"}</td>
                  <td className="small muted">{new Date(p.updated_at).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Rome" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
