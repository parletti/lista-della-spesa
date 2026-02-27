insert into public.categories (key, label, sort_order)
values ('pasta_riso', 'Pasta e Riso', 45)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Pasta spaghetti', 'pasta spaghetti', 'pasta_riso', 84),
    ('Pasta penne rigate', 'pasta penne rigate', 'pasta_riso', 82),
    ('Pasta fusilli', 'pasta fusilli', 'pasta_riso', 77),
    ('Pasta rigatoni', 'pasta rigatoni', 'pasta_riso', 75),
    ('Pasta mezze maniche', 'pasta mezze maniche', 'pasta_riso', 66),
    ('Pasta linguine', 'pasta linguine', 'pasta_riso', 70),
    ('Pasta tagliatelle', 'pasta tagliatelle', 'pasta_riso', 73),
    ('Pasta farfalle', 'pasta farfalle', 'pasta_riso', 68),
    ('Pasta conchiglie', 'pasta conchiglie', 'pasta_riso', 62),
    ('Pasta orecchiette', 'pasta orecchiette', 'pasta_riso', 61),
    ('Pasta paccheri', 'pasta paccheri', 'pasta_riso', 58),
    ('Pasta ditalini', 'pasta ditalini', 'pasta_riso', 55),
    ('Pasta integrale', 'pasta integrale', 'pasta_riso', 64),
    ('Pasta senza glutine', 'pasta senza glutine', 'pasta_riso', 54),
    ('Pasta all''uovo', 'pasta all uovo', 'pasta_riso', 60),
    ('Lasagne secche', 'lasagne secche', 'pasta_riso', 72),
    ('Riso arborio', 'riso arborio', 'pasta_riso', 76),
    ('Riso carnaroli', 'riso carnaroli', 'pasta_riso', 79),
    ('Riso vialone nano', 'riso vialone nano', 'pasta_riso', 57),
    ('Riso basmati', 'riso basmati', 'pasta_riso', 74),
    ('Riso jasmine', 'riso jasmine', 'pasta_riso', 52),
    ('Riso integrale', 'riso integrale', 'pasta_riso', 65),
    ('Riso parboiled', 'riso parboiled', 'pasta_riso', 59),
    ('Riso venere', 'riso venere', 'pasta_riso', 56),
    ('Riso rosso integrale', 'riso rosso integrale', 'pasta_riso', 50),
    ('Cous cous', 'cous cous', 'pasta_riso', 63),
    ('Orzo perlato', 'orzo perlato', 'pasta_riso', 48),
    ('Farro perlato', 'farro perlato', 'pasta_riso', 49),
    ('Quinoa', 'quinoa', 'pasta_riso', 53),
    ('Semolino', 'semolino', 'pasta_riso', 47)
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
