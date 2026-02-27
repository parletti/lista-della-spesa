insert into public.products_catalog (display_name, normalized_name, category_id, popularity_score)
select
  'Salsa di soia',
  'salsa di soia',
  c.id,
  68
from public.categories c
where c.key = 'dispensa'
on conflict (normalized_name) do update
set
  display_name = excluded.display_name,
  category_id = excluded.category_id,
  popularity_score = greatest(public.products_catalog.popularity_score, excluded.popularity_score);
