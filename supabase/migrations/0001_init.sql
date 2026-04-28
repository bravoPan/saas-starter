-- ============================================================================
-- SaaS Starter — initial schema
--
-- Three tables that work together:
--   profiles          — one row per Clerk user, mirrors the user identity into Postgres
--                       so Stripe subscriptions and app data can FK to a stable id.
--   subscriptions     — one row per Stripe subscription, kept in sync via webhooks.
--   feedback_entries  — example user-generated content table demonstrating writes.
--
-- All writes happen through the SERVICE ROLE key from the server (see
-- src/app/lib/supabase/admin.ts). RLS is enabled to make sure no one can write
-- directly with the anon key. Reads on the public-facing tables are open.
--
-- HOW TO APPLY:
--   - In Supabase Studio: SQL editor → paste this file → run.
--   - With Supabase CLI: `supabase db push` (after `supabase link`).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  text        primary key,            -- Clerk user_id ("user_...")
  email               text,
  first_name          text,
  last_name           text,
  image_url           text,
  stripe_customer_id  text        unique,                 -- set once Stripe customer is created
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id);

-- ----------------------------------------------------------------------------
-- subscriptions
-- ----------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                       text        primary key,        -- Stripe subscription id ("sub_...")
  user_id                  text        not null references public.profiles(id) on delete cascade,
  status                   text        not null,           -- active | trialing | past_due | canceled | ...
  price_id                 text,
  product_id               text,
  plan_name                text,                           -- snapshot of Stripe Product.name
  tier                     text        not null default 'basic',  -- 'basic' | 'pro' | 'enterprise'
  quantity                 integer,
  cancel_at_period_end     boolean     default false,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at                timestamptz,
  canceled_at              timestamptz,
  trial_start              timestamptz,
  trial_end                timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx     on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx      on public.subscriptions (status);
create index if not exists subscriptions_price_id_idx    on public.subscriptions (price_id);

-- ----------------------------------------------------------------------------
-- feedback_entries — example writeable table
-- ----------------------------------------------------------------------------
create table if not exists public.feedback_entries (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text        not null references public.profiles(id) on delete cascade,
  display_name  text,                                    -- snapshot at write time
  message       text        not null,
  created_at    timestamptz not null default now()
);

create index if not exists feedback_entries_created_at_idx on public.feedback_entries (created_at desc);
create index if not exists feedback_entries_user_id_idx    on public.feedback_entries (user_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- All app writes go through the service-role key, which bypasses RLS. The point
-- of these policies is defense-in-depth: even if someone got the anon key, they
-- could only READ public data, never write.
-- ----------------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.subscriptions    enable row level security;
alter table public.feedback_entries enable row level security;

-- profiles: nobody can read profiles with the anon key (PII). If you want users
-- to read their own profile from the client, add a policy keyed off `auth.uid()`
-- once you wire Clerk + Supabase JWT.
-- (No SELECT policy = no anon reads.)

-- subscriptions: same — anon clients should not see who has what subscription.

-- feedback_entries: public read is fine (display_name + message are user-authored
-- public posts). All writes are server-only.
drop policy if exists "feedback_entries_public_read" on public.feedback_entries;
create policy "feedback_entries_public_read"
  on public.feedback_entries
  for select
  to anon, authenticated
  using (true);
