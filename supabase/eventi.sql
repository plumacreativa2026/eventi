-- Tabella dei progetti di eventi.plumacreativa.it
-- Da incollare in Supabase → SQL Editor → New query → Run

create table if not exists public.eventi_progetti (
  id uuid primary key,
  codice text not null unique,
  dati jsonb not null,
  email text,
  digitale_pagato_at timestamptz,
  stripe_session_id text,
  stampa_stato text check (stampa_stato in ('in_attesa', 'pagato', 'annullato')),
  woo_ordine text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists eventi_progetti_updated on public.eventi_progetti (updated_at desc);

-- Accesso solo dal server dell'app (chiave segreta): nessuna regola pubblica
alter table public.eventi_progetti enable row level security;
