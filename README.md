# Plumacreativa · eventi

App per creare inviti, menu e segnaposti per nascite, battesimi, compleanni, lauree e anniversari.
Indirizzo: **eventi.plumacreativa.it**.

- Il cliente sceglie evento e modello, personalizza testi, colori e nomi degli invitati.
- **Invito digitale** (JPG per WhatsApp): pagato con Stripe, 9,90 € + IVA.
- **Stampa**: il cliente sceglie le quantità e viene portato nel carrello di plumacreativa.it (plugin in `woocommerce/`), dove sceglie spedizione o ritiro e paga.
- **Area riservata** `/admin`: PDF di stampa (2 mm di abbondanza, senza crocini, testi in tracciati, CMYK), CSV dei nomi per l'Unione dati di InDesign (UTF-16), JPG.

## Struttura

| Cartella | Contenuto |
|---|---|
| `lib/catalog.ts` | eventi, formati, **prezzi IVA esclusa**, SKU WooCommerce |
| `lib/engine/` | motore grafico: modelli (`models.ts`), impaginazione (`render.ts`), PDF e JPG (`output.ts`) |
| `lib/project.ts` | dati di un progetto e testi di esempio per evento |
| `app/` | pagine e API |
| `supabase/eventi.sql` | tabella da creare su Supabase |
| `woocommerce/pluma-eventi/` | plugin per plumacreativa.it |
| `scripts/prova.ts` | genera in locale le anteprime di tutti i modelli |

## Variabili d'ambiente (Vercel)

| Nome | Valore |
|---|---|
| `APP_URL` | `https://eventi.plumacreativa.it` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del progetto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave segreta Supabase (Secret) |
| `STRIPE_SECRET_KEY` | chiave segreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | segreto del webhook `https://eventi.plumacreativa.it/api/stripe/webhook` (evento `checkout.session.completed`) |
| `WOO_SHOP_URL` | `https://plumacreativa.it` |
| `WOO_SECRET` | chiave segreta mostrata dal plugin in WooCommerce → Pluma eventi |
| `ADMIN_PASSWORD` | password dell'area riservata |
| `NEXT_PUBLIC_CONTATTO_EMAIL` | email per preventivi e contatti |

Senza Supabase, in sviluppo i progetti si salvano in `.data/progetti.json`.

## Sviluppo

```bash
npm install
npm run dev
npx tsx scripts/prova.ts prova   # anteprime PNG di tutti i modelli
```

I font (licenza OFL) sono in `public/fonts`, ridotti all'alfabeto latino.
