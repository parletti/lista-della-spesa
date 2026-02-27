with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Albicocca', 'albicocca', 'frutta', 62),
    ('Avocado', 'avocado', 'frutta', 58),
    ('Cachi', 'cachi', 'frutta', 49),
    ('Castagna', 'castagna', 'frutta', 42),
    ('Cedro', 'cedro', 'frutta', 34),
    ('Clementina', 'clementina', 'frutta', 56),
    ('Fico', 'fico', 'frutta', 47),
    ('Melagrana', 'melagrana', 'frutta', 52),
    ('Melone', 'melone', 'frutta', 60),
    ('Nespola', 'nespola', 'frutta', 28),
    ('Papaia', 'papaia', 'frutta', 32),
    ('Pompelmo', 'pompelmo', 'frutta', 45),
    ('Prugna', 'prugna', 'frutta', 50),
    ('Susina', 'susina', 'frutta', 44),
    ('Anguria', 'anguria', 'frutta', 59),
    ('Cocomero', 'cocomero', 'frutta', 57),
    ('Lampone', 'lampone', 'frutta', 41),
    ('Mirtillo rosso', 'mirtillo rosso', 'frutta', 33),
    ('Mora', 'mora', 'frutta', 40),
    ('Ribes rosso', 'ribes rosso', 'frutta', 30),
    ('Ribes nero', 'ribes nero', 'frutta', 29),
    ('Uva spina', 'uva spina', 'frutta', 24),
    ('Fragoline di bosco', 'fragoline di bosco', 'frutta', 36),
    ('Frutti di bosco misti', 'frutti di bosco misti', 'frutta', 38),
    ('Litchi', 'litchi', 'frutta', 26)
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
