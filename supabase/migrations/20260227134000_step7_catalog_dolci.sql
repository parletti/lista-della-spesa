insert into public.categories (key, label, sort_order)
values ('dolci', 'Dolci', 65)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Biscotti secchi', 'biscotti secchi', 'dolci', 76),
    ('Biscotti integrali', 'biscotti integrali', 'dolci', 58),
    ('Frollini', 'frollini', 'dolci', 70),
    ('Savoiardi', 'savoiardi', 'dolci', 52),
    ('Plumcake confezionato', 'plumcake confezionato', 'dolci', 46),
    ('Merendine al cacao', 'merendine al cacao', 'dolci', 55),
    ('Crostatine confezionate', 'crostatine confezionate', 'dolci', 44),
    ('Wafer alla nocciola', 'wafer alla nocciola', 'dolci', 63),
    ('Cioccolato fondente', 'cioccolato fondente', 'dolci', 72),
    ('Cioccolato al latte', 'cioccolato al latte', 'dolci', 71),
    ('Cioccolato bianco', 'cioccolato bianco', 'dolci', 48),
    ('Tavoletta gianduia', 'tavoletta gianduia', 'dolci', 43),
    ('Crema spalmabile al cacao', 'crema spalmabile al cacao', 'dolci', 57),
    ('Nutella', 'nutella', 'dolci', 85),
    ('Crema Novi', 'crema novi', 'dolci', 60),
    ('Crema 100% mandorle', 'crema 100 mandorle', 'dolci', 45),
    ('Crema 100% nocciole', 'crema 100 nocciole', 'dolci', 47),
    ('Marmellata di fragole', 'marmellata di fragole', 'dolci', 62),
    ('Marmellata di albicocche', 'marmellata di albicocche', 'dolci', 59),
    ('Miele millefiori', 'miele millefiori', 'dolci', 66),
    ('Zucchero semolato', 'zucchero semolato', 'dolci', 69),
    ('Zucchero di canna', 'zucchero di canna', 'dolci', 64),
    ('Cacao amaro in polvere', 'cacao amaro in polvere', 'dolci', 53),
    ('Budino confezionato', 'budino confezionato', 'dolci', 41)
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
