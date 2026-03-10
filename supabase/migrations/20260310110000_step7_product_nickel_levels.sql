create table if not exists public.product_nickel_levels (
  product_id uuid primary key references public.products_catalog(id) on delete cascade,
  nickel_level text not null check (nickel_level in ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN')),
  source text not null default 'generic',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_product_nickel_levels_updated_at on public.product_nickel_levels;
create trigger trg_product_nickel_levels_updated_at
before update on public.product_nickel_levels
for each row execute function public.set_updated_at();

alter table public.product_nickel_levels enable row level security;

drop policy if exists "product_nickel_levels_select_authenticated" on public.product_nickel_levels;
create policy "product_nickel_levels_select_authenticated"
on public.product_nickel_levels
for select
to authenticated
using (true);

