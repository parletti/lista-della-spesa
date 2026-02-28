with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Olive verdi intere', 'olive verdi intere', 'condimenti', 48),
    ('Olive verdi denocciolate', 'olive verdi denocciolate', 'condimenti', 50),
    ('Olive taggiasche', 'olive taggiasche', 'condimenti', 52)
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
