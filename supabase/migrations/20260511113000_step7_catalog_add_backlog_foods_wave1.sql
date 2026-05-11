with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Chiodi di garofano', 'chiodi di garofano', 'condimenti', 38),
    ('Strutto', 'strutto', 'condimenti', 33),
    ('Maionese', 'maionese', 'condimenti', 54),
    ('Patate dolci', 'patate dolci', 'verdura', 50),
    ('Vanillina', 'vanillina', 'dolci', 39),
    ('Pane toast', 'pane toast', 'forno', 46),
    ('Crauti', 'crauti', 'verdura', 34),
    ('Burro chiarificato', 'burro chiarificato', 'latticini', 43),
    ('Macinato di maiale', 'macinato di maiale', 'carne', 47)
),
upserted_products as (
  insert into public.products_catalog (
    display_name,
    normalized_name,
    category_id,
    popularity_score
  )
  select
    p.display_name,
    p.normalized_name,
    c.id,
    p.popularity_score
  from products p
  join public.categories c on c.key = p.category_key
  on conflict (normalized_name) do update
  set
    display_name = excluded.display_name,
    category_id = excluded.category_id,
    popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score)
  returning id, normalized_name
),
resolved_products as (
  select id, normalized_name
  from upserted_products
  union all
  select pc.id, pc.normalized_name
  from public.products_catalog pc
  join products p on p.normalized_name = pc.normalized_name
  where not exists (
    select 1
    from upserted_products up
    where up.id = pc.id
  )
),
nutrition_facts (
  normalized_name,
  per_unit,
  energy_kcal,
  carbohydrates_g,
  sugars_g,
  proteins_g,
  fats_g,
  saturated_fats_g,
  salt_g
) as (
  values
    ('chiodi di garofano', 'g', 274, 66.0, 2.4, 6.0, 13.0, 3.9, 0.07),
    ('strutto', 'g', 902, 0.0, 0.0, 0.0, 100.0, 39.0, 0.0),
    ('maionese', 'g', 680, 1.0, 1.0, 1.0, 75.0, 11.0, 1.5),
    ('patate dolci', 'g', 86, 20.0, 4.2, 1.6, 0.1, 0.0, 0.14),
    ('vanillina', 'g', 390, 97.0, 95.0, 0.0, 0.0, 0.0, 0.02),
    ('pane toast', 'g', 270, 49.0, 5.0, 9.0, 4.0, 0.8, 1.2),
    ('crauti', 'g', 19, 4.3, 1.8, 0.9, 0.1, 0.0, 1.1),
    ('burro chiarificato', 'g', 900, 0.0, 0.0, 0.0, 99.8, 62.0, 0.0),
    ('macinato di maiale', 'g', 263, 0.0, 0.0, 17.0, 21.0, 7.5, 0.18)
),
resolved_nutrition as (
  select
    rp.id as product_id,
    nf.per_unit,
    nf.energy_kcal,
    nf.carbohydrates_g,
    nf.sugars_g,
    nf.proteins_g,
    nf.fats_g,
    nf.saturated_fats_g,
    nf.salt_g
  from resolved_products rp
  join nutrition_facts nf on nf.normalized_name = rp.normalized_name
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
  rn.product_id,
  100,
  rn.per_unit,
  rn.energy_kcal,
  rn.carbohydrates_g,
  rn.sugars_g,
  rn.proteins_g,
  rn.fats_g,
  rn.saturated_fats_g,
  rn.salt_g,
  'generic',
  now()
from resolved_nutrition rn
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

with nickel_levels(normalized_name, nickel_level) as (
  values
    ('chiodi di garofano', 'HIGH'),
    ('strutto', 'LOW'),
    ('maionese', 'LOW'),
    ('patate dolci', 'MEDIUM'),
    ('vanillina', 'MEDIUM'),
    ('pane toast', 'MEDIUM'),
    ('crauti', 'MEDIUM'),
    ('burro chiarificato', 'LOW'),
    ('macinato di maiale', 'LOW')
),
resolved_nickel as (
  select
    rp.id as product_id,
    nl.nickel_level
  from resolved_products rp
  join nickel_levels nl on nl.normalized_name = rp.normalized_name
)
insert into public.product_nickel_levels (
  product_id,
  nickel_level,
  source,
  updated_at
)
select
  rn.product_id,
  rn.nickel_level,
  'generic',
  now()
from resolved_nickel rn
on conflict (product_id) do update
set
  nickel_level = excluded.nickel_level,
  source = excluded.source,
  updated_at = now();

select public.resolve_catalog_product_request(id)
from public.products_catalog
where normalized_name in (
  'chiodi di garofano',
  'strutto',
  'maionese',
  'patate dolci',
  'vanillina',
  'pane toast',
  'crauti',
  'burro chiarificato',
  'macinato di maiale'
);
