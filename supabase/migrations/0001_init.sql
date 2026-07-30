-- Sleep Engine, Phase 0 schema.
--
-- Only the `opportunities`, `events`, `automation_health` and `settings`
-- tables are needed for the market intelligence engine. The rest of the data
-- model from the brief (products, orders, fulfilments, customers,
-- support_tickets, content_drafts) lands with the phase that uses it, so no
-- table exists before something writes to it.

create extension if not exists pgcrypto;

create table if not exists opportunities (
  id                  uuid primary key default gen_random_uuid(),
  -- Stable hash of source + canonical url. Makes re-runs idempotent and lets
  -- the scan skip anything already scored in a previous week.
  fingerprint         text not null unique,
  source              text not null,
  title               text not null,
  evidence_urls       text[] not null default '{}',
  scores              jsonb not null,
  total               integer not null,
  verdict             text not null check (verdict in ('accepted', 'rejected')),
  rejection_reason    text,
  riskiest_assumption text,
  one_line_offer      text,
  scored_by           text not null,
  scanned_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  -- A rejection without a reason would be a silent drop.
  constraint rejection_reason_required
    check (verdict <> 'rejected' or rejection_reason is not null)
);

create index if not exists opportunities_rank_idx
  on opportunities (verdict, total desc, scanned_at desc);

-- Append-only audit log. Every automated action lands here.
create table if not exists events (
  id         bigserial primary key,
  type       text not null,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists events_type_created_idx on events (type, created_at desc);

-- Circuit breaker state. Two consecutive failures set disabled_at and the
-- automation refuses to run until a human clears it.
create table if not exists automation_health (
  key                  text primary key,
  consecutive_failures integer not null default 0,
  disabled_at          timestamptz,
  last_error           text,
  updated_at           timestamptz not null default now()
);

-- Operator-controlled flags. `outbound_enabled` is the kill switch.
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values ('outbound_enabled', 'true'::jsonb)
  on conflict (key) do nothing;

-- Row Level Security: every table is deny-by-default. Nothing here is ever
-- read by a browser client; the scan runs server-side with the service role
-- key, which bypasses RLS. Enabling RLS with no permissive policy means a
-- leaked anon key grants nothing.
alter table opportunities     enable row level security;
alter table events            enable row level security;
alter table automation_health enable row level security;
alter table settings          enable row level security;

alter table opportunities     force row level security;
alter table events            force row level security;
alter table automation_health force row level security;
alter table settings          force row level security;

revoke all on opportunities, events, automation_health, settings from anon, authenticated;
