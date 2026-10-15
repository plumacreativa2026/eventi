"use client";
import { useEffect, useRef, useState } from "react";
import { COLORI_BUSTA, euro, PREZZI, righeStampa, VOCI } from "@/lib/catalog";
import type { Assets, Docs } from "@/lib/feste/costanti";
import { createEditor } from "@/lib/feste/editor-dom";
import { SPUNTI } from "@/lib/feste/spunti";
import { NOMI_ESEMPIO, pulisciNomi, type ProjectData } from "@/lib/project";

type Props = {
  id: string;
  codice: string;
  iniziale: ProjectData;
  bloccato: boolean;
  digitale: boolean;
  avviso: "" | "digitale-ok" | "digitale-annullato" | "carrello";
  contatto: string;
  link: string;
};
type Ed = ReturnType<typeof createEditor>;

export function Editor({ id, codice, iniziale, bloccato, digitale, avviso, contatto, link }: Props) {
  const [d, setD] = useState<ProjectData>(iniziale);
  const [nomiTxt, setNomiTxt] = useState(iniziale.nomi.join("\n"));
  const [save, setSave] = useState<"" | "saving" | "saved" | "error">("");
  const [busy, setBusy] = useState<"" | "digitale" | "carrello">("");
  const [err, setErr] = useState("");
  const [caricato, setCaricato] = useState<"" | "ok" | "errore">("");
  const host = useRef<HTMLDivElement>(null);
  const ed = useRef<Ed | null>(null);
  const first = useRef(true);

  // l'editor grafico (sfondi, cornici, illustrazioni, testi) vive nel DOM: si crea una volta sola
  useEffect(() => {
    let vivo = true;
    fetch("/feste/assets.json")
      .then((r) => (r.ok ? (r.json() as Promise<Assets>) : Promise.reject(new Error("assets"))))
      .then((A) => {
        if (!vivo || !host.current) return;
        ed.current = createEditor(host.current, {
          assets: A,
          spunti: SPUNTI,
          data: { docs: iniziale.docs, back: iniziale.back, spunto: iniziale.spunto },
          guest: iniziale.nomi[0] ?? "",
          readOnly: bloccato,
          watermark: !digitale,
          // scegliendo in alto un formato segnaposto, anche il tipo da stampare lo segue
          onFormat: (f: string) => {
            if (f === "segnaposto" || f === "cavalierino") setD((prev) => (prev.tipoSegnaposto === (f === "cavalierino" ? "cavalierino" : "piatto") ? prev : { ...prev, tipoSegnaposto: f === "cavalierino" ? "cavalierino" : "piatto" }));
          },
          onChange: (v: { docs: Docs; back: boolean; spunto: string }) => setD((prev) => ({ ...prev, docs: v.docs, back: v.back, spunto: v.spunto })),
        });
        setCaricato("ok");
      })
      .catch(() => vivo && setCaricato("errore"));
    return () => {
      vivo = false;
      ed.current?.destroy();
      ed.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => ed.current?.setGuest(d.nomi[0] ?? ""), [d.nomi]);

  // salvataggio automatico
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (bloccato) return;
    const t = setTimeout(async () => {
      setSave("saving");
      try {
        const r = await fetch(`/api/p/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
        setSave(r.ok ? "saved" : "error");
      } catch {
        setSave("error");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [d, id, bloccato]);

  const set = (fn: (x: ProjectData) => void) =>
    setD((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const ordine = righeStampa(d.qta, d.tipoSegnaposto);

  // il tipo di segnaposto si vede subito: l'editor passa a quel formato
  function scegliTipo(t: "piatto" | "cavalierino") {
    set((x) => { x.tipoSegnaposto = t; });
    ed.current?.setFormat(t === "cavalierino" ? "cavalierino" : "segnaposto");
    if (window.innerWidth <= 1180) host.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function aggiornaNomi(txt: string) {
    setNomiTxt(txt);
    const nomi = pulisciNomi(txt);
    set((x) => {
      // la quantità segue il numero di nomi, finché il cliente non la cambia a mano
      if (x.qta.segnaposto === x.nomi.length) x.qta.segnaposto = nomi.length;
      x.nomi = nomi;
    });
  }

  async function compraDigitale() {
    setBusy("digitale");
    setErr("");
    try {
      const r = await fetch(`/api/p/${id}/digitale`, { method: "POST" });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Pagamento non disponibile");
      window.location.href = j.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Qualcosa non ha funzionato, riprova.");
      setBusy("");
    }
  }

  async function vaiAlCarrello() {
    setBusy("carrello");
    setErr("");
    try {
      const r = await fetch(`/api/p/${id}/carrello`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(d) });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Carrello non disponibile");
      window.location.href = j.url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Qualcosa non ha funzionato, riprova.");
      setBusy("");
    }
  }

  const ro = bloccato;

  return (
    <div className="ed">
      <div className="ed-main">
        <span className="status" role="status">
          {save === "saving" ? "Salvataggio…" : save === "saved" ? "Salvato" : save === "error" ? "Non salvato, controlla la connessione" : ""}
        </span>
        {caricato === "" && <p className="ph">Preparo l&apos;editor…</p>}
        {caricato === "errore" && <p className="ph">Non riusciamo a caricare l&apos;editor. Ricarica la pagina.</p>}
        <div ref={host} />
      </div>

      <aside className="side">
        {avviso === "digitale-ok" && <p className="msg ok">Pagamento ricevuto, grazie! Il tuo invito digitale è pronto da scaricare qui sotto.</p>}
        {avviso === "digitale-annullato" && <p className="msg">Pagamento annullato. Puoi riprovare quando vuoi.</p>}
        {bloccato && (
          <p className="msg ok">
            Abbiamo ricevuto il tuo ordine di stampa: il progetto ora è bloccato e lo stiamo preparando. Per qualsiasi modifica scrivici citando il codice <b>{codice}</b>.
          </p>
        )}

        <div className="sec">
          <h3>Invito digitale</h3>
          {digitale ? (
            <>
              <p className="small">Il tuo invito in JPG (1080 × 1920), pronto per WhatsApp. Se cambi qualcosa, scaricalo di nuovo.</p>
              <a className="btn main full" href={`/api/p/${id}/jpg`}>
                Scarica l&apos;invito digitale
              </a>
            </>
          ) : (
            <>
              <p className="small">
                Il formato «Invito digitale» in JPG, da mandare su WhatsApp o per email, senza la scritta «anteprima». {euro(PREZZI.digitale)} + IVA.
              </p>
              <button className="btn main full" onClick={compraDigitale} disabled={busy !== ""}>
                {busy === "digitale" ? "Un momento…" : "Acquista l'invito digitale"}
              </button>
            </>
          )}
        </div>

        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="sec">
            <h3>Segnaposti</h3>
            <div className="seg" role="group" aria-label="Tipo di segnaposto da stampare">
              <button type="button" aria-pressed={d.tipoSegnaposto === "piatto"} onClick={() => scegliTipo("piatto")}>
                Semplice 8 × 5
              </button>
              <button type="button" aria-pressed={d.tipoSegnaposto === "cavalierino"} onClick={() => scegliTipo("cavalierino")}>
                A cavalierino
              </button>
            </div>
            <p className="small muted">Stampiamo la grafica del formato «{d.tipoSegnaposto === "cavalierino" ? "Segnaposto a cavalierino" : "Segnaposto semplice"}» dell&apos;editor, con un nome per ogni cartoncino.</p>
            <label className="f">
              Nomi degli invitati
              <span className="hint">Uno per riga. Puoi copiare e incollare una colonna da Excel o Numbers. Ne hai scritti {d.nomi.length}.</span>
              <textarea rows={8} value={nomiTxt} placeholder={NOMI_ESEMPIO.join("\n")} onChange={(e) => aggiornaNomi(e.target.value)} />
            </label>
          </div>

          <div className="sec">
            <h3>Stampa</h3>
            <p className="small muted">Stampiamo noi su carta pregiata, solo fronte. Indica quante copie ti servono.</p>
            <div className="qty">
              {(["invito", "busta", "menu", "segnaposto"] as const).map((k) => {
                const voce = k === "segnaposto" && d.tipoSegnaposto === "cavalierino" ? "cavalierino" : k;
                return (
                  <label key={k} style={{ display: "contents" }}>
                    <span>{VOCI.find((v) => v.id === voce)!.nome}</span>
                    <input type="number" min={0} max={2000} inputMode="numeric" value={d.qta[k] || ""} placeholder="0" onChange={(e) => set((x) => { x.qta[k] = Math.max(0, Math.min(2000, Math.floor(Number(e.target.value) || 0))); })} />
                    <span className="p">{euro(PREZZI[voce])}</span>
                  </label>
                );
              })}
            </div>
            <p className="small muted">Le buste sono facoltative: lascia 0 se non ti servono.</p>
            {d.qta.busta > 0 && (
              <label className="f">
                Colore delle buste
                <select value={d.coloreBusta} onChange={(e) => set((x) => { x.coloreBusta = e.target.value; })}>
                  <option value="">Scegli il colore…</option>
                  {COLORI_BUSTA.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
            )}
            {d.qta.segnaposto > 0 && d.nomi.length === 0 && <p className="msg err small">Scrivi i nomi degli invitati qui sopra, nella sezione Segnaposti.</p>}
            {d.qta.segnaposto > 0 && d.nomi.length > 0 && d.nomi.length !== d.qta.segnaposto && (
              <p className="msg small">
                Hai scritto {d.nomi.length} nomi ma ordini {d.qta.segnaposto} segnaposti.{" "}
                <button type="button" className="linkbtn" onClick={() => set((x) => { x.qta.segnaposto = x.nomi.length; })}>Ordina {d.nomi.length}</button>
              </p>
            )}
            {ordine.righe.length > 0 && (
              <div className="box">
                <div className="tot"><span>Impostazione grafica</span><span>{euro(PREZZI.impostazione)}</span></div>
                <div className="tot"><span>Totale IVA esclusa</span><span>{euro(ordine.netto)}</span></div>
                <div className="tot big"><span>Totale IVA inclusa</span><span>{euro(ordine.totale)}</span></div>
                <span className="muted small">Spedizione o ritiro in negozio si scelgono nel carrello.</span>
              </div>
            )}
            <button className="btn main full" onClick={vaiAlCarrello} disabled={busy !== "" || ordine.righe.length === 0 || (d.qta.segnaposto > 0 && d.nomi.length === 0) || (d.qta.busta > 0 && !d.coloreBusta)}>
              {busy === "carrello" ? "Un momento…" : "Ordina la stampa"}
            </button>
            <p className="small muted">Prima di ordinare controlla bene testi e nomi: stampiamo esattamente quello che vedi. Dopo l&apos;ordine il progetto si blocca.</p>
          </div>
        </fieldset>

        {err && <p className="msg err" role="alert">{err}</p>}

        <div className="sec">
          <h3>Torna quando vuoi</h3>
          <p className="small muted">Salva questo link: è l&apos;unico modo per riaprire il tuo progetto. Il codice è {codice}.</p>
          <div className="copy">
            <input readOnly value={link} aria-label="Link del progetto" onFocus={(e) => e.target.select()} />
            <button className="btn sm" type="button" onClick={() => navigator.clipboard?.writeText(link)}>Copia</button>
          </div>
        </div>

        {contatto && (
          <div className="sec">
            <h3>Vuoi qualcosa di unico?</h3>
            <p className="small muted">Grafica su misura, carte speciali, illustrazioni personalizzate: ti prepariamo un preventivo.</p>
            <a className="btn full" href={`mailto:${contatto}?subject=${encodeURIComponent(`Preventivo personalizzato · ${codice}`)}`}>Chiedi un preventivo</a>
          </div>
        )}
      </aside>
    </div>
  );
}
