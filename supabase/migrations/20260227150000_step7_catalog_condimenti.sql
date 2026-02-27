insert into public.categories (key, label, sort_order)
values ('condimenti', 'Condimenti', 52)
on conflict (key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

with products(display_name, normalized_name, category_key, popularity_score) as (
  values
    ('Olio extravergine di oliva', 'olio extravergine di oliva', 'condimenti', 88),
    ('Olio di oliva', 'olio di oliva', 'condimenti', 76),
    ('Olio di semi di girasole', 'olio di semi di girasole', 'condimenti', 64),
    ('Olio di semi di arachide', 'olio di semi di arachide', 'condimenti', 58),
    ('Olio di sesamo', 'olio di sesamo', 'condimenti', 49),
    ('Aceto di vino bianco', 'aceto di vino bianco', 'condimenti', 62),
    ('Aceto di vino rosso', 'aceto di vino rosso', 'condimenti', 55),
    ('Aceto di mele', 'aceto di mele', 'condimenti', 61),
    ('Aceto balsamico', 'aceto balsamico', 'condimenti', 75),
    ('Aceto di riso', 'aceto di riso', 'condimenti', 47),
    ('Sale fino', 'sale fino', 'condimenti', 73),
    ('Sale grosso', 'sale grosso', 'condimenti', 70),
    ('Sale marino integrale', 'sale marino integrale', 'condimenti', 52),
    ('Pepe nero', 'pepe nero', 'condimenti', 71),
    ('Pepe bianco', 'pepe bianco', 'condimenti', 46),
    ('Pepe rosa', 'pepe rosa', 'condimenti', 43),
    ('Peperoncino secco', 'peperoncino secco', 'condimenti', 60),
    ('Paprika dolce', 'paprika dolce', 'condimenti', 57),
    ('Paprika affumicata', 'paprika affumicata', 'condimenti', 44),
    ('Curcuma', 'curcuma', 'condimenti', 59),
    ('Curry', 'curry', 'condimenti', 58),
    ('Zenzero in polvere', 'zenzero in polvere', 'condimenti', 41),
    ('Cannella in polvere', 'cannella in polvere', 'condimenti', 45),
    ('Noce moscata', 'noce moscata', 'condimenti', 42),
    ('Origano secco', 'origano secco', 'condimenti', 56),
    ('Rosmarino secco', 'rosmarino secco', 'condimenti', 53),
    ('Timo secco', 'timo secco', 'condimenti', 51),
    ('Aglio in polvere', 'aglio in polvere', 'condimenti', 40),
    ('Cipolla in polvere', 'cipolla in polvere', 'condimenti', 39),
    ('Semi di finocchio', 'semi di finocchio', 'condimenti', 38),
    ('Timo', 'timo', 'condimenti', 48),
    ('Basilico', 'basilico', 'condimenti', 63),
    ('Prezzemolo', 'prezzemolo', 'condimenti', 54)
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
