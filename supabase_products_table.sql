-- SHAZAAR Supabase SQL
-- Supabase Dashboard -> SQL Editor -> New Query -> paste all -> Run
-- This creates products + COD orders tables for the static website.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  category text not null,
  stock text default 'In Stock',
  description text not null,
  image text not null,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  product_name text not null,
  product_price text not null,
  quantity int default 1,
  total_amount text,
  customer_name text not null,
  customer_phone text not null,
  customer_city text not null,
  customer_address text not null,
  customer_note text,
  payment_method text default 'COD',
  advance_amount text,
  easypaisa_trx_id text,
  payment_status text default 'COD Pending',
  status text default 'Pending',
  created_at timestamptz default now()
);

alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Allow public read products" on public.products;
drop policy if exists "Allow public insert products" on public.products;
drop policy if exists "Allow public delete products" on public.products;
drop policy if exists "Allow public update products" on public.products;

create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public insert products" on public.products for insert with check (true);
create policy "Allow public delete products" on public.products for delete using (true);
create policy "Allow public update products" on public.products for update using (true) with check (true);

drop policy if exists "Allow public insert orders" on public.orders;
drop policy if exists "Allow public read orders" on public.orders;
drop policy if exists "Allow public update orders" on public.orders;
drop policy if exists "Allow public delete orders" on public.orders;

create policy "Allow public insert orders" on public.orders for insert with check (true);
create policy "Allow public read orders" on public.orders for select using (true);
create policy "Allow public update orders" on public.orders for update using (true) with check (true);
create policy "Allow public delete orders" on public.orders for delete using (true);


-- Run these safely if your orders table already exists from old version.
alter table public.orders add column if not exists payment_method text default 'COD';
alter table public.orders add column if not exists advance_amount text;
alter table public.orders add column if not exists easypaisa_trx_id text;
alter table public.orders add column if not exists payment_status text default 'COD Pending';
