"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { conIva, euro, PEZZI, PREZZI, righeStampa, VOCI, type PieceId } from "@/lib/catalog";
import { loadFonts } from "@/lib/engine/fonts-client";
import { modelliPer, modello } from "@/lib/engine/models";
import { render } from "@/lib/engine/render";
import { toSvg } from "@/lib/engine/scene";
import type { Fonts } from "@/lib/engine/text";
import { watermark } from "@/lib/engine/watermark";
import { NOMI_ESEMPIO, pulisciNomi, type ProjectData } from "@/lib/project";

type Tab = "invito" | "menu" | "segnaposti";
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

export function Editor({ id, codice, iniziale, bloccato, digitale, avviso, contatto, link }: Props) {
  const [d, setD] = useState<ProjectData>(iniziale);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  const [fontErr, setFontErr] = useState(false);
  const [tab, setTab] = useState<Tab>("invito");
  const [nomiTxt, setNomiTxt] = useState(iniziale.nomi.join("\n"));
  const [save, setSave] = useState<"" | "saving" | "saved" | "error">("");
  const [busy, setBusy] = useState<"" | "digitale" | "carrello">("");
  const [err, setErr] = useState("");
  const first = useRef(true);

  useEffect(() => {
    loadFonts().then(setFonts, () => setFontErr(true));
  }, []);

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

  const m = modello(d.modello);
  const models = modelliPer(d.evento);
  const set = (fn: (x: ProjectData) => void) =>
    setD((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });

  const piece: PieceId = tab === "invito" ? "invito" : tab === "menu" ? "menu" : d.tipoSegnaposto === "cavalierino" ? "cavalierino" : "segnaposto";
  const nomiAnteprima = d.nomi.length ? d.nomi : NOMI_ESEMPIO;

  const svg = useMemo(() => {
    if (!fonts) return "";
    const s = render(fonts, d, piece, { nome: nomiAnteprima[0] });
    const w = PEZZI[piece].w;
    const h = PEZZI[piece].h;
    return toSvg(s, {
      trim: true,
      fold: piece === "cavalierino" ? h / 2 : undefined,
      extra: piece === "invito" && !digitale ? watermark(fonts, w, h) : undefined,
    });
  }, [fonts, d, piece, nomiAnteprima, digitale]);

  const minis = useMemo(() => {
    if (!fonts || tab !== "segnaposti") return [];
    return nomiAnteprima.slice(1, 7).map((n) => toSvg(render(fonts, d, piece, { nome: n }), { trim: true, fold: piece === "cavalierino" ? PEZZI.cavalierino.h / 2 : undefined }));
  }, [fonts, d, piece, tab, nomiAnteprima]);

  const ordine = righeStampa(d.qta, d.tipoSegnaposto);

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
  const inv = d.testi.invito;
  const men = d.testi.menu;

  return (
    <div className="ed">
      <section className="stage" aria-label="Anteprima">
        <span className="status" role="status">
          {save === "saving" ? "Salvataggio…" : save === "saved" ? "Salvato" : save === "error" ? "Non salvato, controlla la connessione" : ""}
        </span>
        <div className="tabs" role="group" aria-label="Cosa stai modificando">
          {(["invito", "menu", "segnaposti"] as Tab[]).map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t === "invito" ? "Invito" : t === "menu" ? "Menu" : "Segnaposti"}
            </button>
          ))}
        </div>
        <div className="paper">
          {fontErr ? (
            <p className="ph">Non riusciamo a caricare l&apos;anteprima. Ricarica la pagina.</p>
          ) : svg ? (
            <div
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
              dangerouslySetInnerHTML={{ __html: svg.replace("<svg ", `<svg style="width:min(100%, ${PEZZI[piece].w * 4}px)" `) }}
            />
          ) : (
            <p className="ph">Preparo l&apos;anteprima…</p>
          )}
        </div>
        <p className="fmt">
          {PEZZI[piece].nome} · {PEZZI[piece].formato}
          {piece === "cavalierino" && " · la linea tratteggiata è la piega"}
          {piece === "invito" && !digitale && " · la scritta «anteprima» non compare nell'invito acquistato né nella stampa"}
        </p>
        {minis.length > 0 && (
          <div className="minis">
            {minis.map((s, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: s }} />
            ))}
          </div>
        )}
      </section>

      <aside className="side">
        {avviso === "digitale-ok" && <p className="msg ok">Pagamento ricevuto, grazie! Il tuo invito digitale è pronto da scaricare qui sotto.</p>}
        {avviso === "digitale-annullato" && <p className="msg">Pagamento annullato. Puoi riprovare quando vuoi.</p>}
        {bloccato && (
          <p className="msg ok">
            Abbiamo ricevuto il tuo ordine di stampa: il progetto ora è bloccato e lo stiamo preparando. Per qualsiasi modifica scrivici citando il codice <b>{codice}</b>.
          </p>
        )}

        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <div className="sec">
            <h3>Modello e colori</h3>
            {models.length > 1 && (
              <label className="f">
                Modello
                <select value={d.modello} onChange={(e) => set((x) => { x.modello = e.target.value; x.palette = 0; })}>
                  {models.map((mm) => (
                    <option key={mm.id} value={mm.id}>{mm.nome}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="palettes" role="group" aria-label="Colori">
              {m.palettes.map((p, i) => (
                <button type="button" key={p.nome} className="pal" aria-pressed={d.palette === i} onClick={() => set((x) => { x.palette = i; })}>
                  <span className="sw">
                    <i style={{ background: p.accent }} />
                    <i style={{ background: p.soft }} />
                  </span>
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          {tab === "invito" && (
            <div className="sec">
              <h3>Testi dell&apos;invito</h3>
              <label className="f">
                Riga in alto
                <input value={inv.sopra} maxLength={80} onChange={(e) => set((x) => { x.testi.invito.sopra = e.target.value; })} />
              </label>
              <label className="f">
                Nome
                <input value={inv.nome} maxLength={40} onChange={(e) => set((x) => { x.testi.invito.nome = e.target.value; })} />
              </label>
              <label className="f">
                Testo
                <span className="hint">Va a capo dove vai a capo tu. Una riga vuota lascia un po&apos; di spazio.</span>
                <textarea rows={6} value={inv.corpo} maxLength={600} onChange={(e) => set((x) => { x.testi.invito.corpo = e.target.value; })} />
              </label>
              <label className="f">
                Riga finale
                <span className="hint">Per esempio a chi confermare la presenza</span>
                <input value={inv.chiusura} maxLength={160} onChange={(e) => set((x) => { x.testi.invito.chiusura = e.target.value; })} />
              </label>
            </div>
          )}

          {tab === "menu" && (
            <div className="sec">
              <h3>Testi del menu</h3>
              <label className="f">
                Titolo
                <input value={men.titolo} maxLength={40} onChange={(e) => set((x) => { x.testi.menu.titolo = e.target.value; })} />
              </label>
              <label className="f">
                Sotto il titolo
                <input value={men.nome} maxLength={80} onChange={(e) => set((x) => { x.testi.menu.nome = e.target.value; })} />
              </label>
              <label className="f">
                Portate
                <span className="hint">Una portata per riga, una riga vuota tra antipasti, primi, secondi…</span>
                <textarea rows={12} value={men.portate} maxLength={1200} onChange={(e) => set((x) => { x.testi.menu.portate = e.target.value; })} />
              </label>
              <label className="f">
                In fondo
                <input value={men.chiusura} maxLength={80} onChange={(e) => set((x) => { x.testi.menu.chiusura = e.target.value; })} />
              </label>
            </div>
          )}

          {tab === "segnaposti" && (
            <div className="sec">
              <h3>Segnaposti</h3>
              <div className="seg" role="group" aria-label="Tipo di segnaposto">
                <button type="button" aria-pressed={d.tipoSegnaposto === "piatto"} onClick={() => set((x) => { x.tipoSegnaposto = "piatto"; })}>
                  Cartoncino 8 × 5
                </button>
                <button type="button" aria-pressed={d.tipoSegnaposto === "cavalierino"} onClick={() => set((x) => { x.tipoSegnaposto = "cavalierino"; })}>
                  A cavalierino
                </button>
              </div>
              {d.tipoSegnaposto === "cavalierino" && (
                <label className="check">
                  <input type="checkbox" checked={d.retro} onChange={(e) => set((x) => { x.retro = e.target.checked; })} />
                  <span>Decorazione anche sul retro (uguale per tutti, senza nome)</span>
                </label>
              )}
              <label className="f">
                Riga sotto il nome
                <input value={d.testi.segnaposto.riga} maxLength={80} onChange={(e) => set((x) => { x.testi.segnaposto.riga = e.target.value; })} />
              </label>
              <label className="f">
                Nomi degli invitati
                <span className="hint">Uno per riga. Puoi copiare e incollare una colonna da Excel o Numbers. Ne hai scritti {d.nomi.length}.</span>
                <textarea rows={10} value={nomiTxt} placeholder={NOMI_ESEMPIO.join("\n")} onChange={(e) => aggiornaNomi(e.target.value)} />
              </label>
            </div>
          )}
        </fieldset>

        <div className="sec">
          <h3>Invito digitale</h3>
          {digitale ? (
            <>
              <p className="small">Il tuo invito in JPG, pronto per WhatsApp. Se cambi un testo, scaricalo di nuovo.</p>
              <a className="btn main full" href={`/api/p/${id}/jpg`}>
                Scarica l&apos;invito digitale
              </a>
            </>
          ) : (
            <>
              <p className="small">
                L&apos;invito in JPG da mandare su WhatsApp o per email, senza la scritta «anteprima». {euro(PREZZI.digitale)} + IVA ({euro(conIva(PREZZI.digitale))}).
              </p>
              <button className="btn main full" onClick={compraDigitale} disabled={busy !== ""}>
                {busy === "digitale" ? "Un momento…" : "Acquista l'invito digitale"}
              </button>
            </>
          )}
        </div>

        <fieldset disabled={ro} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
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
            {d.qta.segnaposto > 0 && d.nomi.length === 0 && <p className="msg err small">Scrivi i nomi degli invitati nella scheda Segnaposti.</p>}
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
            <button className="btn main full" onClick={vaiAlCarrello} disabled={busy !== "" || ordine.righe.length === 0 || (d.qta.segnaposto > 0 && d.nomi.length === 0)}>
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
