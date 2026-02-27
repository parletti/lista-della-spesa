with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Formaggio di capra', 'formaggio di capra', 'latticini', 46),
    ('Formaggio di pecora', 'formaggio di pecora', 'latticini', 44),
    ('Formaggio di mucca', 'formaggio di mucca', 'latticini', 48)
)
insert into public.products_catalog (display_name, normalized_name, category_id, popularity_score)
select p.display_name, p.normalized_name, c.id, p.popularity_score
from products p
join public.categories c on c.key = p.category_key
on conflict (normalized_name) do update
set
  display_name = excluded.display_name,
  category_id = excluded.category_id,
  popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score);
