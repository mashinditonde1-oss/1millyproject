-- GetPaid — Initial schema
-- Run this in your Supabase SQL editor before launching

-- ── profiles ──────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id                   uuid primary key references auth.users on delete cascade,
  business_name        text not null,
  business_type        text not null default 'General and Other',
  logo_url             text,
  phone                text,
  email                text,
  address              text,
  zimra_vat_number     text,
  po_box               text,
  bank_name            text,
  bank_account_name    text,
  bank_account_number  text,
  branch_code          text,
  ecocash              text,
  innbucks             text,
  primary_currency     text not null default 'USD',
  vat_default          boolean not null default false,
  default_payment_terms text not null default 'Payment due within 14 days.',
  tagline              text,
  footer_message       text,
  brand_color          text not null default '#1e5f3a',
  plan                 text not null default 'free',
  referral_code        text,
  created_at           timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can manage their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── clients ───────────────────────────────────────────────────────────────────
create table if not exists clients (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  full_name           text not null,
  company_name        text,
  whatsapp_number     text not null,
  email               text,
  address             text,
  po_box              text,
  credit_limit        numeric,
  internal_notes      text,
  payment_preference  text,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now()
);

alter table clients enable row level security;

create policy "Users can manage their own clients"
  on clients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index clients_user_id_idx on clients (user_id);

-- ── documents ─────────────────────────────────────────────────────────────────
create table if not exists documents (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  type               text not null,                        -- quote | proforma | invoice | credit_note
  number             text not null,
  client_id          uuid references clients,
  date               date not null,
  due_date           date,
  expiry_date        date,
  po_number          text,
  currency           text not null default 'USD',
  exchange_rate      numeric,
  rate_overridden    boolean,
  items              jsonb not null default '[]',
  vat_enabled        boolean not null default false,
  discount_type      text,
  discount_value     numeric,
  deposit_required   numeric,
  notes              text,
  status             text not null default 'draft',
  payments           jsonb not null default '[]',
  signature          jsonb,
  decline_reason     text,
  linked_invoice_id  uuid,
  share_token        text unique not null,
  deleted_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table documents enable row level security;

-- Authenticated users can only see their own documents
create policy "Users can manage their own documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone (including unauthenticated clients) can read a document by share_token
-- This is what makes the WhatsApp quote link work on the client's phone
create policy "Public share token read access"
  on documents for select
  using (share_token is not null);

create index documents_user_id_idx on documents (user_id);
create index documents_share_token_idx on documents (share_token);
create index documents_status_idx on documents (status);
