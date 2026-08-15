-- Kindle Candle Maker Tools — Supabase database setup
-- Run this once in Supabase Dashboard → SQL Editor.

create table if not exists public.user_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('candle', 'blend')),
  client_id text not null,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, item_type, client_id)
);

alter table public.user_items enable row level security;

revoke all on table public.user_items from anon;
grant select, insert, update, delete on table public.user_items to authenticated;

drop policy if exists "Users can read their own maker data" on public.user_items;
create policy "Users can read their own maker data"
on public.user_items
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can create their own maker data" on public.user_items;
create policy "Users can create their own maker data"
on public.user_items
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can update their own maker data" on public.user_items;
create policy "Users can update their own maker data"
on public.user_items
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users can delete their own maker data" on public.user_items;
create policy "Users can delete their own maker data"
on public.user_items
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
