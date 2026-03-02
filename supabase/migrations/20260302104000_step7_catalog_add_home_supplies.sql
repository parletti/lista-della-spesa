with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Carta da forno', 'carta da forno', 'dispensa', 58),
    ('Pellicola trasparente', 'pellicola trasparente', 'dispensa', 57),
    ('Pellicola alluminio', 'pellicola alluminio', 'dispensa', 55),
    ('Spugne lavello', 'spugne lavello', 'dispensa', 52),
    ('Pastiglie lavastoviglie', 'pastiglie lavastoviglie', 'dispensa', 50),
    ('Sale lavastoviglie', 'sale lavastoviglie', 'dispensa', 48),
    ('Ammorbidente', 'ammorbidente', 'dispensa', 46)
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
