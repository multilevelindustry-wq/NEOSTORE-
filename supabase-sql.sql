-- If gen_random_uuid is missing, enable pgcrypto
create extension if not exists "pgcrypto";

-- 1) users_profile table (optional mirror of auth.users)
create table if not exists public.users_profile (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz default now()
);

-- 2) carts table
create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  cart jsonb not null default '[]'::jsonb,
  delivery_country text,
  updated_at timestamptz default now()
);

-- 3) orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  cart jsonb not null,
  subtotal numeric,
  delivery_fee numeric,
  total numeric,
  paypal_order_id text,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.carts enable row level security;
alter table public.orders enable row level security;

-- Policies for carts
create policy if not exists "carts_select_user" on public.carts
  for select using (auth.uid() = user_id);

create policy if not exists "carts_insert_user" on public.carts
  for insert with check (auth.uid() = user_id);

create policy if not exists "carts_update_user" on public.carts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Policies for orders
create policy if not exists "orders_insert_user" on public.orders
  for insert with check (auth.uid() = user_id);

create policy if not exists "orders_select_user" on public.orders
  for select using (auth.uid() = user_id);
