-- Schema per l'app "Assistente Personale"
-- Esegui questo script nel SQL editor del tuo progetto Supabase.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILI (impostazioni utente: target calorico, preferenze piano alimentare)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  daily_calorie_target integer not null default 2000,
  diet_type text not null default 'onnivora' check (diet_type in ('onnivora', 'vegetariana')),
  meals_per_day integer not null default 4,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Crea automaticamente un profilo di default alla registrazione
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- FINANZE: entrate e uscite
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12, 2) not null check (amount > 0),
  category text not null default 'Altro',
  description text,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

alter table public.transactions enable row level security;

create policy "transactions_all_own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- AGENDA: impegni con promemoria
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  notes text,
  start_at timestamptz not null,
  reminder_minutes_before integer not null default 30,
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists events_user_start_idx on public.events (user_id, start_at);
create index if not exists events_reminder_due_idx on public.events (start_at, notified) where notified = false;

alter table public.events enable row level security;

create policy "events_all_own" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- PIANO ALIMENTARE: pasti generati giorno per giorno
-- ---------------------------------------------------------------------------
create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  meals jsonb not null,
  total_calories integer not null,
  total_protein_g integer not null,
  total_carbs_g integer not null,
  total_fat_g integer not null,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

alter table public.meal_plans enable row level security;

create policy "meal_plans_all_own" on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ABBONAMENTI PUSH (per i promemoria dell'agenda)
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_all_own" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
