with base as (
  select
    pc.id as product_id,
    pc.normalized_name,
    c.key as category_key
  from public.products_catalog pc
  join public.categories c on c.id = pc.category_id
),
classified as (
  select
    product_id,
    case
      when category_key = 'igiene_casa' then 'UNKNOWN'
      when normalized_name in (
        'carta da forno',
        'pellicola trasparente',
        'pellicola alluminio',
        'spugne lavello',
        'pastiglie lavastoviglie',
        'sale lavastoviglie',
        'ammorbidente'
      ) then 'UNKNOWN'
      when category_key in ('legumi', 'frutta_secca', 'caffe_te_infusi') then 'HIGH'
      when normalized_name like '%cacao%' then 'HIGH'
      when normalized_name like '%cioccolat%' then 'HIGH'
      when normalized_name like '%nutella%' then 'HIGH'
      when normalized_name like '%crema novi%' then 'HIGH'
      when normalized_name like '%soia%' then 'HIGH'
      when category_key in ('carne', 'pesce', 'affettati', 'latticini') then 'LOW'
      when normalized_name in (
        'uova',
        'sale',
        'zucchero',
        'olio extravergine',
        'olio di cocco'
      ) then 'LOW'
      when category_key in ('frutta', 'verdura', 'forno', 'pasta_riso', 'condimenti', 'dispensa', 'dolci') then 'MEDIUM'
      else 'UNKNOWN'
    end as nickel_level
  from base
)
insert into public.product_nickel_levels (product_id, nickel_level, source)
select
  product_id,
  nickel_level,
  'generic_v1'
from classified
on conflict (product_id) do update
set
  nickel_level = excluded.nickel_level,
  source = excluded.source,
  updated_at = now();

