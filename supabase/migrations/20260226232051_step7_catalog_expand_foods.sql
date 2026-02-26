with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Ciliegia', 'ciliegia', 'frutta', 72),
    ('Cocco', 'cocco', 'frutta', 58),
    ('Fragola', 'fragola', 'frutta', 86),
    ('Kiwi', 'kiwi', 'frutta', 68),
    ('Mandarino', 'mandarino', 'frutta', 64),
    ('Pesca', 'pesca', 'frutta', 70),
    ('Uva', 'uva', 'frutta', 74),
    ('Ananas', 'ananas', 'frutta', 60),
    ('Mirtilli', 'mirtilli', 'frutta', 55),
    ('Mango', 'mango', 'frutta', 52),
    ('Melanzana', 'melanzana', 'verdura', 76),
    ('Patata', 'patata', 'verdura', 95),
    ('Cipolla', 'cipolla', 'verdura', 90),
    ('Aglio', 'aglio', 'verdura', 65),
    ('Sedano', 'sedano', 'verdura', 63),
    ('Spinaci', 'spinaci', 'verdura', 71),
    ('Broccoli', 'broccoli', 'verdura', 67),
    ('Cavolfiore', 'cavolfiore', 'verdura', 59),
    ('Mozzarella', 'mozzarella', 'latticini', 88),
    ('Parmigiano', 'parmigiano', 'latticini', 82),
    ('Ricotta', 'ricotta', 'latticini', 66),
    ('Prosciutto cotto', 'prosciutto cotto', 'carne_pesce', 73),
    ('Prosciutto crudo', 'prosciutto crudo', 'carne_pesce', 69),
    ('Bresaola', 'bresaola', 'carne_pesce', 50),
    ('Scottex', 'scottex', 'igiene_casa', 57),
    ('Detersivo bucato', 'detersivo bucato', 'igiene_casa', 61)
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

with aliases(alias_normalized, product_normalized) as (
  values
    ('ciliegie', 'ciliegia'),
    ('ciliegia fresca', 'ciliegia'),
    ('cocco fresco', 'cocco'),
    ('cocco grattugiato', 'cocco'),
    ('fragole', 'fragola'),
    ('kiwi giallo', 'kiwi'),
    ('mandarini', 'mandarino'),
    ('pesche', 'pesca'),
    ('uva bianca', 'uva'),
    ('uva nera', 'uva'),
    ('mirtillo', 'mirtilli'),
    ('melanzane', 'melanzana'),
    ('patate', 'patata'),
    ('cipolle', 'cipolla'),
    ('broccolo', 'broccoli'),
    ('mozzarelle', 'mozzarella'),
    ('parmigiano reggiano', 'parmigiano'),
    ('prosciutto', 'prosciutto cotto'),
    ('scottex casa', 'scottex'),
    ('detersivo lavatrice', 'detersivo bucato')
)
insert into public.product_aliases (product_id, alias_normalized)
select pc.id, a.alias_normalized
from aliases a
join public.products_catalog pc on pc.normalized_name = a.product_normalized
on conflict (product_id, alias_normalized) do nothing;
