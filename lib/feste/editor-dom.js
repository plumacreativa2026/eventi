// Editor feste nel browser: sfondi, cornici, linee, illustrazioni e testi su tutti i formati.
// Lavora sul DOM dentro `root` e avvisa con onChange({ docs, back, spunto }) a ogni modifica.
import { BG_COLORS, FONT_MAP, FONTS, FORMATS, INKS, LINES, OCC, PATTERNS, lighten, lineStep } from "./costanti";
import { aspect, fitFrame, framePath, linePath, lineStroke, patternSvg } from "./geometria";
import { buildAll } from "./spunti";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clone = (o) => JSON.parse(JSON.stringify(o));
const TYPE_N = { frame: "Cornice", icon: "Illustrazione", line: "Linea", text: "Testo" };
const TABS = [["spunti", "Spunti"], ["sfondo", "Sfondo"], ["cornici", "Cornici"], ["linee", "Linee"], ["illu", "Illustrazioni"], ["testi", "Testi"]];

export function createEditor(root, opts) {
  const A = opts.assets;
  const spunti = opts.spunti; // [{id, nome}] della sezione
  let guest = opts.guest || "";
  let ro = !!opts.readOnly;
  let wm = !!opts.watermark;
  let S = { fmt: "digitale", spunto: opts.data.spunto, back: opts.data.back !== false, docs: clone(opts.data.docs) };
  let W = 1080, H = 1920, U = 1.1;
  let doc, selId = null, hist = [], fut = [], tab = "spunti", occ = "Fiocchi e decorazioni", lastInk = "#b77a8e", boxes = {}, drag = null;
  let uid = 1;
  for (const d of Object.values(S.docs)) for (const i of d.items) { const n = +String(i.id).slice(1); if (n >= uid) uid = n + 1; }
  const nid = () => "e" + uid++;

  root.innerHTML = `
  <div class="fe${ro ? " fe-ro" : ""}">
    <aside class="fe-tools">
      <div class="fe-tabs" role="tablist" data-r="tabs"></div>
      <div class="fe-pane" data-r="pane"></div>
      <div class="fe-sel" data-r="sel" hidden></div>
    </aside>
    <section class="fe-stage">
      <div class="fe-bar">
        <div class="fe-fmts" role="tablist" aria-label="Formato" data-r="fmts"></div>
        <div class="fe-undo"><button type="button" class="fe-btn" data-r="undo" title="Annulla (Ctrl+Z)">↶ Annulla</button><button type="button" class="fe-btn" data-r="redo" title="Ripeti">↷ Ripeti</button></div>
      </div>
      <div class="fe-paper" data-r="wrap"><svg data-r="card" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg"></svg></div>
      <div class="fe-fold" data-r="fold" hidden>
        <svg data-r="foldsvg" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg"></svg>
        <div><b>Cavalierino da stampare</b><br>Qui sopra disegni il fronte (8 × 5 cm). Si stampa su un foglio 8 × 10 cm piegato a metà, così sta in piedi da solo. Il nome compare solo sul fronte.<br>
        <label class="fe-check"><input type="checkbox" data-r="back"> Motivo anche sul retro</label></div>
      </div>
      <p class="fe-meta" data-r="meta"></p>
    </section>
    <div class="fe-toast" data-r="toast" role="status"></div>
  </div>`;
  const $ = (r) => root.querySelector(`[data-r="${r}"]`);
  const card = $("card");
  const F = () => FORMATS[S.fmt];
  function bindFmt() { const f = F(); W = f.W; H = f.H; U = f.u; doc = S.docs[S.fmt]; }
  bindFmt();

  // ---------- storico e notifiche ----------
  let changeT = null;
  const changed = () => { clearTimeout(changeT); changeT = setTimeout(() => opts.onChange && opts.onChange({ docs: clone(S.docs), back: S.back, spunto: S.spunto }), 250); };
  function commit() { hist.push(clone(S)); if (hist.length > 80) hist.shift(); fut = []; updUndo(); }
  let pending = null;
  function commitSoon() { if (!pending) commit(); clearTimeout(pending); pending = setTimeout(() => (pending = null), 600); }
  function updUndo() { $("undo").disabled = !hist.length || ro; $("redo").disabled = !fut.length || ro; }
  $("undo").onclick = () => { if (!hist.length) return; fut.push(clone(S)); S = hist.pop(); bindFmt(); if (!doc.items.find((i) => i.id === selId)) selId = null; all(); changed(); };
  $("redo").onclick = () => { if (!fut.length) return; hist.push(clone(S)); S = fut.pop(); bindFmt(); all(); changed(); };
  const sel = () => doc.items.find((i) => i.id === selId);

  // ---------- costruttori ----------
  const T = (text, font, size, color, y, extra = {}) => Object.assign({ id: nid(), type: "text", text, font, size: Math.round(size), color, x: W / 2, y, w: 0, h: 0, align: "middle", ls: 0 }, extra);
  const Fr = (shape, color, x, y, w, h, extra = {}) => Object.assign({ id: nid(), type: "frame", shape, color, sw: 5, fill: "#ffffff", x, y, w, h }, extra);
  const Ic = (name, color, cx, y, w) => { const a = aspect(A, name); return { id: nid(), type: "icon", name, color, x: cx - w / 2, y, w, h: w * a }; };
  const Ln = (style, color, cx, y, w) => ({ id: nid(), type: "line", style, color, sw: 4, x: cx - w / 2, y, w, h: 40 });

  // ---------- disegno ----------
  function iconSVG(name, color) { const ic = A.icons[name]; return { vb: ic.vb.join(" "), inner: `<path d="${ic.d}" fill="${color}"/>` }; }
  function itemSVG(it) {
    if (it.type === "frame") return `<path data-id="${it.id}" d="${framePath(A, it.shape, it.x, it.y, it.w, it.h, it.rot)}" fill="${it.fill === "none" ? "none" : it.fill}" stroke="${it.color}" stroke-width="${it.sw}" stroke-linejoin="round"/>`;
    if (it.type === "icon") {
      const s = iconSVG(it.name, it.color), v = s.vb.split(" ");
      return `<svg data-id="${it.id}" x="${it.x}" y="${it.y}" width="${it.w}" height="${it.h}" viewBox="${s.vb}" preserveAspectRatio="none" overflow="visible"><rect x="${v[0]}" y="${v[1]}" width="${v[2]}" height="${v[3]}" fill="transparent" data-id="${it.id}"/>${s.inner}</svg>`;
    }
    if (it.type === "line") {
      const st = lineStroke(it.style, it.sw);
      return `<g data-id="${it.id}" transform="translate(${it.x} ${it.y})"><rect width="${it.w}" height="${it.h}" fill="transparent"/><path d="${linePath(it.style, it.w, it.h)}" fill="none" stroke="${it.color}" stroke-width="${st.w}" stroke-linecap="${st.cap}"${st.dash ? ` stroke-dasharray="${st.dash.join(" ")}"` : ""}/></g>`;
    }
    if (it.type === "text") {
      const f = FONT_MAP[it.font] || FONT_MAP.Lora;
      const txt = it.role === "nome" && guest ? guest : it.text;
      const lines = String(txt).split("\n"), sz = it._fs || it.size, lh = lineStep(sz, f[0], it.lh || 1), y0 = it.y - ((lines.length - 1) * lh) / 2;
      const ts = lines.map((l, i) => `<tspan x="${it.x}" y="${(y0 + i * lh).toFixed(1)}">${esc(l) || " "}</tspan>`).join("");
      return `<text data-id="${it.id}" text-anchor="${it.align}" dominant-baseline="middle" font-family="${esc(f[2])}" font-size="${(sz * (f[3] || 1)).toFixed(1)}" fill="${it.color}"${it.italic ? ' font-style="italic"' : ""}${it.weight ? ` font-weight="${it.weight}"` : ""}${it.ls ? ` letter-spacing="${it.ls}"` : ""}${it.upper ? ' style="text-transform:uppercase"' : ""}>${ts}</text>`;
    }
    return "";
  }
  function docSVG(d = doc, w = W, h = H, u = U, id = "fe-bgp") {
    const pd = patternSvg(d.bg, u, id);
    return `<defs>${pd}</defs><rect width="${w}" height="${h}" fill="#fff"/>${pd ? `<rect width="${w}" height="${h}" fill="url(#${id})"/>` : ""}` + d.items.map(itemSVG).join("");
  }
  // Filigrana dell'anteprima finché l'invito digitale non è acquistato (non compare nei file)
  function watermark() {
    if (!wm || (S.fmt !== "digitale" && S.fmt !== "invito")) return "";
    const fs = Math.min(W, H) * 0.085, step = fs * 3.2;
    let t = "";
    for (let y = -H; y < H * 2; y += step) t += `<text x="${-W + ((y / step) % 2) * fs * 3.5}" y="${y}" font-family="Montserrat,sans-serif" font-weight="500" font-size="${fs}" letter-spacing="${fs * 0.18}">${"ANTEPRIMA\u00a0\u00a0\u00a0\u00a0".repeat(10)}</text>`;
    return `<g pointer-events="none" transform="rotate(-32 ${W / 2} ${H / 2})" fill="#9F6C68" opacity="0.26">${t}</g>`;
  }
  function foldSVG(id) {
    const pd = patternSvg(doc.bg, U, id), cont = S.back && pd;
    return `<defs>${pd}</defs><rect width="${W}" height="${2 * H}" fill="#fff"/><g transform="translate(0 ${H})">${pd ? `<rect y="${cont ? -H : 0}" width="${W}" height="${cont ? 2 * H : H}" fill="url(#${id})"/>` : ""}${doc.items.map(itemSVG).join("")}</g><path d="M0 ${H}H${W}" stroke="#9a9a9a" stroke-width="2" stroke-dasharray="10 8"/>`;
  }
  function fitPaper() {
    const st = root.querySelector(".fe-stage"), wrap = $("wrap"), mob = window.innerWidth <= 860;
    const availW = Math.max(200, st.clientWidth - 32), availH = mob ? window.innerHeight * 0.62 : Math.max(380, window.innerHeight - (F().fold ? 420 : 240));
    const w = Math.min(availW, (availH * W) / H, W > H ? 560 : 600);
    wrap.style.width = w + "px"; wrap.style.height = (w * H) / W + "px";
  }
  function render() {
    card.setAttribute("viewBox", `0 0 ${W} ${H}`); fitPaper();
    doc.items.forEach((i) => delete i._fs);
    card.innerHTML = docSVG() + watermark() + '<g data-r="ov"></g>';
    // i testi con larghezza massima (nomi) si riducono da soli
    doc.items.forEach((it) => {
      if (it.type !== "text" || !it.fit) return;
      const el = card.querySelector(`text[data-id="${it.id}"]`);
      try { const w = el.getBBox().width; if (w > it.fit) { it._fs = (it.size * it.fit) / w; el.outerHTML = itemSVG(it); } } catch { /* nessuna misura */ }
    });
    const fp = $("fold");
    if (F().fold) { fp.hidden = false; $("foldsvg").setAttribute("viewBox", `0 0 ${W} ${H * 2}`); $("foldsvg").innerHTML = foldSVG("fe-fp"); $("back").checked = !!S.back; } else fp.hidden = true;
    $("meta").textContent = F().label + " · " + F().dim + (wm && (S.fmt === "digitale" || S.fmt === "invito") ? " · la scritta «anteprima» non compare nell'invito acquistato né nella stampa" : "");
    boxes = {};
    doc.items.forEach((it) => {
      if (it.type === "text") {
        const el = card.querySelector(`text[data-id="${it.id}"]`);
        try { const b = el.getBBox(); boxes[it.id] = { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { boxes[it.id] = { x: it.x - 100, y: it.y - 30, w: 200, h: 60 }; }
      } else boxes[it.id] = { x: it.x, y: it.y, w: it.w, h: it.h };
    });
    drawOverlay();
  }
  function drawOverlay() {
    const ov = card.querySelector('[data-r="ov"]'); if (!ov) return; const it = sel(); if (!it || ro) { ov.innerHTML = ""; return; }
    const b = boxes[it.id], q = W / (card.getBoundingClientRect().width || W), p = 6 * q, hs = 13 * q, sw = 1.6 * q;
    let s = `<rect x="${b.x - p}" y="${b.y - p}" width="${b.w + 2 * p}" height="${b.h + 2 * p}" fill="none" stroke="#9F6C68" stroke-width="${sw}" stroke-dasharray="${6 * q} ${4 * q}" pointer-events="none"/>`;
    const corners = [["nw", b.x - p, b.y - p], ["ne", b.x + b.w + p, b.y - p], ["sw", b.x - p, b.y + b.h + p], ["se", b.x + b.w + p, b.y + b.h + p]];
    const hz = it.type === "line" ? [["w", b.x - p, b.y + b.h / 2], ["e", b.x + b.w + p, b.y + b.h / 2]] : corners;
    hz.forEach(([k, x, y]) => (s += `<rect data-h="${k}" x="${x - hs / 2}" y="${y - hs / 2}" width="${hs}" height="${hs}" rx="${3 * q}" fill="#fff" stroke="#9F6C68" stroke-width="${sw}" style="cursor:${k.length === 2 ? (k === "nw" || k === "se" ? "nwse" : "nesw") : "ew"}-resize"/>`));
    ov.innerHTML = s;
  }

  // ---------- interazione sul foglio ----------
  function pt(e) { const p = card.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(card.getScreenCTM().inverse()); }
  card.addEventListener("pointerdown", (e) => {
    if (ro) return;
    const h = e.target.closest("[data-h]"), P = pt(e);
    if (h && sel()) { const it = sel(); drag = { mode: "resize", k: h.dataset.h, start: P, orig: clone(it), box: { ...boxes[it.id] } }; commit(); card.setPointerCapture(e.pointerId); return; }
    const t = e.target.closest("[data-id]");
    if (t) { selId = t.dataset.id; drag = { mode: "move", start: P, orig: clone(sel()), moved: false }; card.setPointerCapture(e.pointerId); drawOverlay(); panelSel(); }
    else { selId = null; drawOverlay(); panelSel(); }
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag) return; const P = pt(e), dx = P.x - drag.start.x, dy = P.y - drag.start.y, it = sel(); if (!it) return; const o = drag.orig;
    if (drag.mode === "move") {
      if (!drag.moved) { if (Math.hypot(dx, dy) < 3) return; commit(); drag.moved = true; }
      let nx = o.x + dx; const ny = o.y + dy;
      const bw = it.type === "text" ? 0 : o.w || 0, cx = it.type === "text" && it.align === "middle" ? nx : nx + bw / 2;
      if (Math.abs(cx - W / 2) < 14) nx += W / 2 - cx; // aggancio al centro
      it.x = nx; it.y = ny; render(); return;
    }
    const b = drag.box, k = drag.k;
    if (it.type === "text") { const sx = (k.includes("e") ? b.w + dx : b.w - dx) / b.w; it.size = Math.max(10, Math.round(o.size * Math.max(0.15, sx))); render(); panelSelValues(); return; }
    let x0 = o.x, y0 = o.y; const x1 = o.x + o.w; let y1 = o.y + o.h;
    let nx1 = x1;
    if (k.includes("w")) x0 += dx; if (k.includes("e")) nx1 += dx; if (k.includes("n")) y0 += dy; if (k.includes("s")) y1 += dy;
    if (it.type === "line") { it.x = Math.min(x0, nx1 - 40); it.w = Math.max(40, nx1 - x0); render(); return; }
    const w = Math.max(40, nx1 - x0); let h = Math.max(40, y1 - y0);
    if (it.type === "icon") { const a = o.h / o.w; h = w * a; if (k.includes("n")) y0 = y1 - h; else y1 = y0 + h; }
    it.x = k.includes("w") ? nx1 - w : x0; it.y = k.includes("n") ? (it.type === "icon" ? y0 : y1 - h) : y0; it.w = w; it.h = h; render();
  });
  const end = () => { if (drag) { const moved = drag.mode === "resize" || drag.moved; drag = null; render(); panelSel(); if (moved) changed(); } };
  card.addEventListener("pointerup", end); card.addEventListener("pointercancel", end);
  card.addEventListener("dblclick", (e) => { const t = e.target.closest("text[data-id]"); if (t && !ro) { selId = t.dataset.id; panelSel(); const ta = root.querySelector("#fe-p-text"); if (ta) ta.focus(); } });
  const onKey = (e) => {
    if (ro) return;
    const ae = document.activeElement, typing = ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName);
    if (ae && ae !== document.body && !root.contains(ae)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); (e.shiftKey ? $("redo") : $("undo")).click(); return; }
    if (typing || !sel()) return;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); delSel(); }
    const st = e.shiftKey ? 20 : 4, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    if (mv) { e.preventDefault(); commitSoon(); sel().x += mv[0]; sel().y += mv[1]; render(); changed(); }
  };
  document.addEventListener("keydown", onKey);

  // ---------- pannelli ----------
  function tabs() {
    $("tabs").innerHTML = TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === tab}" data-t="${k}">${l}</button>`).join("");
    $("tabs").querySelectorAll("button").forEach((b) => (b.onclick = () => { tab = b.dataset.t; tabs(); pane(); }));
  }
  const thumb = (inner, vb = "0 0 100 100") => `<svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
  function inkRow(id, val) { return `<div class="fe-chips">${INKS.map(([n, c]) => `<button type="button" class="fe-sw" title="${n}" aria-label="${n}" aria-pressed="${val === c}" data-ink="${id}" data-c="${c}" style="background:${c}"></button>`).join("")}<input type="color" id="${id}-custom" value="${val}" aria-label="Colore personalizzato" title="Colore personalizzato"></div>`; }
  function centerAdd(it) { commit(); if (it.type === "frame") doc.items.unshift(it); else doc.items.push(it); selId = it.id; render(); panelSel(); toast("Aggiunto al foglio"); changed(); }
  function curInk() { const f = doc.items.find((i) => i.type === "frame"); return (sel() && sel().color) || (f && f.color) || lastInk; }
  function iconTile(n) { const s = iconSVG(n, "#3c3c3b"); return `<button type="button" class="fe-tile" data-icon="${n}" title="${n}">${thumb(s.inner, s.vb)}<span>${n}</span></button>`; }
  const previews = {};
  function miniPreview(id) {
    if (!previews[id]) { const f = FORMATS.invito, d = buildAll(A, id).invito; previews[id] = `<svg viewBox="0 0 ${f.W} ${f.H}">${docSVG(d, f.W, f.H, f.u, "fe-mp" + id)}</svg>`; }
    return previews[id];
  }
  function pane() {
    const P = $("pane"); let h = "";
    if (tab === "spunti") {
      h = `<h3>Spunti da cui partire</h3><p class="fe-note">Sono solo idee: scegline una e cambia tutto quello che vuoi. Lo spunto prepara insieme invito digitale, invito stampa, menu e segnaposti con lo stesso stile; poi ogni formato si modifica per conto suo.</p><div class="fe-grid fe-g2">` +
        spunti.map((s) => `<button type="button" class="fe-tile fe-big" aria-pressed="${S.spunto === s.id}" data-tpl="${s.id}">${miniPreview(s.id)}<span>${esc(s.nome)}</span></button>`).join("") + `</div>`;
    }
    if (tab === "sfondo") {
      const bg = doc.bg;
      h = `<h3>Motivo</h3><div class="fe-grid fe-g4">` + PATTERNS.map(([k, l]) => `<button type="button" class="fe-tile" aria-pressed="${bg.type === k}" data-pat="${k}">${thumb(`<defs>${patternSvg({ type: k, color: bg.color, scale: 0.35 }, 1, "fe-t" + k)}</defs><rect width="100" height="100" fill="#fff"/>${k === "nulla" ? '<path d="M30 70L70 30" stroke="#ccc" stroke-width="2"/>' : `<rect width="100" height="100" fill="url(#fe-t${k})"/>`}`)}<span>${l}</span></button>`).join("") + `</div>
      <h3>Colore del motivo</h3><div class="fe-chips">` + BG_COLORS.map(([n, c]) => `<button type="button" class="fe-sw" title="${n}" aria-label="${n}" aria-pressed="${bg.color === c}" data-bgc="${c}" style="background:${c}"></button>`).join("") +
        `<input type="color" id="fe-bg-custom" value="${bg.color}" aria-label="Altro colore" title="Altro colore"></div>
      <p class="fe-print" data-r="printnote">✓ Solo tinte chiare: un colore troppo scuro viene schiarito in automatico, così la stampa resta pulita e il testo leggibile.</p>
      <h3>Dimensione del motivo</h3><div class="fe-row"><label for="fe-bg-scale">Scala</label><input type="range" id="fe-bg-scale" min="0.5" max="2" step="0.05" value="${bg.scale || 1}"><output>${Math.round((bg.scale || 1) * 100)}%</output></div>`;
    }
    if (tab === "cornici") {
      h = `<h3>Forma</h3><p class="fe-note">Con una cornice selezionata, il clic la <b>sostituisce</b>; altrimenti ne aggiunge una. Trascinando gli angoli la cornice si adatta a qualsiasi formato: angoli e decori restano uguali, si allungano solo i lati.</p><div class="fe-grid fe-g4">` +
        Object.keys(A.frames).filter((n) => n !== "Cerchio" && n !== "Ciottolo").map((n) => { const r = A.frames[n].r, w = 60 / r > 80 ? 80 : 60 / r, hh = w * r; return `<button type="button" class="fe-tile" data-frame="${n}">${thumb(`<path d="${framePath(A, n, 50 - w / 2, 50 - hh / 2, w, hh)}" fill="#fff" stroke="#3c3c3b" stroke-width="1.6"/>`)}<span>${n}</span></button>`; }).join("") + `</div>`;
    }
    if (tab === "linee") {
      h = `<h3>Linee</h3><p class="fe-note">Con una linea selezionata, il clic ne cambia il tipo. Onda e smerlo si ripetono quando la allarghi, invece di deformarsi.</p><div class="fe-grid fe-g3">` +
        LINES.map(([k, l]) => `<button type="button" class="fe-tile" data-line="${k}">${thumb(`<g transform="translate(8 35)">${itemSVG({ id: "x", type: "line", x: 0, y: 0, style: k, sw: 2.2, color: "#3c3c3b", w: 84, h: 30 }).replace(/data-id="x"/, "")}</g>`)}<span>${l}</span></button>`).join("") + `</div>`;
    }
    if (tab === "illu") {
      h = `<h3>Occasione</h3><div class="fe-chips">` + Object.keys(OCC).map((o) => `<button type="button" class="fe-chip" aria-pressed="${o === occ}" data-occ="${o}">${o}</button>`).join("") + `</div><h3>Illustrazioni</h3><p class="fe-note">Se ne può mettere una sola, più di una o nessuna. Con un'illustrazione selezionata sul foglio, il clic qui la <b>sostituisce</b>; altrimenti la aggiunge.</p><div class="fe-grid fe-g3">` + OCC[occ].map(iconTile).join("") + `</div>`;
    }
    if (tab === "testi") {
      h = `<h3>Aggiungi testo</h3><div class="fe-grid fe-g2">
        <button type="button" class="fe-btn" data-addt="title">Titolo (nome)</button><button type="button" class="fe-btn" data-addt="body">Testo</button>
        <button type="button" class="fe-btn" data-addt="kid">Titolo bambini</button><button type="button" class="fe-btn" data-addt="small">Nota piccola</button></div>
        <p class="fe-note">Seleziona un testo sul foglio per cambiare contenuto, carattere, dimensione e colore. Doppio clic sul testo apre la modifica.</p>
        <h3>Testi nel foglio</h3><div class="fe-grid">` + doc.items.filter((i) => i.type === "text").map((t) => `<button type="button" class="fe-btn fe-left" data-pick="${t.id}"><span style="font-family:${esc(FONT_MAP[t.font][2])}">${esc((t.role === "nome" && guest ? guest : t.text).split("\n")[0])}</span></button>`).join("") + `</div>`;
    }
    P.innerHTML = h; wirePane();
  }
  function wirePane() {
    const P = $("pane"), q = (s) => P.querySelector(s), qa = (s) => P.querySelectorAll(s);
    qa("[data-tpl]").forEach((b) => (b.onclick = () => { commit(); S.spunto = b.dataset.tpl; S.docs = buildAll(A, S.spunto); for (const d of Object.values(S.docs)) for (const i of d.items) i.id = nid(); bindFmt(); selId = null; all(); toast("Spunto applicato a tutti i formati"); changed(); }));
    qa("[data-pat]").forEach((b) => (b.onclick = () => { commit(); doc.bg.type = b.dataset.pat; render(); pane(); changed(); }));
    qa("[data-bgc]").forEach((b) => (b.onclick = () => { commit(); doc.bg.color = b.dataset.bgc; if (doc.bg.type === "nulla") doc.bg.type = "righe"; render(); pane(); changed(); }));
    const bc = q("#fe-bg-custom");
    if (bc) {
      bc.oninput = () => {
        commitSoon(); const r = lighten(bc.value); doc.bg.color = r.hex; if (doc.bg.type === "nulla") doc.bg.type = "righe"; render(); changed();
        const pn = $("printnote"); pn.classList.toggle("fe-adj", r.adj);
        pn.textContent = r.adj ? `↺ Colore schiarito per la stampa: il tono scelto era troppo scuro, viene usato ${r.hex}.` : "✓ Tinta abbastanza chiara: stampa sicura.";
        qa("[data-bgc]").forEach((x) => x.setAttribute("aria-pressed", "false"));
      };
      bc.onchange = () => pane();
    }
    const sc = q("#fe-bg-scale");
    if (sc) sc.oninput = () => { commitSoon(); doc.bg.scale = +sc.value; sc.nextElementSibling.textContent = Math.round(sc.value * 100) + "%"; render(); changed(); };
    qa("[data-frame]").forEach((b) => (b.onclick = () => {
      const n = b.dataset.frame, cur = sel();
      if (cur && cur.type === "frame") { commit(); cur.shape = n; render(); panelSel(); toast("Cornice sostituita"); changed(); return; }
      const rot = W > H, fb = S.fmt === "menu" ? { x: W * 0.07, y: H * 0.035, w: W * 0.86, h: H * 0.93 } : fitFrame(A, n, rot, W / 2, H / 2, W * (rot ? 0.72 : 0.8), H * (rot ? 0.72 : 0.8));
      centerAdd(Object.assign(Fr(n, curInk(), fb.x, fb.y, fb.w, fb.h), { rot }));
    }));
    qa("[data-line]").forEach((b) => (b.onclick = () => { const cur = sel(); if (cur && cur.type === "line") { commit(); cur.style = b.dataset.line; render(); panelSel(); toast("Linea sostituita"); changed(); return; } centerAdd(Ln(b.dataset.line, curInk(), W / 2, H / 2, W * 0.35)); }));
    qa("[data-icon]").forEach((b) => (b.onclick = () => {
      const n = b.dataset.icon, a = aspect(A, n), cur = sel();
      if (cur && cur.type === "icon") { commit(); const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2, w = Math.sqrt((cur.w * cur.h) / a); cur.name = n; cur.w = w; cur.h = w * a; cur.x = cx - w / 2; cur.y = cy - cur.h / 2; render(); panelSel(); toast("Illustrazione sostituita"); changed(); return; }
      let w = Math.min(W, H) * (a > 1.4 ? 0.2 : 0.26); if (n === "Nastro" || n === "Festone") w = Math.min(W, H) * 0.45;
      centerAdd(Ic(n, curInk(), W / 2, H / 2 - (w * a) / 2, w));
    }));
    qa("[data-occ]").forEach((b) => (b.onclick = () => { occ = b.dataset.occ; pane(); }));
    qa("[data-addt]").forEach((b) => (b.onclick = () => {
      const k = b.dataset.addt, c = curInk(), kk = F().k;
      centerAdd(k === "title" ? T("Nome", "Pinyon Script", 185 * kk, c, H / 2) : k === "kid" ? T("Buon compleanno!", "Sniglet", 92 * kk, c, H / 2, { weight: 800 }) : k === "small" ? T("È gradita gentile conferma", "Lora", 34 * kk, c, H / 2, { italic: true }) : T("Scrivi qui il tuo testo", "Lora", 44 * kk, c, H / 2));
      pane();
    }));
    qa("[data-pick]").forEach((b) => (b.onclick = () => { selId = b.dataset.pick; drawOverlay(); panelSel(); }));
  }

  // ---------- pannello dell'elemento selezionato ----------
  function panelSel() {
    const box = $("sel"), it = sel(); if (!it || ro) { box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    let h = `<h4>${TYPE_N[it.type]} <small>${esc(it.type === "text" ? "" : it.shape || it.name || (LINES.find((l) => l[0] === it.style) || [])[1] || "")}</small></h4>`;
    if (it.type === "text") {
      h += it.role === "nome"
        ? `<p class="fe-note">Su ogni segnaposto qui compare il nome di un invitato: l'elenco dei nomi si scrive nel riquadro <b>Segnaposti</b> a destra.</p>`
        : `<textarea id="fe-p-text" aria-label="Contenuto del testo">${esc(it.text)}</textarea>`;
      h += `<div class="fe-row"><label for="fe-p-font">Carattere</label><select id="fe-p-font">${FONTS.map((f) => `<option value="${f[0]}" ${f[0] === it.font ? "selected" : ""}>${f[1]}</option>`).join("")}</select></div>
      <div class="fe-row"><label for="fe-p-size">Dimensione</label><input type="range" id="fe-p-size" min="16" max="300" value="${it.size}"><output id="fe-o-size">${it.size}</output></div>
      <div class="fe-row"><label for="fe-p-lh">Interlinea</label><input type="range" id="fe-p-lh" min="0.6" max="2.5" step="0.05" value="${it.lh || 1}"><output>${(it.lh || 1).toFixed(2)}</output></div>
      <div class="fe-row"><label for="fe-p-ls">Spaziatura</label><input type="range" id="fe-p-ls" min="-4" max="30" value="${it.ls || 0}"><output>${it.ls || 0}</output></div>
      <div class="fe-row"><label>Stile</label><div class="fe-chips">${[["start", "Sinistra"], ["middle", "Centro"], ["end", "Destra"]].map(([a, l]) => `<button type="button" class="fe-chip" data-al="${a}" aria-pressed="${it.align === a}">${l}</button>`).join("")}
        <button type="button" class="fe-chip" data-tg="italic" aria-pressed="${!!it.italic}"><i>Corsivo</i></button><button type="button" class="fe-chip" data-tg="upper" aria-pressed="${!!it.upper}">MAIUSC</button></div></div>`;
    }
    if (it.type === "frame") {
      h += `<div class="fe-row"><label for="fe-p-sw">Spessore</label><input type="range" id="fe-p-sw" min="1" max="16" step=".5" value="${it.sw}"><output>${it.sw}</output></div>
      <div class="fe-row"><label>Interno</label><div class="fe-chips"><button type="button" class="fe-chip" data-fill="#ffffff" aria-pressed="${it.fill !== "none"}">Bianco</button><button type="button" class="fe-chip" data-fill="none" aria-pressed="${it.fill === "none"}">Trasparente</button></div></div>
      <div class="fe-row"><label>Verso</label><div class="fe-chips"><button type="button" class="fe-chip" data-rot="0" aria-pressed="${!it.rot}">Verticale</button><button type="button" class="fe-chip" data-rot="1" aria-pressed="${!!it.rot}">Orizzontale</button></div></div>`;
    }
    if (it.type === "line") {
      h += `<div class="fe-row"><label for="fe-p-sw">Spessore</label><input type="range" id="fe-p-sw" min="1" max="12" step=".5" value="${it.sw}"><output>${it.sw}</output></div>`;
    }
    h += `<div class="fe-row"><label>Colore</label>${inkRow("fe-p-ink", it.color)}</div>
    <div class="fe-acts"><button type="button" class="fe-btn" data-a="center">Centra</button><button type="button" class="fe-btn" data-a="dup">Duplica</button><button type="button" class="fe-btn" data-a="up">Porta avanti</button><button type="button" class="fe-btn" data-a="down">Porta dietro</button><button type="button" class="fe-btn fe-danger" data-a="del">Elimina</button></div>`;
    box.innerHTML = h; wireSel();
  }
  function panelSelValues() { const it = sel(), s = root.querySelector("#fe-p-size"); if (it && s) { s.value = it.size; root.querySelector("#fe-o-size").textContent = it.size; } }
  function wireSel() {
    const it = sel(), B = $("sel"), q = (s) => B.querySelector(s), qa = (s) => B.querySelectorAll(s);
    const bind = (id, fn) => { const el = q(id); if (!el) return; el.oninput = () => { commitSoon(); fn(el.value); if (el.nextElementSibling && el.nextElementSibling.tagName === "OUTPUT") el.nextElementSibling.textContent = el.value; render(); changed(); }; };
    bind("#fe-p-text", (v) => (it.text = v)); bind("#fe-p-size", (v) => (it.size = +v)); bind("#fe-p-ls", (v) => (it.ls = +v)); bind("#fe-p-lh", (v) => (it.lh = +v)); bind("#fe-p-sw", (v) => (it.sw = +v));
    const pf = q("#fe-p-font"); if (pf) pf.onchange = () => { commit(); it.font = pf.value; if (FONT_MAP[it.font][3] > 1.15) delete it.weight; render(); changed(); };
    qa("[data-rot]").forEach((b) => (b.onclick = () => { commit(); it.rot = b.dataset.rot === "1"; render(); panelSel(); changed(); }));
    qa("[data-al]").forEach((b) => (b.onclick = () => { commit(); const bx = boxes[it.id]; it.align = b.dataset.al; it.x = it.align === "start" ? bx.x : it.align === "end" ? bx.x + bx.w : bx.x + bx.w / 2; render(); panelSel(); changed(); }));
    qa("[data-tg]").forEach((b) => (b.onclick = () => { commit(); it[b.dataset.tg] = !it[b.dataset.tg]; render(); panelSel(); changed(); }));
    qa("[data-fill]").forEach((b) => (b.onclick = () => { commit(); it.fill = b.dataset.fill; render(); panelSel(); changed(); }));
    qa("[data-ink]").forEach((b) => (b.onclick = () => { commit(); it.color = b.dataset.c; lastInk = it.color; render(); panelSel(); changed(); }));
    const ci = q("#fe-p-ink-custom"); if (ci) ci.oninput = () => { commitSoon(); it.color = ci.value; lastInk = it.color; render(); changed(); qa("[data-ink]").forEach((x) => x.setAttribute("aria-pressed", "false")); };
    const mv = (d) => { const i = doc.items.indexOf(it), j = i + d; if (j < 0 || j >= doc.items.length) return; commit(); doc.items.splice(i, 1); doc.items.splice(j, 0, it); render(); toast(d > 0 ? "Portato avanti" : "Portato dietro"); changed(); };
    q('[data-a="del"]').onclick = delSel;
    q('[data-a="dup"]').onclick = () => { const c = clone(it); c.id = nid(); delete c.role; c.x += 40; c.y += 40; centerAdd(c); };
    q('[data-a="center"]').onclick = () => { commit(); if (it.type === "text") { const b = boxes[it.id]; it.x += W / 2 - (b.x + b.w / 2); } else it.x = (W - it.w) / 2; render(); changed(); };
    q('[data-a="up"]').onclick = () => mv(1); q('[data-a="down"]').onclick = () => mv(-1);
  }
  function delSel() { const it = sel(); if (!it) return; commit(); doc.items = doc.items.filter((i) => i !== it); S.docs[S.fmt] = doc; selId = null; render(); panelSel(); if (tab === "testi") pane(); toast("Elemento eliminato"); changed(); }

  // ---------- varie ----------
  let tt;
  function toast(m) { const t = $("toast"); t.textContent = m; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 1600); }
  function fmts() {
    $("fmts").innerHTML = Object.entries(FORMATS).map(([k, f]) => `<button type="button" role="tab" aria-selected="${S.fmt === k}" data-f="${k}">${f.label}<small>${f.dim.split(" · ")[0]}</small></button>`).join("");
    $("fmts").querySelectorAll("button").forEach((b) => (b.onclick = () => { S.fmt = b.dataset.f; bindFmt(); selId = null; all(); }));
  }
  $("back").onchange = () => { commit(); S.back = $("back").checked; render(); changed(); };
  const onResize = () => { fitPaper(); drawOverlay(); };
  window.addEventListener("resize", onResize);
  function all() { fmts(); render(); pane(); panelSel(); updUndo(); }
  tabs(); all();
  if (document.fonts) document.fonts.ready.then(() => render());

  return {
    setGuest(n) { guest = n || ""; render(); if (tab === "testi") pane(); },
    setReadOnly(v) { ro = !!v; root.querySelector(".fe").classList.toggle("fe-ro", ro); selId = null; all(); },
    setWatermark(v) { wm = !!v; render(); },
    destroy() { document.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); clearTimeout(changeT); root.innerHTML = ""; },
  };
}
