// Spunti di partenza: composizioni approvate per ogni formato. Sono solo idee: tutto resta modificabile.
import { FONT_MAP, FORMATS, type Assets, type Docs, type FmtId, type Item } from "./costanti";
import { aspect, fitFrame, fRatio } from "./geometria";

type Ex = Partial<Item>;
type TextSpec = [string, string, number, number, Ex?];
type Style = {
  bg: { type: string; color: string };
  ink: string;
  frame: { shape: string; cx: number; cy: number; w: number; sw: number };
  icons: [string, number, number, number][];
  texts: TextSpec[];
  name: string;
  occasion: string;
  guest: string;
  nameFont: string;
  nameWeight?: number;
  body: string;
  menuIcon?: string;
  menu?: string;
};
type MenuSpec = {
  icon: [string, number, number];
  title: [string, number, number, Ex?];
  body: [string, number, number, number];
  footer: [string, string, number, number, Ex?][];
};
type DigSpec = { ref: [number, number]; frame: [string, number, number, number, number]; icons: [string, number, number, number][]; texts: TextSpec[] };
type PlaceSpec = { frame: [string, number, number, number, number, boolean?]; name: [number, number] };

export type Gruppo = "bimbi" | "adulti";
export const SPUNTI: { id: string; nome: string; gruppo: Gruppo }[] = [
  { id: "paperella", nome: "Prima comunione", gruppo: "bimbi" },
  { id: "fiocco", nome: "Battesimo · fiocco", gruppo: "bimbi" },
  { id: "righe", nome: "Battesimo · colomba", gruppo: "bimbi" },
  { id: "orsetto", nome: "Primo compleanno", gruppo: "bimbi" },
  { id: "dino", nome: "Compleanno bimbi", gruppo: "bimbi" },
  { id: "diciotto", nome: "18 anni", gruppo: "adulti" },
  { id: "laurea", nome: "Laurea", gruppo: "adulti" },
  { id: "anniversario", nome: "Anniversario", gruppo: "adulti" },
];
export const spuntiPer = (g: Gruppo) => SPUNTI.filter((s) => s.gruppo === g);
export const spunto = (id: string) => SPUNTI.find((s) => s.id === id);

