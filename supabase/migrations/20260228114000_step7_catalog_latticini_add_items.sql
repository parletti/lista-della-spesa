with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Mozzarella pizza', 'mozzarella pizza', 'latticini', 70),
    ('Stracchino capra', 'stracchino capra', 'latticini', 56),
    ('Ricotta capra', 'ricotta capra', 'latticini', 58),
    ('Formaggio a fette', 'formaggio a fette', 'latticini', 62),
    ('Formaggio di capra a fette', 'formaggio di capra a fette', 'latticini', 52),
    ('Parmigiano Reggiano cubetti', 'parmigiano reggiano cubetti', 'latticini', 54),
    ('Pecorino grattugiato', 'pecorino grattugiato', 'latticini', 60),
    ('Parmigiano Reggiano grattugiato', 'parmigiano reggiano grattugiato', 'latticini', 64)
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
