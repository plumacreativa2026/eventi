import { notFound } from "next/navigation";
import { Header } from "@/components/Chrome";
import { evento } from "@/lib/catalog";
import { bloccato, leggiProgetto } from "@/lib/store";
import { APP_URL, CONTATTO_EMAIL } from "@/lib/site";
import { Editor } from "./Editor";

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ digitale?: string }> };

export const metadata = { title: "Il tuo progetto", robots: { index: false } };

export default async function Progetto({ params, searchParams }: P) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await leggiProgetto(id);
  if (!p) notFound();
  const avviso = sp.digitale === "ok" ? "digitale-ok" : sp.digitale === "annullato" ? "digitale-annullato" : "";
  return (
    <>
      <Header />
      <h1 className="sr-only" style={{ position: "absolute", left: -9999 }}>
        {evento(p.dati.evento)?.nome} · {p.codice}
      </h1>
      <Editor
        id={p.id}
        codice={p.codice}
        iniziale={p.dati}
        bloccato={bloccato(p)}
        digitale={!!p.digitale_pagato_at}
        avviso={avviso}
        contatto={CONTATTO_EMAIL}
        link={`${APP_URL}/p/${p.id}`}
      />
    </>
  );
}