/* Composizioni misurate sugli esempi approvati: invito su riferimento 1020 × 1530 px, digitale su ref, menu e segnaposti in frazioni del foglio. */
const REF = { W: 1020, H: 1530 };
const STYLES: Record<string, Style> = {
 laurea:{bg:{type:'fiorellini',color:'#ede8f4'},ink:'#a3284e',
   frame:{shape:'Arco',cx:507,cy:760,w:835,sw:4},
   icons:[['Tocco di laurea',508,255,220]],
   texts:[['Martina','Pinyon Script',164,580,{}],['Dottoressa in Architettura','Cormorant Garamond',44,695,{italic:true}],
     ['Festeggiamo insieme','Cormorant Garamond',34,812],['venerdì 3 luglio · ore 19:30','Cormorant Garamond',43,935],
     ['Villa Fiorita\nStrada del Colle 4, Bergamo','Cormorant Garamond',34,1078],['Gradita conferma entro il 3 giugno','Cormorant Garamond',32,1232,{italic:true}]],
   name:'Martina',occasion:'Laurea',guest:'Alessandro',nameFont:'Pinyon Script',body:'Cormorant Garamond',menuIcon:'Ramo di alloro',
   menu:'Aperitivo in giardino\n\nPrimo\nRisotto agli asparagi\n\nSecondo\nFiletto di branzino\ncon verdure di stagione\n\nTorta di laurea\ne brindisi'},
 dino:{bg:{type:'stelle',color:'#e3ece1'},ink:'#93a891',
   frame:{shape:'Candy',cx:505,cy:759,w:835,sw:5},
   icons:[['Dinosauro',505,300,240]],
   texts:[['LEONARDO\ncompie 4 anni!','Sniglet',72,675,{weight:800,fit:.68}],['Vieni a festeggiare con noi','Sniglet',30,808],
     ['Sabato 10 ottobre · ore 16:00','Sniglet',34,913],['Ludoteca Il Girotondo\nVia Roma 12, Milano','Sniglet',30,1067],
     ['Conferma a mamma Sara · 333 123 4567','Sniglet',25,1227]],
   name:'Leonardo',occasion:'Compleanno',guest:'Matteo',nameFont:'Sniglet',nameWeight:800,body:'Sniglet',menuIcon:'Dinosauro',
   menu:'Merenda\nPizzette e focaccine\nTramezzini colorati\n\nDolce\nTorta al cioccolato\nMacedonia e ghiaccioli\n\nDa bere\nSucchi di frutta e acqua'},
 paperella:{bg:{type:'pois',color:'#e2ebf4'},ink:'#dca0ae',
   frame:{shape:'Elegance',cx:510,cy:766,w:826,sw:3.5},
   icons:[['Calice con ostia',510,200,165]],
   texts:[['Prima Comunione','Cormorant Garamond',38,480,{italic:true}],['Emma','Mea Culpa',178,655,{}],
     ['Sono felice di invitarvi','Cormorant Garamond',34,790],['Domenica 15 settembre 2027\nore 12:00','Cinzel',34,900],
     ['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Cormorant Garamond',34,1063],['È gradita gentile conferma','Lora',25,1247,{italic:true}]],
   name:'Emma',occasion:'Prima Comunione',guest:'Beatrice',nameFont:'Mea Culpa',body:'Cormorant Garamond',menuIcon:'Nastro'},
 orsetto:{bg:{type:'rombi',color:'#f9e6df'},ink:'#d2a47f',
   frame:{shape:'Elegance',cx:512,cy:766,w:825,sw:2.5},
   icons:[['Orsetto',511,228,187]],
   texts:[['Giulia','Sacramento',184,590,{}],['Sono felici di invitarvi\nal mio primo compleanno','Lora',31,789],
     ['Domenica 15 settembre 2027\nore 12:00','Sacramento',52.6,940,{lh:1.33}],['Villa dei Tigli\nVia dei Ciliegi 5\nTorino','Lora',31,1117],
     ['È gradita gentile conferma','Lora',24,1257,{italic:true}]],
   name:'Giulia',occasion:'Primo compleanno',guest:'Lorenzo',nameFont:'Sacramento',body:'Lora',menuIcon:'Orsetto',
   menu:'Aperitivo di benvenuto\n\nPrimi\nMaccheroncini con ragù bianco\ndi faraona e tartufo nero estivo\n\nSecondo\nTagliata di filetto con patate\nal forno e verdure grigliate\n\nBuffet di frutta e dolci\n\nTorta'},
 fiocco:{bg:{type:'quadretti',color:'#f9eab3'},ink:'#93abc8',
   frame:{shape:'Ovale',cx:517,cy:758,w:825,sw:5},
   icons:[['Fiocco con nastri',506,210,212]],
   texts:[['Siamo felici di invitarvi\nal Battesimo di','Cormorant Garamond',34,608],['Sofia','Cinzel',120,765,{}],
     ['Domenica 15 settembre 2027\nore 12:00','Cinzel',36,965],['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Cormorant Garamond',34,1116],
     ['È gradita gentile conferma','Lora',25,1250,{italic:true}]],
   name:'Sofia',occasion:'Santo Battesimo',guest:'Giorgia',nameFont:'Cinzel',body:'Cormorant Garamond',menuIcon:'Nastro'},
 righe:{bg:{type:'righe',color:'#f1e8eb'},ink:'#dca0ae',
   frame:{shape:'Antico',cx:510,cy:758,w:824,sw:5},
   icons:[['Colomba',510,268,190]],
   texts:[['Santo Battesimo','Marcellus',36,507],['Camilla','Sniglet',112,640,{}],['Siamo felici di invitarvi','Marcellus',30,773],
     ['Domenica 15 settembre 2027\nore 12:00','Marcellus',38,905],['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Marcellus',31,1106],
     ['È gradita gentile conferma','Montserrat',23,1250,{italic:true}]],
   name:'Camilla',occasion:'Santo Battesimo',guest:'Tommaso',nameFont:'Sniglet',body:'Marcellus',menuIcon:'Colomba'},
 diciotto:{bg:{type:'stelle',color:'#ede8f4'},ink:'#a99cc5',
   frame:{shape:'Onda',cx:510,cy:765,w:830,sw:4},
   icons:[['Torta con candeline',510,215,172]],
   texts:[['Alice','Cedarville Cursive',140,560,{}],['18','Playfair Display',170,700,{}],['Ti aspetto per festeggiare insieme','Montserrat',26,805],
     ['Sabato 12 aprile 2027 · ore 21:00','Montserrat',32,880],['Terrazza Belvedere\nVia dei Mille 8, Firenze','Montserrat',28,990],['Conferma entro il 5 aprile · 340 987 6543','Montserrat',21,1150,{italic:true}]],
   name:'Alice',occasion:'18 anni',guest:'Chiara',nameFont:'Cedarville Cursive',body:'Montserrat',
   menu:'Aperitivo\nBollicine e stuzzichini\n\nCena\nTagliolini al limone\nFiletto di orata con patate\n\nTorta\nMillefoglie con frutti di bosco\n\nOpen bar e musica'},
 anniversario:{bg:{type:'cuori',color:'#f1e8eb'},ink:'#b77a8e',
   frame:{shape:'Doppio arco',cx:510,cy:765,w:760,sw:3.5},
   icons:[['Tulipani',510,255,150]],
   texts:[['25 anni insieme','Playfair Display',36,520,{italic:true}],['Marco & Elena','Playfair Display',80,620,{}],['Vi aspettiamo per festeggiare\nil nostro anniversario','Playfair Display',29,750],
     ['Sabato 19 giugno 2027 · ore 20:00','Playfair Display',33,870],['Ristorante La Pergola\nVia Garibaldi 21, Verona','Playfair Display',29,985],['È gradita conferma entro il 1° giugno','Playfair Display',23,1150,{italic:true}]],
   name:'Marco & Elena',occasion:'25° anniversario',guest:'Francesca',nameFont:'Playfair Display',body:'Playfair Display',
   menu:'Antipasto\nCarpaccio di branzino agli agrumi\n\nPrimo\nRisotto allo champagne\n\nSecondo\nFiletto di vitello al pepe rosa\ncon verdure di stagione\n\nTorta nuziale\ne brindisi'}
};
/* Menu approvati: [illustrazione, larghezza, alto], titolo, testo, piè di pagina. Misure in unità del menu (950 × 2000). */
const MENUS: Record<string, MenuSpec> = {
 laurea:{icon:['Ramo di alloro',.31,.101],title:['Pinyon Script',176,.350],body:['Cormorant Garamond',41,1.43,.617],
   footer:[['Martina','Pinyon Script',112,.889],['ARCHITETTO','Cormorant Garamond',35,.933,{ls:8}]]},
 dino:{icon:['Dinosauro',.30,.127],title:['Sniglet',76,.359,{weight:800}],body:['Sniglet',36,1.55,.616],
   footer:[['COMPLEANNO','Sniglet',32,.885],['Leonardo','Sniglet',61,.923,{weight:800}]]},
 paperella:{icon:['Nastro',.65,.049],title:['Mea Culpa',165,.209],body:['Cormorant Garamond',42,1.41,.553],
   footer:[['Prima Comunione','Cormorant Garamond',34,.872],['Emma','Mea Culpa',108,.935]]},
 orsetto:{icon:['Orsetto',.26,.045],title:['Sacramento',200,.29],body:['Lora',39,1.48,.615],
   footer:[['IL MIO PRIMO COMPLEANNO','Lora',32,.895],['Giulia','Sacramento',100,.935]]},
 fiocco:{icon:['Nastro',.65,.049],title:['Cinzel',100,.2],body:['Cormorant Garamond',42,1.41,.553],
   footer:[['Santo Battesimo','Cormorant Garamond',34,.889],['Sofia','Cinzel',58,.925]]},
 diciotto:{icon:['Coppa',.22,.055],title:['Cedarville Cursive',150,.255],body:['Montserrat',32,1.6,.585],
   footer:[['18 ANNI','Montserrat',26,.885,{ls:8}],['Alice','Cedarville Cursive',100,.93]]},
 anniversario:{icon:['Tulipani',.2,.05],title:['Playfair Display',105,.25,{italic:true}],body:['Playfair Display',35,1.5,.58],
   footer:[['25° anniversario','Playfair Display',30,.885,{italic:true}],['Marco & Elena','Playfair Display',52,.925]]},
 righe:{icon:['Colomba',.24,.046],title:['Sniglet',115,.180],body:['Marcellus',34,1.61,.531],
   footer:[['SANTO BATTESIMO','Marcellus',32,.908],['CAMILLA','Marcellus',32,.939]]}
};
/* Inviti digitali approvati (misure in px sull'esempio: ref = larghezza × altezza) */
const DIGITAL: Record<string, DigSpec> = {
 laurea:{ref:[850,1530],frame:['Arco',68,58,773,1448],icons:[['Tocco di laurea',421,238,182]],
   texts:[['Martina','Pinyon Script',136,575],['Dottoressa in Architettura','Cormorant Garamond',36,697,{italic:true}],['Festeggiamo insieme','Cormorant Garamond',33,865],
     ['venerdì 3 luglio · ore 19:30','Cormorant Garamond',41,1015],['Villa Fiorita\nStrada del Colle 4, Bergamo','Cormorant Garamond',33,1178],['Gradita conferma entro il 3 giugno','Cormorant Garamond',26,1312,{italic:true}]]},
 dino:{ref:[820,1530],frame:['Candy',30,45,790,1465],icons:[['Dinosauro',406,228,218]],
   texts:[['LEONARDO\ncompie 4 anni!','Sniglet',63,613,{weight:800,fit:.8}],['Vieni a festeggiare con noi','Sniglet',28,793],['Sabato 10 ottobre · ore 16:00','Sniglet',33,940],
     ['Ludoteca Il Girotondo\nVia Roma 12, Milano','Sniglet',28,1115],['Conferma a mamma Sara · 333 123 4567','Sniglet',20,1270]]},
 paperella:{ref:[850,1530],frame:['Elegance',55,50,790,1490],icons:[['Calice con ostia',425,135,140]],
   texts:[['Prima Comunione','Cormorant Garamond',38,440,{italic:true}],['Emma','Mea Culpa',192,640],['Sono felice di invitarvi','Cormorant Garamond',34,785],
     ['Domenica 15 settembre 2027\nore 12:00','Cinzel',34,961],['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Cormorant Garamond',34,1169],['È gradita gentile conferma','Lora',21,1340,{italic:true}]]},
 orsetto:{ref:[850,1530],frame:['Elegance',60,45,795,1495],icons:[['Orsetto',427,218,150]],
   texts:[['Giulia','Sacramento',194,585],['Sono felici di invitarvi\nal mio primo compleanno','Lora',28,771],['Domenica 15 settembre 2027\nore 12:00','Sacramento',49.7,949,{lh:1.33}],
     ['Villa dei Tigli\nVia dei Ciliegi 5\nTorino','Lora',28,1136],['È gradita gentile conferma','Lora',23,1308,{italic:true}]]},
 fiocco:{ref:[850,1530],frame:['Ovale',55,50,790,1490],icons:[['Fiocco con nastri',422,150,190]],
   texts:[['Siamo felici di invitarvi\nal Battesimo di','Cormorant Garamond',34,545],['Sofia','Cinzel',124,715],['Domenica 15 settembre 2027\nore 12:00','Cinzel',34,905],
     ['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Cormorant Garamond',34,1085],['È gradita gentile conferma','Lora',21,1265,{italic:true}]]},
 righe:{ref:[850,1530],frame:['Antico',58,45,812,1478],icons:[['Colomba',425,190,160]],
   texts:[['Santo Battesimo','Marcellus',30,533],['Camilla','Sniglet',91,660],['Siamo felici di invitarvi','Marcellus',30,815],
     ['Domenica 15 settembre 2027\nore 12:00','Marcellus',39,968],['Parrocchia di Santo Stefano\nPiazza Italia 1\nTorino','Marcellus',31,1159],['È gradita gentile conferma','Montserrat',22,1325,{italic:true}]]}
  ,diciotto:{ref:[850,1530],frame:['Onda',50,60,800,1470],icons:[['Torta con candeline',425,222,180]],
   texts:[['Alice','Cedarville Cursive',140,560],['18','Playfair Display',170,720],['Ti aspetto per festeggiare insieme','Montserrat',26,860],
     ['Sabato 12 aprile 2027 · ore 21:00','Montserrat',32,950],['Terrazza Belvedere\nVia dei Mille 8, Firenze','Montserrat',28,1075],['Conferma entro il 5 aprile · 340 987 6543','Montserrat',21,1260,{italic:true}]]},
 anniversario:{ref:[850,1530],frame:['Doppio arco',75,60,775,1470],icons:[['Tulipani',425,230,145]],
   texts:[['25 anni insieme','Playfair Display',36,530,{italic:true}],['Marco & Elena','Playfair Display',80,640],['Vi aspettiamo per festeggiare\nil nostro anniversario','Playfair Display',29,790],
     ['Sabato 19 giugno 2027 · ore 20:00','Playfair Display',33,930],['Ristorante La Pergola\nVia Garibaldi 21, Verona','Playfair Display',29,1065],['È gradita conferma entro il 1° giugno','Playfair Display',23,1265,{italic:true}]]}
};
/* Segnaposti approvati: cornice [forma, x0, y0, x1, y1] in frazioni del cartoncino, nome [corpo, y] */
const PLACE: Record<string, PlaceSpec> = {
 laurea:{frame:['Elegance',.034,.091,.962,.899],name:[141,.49]},
 dino:{frame:['Candy',.035,.094,.955,.884],name:[76,.486]},
 paperella:{frame:['Elegance',.034,.091,.962,.899],name:[140,.56]},
 orsetto:{frame:['Elegance',.029,.093,.969,.905],name:[167,.55]},
 fiocco:{frame:['Ovale',.016,.069,.970,.922],name:[105,.53]},
 righe:{frame:['Antico',.064,.061,.955,.962],name:[103,.5]},
 diciotto:{frame:['Onda',.045,.15,.955,.85],name:[112,.5]},
 anniversario:{frame:['Doppio arco',.05,.08,.95,.92,true],name:[78,.52]}
};
const MENU_DEFAULT =
  "Antipasto\nClassico vitello cotto a bassa temperatura\ncon salsa tonnata e verdure in agrodolce\n\nPrimo\nRiso Carnaroli allo zafferano\ncon robiola di Roccaverano\ne polvere di mirtilli\n\nSecondo\nPetto di faraona cotta al forno\nsu purè di patate al limone\n\nVini\nGavi Tenuta Olim Bauda\nNebbiolo Tenuta Rocche di Costamagna";

