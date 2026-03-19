with upserted_product as (
  insert into public.products_catalog (
    display_name,
    normalized_name,
    category_id,
    popularity_score
  )
  select
    'Formaggio cremoso tipo Philadelfia',
    'formaggio cremoso tipo philadelfia',
    c.id,
    43
  from public.categories c
  where c.key = 'latticini'
  on conflict (normalized_name) do update
  set
    display_name = excluded.display_name,
    category_id = excluded.category_id,
    popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score)
  returning id, normalized_name
),
resolved_product as (
  select id, normalized_name
  from upserted_product
  union all
  select pc.id, pc.normalized_name
  from public.products_catalog pc
  where pc.normalized_name = 'formaggio cremoso tipo philadelfia'
    and not exists (select 1 from upserted_product)
)
insert into public.product_nutrition_facts (
  product_id,
  per_quantity,
  per_unit,
  energy_kcal,
  carbohydrates_g,
  sugars_g,
  proteins_g,
  fats_g,
  saturated_fats_g,
  salt_g,
  source,
  updated_at
)
select
  rp.id,
  100,
  'g',
  250,
  4.0,
  3.5,
  5.5,
  24.0,
  15.0,
  0.8,
  'generic',
  now()
from resolved_product rp
on conflict (product_id) do update
set
  per_quantity = excluded.per_quantity,
  per_unit = excluded.per_unit,
  energy_kcal = excluded.energy_kcal,
  carbohydrates_g = excluded.carbohydrates_g,
  sugars_g = excluded.sugars_g,
  proteins_g = excluded.proteins_g,
  fats_g = excluded.fats_g,
  saturated_fats_g = excluded.saturated_fats_g,
  salt_g = excluded.salt_g,
  source = excluded.source,
  updated_at = now();

with resolved_product as (
  select id
  from public.products_catalog
  where normalized_name = 'formaggio cremoso tipo philadelfia'
)
insert into public.product_nickel_levels (
  product_id,
  nickel_level,
  source,
  updated_at
)
select
  rp.id,
  'LOW',
  'generic',
  now()
from resolved_product rp
on conflict (product_id) do update
set
  nickel_level = excluded.nickel_level,
  source = excluded.source,
  updated_at = now();

select public.resolve_catalog_product_request(id)
from public.products_catalog
where normalized_name = 'formaggio cremoso tipo philadelfia';
