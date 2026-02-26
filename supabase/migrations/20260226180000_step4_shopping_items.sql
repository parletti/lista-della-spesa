create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  text text not null check (char_length(trim(text)) between 1 and 120),
  status text not null check (status in ('PENDING', 'BOUGHT')) default 'PENDING',
  added_by uuid not null references public.profiles(id) on delete restrict,
  bought_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  bought_at timestamptz
);

create index if not exists idx_shopping_items_family_status
  on public.shopping_items(family_id, status, created_at desc);

drop trigger if exists trg_shopping_items_updated_at on public.shopping_items;
create trigger trg_shopping_items_updated_at
before update on public.shopping_items
for each row
execute function public.set_updated_at();

alter table public.shopping_items enable row level security;

drop policy if exists "shopping_items_select_same_family" on public.shopping_items;
create policy "shopping_items_select_same_family"
on public.shopping_items
for select
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_items.family_id
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "shopping_items_insert_same_family" on public.shopping_items;
create policy "shopping_items_insert_same_family"
on public.shopping_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_items.family_id
      and my_p.auth_user_id = auth.uid()
  )
);

drop policy if exists "shopping_items_update_same_family" on public.shopping_items;
create policy "shopping_items_update_same_family"
on public.shopping_items
for update
to authenticated
using (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_items.family_id
      and my_p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.family_members my_fm
    join public.profiles my_p on my_p.id = my_fm.profile_id
    where my_fm.family_id = shopping_items.family_id
      and my_p.auth_user_id = auth.uid()
  )
);