// Costruisce i documenti di tutti i formati per uno spunto
export function buildAll(A: Assets, name: string): Docs {
  let uid = 1;
  const nid = () => "e" + uid++;
  const st = STYLES[name] ?? STYLES.laurea;
  const key = STYLES[name] ? name : "laurea";
  const out = {} as Docs;
  for (const fk of Object.keys(FORMATS) as FmtId[]) {
    const { W, H } = FORMATS[fk];
    const c = st.ink;
    const T = (text: string, font: string, size: number, y: number, extra: Ex = {}): Item =>
      ({ id: nid(), type: "text", text, font, size: Math.round(size), color: c, x: W / 2, y, w: 0, h: 0, align: "middle", ls: 0, ...extra }) as Item;
    const Fr = (shape: string, x: number, y: number, w: number, h: number, extra: Ex = {}): Item =>
      ({ id: nid(), type: "frame", shape, color: c, sw: 5, fill: "#ffffff", x, y, w, h, ...extra }) as Item;
    const Ic = (n: string, cx: number, y: number, w: number): Item => ({ id: nid(), type: "icon", name: n, color: c, x: cx - w / 2, y, w, h: w * aspect(A, n) });
    const ff = (font: string) => FONT_MAP[font]?.[3] || 1;
    const items: Item[] = [];
    let bg = { ...st.bg, scale: 1 };
    const nameEx: Ex = st.nameWeight ? { weight: st.nameWeight } : {};

    if (fk === "invito") {
      const s = W / REF.W, ox = 0, oy = (H - REF.H * s) / 2;
      const X = (v: number) => ox + v * s, Y = (v: number) => oy + v * s;
      const fr = st.frame, fw = fr.w * s, fh = fw * fRatio(A, fr.shape, false);
      items.push(Fr(fr.shape, X(fr.cx) - fw / 2, Y(fr.cy) - fh / 2, fw, fh, { sw: fr.sw }));
      st.icons.forEach(([n, cx, y, w]) => items.push(Ic(n, X(cx), Y(y), w * s)));
      st.texts.forEach(([t, font, px, y, ex = {}]) => {
        const e: Ex = { ...ex, fit: (ex.fit ?? 0.74) * REF.W * s };
        const it = T(t, font, (px * s) / ff(font), Y(y), e);
        it.x = X(REF.W / 2);
        items.push(it);
      });
    } else if (fk === "digitale") {
      const D = DIGITAL[key], sx = W / D.ref[0], sy = H / D.ref[1], [fs, fx0, fy0, fx1, fy1] = D.frame;
      items.push(Fr(fs, fx0 * sx, fy0 * sy, (fx1 - fx0) * sx, (fy1 - fy0) * sy, { sw: st.frame.sw }));
      D.icons.forEach(([n, cx, top, w]) => items.push(Ic(n, cx * sx, top * sy, w * sx)));
      D.texts.forEach(([tx, font, px, y, ex = {}]) => items.push(T(tx, font, (px * sx) / ff(font), y * sy, { ...ex, fit: (ex.fit ?? 0.74) * W })));
    } else if (fk === "menu") {
      bg = { type: "nulla", color: st.bg.color, scale: 1 };
      const M = MENUS[key];
      const [inm, iwf, itop] = M.icon;
      items.push(Ic(inm, W / 2, H * itop, W * iwf));
      const [tf, tu, ty, tex = {}] = M.title;
      items.push(T("Menu", tf, tu / ff(tf), H * ty, { ...tex }));
      const [bf, bu, blh, by] = M.body;
      items.push(T(st.menu || MENU_DEFAULT, bf, bu / ff(bf), H * by, { lh: blh }));
      M.footer.forEach(([tx, fnt, u, y, ex = {}]) => items.push(T(tx, fnt, u / ff(fnt), H * y, { ...ex })));
    } else {
      const P = PLACE[key], [sh, x0, y0, x1, y1, rot] = P.frame;
      items.push(Fr(sh, x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H, { sw: Math.max(2.5, st.frame.sw * 0.75), rot: !!rot }));
      items.push(T(st.guest, st.nameFont, P.name[0] / ff(st.nameFont), H * P.name[1], { ...nameEx, fit: W * 0.72, role: "nome" }));
    }
    out[fk] = { bg, items };
  }
  return out;
}

// Miniatura e nome del festeggiato (per i nomi dei file)
export const nomeFesta = (name: string) => STYLES[name]?.name ?? "";
export { fitFrame };
