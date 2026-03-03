create table if not exists public.product_nutrition_facts (
  product_id uuid primary key references public.products_catalog(id) on delete cascade,
  per_quantity numeric not null default 100,
  per_unit text not null check (per_unit in ('g', 'ml')),
  energy_kcal numeric,
  carbohydrates_g numeric,
  sugars_g numeric,
  proteins_g numeric,
  fats_g numeric,
  saturated_fats_g numeric,
  salt_g numeric,
  source text not null default 'generic',
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_product_nutrition_facts_updated_at on public.product_nutrition_facts;
create trigger trg_product_nutrition_facts_updated_at
before update on public.product_nutrition_facts
for each row
execute function public.set_updated_at();

alter table public.product_nutrition_facts enable row level security;

drop policy if exists "product_nutrition_facts_select_authenticated" on public.product_nutrition_facts;
create policy "product_nutrition_facts_select_authenticated"
on public.product_nutrition_facts
for select
to authenticated
using (true);
