with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Sapone cucina', 'sapone cucina', 'igiene_casa', 42),
    ('Ramechini alluminio', 'ramechini alluminio', 'igiene_casa', 28),
    ('Sacchetti pattume compostabile', 'sacchetti pattume compostabile', 'igiene_casa', 41),
    ('Sacchetti pattume indifferenziato', 'sacchetti pattume indifferenziato', 'igiene_casa', 41),
    ('Deodorante auto', 'deodorante auto', 'igiene_casa', 26),
    ('Stracci lavandino', 'stracci lavandino', 'igiene_casa', 35),
    ('Scotch carta', 'scotch carta', 'igiene_casa', 30)
)
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
  popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score);

select public.resolve_catalog_product_request(id)
from public.products_catalog
where normalized_name in (
  'sapone cucina',
  'ramechini alluminio',
  'sacchetti pattume compostabile',
  'sacchetti pattume indifferenziato',
  'deodorante auto',
  'stracci lavandino',
  'scotch carta'
);
